import { useCallback, useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, runTransaction, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  budgetReducer,
  getItemExecutedSum,
  type BudgetAction,
  type BudgetState,
} from "../store/budgetReducer";
import type { BudgetItem, Course, ExecutionRow, AdjustmentLog } from "../types";

const COURSES = "courses";
const EXECUTIONS = "executions";
const LOGS = "logs";
/** 서버 스냅샷에 아직 안 보이는 로컬 신규 집행을 유지하는 시간 */
const PENDING_EXEC_MS = 60_000;

export type SyncStatus = "offline" | "syncing" | "synced";

/**
 * 서버 course 문서의 item.executed를 절대값으로 맞춘다.
 * 델타 가산은 재시도/레이스에서 중복 반영되기 쉬워 합계 절대값으로 쓴다.
 */
async function setItemExecutedAbsolute(
  courseId: number,
  itemId: string,
  executed: number,
  fallbackCourse: Course | undefined,
) {
  const courseRef = doc(db, COURSES, String(courseId));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(courseRef);
    if (!snap.exists()) {
      if (fallbackCourse) {
        const items = fallbackCourse.items.map((item) =>
          item.id !== itemId ? item : { ...item, executed },
        );
        tx.set(courseRef, { ...fallbackCourse, items });
      }
      return;
    }
    const serverCourse = snap.data() as Course;
    const items = serverCourse.items.map((item) =>
      item.id !== itemId ? item : { ...item, executed: Math.max(0, executed) },
    );
    tx.set(courseRef, { ...serverCourse, items });
  });
}

/**
 * 서버에 있는 과정 문서를 읽어 mutate한 뒤 저장한다.
 * 로컬 스냅샷 전체를 덮어쓰면 다른 사용자가 올린 값이 사라질 수 있어 트랜잭션으로 병합한다.
 */
async function mergeCourseWrite(
  courseId: number,
  fallbackCourse: Course | undefined,
  mutate: (serverCourse: Course) => Course,
) {
  const courseRef = doc(db, COURSES, String(courseId));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(courseRef);
    const base = snap.exists()
      ? (snap.data() as Course)
      : fallbackCourse;
    if (!base) return;
    tx.set(courseRef, mutate(base));
  });
}

function normalizeExecution(raw: ExecutionRow, docId: string): ExecutionRow {
  return {
    ...raw,
    id: typeof raw.id === "number" ? raw.id : Number(docId),
    courseId: Number(raw.courseId),
    amount: Number(raw.amount) || 0,
  };
}

/** 서버 스냅샷에 아직 없는 방금 등록한 로컬 집행을 잠깐 보존한다. */
function mergePendingExecutions(
  local: ExecutionRow[],
  remote: ExecutionRow[],
): ExecutionRow[] {
  const remoteIds = new Set(remote.map((e) => e.id));
  const cutoff = Date.now() - PENDING_EXEC_MS;
  const pending = local.filter((e) => !remoteIds.has(e.id) && e.id >= cutoff);
  if (pending.length === 0) return remote;
  return [...pending, ...remote];
}

/**
 * Firestore 컬렉션을 스냅샷 전체로 치환 구독한다.
 * docChanges 델타만 쓰면 초기 로드·캐시·로컬 잔여 데이터가 섞여 집행액이 틀어진다.
 */
export function useFirestoreSync(
  state: BudgetState,
  dispatch: React.Dispatch<BudgetAction>,
  enabled: boolean,
) {
  const stateRef = useRef(state);
  stateRef.current = state;
  const [status, setStatus] = useState<SyncStatus>(enabled ? "syncing" : "offline");

  useEffect(() => {
    if (!enabled) {
      setStatus("offline");
      return;
    }
    setStatus("syncing");

    const unsubCourses = onSnapshot(
      collection(db, COURSES),
      (snap) => {
        setStatus("synced");
        const courses = snap.docs.map((d) => {
          const data = d.data() as Course;
          return { ...data, id: typeof data.id === "number" ? data.id : Number(d.id) };
        });
        dispatch({ type: "REMOTE_COURSES_REPLACED", courses });
      },
      (err) => {
        console.error("[FirestoreSync] courses 구독 실패", err);
        setStatus("offline");
      },
    );

    const unsubExecutions = onSnapshot(
      collection(db, EXECUTIONS),
      (snap) => {
        setStatus("synced");
        const remote = snap.docs.map((d) => normalizeExecution(d.data() as ExecutionRow, d.id));
        const executions = mergePendingExecutions(stateRef.current.executions, remote);
        dispatch({ type: "REMOTE_EXECUTIONS_REPLACED", executions });
      },
      (err) => {
        console.error("[FirestoreSync] executions 구독 실패", err);
        setStatus("offline");
      },
    );

    const unsubLogs = onSnapshot(
      collection(db, LOGS),
      (snap) => {
        setStatus("synced");
        const logs = snap.docs.map((d) => d.data() as AdjustmentLog);
        dispatch({ type: "REMOTE_LOGS_REPLACED", logs });
      },
      (err) => {
        console.error("[FirestoreSync] logs 구독 실패", err);
        setStatus("offline");
      },
    );

    return () => {
      unsubCourses();
      unsubExecutions();
      unsubLogs();
    };
  }, [enabled, dispatch]);

  useEffect(() => {
    if (!enabled) return;
    const handleOffline = () => setStatus("offline");
    const handleOnline = () => setStatus("synced");
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled]);

  const dispatchSynced = useCallback(
    (action: BudgetAction): Promise<boolean> => {
      const prev = stateRef.current;
      const next = budgetReducer(prev, action);
      dispatch(action);

      if (!enabled) return Promise.resolve(true);

      const run = async () => {
        switch (action.type) {
          case "UPDATE_ITEM": {
            const fallback = next.courses.find((c) => c.id === action.courseId);
            const reconciledItem = fallback?.items.find((i) => i.id === action.itemId);
            const log = next.logs[0];
            const patchForServer = reconciledItem
              ? { ...action.patch, executed: reconciledItem.executed }
              : action.patch;
            const writes: Promise<void>[] = [
              mergeCourseWrite(action.courseId, fallback, (serverCourse) => ({
                ...serverCourse,
                items: serverCourse.items.map((item: BudgetItem) =>
                  item.id !== action.itemId ? item : { ...item, ...patchForServer },
                ),
              })),
            ];
            if (log) writes.push(setDoc(doc(db, LOGS, log.id), log));
            await Promise.all(writes);
            break;
          }
          case "ADD_ITEM": {
            const fallback = next.courses.find((c) => c.id === action.courseId);
            await mergeCourseWrite(action.courseId, fallback, (serverCourse) => {
              if (serverCourse.items.some((i) => i.id === action.item.id)) return serverCourse;
              return { ...serverCourse, items: [...serverCourse.items, action.item] };
            });
            break;
          }
          case "DELETE_ITEM": {
            const fallback = next.courses.find((c) => c.id === action.courseId);
            await mergeCourseWrite(action.courseId, fallback, (serverCourse) => ({
              ...serverCourse,
              items: serverCourse.items.map((item) =>
                item.id !== action.itemId ? item : { ...item, isDeleted: true },
              ),
            }));
            break;
          }
          case "ADD_EXECUTION": {
            const execution = next.executions[0];
            const fallbackCourse = next.courses.find((c) => c.id === action.row.courseId);
            const executed = getItemExecutedSum(next.executions, action.row.courseId, action.row.itemId);
            const writes: Promise<void>[] = [];
            if (execution) writes.push(setDoc(doc(db, EXECUTIONS, String(execution.id)), execution));
            writes.push(setItemExecutedAbsolute(action.row.courseId, action.row.itemId, executed, fallbackCourse));
            await Promise.all(writes);
            break;
          }
          case "UPDATE_EXECUTION": {
            const old = prev.executions.find((e) => e.id === action.id);
            const execution = next.executions.find((e) => e.id === action.id);
            const fallbackCourse = old ? next.courses.find((c) => c.id === old.courseId) : undefined;
            const writes: Promise<void>[] = [];
            if (execution) writes.push(setDoc(doc(db, EXECUTIONS, String(execution.id)), execution));
            if (old) {
              const targets = new Set([
                `${old.courseId}::${old.itemId}`,
                `${execution?.courseId ?? old.courseId}::${execution?.itemId ?? old.itemId}`,
              ]);
              for (const key of targets) {
                const [courseId, itemId] = key.split("::");
                const sum = getItemExecutedSum(next.executions, Number(courseId), itemId);
                const fb = next.courses.find((c) => c.id === Number(courseId)) ?? fallbackCourse;
                writes.push(setItemExecutedAbsolute(Number(courseId), itemId, sum, fb));
              }
            }
            await Promise.all(writes);
            break;
          }
          case "DELETE_EXECUTION": {
            const old = prev.executions.find((e) => e.id === action.id);
            const fallbackCourse = old ? next.courses.find((c) => c.id === old.courseId) : undefined;
            const writes: Promise<void>[] = [deleteDoc(doc(db, EXECUTIONS, String(action.id)))];
            if (old) {
              const sum = getItemExecutedSum(next.executions, old.courseId, old.itemId);
              writes.push(setItemExecutedAbsolute(old.courseId, old.itemId, sum, fallbackCourse));
            }
            await Promise.all(writes);
            break;
          }
          case "HYDRATE": {
            const batch = writeBatch(db);
            next.courses.forEach((c) => batch.set(doc(db, COURSES, String(c.id)), c));
            next.executions.forEach((e) => batch.set(doc(db, EXECUTIONS, String(e.id)), e));
            next.logs.forEach((l) => batch.set(doc(db, LOGS, l.id), l));
            await batch.commit();
            break;
          }
          default:
            return;
        }
      };

      setStatus("syncing");
      return run().then(
        () => {
          setStatus("synced");
          return true;
        },
        (err) => {
          console.error("[FirestoreSync] write 실패", err);
          setStatus("offline");
          return false;
        },
      );
    },
    [dispatch, enabled],
  );

  return { status, dispatchSynced };
}
