import type { AdjustmentLog, BudgetChange, Course } from "../types";

export const SECOND_REDUCTION_CHANGE_ID = "budget-change-20260918";
const BASE_TOTAL_BUDGET = 278_500_000;
const FIRST_REDUCTION = 5_205_000;
const SECOND_REDUCTION = 9_900_000;
export const TOTAL_BUDGET_REDUCTION = FIRST_REDUCTION + SECOND_REDUCTION;

const ITEM_CUTS = [
  {
    id: "c0-3",
    from: 5_500_000,
    group: "행사운영비",
    name: "직종설명회 운영",
    logId: "log-1799713004867",
    editedAt: "2026-09-18T08:16:44.867Z",
  },
  {
    id: "c0-7",
    from: 4_400_000,
    group: "교육훈련비",
    name: "직종설명회 특강 강사료",
    logId: "log-1799713003851",
    editedAt: "2026-09-18T08:16:43.851Z",
  },
] as const;

export type SecondReductionInput = {
  courses: Course[];
  logs: AdjustmentLog[];
  budgetBase?: number;
  budgetReduction?: number;
  budgetChanges?: BudgetChange[];
};

function secondReductionChange(base: number): BudgetChange {
  return {
    id: SECOND_REDUCTION_CHANGE_ID,
    changedAt: "2026-09-18T08:16:44.867Z",
    before: base - FIRST_REDUCTION,
    reduction: SECOND_REDUCTION,
    after: base - TOTAL_BUDGET_REDUCTION,
    reason: "2차 감액 추가 반영(교육훈련비 4,400,000원, 행사운영비 5,500,000원)",
    editedBy: "관리자",
  };
}

/** 서버에 남아 있는 1차 감액 상태를 2차 감액으로 맞춘다. 이미 반영됐거나 금액이 다르면 건드리지 않는다. */
export function applySecondBudgetReduction<T extends SecondReductionInput>(remote: T): { data: T; changed: boolean } {
  const courseIndex = remote.courses.findIndex((course) => Number(course.id) === 0);
  if (courseIndex < 0) return { data: remote, changed: false };

  const course = remote.courses[courseIndex];
  const cuts = ITEM_CUTS.map((cut) => ({ cut, item: course.items.find((entry) => entry.id === cut.id) }));
  if (cuts.some(({ cut, item }) => !item || item.name !== cut.name || item.group !== cut.group)) {
    return { data: remote, changed: false };
  }
  if (cuts.some(({ cut, item }) => item!.adjusted !== cut.from && item!.adjusted !== 0)) {
    return { data: remote, changed: false };
  }

  const changes = Array.isArray(remote.budgetChanges) ? remote.budgetChanges : [];
  const recorded = changes.some((change) => change.id === SECOND_REDUCTION_CHANGE_ID);
  const reduction = remote.budgetReduction;
  const expectedReduction = reduction === undefined || reduction === FIRST_REDUCTION || reduction === TOTAL_BUDGET_REDUCTION;
  if (!expectedReduction) return { data: remote, changed: false };

  const needsItems = cuts.some(({ cut, item }) => item!.adjusted === cut.from);
  const needsReduction = !recorded && reduction !== TOTAL_BUDGET_REDUCTION;
  const needsHistory = !recorded;
  if (!needsItems && !needsReduction && !needsHistory) return { data: remote, changed: false };

  const nextCourse: Course = {
    ...course,
    items: course.items.map((item) => {
      const cut = ITEM_CUTS.find((entry) => entry.id === item.id);
      return cut && item.adjusted === cut.from ? { ...item, adjusted: 0 } : item;
    }),
  };
  const courses = remote.courses.slice();
  courses[courseIndex] = nextCourse;

  const existingLogIds = new Set(remote.logs.map((log) => log.id));
  const nextLogs = [...remote.logs];
  for (const { cut, item } of cuts) {
    if (!item || existingLogIds.has(cut.logId)) continue;
    nextLogs.unshift({
      id: cut.logId,
      courseId: Number(course.id),
      itemId: cut.id,
      before: { group: cut.group, name: cut.name, adjusted: cut.from },
      after: { group: cut.group, name: cut.name, adjusted: 0 },
      reason: "예산 2차 감액 추가 반영",
      editedAt: cut.editedAt,
      editedBy: "관리자",
      adjustmentRound: 2,
      kind: "item",
    });
  }

  const base = remote.budgetBase ?? BASE_TOTAL_BUDGET;
  return {
    changed: true,
    data: {
      ...remote,
      courses,
      logs: nextLogs,
      budgetBase: base,
      budgetReduction: needsReduction ? TOTAL_BUDGET_REDUCTION : (reduction ?? TOTAL_BUDGET_REDUCTION),
      budgetChanges: needsHistory ? [secondReductionChange(base), ...changes] : changes,
    },
  };
}
