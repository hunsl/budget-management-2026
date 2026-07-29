import { useCallback, useEffect, useState } from "react";
import type { BudgetAction, BudgetState } from "../store/budgetReducer";
import { matchesSavedBudgetCourses, savedBudget20260722 } from "../data/savedBudget";

const STORAGE_KEY = "budget-mgmt-2026";
const RESTORE_KEY = "budget-mgmt-2026-restored-from-20260722";
const SCHEMA_VERSION = 1;

export type PersistedData = {
  version: number;
  savedAt: string;
  exportedBy?: string;
  data: Pick<BudgetState, "courses" | "executions" | "logs">;
};

type PersistedDataLike = {
  version?: number;
  savedAt?: string;
  exportedBy?: string;
  data?: Partial<Pick<BudgetState, "courses" | "executions" | "logs">>;
};

function normalizePersistedData(value: unknown): PersistedData {
  const parsed = value as PersistedDataLike;
  if (!parsed || typeof parsed !== "object" || !parsed.data || !Array.isArray(parsed.data.courses)) {
    throw new Error("지원하지 않는 백업 파일이거나 데이터 구조가 올바르지 않습니다.");
  }

  return {
    version: SCHEMA_VERSION,
    savedAt: parsed.savedAt ?? new Date().toISOString(),
    exportedBy: parsed.exportedBy,
    data: {
      courses: parsed.data.courses,
      executions: Array.isArray(parsed.data.executions) ? parsed.data.executions : [],
      logs: Array.isArray(parsed.data.logs) ? parsed.data.logs : [],
    },
  };
}

export function createPersistedData(state: BudgetState): PersistedData {
  return {
    version: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    exportedBy: state.currentUser,
    data: {
      courses: state.courses,
      executions: state.executions,
      logs: state.logs,
    },
  };
}

export function parseBudgetBackup(raw: string): PersistedData {
  return normalizePersistedData(JSON.parse(raw));
}

export function downloadBudgetBackup(state: BudgetState) {
  const persisted = createPersistedData(state);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const blob = new Blob([JSON.stringify(persisted, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `예산프로그램_백업_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function savePersistedData(persisted: PersistedData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

function keepUnreadableSnapshot(raw: string) {
  try {
    localStorage.setItem(`${STORAGE_KEY}-unreadable-${Date.now()}`, raw);
  } catch {
    // If storage is full or unavailable, startup should still continue.
  }
}

/**
 * localStorage에서 초기 상태를 복원합니다.
 * Firebase 사용 시에는 Firestore가 원본이므로 로컬 캐시로 시작하지 않는다.
 * (오래된 localStorage 집행내역이 서버와 섞이면 집행액이 틀어진다.)
 */
export function loadPersistedState(options?: { preferRemote?: boolean }): Partial<BudgetState> | null {
  if (options?.preferRemote) return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = parseBudgetBackup(raw);
    const restoredFromSavedData = localStorage.getItem(RESTORE_KEY) === "yes";
    if (!restoredFromSavedData && !matchesSavedBudgetCourses(parsed.data.courses)) {
      localStorage.setItem(RESTORE_KEY, "yes");
      return {
        courses: savedBudget20260722.courses,
        executions: savedBudget20260722.executions,
        logs: savedBudget20260722.logs,
      };
    }

    return {
      courses: parsed.data.courses,
      executions: parsed.data.executions,
      logs: parsed.data.logs,
    };
  } catch (error) {
    keepUnreadableSnapshot(raw);
    console.warn("[Persistence] localStorage 파싱 실패. 초기 데이터를 사용합니다.", error);
    return null;
  }
}

/**
 * 상태 변경을 localStorage에 저장하고 다른 탭의 변경을 감지합니다.
 * Firebase 모드(preferRemote)에서는 다른 탭 localStorage HYDRATE를 하지 않는다.
 * (Firestore 실시간 구독이 이미 동기화한다.)
 */
export function usePersistence(
  state: BudgetState,
  dispatch: React.Dispatch<BudgetAction>,
  options?: { preferRemote?: boolean },
) {
  const preferRemote = options?.preferRemote ?? false;
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const persisted = createPersistedData(state);
    savePersistedData(persisted);
    setLastSavedAt(persisted.savedAt);
  }, [state.courses, state.executions, state.logs, state.currentUser]);

  const handleStorageChange = useCallback(
    (e: StorageEvent) => {
      if (preferRemote) return;
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const incoming = parseBudgetBackup(e.newValue);
        dispatch({
          type: "HYDRATE",
          courses: incoming.data.courses,
          executions: incoming.data.executions,
          logs: incoming.data.logs,
        });
        setLastSavedAt(incoming.savedAt);
      } catch {
        // Ignore malformed data from other tabs.
      }
    },
    [dispatch, preferRemote],
  );

  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [handleStorageChange]);

  return { lastSavedAt };
}
