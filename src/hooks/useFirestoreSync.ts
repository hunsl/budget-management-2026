import { useCallback, useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { budgetReducer, type BudgetAction, type BudgetState } from "../store/budgetReducer";
import type { AdjustmentLog, Course, ExecutionRow } from "../types";

const COLLECTIONS = { courses: "courses", executions: "executions", logs: "logs" } as const;
type RemoteData = { courses: Course[]; executions: ExecutionRow[]; logs: AdjustmentLog[]; budgetBase?: number; budgetReduction?: number; budgetChanges?: BudgetState["budgetChanges"] };

function writeAll(data: RemoteData) {
  const batch = writeBatch(db);
  data.courses.forEach((item) => batch.set(doc(db, COLLECTIONS.courses, String(item.id)), item));
  data.executions.forEach((item) => batch.set(doc(db, COLLECTIONS.executions, String(item.id)), item));
  data.logs.forEach((item) => batch.set(doc(db, COLLECTIONS.logs, item.id), item));
  batch.set(doc(db, "settings", "budget"), {
    budgetBase: data.budgetBase,
    budgetReduction: data.budgetReduction,
    budgetChanges: data.budgetChanges ?? [],
  });
  return batch.commit();
}

export type SyncStatus = "offline" | "syncing" | "synced";

export function useFirestoreSync(state: BudgetState, dispatch: React.Dispatch<BudgetAction>, enabled: boolean) {
  const stateRef = useRef(state);
  stateRef.current = state;
  const [status, setStatus] = useState<SyncStatus>(enabled ? "syncing" : "offline");

  useEffect(() => {
    if (!enabled) { setStatus("offline"); return; }
    setStatus("syncing");
    const remote: RemoteData = { courses: [], executions: [], logs: [] };
    const ready = new Set<string>();
    let hydrated = false;
    let settingsSeen = false;

    const syncSnapshot = () => {
      if (!ready.has("courses") || !ready.has("executions") || !ready.has("logs") || !settingsSeen) return;
      setStatus("synced");
      if (!hydrated) {
        hydrated = true;
        if (remote.courses.length || remote.executions.length || remote.logs.length) {
          dispatch({ type: "REMOTE_STATE_SYNCED", ...remote });
        } else {
          void writeAll(stateRef.current).catch((error) => { console.error("[FirestoreSync] 초기 데이터 저장 실패", error); setStatus("offline"); });
        }
        return;
      }
      dispatch({ type: "REMOTE_STATE_SYNCED", ...remote });
    };

    const unsubCourses = onSnapshot(collection(db, COLLECTIONS.courses), (snap) => {
      remote.courses = snap.docs.map((item) => item.data() as Course);
      ready.add("courses"); syncSnapshot();
    }, (error) => { console.error("[FirestoreSync] courses 구독 실패", error); setStatus("offline"); });
    const unsubExecutions = onSnapshot(collection(db, COLLECTIONS.executions), (snap) => {
      remote.executions = snap.docs.map((item) => ({ ...item.data(), id: Number(item.id) }) as ExecutionRow);
      ready.add("executions"); syncSnapshot();
    }, (error) => { console.error("[FirestoreSync] executions 구독 실패", error); setStatus("offline"); });
    const unsubLogs = onSnapshot(collection(db, COLLECTIONS.logs), (snap) => {
      remote.logs = snap.docs.map((item) => item.data() as AdjustmentLog);
      ready.add("logs"); syncSnapshot();
    }, (error) => { console.error("[FirestoreSync] logs 구독 실패", error); setStatus("offline"); });
    const unsubSettings = onSnapshot(doc(db, "settings", "budget"), (snap) => {
      if (snap.exists()) Object.assign(remote, snap.data());
      settingsSeen = true; syncSnapshot();
    }, (error) => { console.error("[FirestoreSync] 설정 구독 실패", error); setStatus("offline"); });
    return () => { unsubCourses(); unsubExecutions(); unsubLogs(); unsubSettings(); };
  }, [enabled, dispatch]);

  const dispatchSynced = useCallback((action: BudgetAction): Promise<boolean> => {
    const previous = stateRef.current;
    const next = budgetReducer(previous, action);
    dispatch(action);
    if (!enabled) return Promise.resolve(true);
    setStatus("syncing");
    const save = async () => {
      switch (action.type) {
        case "UPDATE_ITEM": case "ADD_ITEM": case "DELETE_ITEM": case "RENAME_COURSE":
          await setDoc(doc(db, COLLECTIONS.courses, String(action.courseId)), next.courses.find((item) => item.id === action.courseId)!);
          if (action.type === "UPDATE_ITEM" || action.type === "RENAME_COURSE") await setDoc(doc(db, COLLECTIONS.logs, next.logs[0].id), next.logs[0]);
          break;
        case "ADD_EXECUTION": case "UPDATE_EXECUTION": case "DELETE_EXECUTION": {
          const oldId = action.type === "ADD_EXECUTION" ? undefined : action.id;
          const old = oldId === undefined ? undefined : previous.executions.find((item) => item.id === oldId);
          if (action.type === "DELETE_EXECUTION") await deleteDoc(doc(db, COLLECTIONS.executions, String(action.id)));
          else { const item = action.type === "ADD_EXECUTION" ? next.executions[0] : next.executions.find((row) => row.id === action.id); if (item) await setDoc(doc(db, COLLECTIONS.executions, String(item.id)), item); }
          const courseId = action.type === "ADD_EXECUTION" ? action.row.courseId : old?.courseId;
          const course = courseId === undefined ? undefined : next.courses.find((item) => item.id === courseId);
          if (course) await setDoc(doc(db, COLLECTIONS.courses, String(course.id)), course);
          break;
        }
        case "SET_BUDGET_REDUCTION":
          await setDoc(doc(db, "settings", "budget"), { budgetBase: next.budgetBase, budgetReduction: next.budgetReduction, budgetChanges: next.budgetChanges });
          break;
        case "HYDRATE":
          await writeAll(next);
          break;
      }
    };
    return save().then(() => { setStatus("synced"); return true; }).catch((error) => { console.error("[FirestoreSync] 저장 실패", error); setStatus("offline"); return false; });
  }, [dispatch, enabled]);

  return { status, dispatchSynced };
}
