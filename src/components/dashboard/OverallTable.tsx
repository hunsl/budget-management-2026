import type { Course } from "../../types";
import { formatAmount, formatPct, courseTotals, isExecutionAlert } from "../../store/utils";

type Props = {
  courses: Course[];
  commonCourse?: Course;
  totalBudget: number;
  selectedCourseId: number;
  onSelect: (id: number) => void;
};

const CATEGORY_DOT: Record<string, string> = {
  "강사양성형": "bg-violet-500",
  "지역연계·기여형": "bg-blue-500",
  "사무분야": "bg-sky-500",
  "식품분야": "bg-orange-500",
  "IT·디지털분야": "bg-cyan-500",
  "미지정": "bg-slate-300",
  "공통 운영": "bg-emerald-500",
};

export function OverallTable({ courses, commonCourse, totalBudget, selectedCourseId, onSelect }: Props) {
  const rows = courses.map((c) => ({ ...c, ...courseTotals(c) }));
  const programTotal = rows.reduce((s, r) => ({ adjusted: s.adjusted + r.adjusted, executed: s.executed + r.executed }), { adjusted: 0, executed: 0 });
  const commonTotal = commonCourse ? courseTotals(commonCourse) : null;
  const grandAdjusted = programTotal.adjusted + (commonTotal?.adjusted ?? 0);

  return (
    <div className="rounded-2xl glass-card shadow-glass overflow-hidden ring-1 ring-slate-200/50 panel-glow">
      <div className="px-5 py-4 border-b border-slate-100 bg-white/85">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">과정별 예산 현황</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">과정별 조정예산, 집행액, 잔액을 한 번에 비교합니다.</p>
          </div>
          <span className="budget-chip text-[10px] text-slate-600 rounded-full px-2.5 py-1 font-semibold">{rows.length}개 과정</span>
        </div>
      </div>
      <div className="budget-table-shell">
        <table className="budget-table min-w-[760px] text-sm">
          <thead>
            <tr className="text-[10px] text-slate-200 uppercase tracking-wider shadow-sm">
              <th className="px-4 py-3.5 text-left font-semibold">과정명</th>
              <th className="px-4 py-3.5 text-left font-semibold hidden md:table-cell">구분</th>
              <th data-tone="indigo" className="px-4 py-3.5 text-right font-semibold">조정예산<br /><span className="text-[9px] font-normal text-indigo-200">(원)</span></th>
              <th className="px-4 py-3.5 text-right font-semibold hidden lg:table-cell">집행액<br /><span className="text-[9px] font-normal text-slate-300">(원)</span></th>
              <th className="px-4 py-3.5 text-right font-semibold hidden lg:table-cell">잔액<br /><span className="text-[9px] font-normal text-slate-300">(원)</span></th>
              <th className="px-4 py-3.5 text-right font-semibold w-40">집행률</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const active = row.id === selectedCourseId;
              const executionAlert = isExecutionAlert(row.adjusted, row.executed);
              const isUnset = row.category === "미지정";
              const barWidth = row.adjusted > 0 ? Math.min(100, (row.executed / row.adjusted) * 100) : 0;
              const dotColor = CATEGORY_DOT[row.category] ?? "bg-slate-300";
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row.id)}
                   className={`table-row-emphasis cursor-pointer border-b border-slate-100 even:bg-slate-50/80 ${
                    active
                      ? executionAlert
                       ? "bg-gradient-to-r from-rose-800 via-rose-900 to-slate-950 text-white"
                       : "bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 text-white"
                      : executionAlert
                       ? "bg-rose-50/85 text-rose-950 hover:bg-rose-100"
                       : "hover:bg-indigo-50/70"
                  }`}
                  title={executionAlert ? "집행률 100% 초과 — 확인 필요" : undefined}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}>{idx + 1}</span>
                     <span className={`font-semibold text-[13px] leading-tight ${isUnset ? "italic opacity-60" : ""}`}>
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white/50" : dotColor}`} />
                      <span className={`text-[11px] ${active ? "text-slate-300" : "text-slate-500"}`}>{row.category}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums numeric-emphasis ${active ? "text-white bg-indigo-950/30" : isUnset ? "text-slate-400 italic bg-indigo-50/50" : "text-indigo-950 bg-indigo-50/60"}`}>
                    {row.adjusted > 0 ? formatAmount(row.adjusted) : "미입력"}
                  </td>
                  <td className={`px-4 py-3.5 text-right text-sm tabular-nums hidden lg:table-cell ${active ? "text-amber-300" : "text-slate-700"}`}>
                    {formatAmount(row.executed)}
                  </td>
                  <td className={`px-4 py-3.5 text-right text-sm tabular-nums hidden lg:table-cell ${active ? "text-slate-300" : "text-slate-600"}`}>
                    {formatAmount(row.remaining)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                     <div className={`w-20 h-2 rounded-full overflow-hidden ${active ? "bg-white/10" : executionAlert ? "bg-rose-200" : "bg-slate-100"}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          executionAlert ? (active ? "bg-rose-300" : "bg-rose-500") :
                          barWidth > 80 ? (active ? "bg-emerald-400" : "bg-gradient-to-r from-emerald-500 to-teal-400") :
                          barWidth > 50 ? (active ? "bg-sky-400" : "bg-gradient-to-r from-indigo-500 to-cyan-400") :
                          active ? "bg-amber-400" : "bg-gradient-to-r from-amber-500 to-orange-400"
                        }`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className={`text-[12px] tabular-nums font-bold w-12 text-right ${active ? (executionAlert ? "text-rose-200" : "text-slate-200") : executionAlert ? "text-rose-700" : "text-slate-700"}`}>
                        {formatPct(row.executionRate)}
                      </span>
                      {executionAlert && <span className={`text-[10px] font-bold ${active ? "text-rose-200" : "text-rose-700"}`}>확인</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* 소계/합계 */}
          <tfoot>
            <tr className="bg-slate-100/95 font-semibold text-xs text-slate-700 border-t-2 border-slate-300">
              <td className="px-4 py-3.5" colSpan={2}>과정 소계 (13개)</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-sm font-bold">{formatAmount(programTotal.adjusted)}</td>
              <td className="px-4 py-3.5 text-right hidden lg:table-cell text-slate-700 tabular-nums text-sm">{formatAmount(programTotal.executed)}</td>
              <td className="px-4 py-3.5 text-right hidden lg:table-cell tabular-nums text-sm">{formatAmount(programTotal.adjusted - programTotal.executed)}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-sm">{formatPct(programTotal.adjusted === 0 ? 0 : programTotal.executed / programTotal.adjusted)}</td>
            </tr>

            {commonCourse && commonTotal && (
              <tr
                onClick={() => onSelect(0)}
                className={`table-row-emphasis cursor-pointer transition-all text-xs border-t border-slate-100 ${
                  selectedCourseId === 0
                    ? "bg-emerald-800 text-white"
                    : "bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800"
                }`}
              >
                <td className="px-4 py-3.5 font-semibold" colSpan={2}>
                  <div className="flex items-center gap-2">
                    <span>🏢</span>
                    <span>공통 운영비</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-sm">{formatAmount(commonTotal.adjusted)}</td>
                <td className="px-4 py-3.5 text-right hidden lg:table-cell tabular-nums text-sm">{formatAmount(commonTotal.executed)}</td>
                <td className="px-4 py-3.5 text-right hidden lg:table-cell tabular-nums text-sm">{formatAmount(commonTotal.remaining)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-sm">{formatPct(commonTotal.executionRate)}</td>
              </tr>
            )}

            <tr className="bg-gradient-to-r from-slate-800 to-slate-950 text-white text-xs font-bold border-t-2 border-slate-700">
              <td className="px-4 py-3.5" colSpan={2}>총 배분 합계</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-sm numeric-emphasis">{formatAmount(grandAdjusted)}</td>
              <td className="px-4 py-3.5 text-right hidden lg:table-cell text-amber-300 tabular-nums text-sm">{formatAmount(programTotal.executed + (commonTotal?.executed ?? 0))}</td>
              <td className="px-4 py-3.5 text-right hidden lg:table-cell text-slate-300 tabular-nums text-sm">{formatAmount(grandAdjusted - programTotal.executed - (commonTotal?.executed ?? 0))}</td>
              <td className="px-4 py-3.5 text-right text-slate-400">—</td>
            </tr>

            <tr className="bg-gradient-to-r from-indigo-800 to-indigo-950 text-white text-xs">
              <td className="px-4 py-3.5 font-semibold" colSpan={2}>현재 예산현액</td>
              <td className="px-4 py-3.5 text-right font-bold text-emerald-300 tabular-nums text-sm numeric-emphasis">{formatAmount(totalBudget)}</td>
              <td className="px-4 py-3.5 hidden lg:table-cell" />
              <td className="px-4 py-3.5 hidden lg:table-cell" />
              <td className="px-4 py-3.5 text-right">
                <span className={`font-bold ${totalBudget - grandAdjusted >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  잔여 {formatAmount(totalBudget - grandAdjusted)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
