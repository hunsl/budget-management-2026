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
  | { type: "REMOTE_COURSES_REPLACED"; courses: Course[] }
  | { type: "REMOTE_EXECUTION_SYNCED"; execution: ExecutionRow }
  | { type: "REMOTE_EXECUTIONS_REPLACED"; executions: ExecutionRow[] }
  | { type: "REMOTE_EXECUTION_DELETED"; id: number }
  | { type: "REMOTE_LOG_ADDED"; log: AdjustmentLog }
  | { type: "REMOTE_LOGS_REPLACED"; logs: AdjustmentLog[] };

/** 항목별 집행내역 합계로 executed를 맞춘다.
 * - 내역이 있으면 합계 사용
 * - 이전에 내역이 있었는데 없어졌으면 0
 * - 내역이 한 번도 없으면(수동 입력) 기존 executed 유지
 */
export function reconcileCoursesExecuted(
  courses: Course[],
  executions: ExecutionRow[],
  previousExecutions?: ExecutionRow[],
): Course[] {
  const sums = new Map<string, number>();
  for (const e of executions) {
    const key = `${e.courseId}::${e.itemId}`;
    sums.set(key, (sums.get(key) ?? 0) + e.amount);
  }

  const previousKeys = new Set<string>();
  if (previousExecutions) {
    for (const e of previousExecutions) {
      previousKeys.add(`${e.courseId}::${e.itemId}`);
    }
  }

  return courses.map((course) => ({
    ...course,
    items: course.items.map((item) => {
      const key = `${course.id}::${item.id}`;
      if (sums.has(key)) {
        const executed = sums.get(key) ?? 0;
        return item.executed === executed ? item : { ...item, executed };
      }
      if (previousKeys.has(key) && item.executed !== 0) {
        return { ...item, executed: 0 };
      }
      return item;
    }),
  }));
}

export function getItemExecutedSum(
  executions: ExecutionRow[],
  courseId: number,
  itemId: string,
): number {
  return executions
    .filter((e) => e.courseId === courseId && e.itemId === itemId)
    .reduce((s, e) => s + e.amount, 0);
}

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

      const courses = state.courses.map((course) =>
        course.id !== action.courseId ? course : {
          ...course,
          items: course.items.map((item) =>
            item.id !== action.itemId ? item : { ...item, ...action.patch }
          ),
        }
      );

      // 집행내역이 있는 항목은 합계가 진실 — 수동 집행액 입력을 덮어 일치시킨다.
      return {
        ...state,
        courses: reconcileCoursesExecuted(courses, state.executions),
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
      const executions = [newRow, ...state.executions];
      return {
        ...state,
        executions,
        courses: reconcileCoursesExecuted(state.courses, executions, state.executions),
      };
    }

    case "UPDATE_EXECUTION": {
      const executions = state.executions.map((e) =>
        e.id !== action.id ? e : { ...e, ...action.patch }
      );
      return {
        ...state,
        executions,
        courses: reconcileCoursesExecuted(state.courses, executions, state.executions),
      };
    }

    case "DELETE_EXECUTION": {
      const executions = state.executions.filter((e) => e.id !== action.id);
      return {
        ...state,
        executions,
        courses: reconcileCoursesExecuted(state.courses, executions, state.executions),
      };
    }

    case "HYDRATE":
      return {
        ...state,
        courses: reconcileCoursesExecuted(action.courses, action.executions, state.executions),
        executions: action.executions,
        logs: action.logs,
      };

    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.name };

    // ─── Firestore 원격 변경 병합 ───

    case "REMOTE_COURSE_SYNCED": {
      const exists = state.courses.some((c) => c.id === action.course.id);
      const courses = exists
        ? state.courses.map((c) => (c.id === action.course.id ? action.course : c))
        : [...state.courses, action.course];
      return {
        ...state,
        courses: reconcileCoursesExecuted(courses, state.executions, state.executions),
      };
    }

    case "REMOTE_COURSES_REPLACED":
      return {
        ...state,
        courses: reconcileCoursesExecuted(action.courses, state.executions, state.executions),
      };

    case "REMOTE_EXECUTION_SYNCED": {
      const exists = state.executions.some((e) => e.id === action.execution.id);
      const executions = exists
        ? state.executions.map((e) => (e.id === action.execution.id ? action.execution : e))
        : [action.execution, ...state.executions];
      return {
        ...state,
        executions,
        courses: reconcileCoursesExecuted(state.courses, executions, state.executions),
      };
    }

    case "REMOTE_EXECUTIONS_REPLACED":
      return {
        ...state,
        executions: action.executions,
        courses: reconcileCoursesExecuted(state.courses, action.executions, state.executions),
      };

    case "REMOTE_EXECUTION_DELETED": {
      const executions = state.executions.filter((e) => e.id !== action.id);
      return {
        ...state,
        executions,
        courses: reconcileCoursesExecuted(state.courses, executions, state.executions),
      };
    }

    case "REMOTE_LOG_ADDED": {
      if (state.logs.some((l) => l.id === action.log.id)) return state;
      return { ...state, logs: [action.log, ...state.logs] };
    }

    case "REMOTE_LOGS_REPLACED":
      return { ...state, logs: action.logs };

    default:
      return state;
  }
}
