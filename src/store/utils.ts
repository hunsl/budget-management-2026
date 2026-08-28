import type { Course, CourseTotals, ItemDetailed, WarningItem } from "../types";

export function courseTotals(course: Course): CourseTotals {
  const active = course.items.filter((i) => !i.isDeleted);
  const original = active.reduce((s, i) => s + i.original, 0);
  const adjusted = active.reduce((s, i) => s + i.adjusted, 0);
  const executed = active.reduce((s, i) => s + i.executed, 0);
  return {
    original,
    adjusted,
    executed,
    remaining: adjusted - executed,
    variance: adjusted - original,
    executionRate: adjusted === 0 ? 0 : executed / adjusted,
  };
}

export function formatWon(n: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(n || 0))}원`;
}

export function formatPct(n: number): string {
  return `${((n || 0) * 100).toFixed(1)}%`;
}

export function isExecutionAlert(adjusted: number, executed: number): boolean {
  return adjusted === 0 ? executed > 0 : executed >= adjusted;
}

export function parseNumber(value: string | number | undefined, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function statusEmoji(original: number, adjusted: number, executionRate: number): string {
  if (adjusted > original) return "🔴";
  if (executionRate < 0.3) return "🟡";
  return "🟢";
}

export function toItemDetailed(course: Course): ItemDetailed[] {
  return course.items
    .filter((i) => !i.isDeleted)
    .map((item) => {
      const variance = item.adjusted - item.original;
      const remaining = item.adjusted - item.executed;
      const executionRate = item.adjusted === 0 ? 0 : item.executed / item.adjusted;
      const changeRate = item.original === 0 ? 0 : variance / item.original;
      const status = variance > 0 ? "증액" : variance < 0 ? "감액" : "유지";
      return { ...item, variance, remaining, executionRate, changeRate, status } as ItemDetailed;
    });
}

// ─── 검증 로직 ────────────────────────────────────────────────
export function buildWarnings(courses: Course[]): WarningItem[] {
  const warnings: WarningItem[] = [];
  let seq = 0;

  courses.forEach((course) => {
    const totals = courseTotals(course);

    if (isExecutionAlert(totals.adjusted, totals.executed)) {
      warnings.push({
        id: `w-${seq++}`,
        level: "critical",
        courseId: course.id,
        type: "집행 확인",
        message: `[${course.name}] 집행률 ${totals.adjusted === 0 ? "예산 없음" : formatPct(totals.executionRate)} — 확인 필요`,
      });
    }

    // 증액 경고
    if (totals.adjusted > totals.original) {
      warnings.push({
        id: `w-${seq++}`,
        level: "warning",
        courseId: course.id,
        type: "증액",
        message: `[${course.name}] 원안 대비 ${formatWon(totals.adjusted - totals.original)} 증액`,
      });
    }

    // 저집행 경고
    if (totals.executionRate < 0.15 && totals.adjusted > 0) {
      warnings.push({
        id: `w-${seq++}`,
        level: "warning",
        courseId: course.id,
        type: "저집행",
        message: `[${course.name}] 집행률 ${formatPct(totals.executionRate)} — 집행계획 점검 필요`,
      });
    }

    course.items.filter((i) => !i.isDeleted).forEach((item) => {
      // 초과집행
      if (isExecutionAlert(item.adjusted, item.executed)) {
        warnings.push({
          id: `w-${seq++}`,
          level: "critical",
          courseId: course.id,
          itemId: item.id,
          type: "초과집행",
          message: `[${course.name}] ${item.name} — 조정예산 초과 집행`,
        });
      }

      // 기준성 항목 증액
      if (item.name.includes("훈련지원금") && item.adjusted > item.original) {
        warnings.push({
          id: `w-${seq++}`,
          level: "warning",
          courseId: course.id,
          itemId: item.id,
          type: "기준성항목",
          message: `[${course.name}] ${item.name} — 기준성 항목 증액, 사유 재확인 필요`,
        });
      }

      // 산출근거 누락
      if (!item.calc || item.calc.trim() === "") {
        warnings.push({
          id: `w-${seq++}`,
          level: "info",
          courseId: course.id,
          itemId: item.id,
          type: "입력오류",
          message: `[${course.name}] ${item.name} — 산출근거 누락`,
        });
      }

      // 조정금액 0 이하
      if (item.adjusted <= 0) {
        warnings.push({
          id: `w-${seq++}`,
          level: "info",
          courseId: course.id,
          itemId: item.id,
          type: "입력오류",
          message: `[${course.name}] ${item.name} — 조정금액이 0 이하`,
        });
      }
    });
  });

  return warnings;
}

export function generateNewItemId(courseId: number, items: Course["items"]): string {
  const max = items.reduce((m, i) => {
    const n = parseInt(i.id.split("-")[1] ?? "0", 10);
    return n > m ? n : m;
  }, 0);
  return `c${courseId}-${max + 1}`;
}
