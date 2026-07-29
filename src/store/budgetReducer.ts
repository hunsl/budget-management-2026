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

/** 과정 항목의 executed에 델타를 더한다 (음수면 차감, 0 미만은 0으로 클램프). */
function applyExecutedDeltaToCourses(
  courses: Course[],
  courseId: number,
  itemId: string,
  delta: number,
): Course[] {
  if (delta === 0) return courses;
  return courses.map((course) =>
    Number(course.id) !== Number(courseId)
      ? course
      : {
          ...course,
          items: course.items.map((item) =>
            item.id !== itemId
              ? item
              : { ...item, executed: Math.max(0, item.executed + delta) },
          ),
        },
  );
}

function getItemExecuted(courses: Course[], courseId: number, itemId: string): number {
  return courses.find((c) => Number(c.id) === Number(courseId))?.items.find((i) => i.id === itemId)?.executed ?? 0;
}

function sumExecutionsForItem(executions: ExecutionRow[], courseId: number, itemId: string): number {
  return executions
    .filter((e) => Number(e.courseId) === Number(courseId) && String(e.itemId) === String(itemId))
    .reduce((s, e) => s + Number(e.amount), 0);
}

/**
 * 원격 집행 변경을 courses.item.executed에 반영한다.
 * courses 스냅샷이 먼저 와 이미 합계와 일치하면 건너뛰어 이중 가산을 막는다.
 */
function syncCoursesExecutedFromRemoteChange(
  courses: Course[],
  nextExecutions: ExecutionRow[],
  courseId: number,
  itemId: string,
  delta: number,
): Course[] {
  if (delta === 0) return courses;
  const sumAfter = sumExecutionsForItem(nextExecutions, courseId, itemId);
  const current = getItemExecuted(courses, courseId, itemId);
  if (current === sumAfter) return courses; // course sync가 이미 반영함
  return applyExecutedDeltaToCourses(courses, courseId, itemId, delta);
}

/** 원격 문서가 로컬과 값이 같은지 비교한다. 같으면 상태 참조를 그대로 유지해 리렌더를 막는다. */
function isSameDoc(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
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
      const newRow: ExecutionRow = {
        ...action.row,
        id: Date.now(),
        courseId: Number(action.row.courseId),
        itemId: String(action.row.itemId),
        amount: Number(action.row.amount) || 0,
      };
      return {
        ...state,
        executions: [newRow, ...state.executions],
        courses: state.courses.map((course) =>
          Number(course.id) !== Number(newRow.courseId) ? course : {
            ...course,
            items: course.items.map((item) =>
              item.id !== newRow.itemId ? item : { ...item, executed: item.executed + newRow.amount }
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
      const current = state.courses.find((c) => c.id === action.course.id);
      if (current && isSameDoc(current, action.course)) return state;
      const exists = Boolean(current);
      return {
        ...state,
        courses: exists
          ? state.courses.map((c) => (c.id === action.course.id ? action.course : c))
          : [...state.courses, action.course],
      };
    }

    case "REMOTE_EXECUTION_SYNCED": {
      const old = state.executions.find((e) => e.id === action.execution.id);
      if (old && isSameDoc(old, action.execution)) return state;
      const nextExecutions = old
        ? state.executions.map((e) => (e.id === action.execution.id ? action.execution : e))
        : [action.execution, ...state.executions];

      // 집행내역만 오고 courses.item.executed가 안 따라오면 화면 반영이 깨지므로
      // 로컬 ADD/UPDATE와 동일하게 항목 집행액을 델타로 맞춘다.
      // courses 스냅샷이 먼저 반영된 경우에는 합계가 이미 맞아 건너뛴다.
      let courses = state.courses;
      if (!old) {
        courses = syncCoursesExecutedFromRemoteChange(
          courses,
          nextExecutions,
          action.execution.courseId,
          action.execution.itemId,
          action.execution.amount,
        );
      } else {
        const sameTarget =
          old.courseId === action.execution.courseId && old.itemId === action.execution.itemId;
        if (sameTarget) {
          const amountDiff = action.execution.amount - old.amount;
          courses = syncCoursesExecutedFromRemoteChange(
            courses,
            nextExecutions,
            old.courseId,
            old.itemId,
            amountDiff,
          );
        } else {
          const withoutOld = nextExecutions.filter((e) => e.id !== action.execution.id);
          courses = syncCoursesExecutedFromRemoteChange(
            courses,
            withoutOld,
            old.courseId,
            old.itemId,
            -old.amount,
          );
          courses = syncCoursesExecutedFromRemoteChange(
            courses,
            nextExecutions,
            action.execution.courseId,
            action.execution.itemId,
            action.execution.amount,
          );
        }
      }

      return { ...state, executions: nextExecutions, courses };
    }

    case "REMOTE_EXECUTION_DELETED": {
      const target = state.executions.find((e) => e.id === action.id);
      if (!target) {
        return { ...state, executions: state.executions.filter((e) => e.id !== action.id) };
      }
      const nextExecutions = state.executions.filter((e) => e.id !== action.id);
      return {
        ...state,
        executions: nextExecutions,
        courses: syncCoursesExecutedFromRemoteChange(
          state.courses,
          nextExecutions,
          target.courseId,
          target.itemId,
          -target.amount,
        ),
      };
    }

    case "REMOTE_LOG_ADDED": {
      if (state.logs.some((l) => l.id === action.log.id)) return state;
      return { ...state, logs: [action.log, ...state.logs] };
    }

    default:
      return state;
  }
}
