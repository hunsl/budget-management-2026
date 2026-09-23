import { useCallback, useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { budgetReducer, type BudgetAction, type BudgetState } from "../store/budgetReducer";
import { applySecondBudgetReduction } from "../store/secondReduction";
import type { AdjustmentLog, Course, ExecutionRow } from "../types";

const COLLECTIONS = { courses: "courses", executions: "executions", logs: "logs" } as const;

function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => withoutUndefined(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, withoutUndefined(entry)]),
    ) as T;
  }
  return value;
}

function sameId(left: unknown, right: unknown): boolean {
  return Number(left) === Number(right);
}
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

const SECOND_REDUCTION_LOG_IDS = ["log-1799713004867", "log-1799713003851"];

function persistSecondReduction(data: RemoteData) {
  const course = data.courses.find((item) => Number(item.id) === 0);
  if (!course) return Promise.resolve();
  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTIONS.courses, String(course.id)), course);
  SECOND_REDUCTION_LOG_IDS.forEach((logId) => {
    const log = data.logs.find((item) => item.id === logId);
    if (log) batch.set(doc(db, COLLECTIONS.logs, log.id), log);
  });
  batch.set(doc(db, "settings", "budget"), {
    budgetBase: data.budgetBase,
    budgetReduction: data.budgetReduction,
    budgetChanges: data.budgetChanges ?? [],
  }, { merge: true });
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
    let settingsExists = false;
    // Firebase 연결 전부터 사용하던 이 브라우저의 데이터가 있는지 기록한다.
    // 최초 마이그레이션 때만 기존 로컬 조정 내용을 서버에 올린다.
    const hadLocalData = Boolean(localStorage.getItem("budget-mgmt-2026"));

    let applyingReduction = false;
    const syncSnapshot = () => {
      if (!ready.has("courses") || !ready.has("executions") || !ready.has("logs") || !settingsSeen) return;
      const migrated = applySecondBudgetReduction(remote);
      if (migrated.changed) {
        remote.courses = migrated.data.courses;
        remote.logs = migrated.data.logs;
        remote.budgetBase = migrated.data.budgetBase;
        remote.budgetReduction = migrated.data.budgetReduction;
        remote.budgetChanges = migrated.data.budgetChanges;
        if (!applyingReduction) {
          applyingReduction = true;
          void persistSecondReduction(remote).catch((error) => {
            applyingReduction = false;
            console.error("[FirestoreSync] 2차 감액 반영 실패", error);
            setStatus("offline");
          });
        }
      }
      setStatus("synced");
      if (!hydrated) {
        hydrated = true;
        if (!settingsExists && hadLocalData) {
          // 구버전 Firebase에는 settings 문서가 없으므로, 조정 작업을 해 온
          // 기존 PC의 localStorage를 최초 1회 정식 원본으로 마이그레이션한다.
          void writeAll(stateRef.current).catch((error) => {
            console.error("[FirestoreSync] 기존 로컬 데이터 마이그레이션 실패", error);
            setStatus("offline");
          });
        } else if (remote.courses.length || remote.executions.length || remote.logs.length) {
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
      settingsExists = snap.exists();
      if (settingsExists) Object.assign(remote, snap.data());
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
        case "UPDATE_ITEM": case "ADD_ITEM": case "DELETE_ITEM": case "RENAME_COURSE": {
          const course = next.courses.find((item) => sameId(item.id, action.courseId));
          if (!course) throw new Error("수정할 과정을 찾지 못했습니다.");
          await setDoc(doc(db, COLLECTIONS.courses, String(course.id)), withoutUndefined(course));
          if (action.type === "UPDATE_ITEM" || action.type === "RENAME_COURSE") await setDoc(doc(db, COLLECTIONS.logs, next.logs[0].id), withoutUndefined(next.logs[0]));
          break;
        }
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
