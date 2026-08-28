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
  data: Pick<BudgetState, "courses" | "executions" | "logs"> & Partial<Pick<BudgetState, "budgetBase" | "budgetReduction" | "budgetChanges">>;
};

type PersistedDataLike = {
  version?: number;
  savedAt?: string;
  exportedBy?: string;
  data?: Partial<Pick<BudgetState, "courses" | "executions" | "logs" | "budgetBase" | "budgetReduction" | "budgetChanges">>;
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
      budgetBase: typeof parsed.data.budgetBase === "number" ? parsed.data.budgetBase : undefined,
      budgetReduction: typeof parsed.data.budgetReduction === "number" ? parsed.data.budgetReduction : undefined,
      budgetChanges: Array.isArray(parsed.data.budgetChanges) ? parsed.data.budgetChanges : undefined,
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
      budgetBase: state.budgetBase,
      budgetReduction: state.budgetReduction,
      budgetChanges: state.budgetChanges,
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

/** localStorage에서 초기 상태를 복원합니다. */
export function loadPersistedState(): Partial<BudgetState> | null {
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
      ...(typeof parsed.data.budgetBase === "number" ? { budgetBase: parsed.data.budgetBase } : {}),
      ...(typeof parsed.data.budgetReduction === "number" ? { budgetReduction: parsed.data.budgetReduction } : {}),
      ...(Array.isArray(parsed.data.budgetChanges) ? { budgetChanges: parsed.data.budgetChanges } : {}),
    };
  } catch (error) {
    keepUnreadableSnapshot(raw);
    console.warn("[Persistence] localStorage 파싱 실패. 초기 데이터를 사용합니다.", error);
    return null;
  }
}

/** 상태 변경을 localStorage에 저장하고 다른 탭의 변경을 감지합니다. */
export function usePersistence(
  state: BudgetState,
  dispatch: React.Dispatch<BudgetAction>,
) {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const persisted = createPersistedData(state);
    savePersistedData(persisted);
    setLastSavedAt(persisted.savedAt);
  }, [state.courses, state.executions, state.logs, state.currentUser, state.budgetBase, state.budgetReduction, state.budgetChanges]);

  const handleStorageChange = useCallback(
    (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const incoming = parseBudgetBackup(e.newValue);
        dispatch({
          type: "HYDRATE",
          courses: incoming.data.courses,
          executions: incoming.data.executions,
          logs: incoming.data.logs,
          budgetBase: incoming.data.budgetBase,
          budgetReduction: incoming.data.budgetReduction,
          budgetChanges: incoming.data.budgetChanges,
        });
        setLastSavedAt(incoming.savedAt);
      } catch {
        // Ignore malformed data from other tabs.
      }
    },
    [dispatch],
  );

  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [handleStorageChange]);

  return { lastSavedAt };
}
