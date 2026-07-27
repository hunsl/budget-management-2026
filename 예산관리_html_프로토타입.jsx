import React, { useEffect, useMemo, useState } from "react";

type BudgetItem = {
  id: string;
  group: string;
  name: string;
  calc: string;
  unitPrice: number;
  qty1?: number;
  qty2?: number;
  qty3?: number;
  original: number;
  adjusted: number;
  executed: number;
};

type Course = {
  id: number;
  name: string;
  manager: string;
  category: string;
  items: BudgetItem[];
};

type ExecutionRow = {
  id: number;
  courseId: number;
  itemId: string;
  date: string;
  amount: number;
  vendor: string;
  proofNo: string;
  memo: string;
};

type EditForm = {
  group: string;
  name: string;
  unitPrice: string;
  qty1: string;
  qty2: string;
  qty3: string;
  adjusted: string;
  calc: string;
  reason: string;
};

const initialCourses: Course[] = [
  {
    id: 0,
    name: "공통 운영(과정 외 운영비)",
    manager: "이상훈 과장 / 공통",
    category: "공통 운영",
    items: [
      { id: "c0-1", group: "사무관리비", name: "교육과정 홍보물 제작", calc: "21,450,000 × 1", unitPrice: 21450000, qty1: 1, qty2: 1, original: 21450000, adjusted: 21450000, executed: 7800000 },
      { id: "c0-2", group: "사무관리비", name: "SNS·문자 홍보", calc: "6,500,000 × 1", unitPrice: 6500000, qty1: 1, qty2: 1, original: 6500000, adjusted: 7200000, executed: 2400000 },
      { id: "c0-3", group: "행사운영비", name: "직종설명회 운영", calc: "5,500,000 × 1", unitPrice: 5500000, qty1: 1, qty2: 1, original: 5500000, adjusted: 5500000, executed: 0 },
      { id: "c0-4", group: "회의비", name: "강사 간담회 및 다과", calc: "800,000 × 1", unitPrice: 800000, qty1: 1, qty2: 1, original: 800000, adjusted: 800000, executed: 180000 },
      { id: "c0-5", group: "교육훈련비", name: "심화교육 특강 강사료", calc: "4,000,000 × 1", unitPrice: 4000000, qty1: 1, qty2: 1, original: 4000000, adjusted: 4500000, executed: 0 },
      { id: "c0-6", group: "교육훈련비", name: "직종설명회 특강 강사료", calc: "2,000,000 × 1", unitPrice: 2000000, qty1: 1, qty2: 1, original: 2000000, adjusted: 2000000, executed: 0 },
      { id: "c0-7", group: "교육훈련비", name: "학습동아리 운영(공통)", calc: "4,900,000 × 1", unitPrice: 4900000, qty1: 1, qty2: 1, original: 4900000, adjusted: 4900000, executed: 1200000 },
      { id: "c0-8", group: "행사실비보상금", name: "개강/수료식 다과", calc: "1,500,000 × 1", unitPrice: 1500000, qty1: 1, qty2: 1, original: 1500000, adjusted: 1500000, executed: 620000 },
    ],
  },
  {
    id: 1,
    name: "행정회계 사무 OA(1·2기)",
    manager: "신동원 주임",
    category: "사무분야",
    items: [
      { id: "c1-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 2", unitPrice: 400000, qty1: 2, qty2: 1, original: 800000, adjusted: 800000, executed: 400000 },
      { id: "c1-2", group: "사무관리비", name: "교재비용", calc: "60,000 × 20 × 2", unitPrice: 60000, qty1: 20, qty2: 2, original: 2400000, adjusted: 2200000, executed: 0 },
      { id: "c1-3", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 2", unitPrice: 1650000, qty1: 2, qty2: 1, original: 3300000, adjusted: 3300000, executed: 1650000 },
      { id: "c1-4", group: "공공운영비", name: "우편발송료", calc: "5,000 × 6 × 2", unitPrice: 5000, qty1: 6, qty2: 2, original: 60000, adjusted: 60000, executed: 30000 },
      { id: "c1-5", group: "교육훈련비", name: "강사수당", calc: "80,000 × 184H × 2", unitPrice: 80000, qty1: 184, qty2: 2, original: 29440000, adjusted: 28600000, executed: 8400000 },
      { id: "c1-6", group: "교육훈련비", name: "취업대비특강", calc: "100,000 × 8H × 2", unitPrice: 100000, qty1: 8, qty2: 2, original: 1600000, adjusted: 1200000, executed: 600000 },
      { id: "c1-7", group: "교육훈련비", name: "생성형AI 특강", calc: "100,000 × 8H × 2", unitPrice: 100000, qty1: 8, qty2: 2, original: 1600000, adjusted: 1200000, executed: 0 },
      { id: "c1-8", group: "교육훈련비", name: "사후관리특강", calc: "100,000 × 4H × 2", unitPrice: 100000, qty1: 4, qty2: 2, original: 800000, adjusted: 800000, executed: 0 },
      { id: "c1-9", group: "교육훈련비", name: "학습동아리", calc: "700,000 × 2", unitPrice: 700000, qty1: 2, qty2: 1, original: 1400000, adjusted: 1400000, executed: 0 },
      { id: "c1-10", group: "교육훈련비", name: "훈련지원금", calc: "50,000 × 20 × 2 × 2", unitPrice: 50000, qty1: 20, qty2: 2, qty3: 2, original: 4000000, adjusted: 4540000, executed: 1920000 },
    ],
  },
  {
    id: 2,
    name: "HACCP 전문인력 양성",
    manager: "이상훈 과장",
    category: "식품분야",
    items: [
      { id: "c2-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, qty2: 1, original: 400000, adjusted: 400000, executed: 400000 },
      { id: "c2-2", group: "사무관리비", name: "교재비용", calc: "31,000 × 21 × 3", unitPrice: 31000, qty1: 21, qty2: 3, original: 1953000, adjusted: 1800000, executed: 0 },
      { id: "c2-3", group: "사무관리비", name: "실습용역", calc: "10,062,000 × 1", unitPrice: 10062000, qty1: 1, qty2: 1, original: 10062000, adjusted: 10062000, executed: 5031000 },
      { id: "c2-4", group: "교육훈련비", name: "강사수당", calc: "120,000 × 132H", unitPrice: 120000, qty1: 132, qty2: 1, original: 15840000, adjusted: 15000000, executed: 3800000 },
      { id: "c2-5", group: "교육훈련비", name: "실험보조", calc: "50,000 × 56H", unitPrice: 50000, qty1: 56, qty2: 1, original: 2800000, adjusted: 2800000, executed: 560000 },
      { id: "c2-6", group: "교육훈련비", name: "AI 특강", calc: "100,000 × 4H", unitPrice: 100000, qty1: 4, qty2: 1, original: 400000, adjusted: 400000, executed: 0 },
    ],
  },
  {
    id: 3,
    name: "ERP·지게차 물류관리 실무자 양성",
    manager: "이상훈 과장",
    category: "지역연계·기여형",
    items: [
      { id: "c3-1", group: "사무관리비", name: "교육장 임차", calc: "9,980,000 × 1", unitPrice: 9980000, qty1: 1, qty2: 1, original: 9980000, adjusted: 9980000, executed: 0 },
      { id: "c3-2", group: "교육훈련비", name: "강사수당", calc: "65,000 × 102H", unitPrice: 65000, qty1: 102, qty2: 1, original: 6630000, adjusted: 6630000, executed: 2600000 },
      { id: "c3-3", group: "교육훈련비", name: "ERP강사", calc: "65,000 × 72H", unitPrice: 65000, qty1: 72, qty2: 1, original: 4680000, adjusted: 5980000, executed: 1800000 },
      { id: "c3-4", group: "교육훈련비", name: "취업/안전 특강", calc: "100,000 × 4H × 2", unitPrice: 100000, qty1: 4, qty2: 2, original: 800000, adjusted: 800000, executed: 400000 },
      { id: "c3-5", group: "교육훈련비", name: "훈련지원금", calc: "50,000 × 15 × 1", unitPrice: 50000, qty1: 15, qty2: 1, original: 750000, adjusted: 750000, executed: 250000 },
    ],
  },
];

const initialExecutions: ExecutionRow[] = [
  { id: 1, courseId: 0, itemId: "c0-1", date: "2026-03-20", amount: 4200000, vendor: "홍보업체 A", proofNo: "증빙-2026-041", memo: "1차 홍보 집행" },
  { id: 2, courseId: 1, itemId: "c1-5", date: "2026-04-08", amount: 4200000, vendor: "홍길동 강사", proofNo: "증빙-2026-042", memo: "강사수당 일부 집행" },
  { id: 3, courseId: 2, itemId: "c2-3", date: "2026-04-10", amount: 5031000, vendor: "실습기관", proofNo: "증빙-2026-043", memo: "실습용역 선지급" },
];

function courseTotals(course: Course) {
  const original = course.items.reduce((sum, item) => sum + item.original, 0);
  const adjusted = course.items.reduce((sum, item) => sum + item.adjusted, 0);
  const executed = course.items.reduce((sum, item) => sum + item.executed, 0);
  const remaining = adjusted - executed;
  const variance = adjusted - original;
  const executionRate = adjusted === 0 ? 0 : executed / adjusted;
  return { original, adjusted, executed, remaining, variance, executionRate };
}

function formatWon(n: number) {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(n || 0))}원`;
}

function formatPct(n: number) {
  return `${((n || 0) * 100).toFixed(1)}%`;
}

function parseNumber(value: string | number | undefined, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function statusEmoji(original: number, adjusted: number, executionRate: number) {
  if (adjusted > original) return "🔴";
  if (executionRate < 0.3) return "🟡";
  return "🟢";
}

function StatCard({
  title,
  value,
  sub,
  tone = "default",
}: {
  title: string;
  value: string;
  sub: string;
  tone?: "default" | "dark" | "amber" | "emerald" | "rose";
}) {
  const toneMap = {
    default: "bg-white ring-slate-200 text-slate-900",
    dark: "bg-slate-900 ring-slate-900 text-white",
    amber: "bg-amber-50 ring-amber-200 text-amber-900",
    emerald: "bg-emerald-50 ring-emerald-200 text-emerald-900",
    rose: "bg-rose-50 ring-rose-200 text-rose-900",
  };

  return (
    <div className={`rounded-2xl p-5 shadow-sm ring-1 ${toneMap[tone]}`}>
      <div className={`text-sm ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className={`mt-1 text-xs ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{sub}</div>
    </div>
  );
}

export default function BudgetPrototype() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [executions, setExecutions] = useState<ExecutionRow[]>(initialExecutions);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<"all" | "increase" | "decrease" | "lowExecution">("all");
  const [sortMode, setSortMode] = useState<"varianceDesc" | "executionAsc" | "name">("varianceDesc");
  const [editingItemId, setEditingItemId] = useState<string>("c0-1");
  const [reportType, setReportType] = useState<"summary" | "selected" | "risk">("summary");
  const [execForm, setExecForm] = useState({
    date: "2026-04-08",
    itemId: "c0-1",
    amount: "4200000",
    vendor: "",
    proofNo: "",
    memo: "",
  });
  const [editForm, setEditForm] = useState<EditForm>({
    group: "사무관리비",
    name: "교육과정 홍보물 제작",
    unitPrice: "21450000",
    qty1: "1",
    qty2: "1",
    qty3: "1",
    adjusted: "21450000",
    calc: "21,450,000 × 1",
    reason: "공통 운영 예산 중 대외 홍보물 제작 범위를 유지하여 조정 없이 반영",
  });

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0],
    [courses, selectedCourseId]
  );

  const courseSummary = useMemo(
    () => courses.map((course) => ({ ...course, ...courseTotals(course) })),
    [courses]
  );

  const summary = useMemo(() => {
    const original = courseSummary.reduce((sum, course) => sum + course.original, 0);
    const adjusted = courseSummary.reduce((sum, course) => sum + course.adjusted, 0);
    const executed = courseSummary.reduce((sum, course) => sum + course.executed, 0);
    const remaining = adjusted - executed;
    const variance = adjusted - original;
    const executionRate = adjusted === 0 ? 0 : executed / adjusted;
    return { original, adjusted, executed, remaining, variance, executionRate };
  }, [courseSummary]);

  const selectedCourseTotals = useMemo(() => courseTotals(selectedCourse), [selectedCourse]);

  const selectedItem = useMemo(
    () => selectedCourse.items.find((item) => item.id === editingItemId) ?? selectedCourse.items[0],
    [selectedCourse, editingItemId]
  );

  useEffect(() => {
    if (!selectedItem) return;
    setEditForm({
      group: selectedItem.group,
      name: selectedItem.name,
      unitPrice: String(selectedItem.unitPrice ?? selectedItem.adjusted),
      qty1: String(selectedItem.qty1 ?? 1),
      qty2: String(selectedItem.qty2 ?? 1),
      qty3: String(selectedItem.qty3 ?? 1),
      adjusted: String(selectedItem.adjusted),
      calc: selectedItem.calc,
      reason: "조정 사유 입력",
    });
  }, [selectedItem]);

  useEffect(() => {
    const firstItemId = selectedCourse.items[0]?.id ?? "";
    setEditingItemId(firstItemId);
    setExecForm((prev) => ({ ...prev, itemId: firstItemId }));
  }, [selectedCourseId, selectedCourse.items]);

  const selectedItemsDetailed = useMemo(() => {
    return selectedCourse.items.map((item) => {
      const variance = item.adjusted - item.original;
      const remaining = item.adjusted - item.executed;
      const executionRate = item.adjusted === 0 ? 0 : item.executed / item.adjusted;
      const changeRate = item.original === 0 ? 0 : variance / item.original;
      const status = variance > 0 ? "증액" : variance < 0 ? "감액" : "유지";
      return { ...item, variance, remaining, executionRate, changeRate, status };
    });
  }, [selectedCourse]);

  const filteredAndSortedItems = useMemo(() => {
    const filtered = selectedItemsDetailed.filter((item) => {
      if (filterMode === "increase") return item.variance > 0;
      if (filterMode === "decrease") return item.variance < 0;
      if (filterMode === "lowExecution") return item.executionRate < 0.3;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "executionAsc") return a.executionRate - b.executionRate;
      if (sortMode === "name") return a.name.localeCompare(b.name, "ko");
      return Math.abs(b.variance) - Math.abs(a.variance);
    });
  }, [selectedItemsDetailed, filterMode, sortMode]);

  const groupedSelectedRows = useMemo(() => {
    const grouped = filteredAndSortedItems.reduce<Record<string, {
      group: string;
      items: typeof filteredAndSortedItems;
      subtotal: { original: number; adjusted: number; executed: number; variance: number; remaining: number };
    }>>((acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = {
          group: item.group,
          items: [],
          subtotal: { original: 0, adjusted: 0, executed: 0, variance: 0, remaining: 0 },
        };
      }
      acc[item.group].items.push(item);
      acc[item.group].subtotal.original += item.original;
      acc[item.group].subtotal.adjusted += item.adjusted;
      acc[item.group].subtotal.executed += item.executed;
      acc[item.group].subtotal.variance += item.variance;
      acc[item.group].subtotal.remaining += item.remaining;
      return acc;
    }, {});

    return Object.values(grouped);
  }, [filteredAndSortedItems]);

  const groupedSummary = useMemo(() => {
    const rows = courses.flatMap((course) => course.items);
    const grouped = rows.reduce<Record<string, { name: string; original: number; adjusted: number; executed: number }>>((acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = { name: item.group, original: 0, adjusted: 0, executed: 0 };
      }
      acc[item.group].original += item.original;
      acc[item.group].adjusted += item.adjusted;
      acc[item.group].executed += item.executed;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [courses]);

  const topVarianceItems = useMemo(() => {
    return courses
      .flatMap((course) =>
        course.items.map((item) => ({
          course: course.name,
          name: item.name,
          variance: item.adjusted - item.original,
        }))
      )
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 5);
  }, [courses]);

  const warningList = useMemo(() => {
    const warnings: string[] = [];

    courseSummary.forEach((course) => {
      if (course.adjusted > course.original) {
        warnings.push(`${course.name}은(는) 원안 대비 ${formatWon(course.adjusted - course.original)} 증액되었습니다.`);
      }
      if (course.executionRate < 0.15) {
        warnings.push(`${course.name}의 집행률이 ${formatPct(course.executionRate)}로 낮아 집행계획 점검이 필요합니다.`);
      }
    });

    selectedItemsDetailed.forEach((item) => {
      if (item.executed > item.adjusted) {
        warnings.push(`${item.name} 항목은 조정예산을 초과 집행했습니다.`);
      }
      if (item.name.includes("훈련지원금") && item.variance > 0) {
        warnings.push(`${item.name} 항목은 기준성 항목으로 조정 사유 재확인이 필요합니다.`);
      }
    });

    return warnings.slice(0, 5);
  }, [courseSummary, selectedItemsDetailed]);

  const overBudgetCourses = courseSummary.filter((course) => course.adjusted > course.original);

  const reportText = {
    summary: `전체 조정예산은 계획예산 대비 ${summary.variance >= 0 ? "+" : ""}${formatWon(summary.variance)} 변동되었습니다. 현재 집행률은 ${formatPct(summary.executionRate)}이며, 공통 운영비와 일부 과정에서 증액 검토가 확인됩니다.`,
    selected: `${selectedCourse.name}의 조정예산은 ${formatWon(selectedCourseTotals.adjusted)}이며, 집행률은 ${formatPct(selectedCourseTotals.executionRate)}입니다. ${selectedCourseTotals.variance > 0 ? "증액 항목의 사유 검토가 필요합니다." : "감액 조정 항목의 적정성을 확인하면 됩니다."}`,
    risk: `현재 경고는 ${warningList.length}건입니다. 특히 기준성 항목, 저집행 항목, 증액 과정은 총괄 검토 시 별도 코멘트가 필요합니다.`,
  };

  const saveEdit = () => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== selectedCourseId) return course;
        return {
          ...course,
          items: course.items.map((item) => {
            if (item.id !== editingItemId) return item;
            return {
              ...item,
              group: editForm.group,
              name: editForm.name,
              unitPrice: parseNumber(editForm.unitPrice),
              qty1: parseNumber(editForm.qty1, 1),
              qty2: parseNumber(editForm.qty2, 1),
              qty3: parseNumber(editForm.qty3, 1),
              adjusted: parseNumber(editForm.adjusted),
              calc: editForm.calc,
            };
          }),
        };
      })
    );
  };

  const addExecution = () => {
    if (!execForm.itemId || !execForm.amount) return;

    const amount = parseNumber(execForm.amount);
    if (amount <= 0) return;

    setExecutions((prev) => [
      {
        id: Date.now(),
        courseId: selectedCourseId,
        itemId: execForm.itemId,
        date: execForm.date,
        amount,
        vendor: execForm.vendor || "-",
        proofNo: execForm.proofNo || "-",
        memo: execForm.memo || "-",
      },
      ...prev,
    ]);

    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== selectedCourseId) return course;
        return {
          ...course,
          items: course.items.map((item) =>
            item.id === execForm.itemId ? { ...item, executed: item.executed + amount } : item
          ),
        };
      })
    );

    setExecForm((prev) => ({
      ...prev,
      amount: "",
      vendor: "",
      proofNo: "",
      memo: "",
    }));
  };

  const selectedExecutions = executions
    .filter((row) => row.courseId === selectedCourseId)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-2 whitespace-nowrap pb-2">
            {courseSummary.map((course) => {
              const active = course.id === selectedCourseId;
              const emoji = statusEmoji(course.original, course.adjusted, course.executionRate);
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <span>{course.name}</span>
                  <span className="text-xs">{emoji}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-300">2026 경기북부 직업교육</div>
              <h1 className="mt-1 text-3xl font-bold">예산관리 프로그램 HTML 프로토타입</h1>
              <p className="mt-2 text-sm text-slate-200">
                과정별 예산 검토, 공통 운영비 관리, 세부항목 편집, 집행현황 반영, 분석리포트까지 연결된 동작형 시안입니다.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur">
              <div className="text-xs text-slate-300">현재 선택 항목</div>
              <div className="mt-1 font-semibold">{selectedCourse.name}</div>
              <div className="text-xs text-slate-300">담당 {selectedCourse.manager}</div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <StatCard title="전체 계획예산" value={formatWon(summary.original)} sub="사업계획 기준" />
            <StatCard title="전체 조정예산" value={formatWon(summary.adjusted)} sub="검토 반영 후" />
            <StatCard title="전체 집행액" value={formatWon(summary.executed)} sub="누적 집행" />
            <StatCard title="전체 잔액" value={formatWon(summary.remaining)} sub="조정예산 - 집행액" tone="emerald" />
            <StatCard title="전체 집행률" value={formatPct(summary.executionRate)} sub="조정예산 대비" tone="dark" />
          </div>
        </div>

        <section className="mb-6 grid gap-4 lg:grid-cols-4">
          <StatCard
            title="총 조정 차액"
            value={`${summary.variance >= 0 ? "+" : ""}${formatWon(summary.variance)}`}
            sub={summary.variance >= 0 ? "전체 기준 증액" : "전체 기준 감액"}
            tone={summary.variance > 0 ? "amber" : "emerald"}
          />
          <StatCard title="증액 과정 수" value={`${overBudgetCourses.length}개`} sub="공통 운영 포함" />
          <StatCard title="과정 수" value={`${courses.length}개`} sub="공통 운영 포함" />
          <StatCard title="검토 필요 경고" value={`${warningList.length}건`} sub="자동 검증 기준" />
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div>
              <h2 className="text-xl font-semibold">총괄 현황</h2>
              <p className="mt-1 text-sm text-slate-500">전체 예산의 조정·집행 상태를 과정별, 구분별로 동시에 봅니다.</p>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">구분</th>
                      <th className="px-4 py-3 text-right font-medium">계획예산</th>
                      <th className="px-4 py-3 text-right font-medium">조정예산</th>
                      <th className="px-4 py-3 text-right font-medium">집행액</th>
                      <th className="px-4 py-3 text-right font-medium">잔액</th>
                      <th className="px-4 py-3 text-right font-medium">집행률</th>
                      <th className="px-4 py-3 text-right font-medium">조정차액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseSummary.map((course) => (
                      <tr
                        key={course.id}
                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                        onClick={() => setSelectedCourseId(course.id)}
                      >
                        <td className="px-4 py-3 font-medium">{course.name}</td>
                        <td className="px-4 py-3 text-right">{formatWon(course.original)}</td>
                        <td className="px-4 py-3 text-right">{formatWon(course.adjusted)}</td>
                        <td className="px-4 py-3 text-right">{formatWon(course.executed)}</td>
                        <td className="px-4 py-3 text-right">{formatWon(course.remaining)}</td>
                        <td className="px-4 py-3 text-right">{formatPct(course.executionRate)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${course.variance > 0 ? "text-amber-700" : course.variance < 0 ? "text-emerald-700" : "text-slate-700"}`}>
                          {`${course.variance >= 0 ? "+" : ""}${formatWon(course.variance)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">예산구분별 총괄</h2>
            <p className="mt-1 text-sm text-slate-500">계정과목 단위 집계입니다.</p>
            <div className="mt-5 space-y-3">
              {groupedSummary.map((group) => {
                const rate = group.adjusted === 0 ? 0 : group.executed / group.adjusted;
                const variance = group.adjusted - group.original;
                return (
                  <div key={group.name} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{group.name}</div>
                      <div className={`text-sm font-semibold ${variance > 0 ? "text-amber-700" : variance < 0 ? "text-emerald-700" : "text-slate-700"}`}>
                        {`${variance >= 0 ? "+" : ""}${formatWon(variance)}`}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-500">
                      <div>
                        <div>조정예산</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{formatWon(group.adjusted)}</div>
                      </div>
                      <div>
                        <div>집행액</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{formatWon(group.executed)}</div>
                      </div>
                      <div>
                        <div>집행률</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{formatPct(rate)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">분석 리포트</h2>
              <p className="mt-1 text-sm text-slate-500">예산 조정 방향과 검토 포인트를 자동 요약해 보여줍니다.</p>
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as "summary" | "selected" | "risk")}
              >
                <option value="summary">전체 요약</option>
                <option value="selected">선택 과정</option>
                <option value="risk">리스크 중심</option>
              </select>
            </div>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">자동 생성 코멘트</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{reportText[reportType]}</div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold text-amber-900">중점 검토 포인트</div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-800">
                  <li>• 공통 운영 예산과 과정 직접비를 분리 관리하되 총괄표는 통합 반영</li>
                  <li>• 증액 항목은 기준 변경인지 물량 변경인지 사유 구분 필요</li>
                  <li>• 훈련지원금, 홍보비, 특강비 등 기준성 항목은 내부 기준과 정합성 재확인</li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">리포트 핵심 지표</div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">자동 생성</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatCard title="증액 과정" value={`${overBudgetCourses.length}개`} sub="공통 운영 포함" tone="amber" />
                <StatCard title="최대 변동 항목" value={topVarianceItems[0]?.name ?? "-"} sub={topVarianceItems[0]?.course ?? "-"} />
                <StatCard title="전체 잔액" value={formatWon(summary.remaining)} sub="집행 가능 재원" tone="emerald" />
                <StatCard title="선택 항목 집행률" value={formatPct(selectedCourseTotals.executionRate)} sub={selectedCourse.name} tone="dark" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <aside className="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">과정 목록</h2>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
              과정 외 운영비도 별도 과정처럼 목록에 포함되어 동일 흐름으로 검토합니다.
            </div>
            <div className="space-y-3">
              {courseSummary.map((course) => {
                const active = course.id === selectedCourseId;
                const isCommon = course.id === 0;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white shadow-md"
                        : isCommon
                          ? "border-indigo-200 bg-indigo-50 hover:border-indigo-300"
                          : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`text-xs ${active ? "text-slate-300" : isCommon ? "text-indigo-600" : "text-slate-500"}`}>
                          {course.category}
                        </div>
                        <div className="mt-1 font-semibold">{course.name}</div>
                        <div className={`mt-1 text-xs ${active ? "text-slate-300" : isCommon ? "text-indigo-700" : "text-slate-500"}`}>
                          {course.manager}
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${active ? "bg-white/15 text-white" : isCommon ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                        {formatPct(course.executionRate)}
                      </span>
                    </div>
                    <div className={`mt-3 grid grid-cols-3 gap-2 text-xs ${active ? "text-slate-200" : isCommon ? "text-indigo-700" : "text-slate-500"}`}>
                      <div>
                        <div>계획</div>
                        <div className={`mt-1 font-medium ${active ? "text-white" : "text-slate-800"}`}>{formatWon(course.original)}</div>
                      </div>
                      <div>
                        <div>조정</div>
                        <div className={`mt-1 font-medium ${active ? "text-white" : "text-slate-800"}`}>{formatWon(course.adjusted)}</div>
                      </div>
                      <div>
                        <div>집행</div>
                        <div className={`mt-1 font-medium ${active ? "text-white" : "text-slate-800"}`}>{formatWon(course.executed)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
              <StatCard title="선택 항목 계획예산" value={formatWon(selectedCourseTotals.original)} sub="원본 예산" />
              <StatCard title="선택 항목 조정예산" value={formatWon(selectedCourseTotals.adjusted)} sub="검토 반영" />
              <StatCard title="선택 항목 집행액" value={formatWon(selectedCourseTotals.executed)} sub="현재 누계" />
              <StatCard
                title="선택 항목 조정 차액"
                value={`${selectedCourseTotals.variance >= 0 ? "+" : ""}${formatWon(selectedCourseTotals.variance)}`}
                sub={selectedCourseTotals.variance > 0 ? "증액 검토" : selectedCourseTotals.variance < 0 ? "감액 검토" : "변동 없음"}
              />
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">과정별 예산 검토</h2>
                  <p className="mt-1 text-sm text-slate-500">차액·증감률·잔액·상태를 바로 판단할 수 있도록 강화한 검토 표입니다.</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "전체", "bg-slate-900 text-white", "bg-slate-100 text-slate-600"],
                    ["increase", "증액만", "bg-amber-600 text-white", "bg-amber-50 text-amber-700"],
                    ["decrease", "감액만", "bg-emerald-600 text-white", "bg-emerald-50 text-emerald-700"],
                    ["lowExecution", "집행률 30% 미만", "bg-rose-600 text-white", "bg-rose-50 text-rose-700"],
                  ].map(([key, label, activeClass, inactiveClass]) => (
                    <button
                      key={key}
                      onClick={() => setFilterMode(key as "all" | "increase" | "decrease" | "lowExecution")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${filterMode === key ? activeClass : inactiveClass}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">정렬</span>
                  <select
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as "varianceDesc" | "executionAsc" | "name")}
                  >
                    <option value="varianceDesc">차액 큰 순</option>
                    <option value="executionAsc">집행률 낮은 순</option>
                    <option value="name">항목명순</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <StatCard title="표시 항목 수" value={`${filteredAndSortedItems.length}건`} sub="필터 반영" />
                <StatCard title="증액 항목" value={`${selectedItemsDetailed.filter((item) => item.variance > 0).length}건`} sub="선택 항목 기준" tone="amber" />
                <StatCard title="감액 항목" value={`${selectedItemsDetailed.filter((item) => item.variance < 0).length}건`} sub="선택 항목 기준" tone="emerald" />
                <StatCard title="선택 항목 집행률" value={formatPct(selectedCourseTotals.executionRate)} sub={selectedCourse.name} tone="dark" />
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">예산구분</th>
                        <th className="px-4 py-3 text-left font-medium">세부항목</th>
                        <th className="px-4 py-3 text-left font-medium">산출근거</th>
                        <th className="px-4 py-3 text-right font-medium">계획금액</th>
                        <th className="px-4 py-3 text-right font-medium">조정금액</th>
                        <th className="px-4 py-3 text-right font-medium">조정차액</th>
                        <th className="px-4 py-3 text-right font-medium">증감률</th>
                        <th className="px-4 py-3 text-right font-medium">집행액</th>
                        <th className="px-4 py-3 text-right font-medium">잔액</th>
                        <th className="px-4 py-3 text-right font-medium">집행률</th>
                        <th className="px-4 py-3 text-center font-medium">상태</th>
                        <th className="px-4 py-3 text-center font-medium">편집</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedSelectedRows.map((groupBlock) => (
                        <React.Fragment key={groupBlock.group}>
                          <tr className="border-t border-slate-200 bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900" colSpan={12}>
                              {groupBlock.group}
                            </td>
                          </tr>

                          {groupBlock.items.map((item) => (
                            <tr key={item.id} className="border-t border-slate-100">
                              <td className="px-4 py-3 text-slate-500">{item.group}</td>
                              <td className="px-4 py-3 font-medium">{item.name}</td>
                              <td className="px-4 py-3 text-slate-500">{item.calc}</td>
                              <td className="px-4 py-3 text-right">{formatWon(item.original)}</td>
                              <td className="px-4 py-3 text-right font-semibold">{formatWon(item.adjusted)}</td>
                              <td className={`px-4 py-3 text-right font-semibold ${item.variance > 0 ? "text-amber-700" : item.variance < 0 ? "text-emerald-700" : "text-slate-700"}`}>
                                {`${item.variance >= 0 ? "+" : ""}${formatWon(item.variance)}`}
                              </td>
                              <td className={`px-4 py-3 text-right ${item.changeRate > 0 ? "text-amber-700" : item.changeRate < 0 ? "text-emerald-700" : "text-slate-700"}`}>
                                {`${item.changeRate >= 0 ? "+" : ""}${(item.changeRate * 100).toFixed(1)}%`}
                              </td>
                              <td className="px-4 py-3 text-right">{formatWon(item.executed)}</td>
                              <td className="px-4 py-3 text-right">{formatWon(item.remaining)}</td>
                              <td className="px-4 py-3 text-right">{formatPct(item.executionRate)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "증액" ? "bg-amber-50 text-amber-700" : item.status === "감액" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => setEditingItemId(item.id)}
                                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                                >
                                  편집
                                </button>
                              </td>
                            </tr>
                          ))}

                          <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-medium text-slate-800">
                            <td className="px-4 py-3" colSpan={3}>
                              {groupBlock.group} 소계
                            </td>
                            <td className="px-4 py-3 text-right">{formatWon(groupBlock.subtotal.original)}</td>
                            <td className="px-4 py-3 text-right">{formatWon(groupBlock.subtotal.adjusted)}</td>
                            <td className={`px-4 py-3 text-right ${groupBlock.subtotal.variance > 0 ? "text-amber-700" : groupBlock.subtotal.variance < 0 ? "text-emerald-700" : "text-slate-700"}`}>
                              {`${groupBlock.subtotal.variance >= 0 ? "+" : ""}${formatWon(groupBlock.subtotal.variance)}`}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {groupBlock.subtotal.original === 0
                                ? "0.0%"
                                : `${groupBlock.subtotal.variance >= 0 ? "+" : ""}${((groupBlock.subtotal.variance / groupBlock.subtotal.original) * 100).toFixed(1)}%`}
                            </td>
                            <td className="px-4 py-3 text-right">{formatWon(groupBlock.subtotal.executed)}</td>
                            <td className="px-4 py-3 text-right">{formatWon(groupBlock.subtotal.remaining)}</td>
                            <td className="px-4 py-3 text-right">
                              {groupBlock.subtotal.adjusted === 0 ? "0.0%" : formatPct(groupBlock.subtotal.executed / groupBlock.subtotal.adjusted)}
                            </td>
                            <td className="px-4 py-3 text-center" colSpan={2}>
                              -
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">세부 예산 편집기</h3>
                    <p className="mt-1 text-sm text-slate-500">수정 저장 시 검토표와 총괄 수치에 바로 반영됩니다.</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    편집 대상: {selectedItem?.name ?? "-"}
                  </span>
                </div>

                {selectedItem && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">예산구분</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.group} onChange={(e) => setEditForm((prev) => ({ ...prev, group: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">세부항목명</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">단가</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.unitPrice} onChange={(e) => setEditForm((prev) => ({ ...prev, unitPrice: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">수량1</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.qty1} onChange={(e) => setEditForm((prev) => ({ ...prev, qty1: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">수량2</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.qty2} onChange={(e) => setEditForm((prev) => ({ ...prev, qty2: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">수량3</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.qty3} onChange={(e) => setEditForm((prev) => ({ ...prev, qty3: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">조정금액</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.adjusted} onChange={(e) => setEditForm((prev) => ({ ...prev, adjusted: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium">산출근거</label>
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.calc} onChange={(e) => setEditForm((prev) => ({ ...prev, calc: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium">수정 사유</label>
                      <textarea className="min-h-[96px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={editForm.reason} onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))} />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div>
                    <div className="text-sm font-medium">자동 계산 결과</div>
                    <div className="mt-1 text-sm text-slate-500">
                      계획 {formatWon(selectedItem?.original ?? 0)} → 조정 {formatWon(parseNumber(editForm.adjusted))} / 차액 {`${parseNumber(editForm.adjusted) - (selectedItem?.original ?? 0) >= 0 ? "+" : ""}${formatWon(parseNumber(editForm.adjusted) - (selectedItem?.original ?? 0))}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                      저장
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-lg font-semibold">집행현황 입력</h3>
                  <p className="mt-1 text-sm text-slate-500">등록 시 누적 집행액이 즉시 반영됩니다.</p>
                  <div className="mt-4 grid gap-3">
                    <input className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={execForm.date} onChange={(e) => setExecForm((prev) => ({ ...prev, date: e.target.value }))} />
                    <select className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={execForm.itemId} onChange={(e) => setExecForm((prev) => ({ ...prev, itemId: e.target.value }))}>
                      {selectedCourse.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <input className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={execForm.amount} onChange={(e) => setExecForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="집행금액" />
                    <input className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={execForm.vendor} onChange={(e) => setExecForm((prev) => ({ ...prev, vendor: e.target.value }))} placeholder="거래처" />
                    <input className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={execForm.proofNo} onChange={(e) => setExecForm((prev) => ({ ...prev, proofNo: e.target.value }))} placeholder="증빙번호" />
                    <textarea className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={execForm.memo} onChange={(e) => setExecForm((prev) => ({ ...prev, memo: e.target.value }))} placeholder="비고" />
                    <button onClick={addExecution} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
                      집행 등록
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">최근 집행내역</h3>
                    <span className="text-xs text-slate-500">최신 6건</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    {selectedExecutions.map((row) => {
                      const itemName = selectedCourse.items.find((item) => item.id === row.itemId)?.name ?? row.itemId;
                      return (
                        <div key={row.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{itemName}</div>
                            <div>{formatWon(row.amount)}</div>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{row.date} · {row.vendor} · {row.proofNo}</div>
                          <div className="mt-1 text-xs text-slate-500">{row.memo}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">검증 / 경고</h3>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{warningList.length}건 확인 필요</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    {warningList.map((warning, idx) => (
                      <div key={`${warning}-${idx}`} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">주요 조정 항목 TOP 5</h3>
                    <span className="text-xs text-slate-500">절대 차액 기준</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {topVarianceItems.map((item, idx) => (
                      <div key={`${item.course}-${item.name}-${idx}`} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                        <div>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.course}</div>
                        </div>
                        <div className={`text-sm font-semibold ${item.variance > 0 ? "text-amber-700" : item.variance < 0 ? "text-emerald-700" : "text-slate-700"}`}>
                          {`${item.variance >= 0 ? "+" : ""}${formatWon(item.variance)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
