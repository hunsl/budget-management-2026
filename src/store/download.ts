import type { Course, ExecutionRow } from "../types";
import { courseTotals, formatWon, formatPct } from "./utils";

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

function downloadCSV(filename: string, content: string) {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadOverallCSV(courses: Course[]) {
  const headers = ["과정명", "담당자", "계획예산", "조정예산", "집행액", "잔액", "집행률", "조정차액"];
  const rows = courses.map((c) => {
    const t = courseTotals(c);
    return [
      c.name, c.manager,
      formatWon(t.original), formatWon(t.adjusted), formatWon(t.executed),
      formatWon(t.remaining), formatPct(t.executionRate),
      `${t.variance >= 0 ? "+" : ""}${formatWon(t.variance)}`,
    ];
  });
  downloadCSV("총괄현황.csv", toCSV(headers, rows));
}

export function downloadCourseCSV(course: Course) {
  const headers = ["예산구분", "세부항목", "산출근거", "계획금액", "조정금액", "조정차액", "집행액", "잔액", "집행률", "상태"];
  const rows = course.items.filter((i) => !i.isDeleted).map((item) => {
    const variance = item.adjusted - item.original;
    const remaining = item.adjusted - item.executed;
    const rate = item.adjusted === 0 ? 0 : item.executed / item.adjusted;
    const status = variance > 0 ? "증액" : variance < 0 ? "감액" : "유지";
    return [
      item.group, item.name, item.calc,
      formatWon(item.original), formatWon(item.adjusted),
      `${variance >= 0 ? "+" : ""}${formatWon(variance)}`,
      formatWon(item.executed), formatWon(remaining), formatPct(rate), status,
    ];
  });
  downloadCSV(`${course.name}_검토표.csv`, toCSV(headers, rows));
}

export function downloadExecutionCSV(course: Course, executions: ExecutionRow[]) {
  const courseExecs = executions.filter((e) => e.courseId === course.id);
  const headers = ["일자", "항목", "금액", "거래처", "증빙번호", "비고"];
  const rows = courseExecs.map((e) => {
    const itemName = course.items.find((i) => i.id === e.itemId)?.name ?? e.itemId;
    return [e.date, itemName, formatWon(e.amount), e.vendor, e.proofNo, e.memo];
  });
  downloadCSV(`${course.name}_집행내역.csv`, toCSV(headers, rows));
}
