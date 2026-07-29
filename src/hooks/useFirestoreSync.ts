import { useCallback, useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { budgetReducer, type BudgetAction, type BudgetState } from "../store/budgetReducer";
import type { Course, ExecutionRow } from "../types";

const COURSES = "courses";
const EXECUTIONS = "executions";
const LOGS = "logs";

export type SyncStatus = "offline" | "syncing" | "synced";

/** Firestore에서 온 집행내역 필드 타입을 로컬과 맞게 정규화한다. */
function normalizeExecution(raw: Partial<ExecutionRow> & Record<string, unknown>, docId: string): ExecutionRow {
  return {
    id: typeof raw.id === "number" ? raw.id : Number(docId),
    courseId: Number(raw.courseId),
    itemId: String(raw.itemId ?? ""),
    date: String(raw.date ?? ""),
    amount: Number(raw.amount) || 0,
    vendor: String(raw.vendor ?? "-"),
    proofNo: String(raw.proofNo ?? "-"),
    memo: String(raw.memo ?? "-"),
  };
}

/** 과정 문서를 로컬 최신본 그대로 저장한다. */
async function setCourseDoc(course: Course) {
  await setDoc(doc(db, COURSES, String(course.id)), course);
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
          // 내가 방금 쓴 값의 메아리는 무시한다. 로컬에는 이미 반영돼 있어
          // 다시 병합하면 화면 숫자가 잠깐 튀었다 돌아온다.
          if (change.doc.metadata.hasPendingWrites) return;
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
          if (change.doc.metadata.hasPendingWrites) return;
          if (change.type === "removed") {
            dispatch({ type: "REMOTE_EXECUTION_DELETED", id: Number(change.doc.id) });
            return;
          }
          dispatch({
            type: "REMOTE_EXECUTION_SYNCED",
            execution: normalizeExecution(change.doc.data() as Partial<ExecutionRow> & Record<string, unknown>, change.doc.id),
          });
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
          if (change.doc.metadata.hasPendingWrites) return;
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
            const course = next.courses.find((c) => c.id === action.courseId);
            const log = next.logs[0];
            if (!course) throw new Error("저장할 과정 데이터를 찾지 못했습니다.");
            const writes: Promise<void>[] = [setCourseDoc(course)];
            if (log) writes.push(setDoc(doc(db, LOGS, log.id), log));
            await Promise.all(writes);
            break;
          }
          case "ADD_ITEM":
          case "DELETE_ITEM": {
            const course = next.courses.find((c) => c.id === action.courseId);
            if (!course) throw new Error("저장할 과정 데이터를 찾지 못했습니다.");
            await setCourseDoc(course);
            break;
          }
          case "ADD_EXECUTION": {
            // reducer가 새 행을 맨 앞에 넣으므로 [0]이 방금 등록한 건
            const execution = next.executions[0];
            const course = next.courses.find((c) => Number(c.id) === Number(action.row.courseId));
            if (!execution) throw new Error("저장할 집행내역을 찾지 못했습니다.");
            if (!course) throw new Error("저장할 과정 데이터를 찾지 못했습니다.");
            await Promise.all([
              setDoc(doc(db, EXECUTIONS, String(execution.id)), normalizeExecution(execution, String(execution.id))),
              setCourseDoc(course),
            ]);
            break;
          }
          case "UPDATE_EXECUTION": {
            const old = prev.executions.find((e) => e.id === action.id);
            const execution = next.executions.find((e) => e.id === action.id);
            const course = old ? next.courses.find((c) => c.id === old.courseId) : undefined;
            if (!execution) throw new Error("수정할 집행내역을 찾지 못했습니다.");
            const writes: Promise<void>[] = [
              setDoc(doc(db, EXECUTIONS, String(execution.id)), normalizeExecution(execution, String(execution.id))),
            ];
            if (course) writes.push(setCourseDoc(course));
            await Promise.all(writes);
            break;
          }
          case "DELETE_EXECUTION": {
            const old = prev.executions.find((e) => e.id === action.id);
            const course = old ? next.courses.find((c) => c.id === old.courseId) : undefined;
            const writes: Promise<void>[] = [deleteDoc(doc(db, EXECUTIONS, String(action.id)))];
            if (course) writes.push(setCourseDoc(course));
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
