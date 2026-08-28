import type {
  Course, BudgetItem, ExecutionRow, AdjustmentLog,
  FilterMode, SortMode, ReportType,
  BudgetChange,
} from "../types";
import { savedBudget20260722 } from "../data/savedBudget";

// ─── State ────────────────────────────────────────────────────
export type BudgetState = {
  courses: Course[];
  executions: ExecutionRow[];
  logs: AdjustmentLog[];
  selectedCourseId: number;
  editingItemId: string;
  filterMode: FilterMode;
  sortMode: SortMode;
  reportType: ReportType;
  currentUser: string;
  budgetBase: number;
  budgetReduction: number;
  budgetChanges: BudgetChange[];
};

const BASE_TOTAL_BUDGET = 278_500_000;
const INITIAL_BUDGET_REDUCTION = 5_205_000;

export const initialState: BudgetState = {
  courses: savedBudget20260722.courses,
  executions: savedBudget20260722.executions,
  logs: savedBudget20260722.logs,
  selectedCourseId: 0,
  editingItemId: savedBudget20260722.courses[0]?.items[0]?.id ?? "",
  filterMode: "all",
  sortMode: "varianceDesc",
  reportType: "summary",
  currentUser: "관리자",
  budgetBase: BASE_TOTAL_BUDGET,
  budgetReduction: INITIAL_BUDGET_REDUCTION,
  budgetChanges: [{
    id: "budget-change-20260828",
    changedAt: "2026-08-28T00:00:00.000Z",
    before: BASE_TOTAL_BUDGET,
    reduction: INITIAL_BUDGET_REDUCTION,
    after: BASE_TOTAL_BUDGET - INITIAL_BUDGET_REDUCTION,
    reason: "현재 미배분 예산 감액 반영(첨부 세출결산현황 기준)",
    editedBy: "관리자",
  }],
};

// ─── Actions ──────────────────────────────────────────────────
export type BudgetAction =
  | { type: "SELECT_COURSE"; courseId: number }
  | { type: "SELECT_ITEM"; itemId: string }
  | { type: "SET_FILTER"; mode: FilterMode }
  | { type: "SET_SORT"; mode: SortMode }
  | { type: "SET_REPORT_TYPE"; reportType: ReportType }
  | { type: "SET_BUDGET_REDUCTION"; reduction: number; reason: string }
  | { type: "RENAME_COURSE"; courseId: number; name: string }
  | { type: "UPDATE_ITEM"; courseId: number; itemId: string; patch: Partial<BudgetItem>; reason: string }
  | { type: "ADD_ITEM"; courseId: number; item: BudgetItem }
  | { type: "DELETE_ITEM"; courseId: number; itemId: string }
  | { type: "ADD_EXECUTION"; row: Omit<ExecutionRow, "id"> }
  | { type: "UPDATE_EXECUTION"; id: number; patch: Partial<ExecutionRow> }
  | { type: "DELETE_EXECUTION"; id: number }
  | { type: "HYDRATE"; courses: Course[]; executions: ExecutionRow[]; logs: AdjustmentLog[]; budgetBase?: number; budgetReduction?: number; budgetChanges?: BudgetChange[] };

// ─── Reducer ──────────────────────────────────────────────────
export function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {

    case "SELECT_COURSE": {
      const course = state.courses.find((c) => c.id === action.courseId);
      const firstItemId = course?.items.find((i) => !i.isDeleted)?.id ?? "";
      return { ...state, selectedCourseId: action.courseId, editingItemId: firstItemId };
    }

    case "SELECT_ITEM":
      return { ...state, editingItemId: action.itemId };

    case "SET_FILTER":
      return { ...state, filterMode: action.mode };

    case "SET_SORT":
      return { ...state, sortMode: action.mode };

    case "SET_REPORT_TYPE":
      return { ...state, reportType: action.reportType };

    case "SET_BUDGET_REDUCTION": {
      const reduction = Math.max(0, Math.min(state.budgetBase, Math.round(action.reduction)));
      if (reduction === state.budgetReduction) return state;
      const change: BudgetChange = {
        id: `budget-change-${Date.now()}`,
        changedAt: new Date().toISOString(),
        before: state.budgetBase - state.budgetReduction,
        reduction,
        after: state.budgetBase - reduction,
        reason: action.reason.trim() || "미배분 예산 감액 조정",
        editedBy: state.currentUser,
      };
      return {
        ...state,
        budgetReduction: reduction,
        budgetChanges: [change, ...state.budgetChanges],
      };
    }

    case "RENAME_COURSE": {
      const course = state.courses.find((c) => c.id === action.courseId);
      const nextName = action.name.trim();
      if (!course || !nextName || course.name === nextName) return state;

      const log: AdjustmentLog = {
        id: `log-${Date.now()}`,
        courseId: action.courseId,
        itemId: "__course__",
        before: {},
        after: {},
        reason: "과정명 변경",
        editedAt: new Date().toISOString(),
        editedBy: state.currentUser,
        kind: "course",
        courseNameBefore: course.name,
        courseNameAfter: nextName,
      };

      return {
        ...state,
        courses: state.courses.map((item) => item.id === action.courseId ? { ...item, name: nextName } : item),
        logs: [log, ...state.logs],
      };
    }

    case "UPDATE_ITEM": {
      const before = state.courses
        .find((c) => c.id === action.courseId)
        ?.items.find((i) => i.id === action.itemId);

      const nextItem = before ? { ...before, ...action.patch } : action.patch;
      const baselineTime = new Date(savedBudget20260722.savedAt).getTime();
      const nextRound = state.logs.filter((log) =>
        log.courseId === action.courseId &&
        log.itemId === action.itemId &&
        new Date(log.editedAt).getTime() >= baselineTime,
      ).length + 1;
      const log: AdjustmentLog = {
        id: `log-${Date.now()}`,
        courseId: action.courseId,
        itemId: action.itemId,
        before: before ? { ...before } : {},
        after: nextItem,
        reason: action.reason,
        editedAt: new Date().toISOString(),
        editedBy: state.currentUser,
        adjustmentRound: nextRound,
        kind: "item",
      };

      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id !== action.courseId ? course : {
            ...course,
            items: course.items.map((item) =>
              item.id !== action.itemId ? item : { ...item, ...action.patch }
            ),
          }
        ),
        logs: [log, ...state.logs],
      };
    }

    case "ADD_ITEM":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id !== action.courseId ? course : {
            ...course,
            items: [...course.items, action.item],
          }
        ),
        editingItemId: action.item.id,
      };

    case "DELETE_ITEM":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id !== action.courseId ? course : {
            ...course,
            items: course.items.map((item) =>
              item.id !== action.itemId ? item : { ...item, isDeleted: true }
            ),
          }
        ),
      };

    case "ADD_EXECUTION": {
      const newRow: ExecutionRow = { ...action.row, id: Date.now() };
      return {
        ...state,
        executions: [newRow, ...state.executions],
        courses: state.courses.map((course) =>
          course.id !== action.row.courseId ? course : {
            ...course,
            items: course.items.map((item) =>
              item.id !== action.row.itemId ? item : { ...item, executed: item.executed + action.row.amount }
            ),
          }
        ),
      };
    }

    case "UPDATE_EXECUTION": {
      const old = state.executions.find((e) => e.id === action.id);
      const amountDiff = (action.patch.amount ?? old?.amount ?? 0) - (old?.amount ?? 0);
      return {
        ...state,
        executions: state.executions.map((e) =>
          e.id !== action.id ? e : { ...e, ...action.patch }
        ),
        courses: amountDiff === 0 ? state.courses : state.courses.map((course) =>
          course.id !== old?.courseId ? course : {
            ...course,
            items: course.items.map((item) =>
              item.id !== old?.itemId ? item : { ...item, executed: item.executed + amountDiff }
            ),
          }
        ),
      };
    }

    case "DELETE_EXECUTION": {
      const target = state.executions.find((e) => e.id === action.id);
      return {
        ...state,
        executions: state.executions.filter((e) => e.id !== action.id),
        courses: !target ? state.courses : state.courses.map((course) =>
          course.id !== target.courseId ? course : {
            ...course,
            items: course.items.map((item) =>
              item.id !== target.itemId ? item : { ...item, executed: Math.max(0, item.executed - target.amount) }
            ),
          }
        ),
      };
    }

    case "HYDRATE":
      return {
        ...state,
        courses: action.courses,
        executions: action.executions,
        logs: action.logs,
        budgetBase: action.budgetBase ?? state.budgetBase,
        budgetReduction: action.budgetReduction ?? state.budgetReduction,
        budgetChanges: action.budgetChanges ?? state.budgetChanges,
      };

    default:
      return state;
  }
}
