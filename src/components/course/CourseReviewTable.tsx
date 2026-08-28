import type { Course, FilterMode, SortMode } from "../../types";
import { toItemDetailed, formatAmount, formatPct, isExecutionAlert } from "../../store/utils";
import { useMemo } from "react";

type Props = {
  course: Course;
  editingItemId: string;
  filterMode: FilterMode;
  sortMode: SortMode;
  onSelectItem: (id: string) => void;
  onFilterChange: (mode: FilterMode) => void;
  onSortChange: (mode: SortMode) => void;
};

export function CourseReviewTable({
  course, editingItemId, filterMode, sortMode,
  onSelectItem, onFilterChange, onSortChange,
}: Props) {
  const items = useMemo(() => {
    const detailed = toItemDetailed(course);
    const filtered = detailed.filter((item) => {
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
  }, [course, filterMode, sortMode]);

  const groups = useMemo(() => {
    return items.reduce<Record<string, typeof items>>((acc, item) => {
      (acc[item.group] ??= []).push(item);
      return acc;
    }, {});
  }, [items]);

  const statusStyle = (status: string) =>
    status === "집행초과" ? "text-rose-700 bg-rose-50 ring-rose-200" :
    status === "증액" ? "text-amber-700 bg-amber-50 ring-amber-200" :
    status === "감액" ? "text-emerald-700 bg-emerald-50 ring-emerald-200" :
    "text-slate-500 bg-slate-50 ring-slate-200";

  return (
    <div className="rounded-2xl glass-card shadow-glass p-5 ring-1 ring-slate-200/50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800">{course.name} — 예산 검토표</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">항목을 클릭하면 편집기에서 수정할 수 있습니다</p>
        </div>
        <div className="flex flex-wrap gap-2 print-hide">
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            value={filterMode}
            onChange={(e) => onFilterChange(e.target.value as FilterMode)}
          >
            <option value="all">전체</option>
            <option value="increase">증액만</option>
            <option value="decrease">감액만</option>
            <option value="lowExecution">집행률 30% 미만</option>
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            value={sortMode}
            onChange={(e) => onSortChange(e.target.value as SortMode)}
          >
            <option value="varianceDesc">차액 큰 순</option>
            <option value="executionAsc">집행률 낮은 순</option>
            <option value="name">항목명순</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
        <table className="min-w-[1180px] w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="sticky top-0 z-10 bg-indigo-950 text-[10px] text-indigo-100 uppercase tracking-wider shadow-sm">
              <th className="px-3 py-3 text-left font-semibold">예산구분</th>
              <th className="px-3 py-3 text-left font-semibold">세부항목</th>
              <th className="px-3 py-3 text-left font-semibold">산출근거</th>
              <th className="px-3 py-3 text-right font-semibold">계획금액<br /><span className="text-[9px] font-normal text-indigo-200">(원)</span></th>
              <th className="px-3 py-3 text-right font-semibold bg-indigo-900">조정금액<br /><span className="text-[9px] font-normal text-indigo-200">(원)</span></th>
              <th className="px-3 py-3 text-right font-semibold bg-slate-800">조정차액<br /><span className="text-[9px] font-normal text-slate-400">(원)</span></th>
              <th className="px-3 py-3 text-right font-semibold">증감률</th>
              <th className="px-3 py-3 text-right font-semibold">집행액</th>
              <th className="px-3 py-3 text-right font-semibold">잔액</th>
              <th className="px-3 py-3 text-right font-semibold">집행률</th>
              <th className="px-3 py-3 text-center font-semibold">상태</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([group, groupItems]) => {
              const sub = groupItems.reduce(
                (acc, i) => ({
                  original: acc.original + i.original,
                  adjusted: acc.adjusted + i.adjusted,
                  executed: acc.executed + i.executed,
                  variance: acc.variance + i.variance,
                  remaining: acc.remaining + i.remaining,
                }),
                { original: 0, adjusted: 0, executed: 0, variance: 0, remaining: 0 }
              );
              return [
                ...groupItems.map((item) => {
                  const executionAlert = isExecutionAlert(item.adjusted, item.executed);
                  const displayStatus = executionAlert ? "집행초과" : item.status;
                  return <tr
                    key={item.id}
                    onClick={() => onSelectItem(item.id)}
                    className={`cursor-pointer border-b border-slate-100 transition-all duration-150 even:bg-slate-50/50 ${
                      executionAlert
                        ? item.id === editingItemId ? "bg-rose-100/90 ring-1 ring-inset ring-rose-300" : "bg-rose-50/70 hover:bg-rose-100"
                        : item.id === editingItemId
                        ? "bg-indigo-50/80 ring-1 ring-inset ring-indigo-200"
                        : executionAlert
                          ? "bg-rose-50/80 hover:bg-rose-100"
                          : "hover:bg-slate-50/80"
                    }`}
                    title={executionAlert ? "집행률 100% 초과 — 확인 필요" : undefined}
                  >
                    <td className="px-3 py-2.5 text-[11px] text-slate-400">{item.group}</td>
                    <td className="px-3 py-2.5 text-xs font-medium text-slate-800">{item.name}</td>
                    <td className="px-3 py-2.5 text-slate-400 text-[11px] max-w-[120px] truncate">{item.calc}</td>
                    <td className="px-3 py-2.5 text-right text-sm font-medium tabular-nums text-slate-700 whitespace-nowrap">{formatAmount(item.original)}</td>
                    <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums text-indigo-900 bg-indigo-50/40 whitespace-nowrap">{formatAmount(item.adjusted)}</td>
                    <td className={`px-3 py-2.5 text-right text-xs font-semibold tabular-nums ${item.variance > 0 ? "text-amber-600" : item.variance < 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {item.variance >= 0 ? "+" : ""}{formatAmount(item.variance)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[11px] tabular-nums text-slate-500">
                      {item.original > 0 ? `${(item.changeRate * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className={`px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap ${executionAlert ? "font-bold text-rose-700" : "text-slate-700"}`}>{formatAmount(item.executed)}</td>
                    <td className={`px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap ${executionAlert ? "font-bold text-rose-700" : "text-slate-600"}`}>{formatAmount(item.remaining)}</td>
                    <td className={`px-3 py-2.5 text-right text-xs tabular-nums font-bold ${executionAlert ? "text-rose-700" : "text-slate-600"}`}>{formatPct(item.executionRate)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusStyle(displayStatus)}`}>
                        {displayStatus}
                      </span>
                    </td>
                  </tr>;
                }),
                <tr key={`sub-${group}`} className="border-t-2 border-slate-300 bg-teal-50/80 font-semibold text-xs text-slate-700">
                  <td className="px-3 py-2.5" colSpan={3}>
                    <span className="text-slate-500">{group}</span> 소계
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(sub.original)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(sub.adjusted)}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${sub.variance > 0 ? "text-amber-600" : sub.variance < 0 ? "text-emerald-600" : ""}`}>
                    {sub.variance >= 0 ? "+" : ""}{formatAmount(sub.variance)}
                  </td>
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(sub.executed)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(sub.remaining)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatPct(sub.adjusted === 0 ? 0 : sub.executed / sub.adjusted)}
                  </td>
                  <td className="px-3 py-2.5" />
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
