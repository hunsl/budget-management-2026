import type {
  Course, BudgetItem, ExecutionRow, AdjustmentLog,
  FilterMode, SortMode, ReportType,
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
};

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
};

// ─── Actions ──────────────────────────────────────────────────
export type BudgetAction =
  | { type: "SELECT_COURSE"; courseId: number }
  | { type: "SELECT_ITEM"; itemId: string }
  | { type: "SET_FILTER"; mode: FilterMode }
  | { type: "SET_SORT"; mode: SortMode }
  | { type: "SET_REPORT_TYPE"; reportType: ReportType }
  | { type: "UPDATE_ITEM"; courseId: number; itemId: string; patch: Partial<BudgetItem>; reason: string }
  | { type: "ADD_ITEM"; courseId: number; item: BudgetItem }
  | { type: "DELETE_ITEM"; courseId: number; itemId: string }
  | { type: "ADD_EXECUTION"; row: Omit<ExecutionRow, "id"> }
  | { type: "UPDATE_EXECUTION"; id: number; patch: Partial<ExecutionRow> }
  | { type: "DELETE_EXECUTION"; id: number }
  | { type: "HYDRATE"; courses: Course[]; executions: ExecutionRow[]; logs: AdjustmentLog[] }
  | { type: "SET_CURRENT_USER"; name: string }
  | { type: "REMOTE_COURSE_SYNCED"; course: Course }
  | { type: "REMOTE_EXECUTION_SYNCED"; execution: ExecutionRow }
  | { type: "REMOTE_EXECUTION_DELETED"; id: number }
  | { type: "REMOTE_LOG_ADDED"; log: AdjustmentLog };

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

    case "UPDATE_ITEM": {
      const before = state.courses
        .find((c) => c.id === action.courseId)
        ?.items.find((i) => i.id === action.itemId);

      const log: AdjustmentLog = {
        id: `log-${Date.now()}`,
        courseId: action.courseId,
        itemId: action.itemId,
        before: before ? { ...before } : {},
        after: action.patch,
        reason: action.reason,
        editedAt: new Date().toISOString(),
        editedBy: state.currentUser,
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
      };

    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.name };

    // ─── Firestore 원격 변경 병합 (다른 사용자/다른 탭에서 들어온 변경) ───

    case "REMOTE_COURSE_SYNCED": {
      const exists = state.courses.some((c) => c.id === action.course.id);
      return {
        ...state,
        courses: exists
          ? state.courses.map((c) => (c.id === action.course.id ? action.course : c))
          : [...state.courses, action.course],
      };
    }

    case "REMOTE_EXECUTION_SYNCED": {
      const exists = state.executions.some((e) => e.id === action.execution.id);
      return {
        ...state,
        executions: exists
          ? state.executions.map((e) => (e.id === action.execution.id ? action.execution : e))
          : [action.execution, ...state.executions],
      };
    }

    case "REMOTE_EXECUTION_DELETED":
      return {
        ...state,
        executions: state.executions.filter((e) => e.id !== action.id),
      };

    case "REMOTE_LOG_ADDED": {
      if (state.logs.some((l) => l.id === action.log.id)) return state;
      return { ...state, logs: [action.log, ...state.logs] };
    }

    default:
      return state;
  }
}
