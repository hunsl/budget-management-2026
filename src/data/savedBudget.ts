import type { AdjustmentLog, Course, ExecutionRow } from "../types";
import savedBudget from "./budgetData20260722.json";

type SavedBudgetPayload = {
  savedAt?: string;
  data?: {
    courses?: Course[];
    executions?: ExecutionRow[];
    logs?: AdjustmentLog[];
  };
};

const payload = savedBudget as SavedBudgetPayload;

export const savedBudget20260722 = {
  savedAt: payload.savedAt ?? "2026-07-22T04:09:01.501Z",
  courses: payload.data?.courses ?? [],
  executions: payload.data?.executions ?? [],
  logs: payload.data?.logs ?? [],
};

export function courseAdjustedTotal(course: Course | undefined): number {
  return course?.items
    .filter((item) => !item.isDeleted)
    .reduce((sum, item) => sum + (item.adjusted || 0), 0) ?? 0;
}

export function hasRecoveredUnassignedCourses(courses: Course[]): boolean {
  return [11, 12, 13].every((id) => courseAdjustedTotal(courses.find((course) => course.id === id)) > 0);
}

export function matchesSavedUnassignedCourses(courses: Course[]): boolean {
  return [11, 12, 13].every((id) => {
    const current = courses.find((course) => course.id === id);
    const saved = savedBudget20260722.courses.find((course) => course.id === id);

    return (
      !!current &&
      !!saved &&
      current.name === saved.name &&
      current.items.length === saved.items.length &&
      courseAdjustedTotal(current) === courseAdjustedTotal(saved)
    );
  });
}

export function matchesSavedBudgetCourses(courses: Course[]): boolean {
  if (courses.length !== savedBudget20260722.courses.length) return false;

  return savedBudget20260722.courses.every((saved) => {
    const current = courses.find((course) => course.id === saved.id);
    return (
      !!current &&
      current.name === saved.name &&
      current.items.length === saved.items.length &&
      courseAdjustedTotal(current) === courseAdjustedTotal(saved)
    );
  });
}
