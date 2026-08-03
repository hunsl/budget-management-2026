// ─── 예산 항목 ───────────────────────────────────────────────
export type BudgetItem = {
  id: string;
  group: string;
  name: string;
  calc: string;
  unitPrice: number;
  qty1?: number;
  qty2?: number;
  qty3?: number;
  qty4?: number;
  original: number;
  adjusted: number;
  executed: number;
  isDeleted?: boolean; // soft-delete
};

// ─── 과정 ────────────────────────────────────────────────────
export type Course = {
  id: number;
  name: string;
  manager: string;
  category: string;
  items: BudgetItem[];
};

// ─── 집행내역 ─────────────────────────────────────────────────
export type ExecutionRow = {
  id: number;
  courseId: number;
  itemId: string;
  date: string;
  amount: number;
  vendor: string;
  proofNo: string;
  memo: string;
};

// ─── 수정이력 ─────────────────────────────────────────────────
export type AdjustmentLog = {
  id: string;
  courseId: number;
  itemId: string;
  before: Partial<BudgetItem>;
  after: Partial<BudgetItem>;
  reason: string;
  editedAt: string;
  editedBy: string;
  adjustmentRound?: number;
  kind?: "item" | "course";
  courseNameBefore?: string;
  courseNameAfter?: string;
};

// ─── 경고 ────────────────────────────────────────────────────
export type WarningLevel = "info" | "warning" | "critical";

export type WarningItem = {
  id: string;
  level: WarningLevel;
  courseId: number;
  itemId?: string;
  type: string;
  message: string;
};

// ─── 편집 폼 ─────────────────────────────────────────────────
export type EditForm = {
  group: string;
  name: string;
  unitPrice: string;
  qty1: string;
  qty2: string;
  qty3: string;
  adjusted: string;
  executed: string;
  calc: string;
  reason: string;
};

// ─── 집행 폼 ─────────────────────────────────────────────────
export type ExecForm = {
  date: string;
  itemId: string;
  amount: string;
  vendor: string;
  proofNo: string;
  memo: string;
};

// ─── 필터/정렬 ───────────────────────────────────────────────
export type FilterMode = "all" | "increase" | "decrease" | "lowExecution";
export type SortMode = "varianceDesc" | "executionAsc" | "name";
export type ReportType = "summary" | "selected" | "risk" | "common";

// ─── 집계 헬퍼 ───────────────────────────────────────────────
export type CourseTotals = {
  original: number;
  adjusted: number;
  executed: number;
  remaining: number;
  variance: number;
  executionRate: number;
};

export type ItemDetailed = BudgetItem & {
  variance: number;
  remaining: number;
  executionRate: number;
  changeRate: number;
  status: "증액" | "감액" | "유지";
};
