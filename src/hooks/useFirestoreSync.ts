import { useCallback, useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, runTransaction, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { budgetReducer, type BudgetAction, type BudgetState } from "../store/budgetReducer";
import type { BudgetItem, Course, ExecutionRow } from "../types";

const COURSES = "courses";
const EXECUTIONS = "executions";
const LOGS = "logs";

export type SyncStatus = "offline" | "syncing" | "synced";

/**
 * courses/{courseId}의 item.executed를 서버에 실제로 저장된 값 기준으로 델타 반영한다.
 * (로컬에서 계산해둔 값을 그대로 덮어쓰면, 여러 사용자가 동시에 같은 과정에 집행을
 * 등록할 때 한쪽 변경이 씹히는 경쟁 상태가 생길 수 있어 트랜잭션으로 처리한다.)
 */
async function applyExecutedDelta(
  courseId: number,
  itemId: string,
  delta: number,
  fallbackCourse: Course | undefined,
) {
  if (delta === 0) return;
  const courseRef = doc(db, COURSES, String(courseId));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(courseRef);
    if (!snap.exists()) {
      if (fallbackCourse) tx.set(courseRef, fallbackCourse);
      return;
    }
    const serverCourse = snap.data() as Course;
    const items = serverCourse.items.map((item) =>
      item.id !== itemId ? item : { ...item, executed: Math.max(0, item.executed + delta) },
    );
    tx.set(courseRef, { ...serverCourse, items });
  });
}

/**
 * 서버에 있는 과정 문서를 읽어 mutate한 뒤 저장한다.
 * 로컬 스냅샷 전체를 덮어쓰면 다른 사용자가 올린 집행액이 사라질 수 있어 트랜잭션으로 병합한다.
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

/**
 * Firestore의 courses/executions/logs 컬렉션을 실시간 구독하고, 로컬에서 발생한
 * 변경 액션을 같은 컬렉션에 write-through 한다. 원격 변경 병합은 budgetReducer의
 * REMOTE_* 액션을 그대로 재사용해 로컬/원격 상태가 항상 같은 로직으로 계산되게 한다.
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
        snap.docChanges().forEach((change) => {
          if (change.type === "removed") return;
          dispatch({ type: "REMOTE_COURSE_SYNCED", course: change.doc.data() as Course });
        });
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
        snap.docChanges().forEach((change) => {
          if (change.type === "removed") {
            dispatch({ type: "REMOTE_EXECUTION_DELETED", id: Number(change.doc.id) });
            return;
          }
          dispatch({ type: "REMOTE_EXECUTION_SYNCED", execution: change.doc.data() as ExecutionRow });
        });
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
        snap.docChanges().forEach((change) => {
          if (change.type === "removed") return;
          dispatch({ type: "REMOTE_LOG_ADDED", log: change.doc.data() as import("../types").AdjustmentLog });
        });
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
            const log = next.logs[0];
            const writes: Promise<void>[] = [
              mergeCourseWrite(action.courseId, fallback, (serverCourse) => ({
                ...serverCourse,
                items: serverCourse.items.map((item: BudgetItem) =>
                  item.id !== action.itemId ? item : { ...item, ...action.patch },
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
            const writes: Promise<void>[] = [];
            if (execution) writes.push(setDoc(doc(db, EXECUTIONS, String(execution.id)), execution));
            writes.push(applyExecutedDelta(action.row.courseId, action.row.itemId, action.row.amount, fallbackCourse));
            await Promise.all(writes);
            break;
          }
          case "UPDATE_EXECUTION": {
            const old = prev.executions.find((e) => e.id === action.id);
            const execution = next.executions.find((e) => e.id === action.id);
            const amountDiff = old ? (action.patch.amount ?? old.amount) - old.amount : 0;
            const fallbackCourse = old ? next.courses.find((c) => c.id === old.courseId) : undefined;
            const writes: Promise<void>[] = [];
            if (execution) writes.push(setDoc(doc(db, EXECUTIONS, String(execution.id)), execution));
            if (old) writes.push(applyExecutedDelta(old.courseId, old.itemId, amountDiff, fallbackCourse));
            await Promise.all(writes);
            break;
          }
          case "DELETE_EXECUTION": {
            const old = prev.executions.find((e) => e.id === action.id);
            const fallbackCourse = old ? next.courses.find((c) => c.id === old.courseId) : undefined;
            const writes: Promise<void>[] = [deleteDoc(doc(db, EXECUTIONS, String(action.id)))];
            if (old) writes.push(applyExecutedDelta(old.courseId, old.itemId, -old.amount, fallbackCourse));
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
            return; // UI 전용/원격 병합 액션은 write-through 하지 않음
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
