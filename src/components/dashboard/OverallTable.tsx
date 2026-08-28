import type { Course } from "../../types";
import { formatWon, formatPct, courseTotals, isExecutionAlert } from "../../store/utils";

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
    <div className="rounded-2xl glass-card shadow-glass overflow-hidden ring-1 ring-slate-200/50">
      <div className="px-5 py-4 border-b border-slate-100 bg-white/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">과정별 예산 현황</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">13개 과정 + 공통운영비 집계</p>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">{rows.length}개 과정</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="sticky top-0 z-10 bg-slate-900 text-[10px] text-slate-200 uppercase tracking-wider shadow-sm">
              <th className="px-4 py-3 text-left font-semibold">과정명</th>
              <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">구분</th>
              <th className="px-4 py-3 text-right font-semibold bg-indigo-950/40">조정예산</th>
              <th className="px-4 py-3 text-right font-semibold hidden lg:table-cell bg-amber-950/30">집행액</th>
              <th className="px-4 py-3 text-right font-semibold hidden lg:table-cell bg-slate-800">잔액</th>
              <th className="px-4 py-3 text-right font-semibold w-36">집행률</th>
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
                    className={`cursor-pointer transition-all duration-150 border-b border-slate-100 even:bg-slate-50/60 ${
                    active
                      ? executionAlert
                        ? "bg-gradient-to-r from-rose-800 to-rose-900 text-white"
                        : "bg-gradient-to-r from-slate-800 to-slate-900 text-white"
                      : executionAlert
                        ? "bg-rose-50/80 text-rose-950 hover:bg-rose-100"
                        : "hover:bg-slate-50/80"
                  }`}
                  title={executionAlert ? "집행률 100% 이상 — 확인 필요" : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}>{idx + 1}</span>
                      <span className={`font-medium text-xs leading-tight ${isUnset ? "italic opacity-60" : ""}`}>
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white/50" : dotColor}`} />
                      <span className={`text-[11px] ${active ? "text-slate-300" : "text-slate-500"}`}>{row.category}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right text-xs font-semibold tabular-nums ${active ? "text-white bg-indigo-950/30" : isUnset ? "text-slate-400 italic bg-indigo-50/30" : "text-indigo-900 bg-indigo-50/30"}`}>
                    {row.adjusted > 0 ? formatWon(row.adjusted) : "미입력"}
                  </td>
                  <td className={`px-4 py-3 text-right text-xs tabular-nums hidden lg:table-cell ${active ? "text-amber-300" : "text-amber-700"}`}>
                    {formatWon(row.executed)}
                  </td>
                  <td className={`px-4 py-3 text-right text-xs tabular-nums hidden lg:table-cell ${active ? "text-slate-300" : "text-slate-500"}`}>
                    {formatWon(row.remaining)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className={`w-16 h-1.5 rounded-full overflow-hidden ${active ? "bg-white/10" : executionAlert ? "bg-rose-200" : "bg-slate-100"}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          executionAlert ? (active ? "bg-rose-300" : "bg-rose-500") :
                          barWidth > 80 ? (active ? "bg-emerald-400" : "bg-gradient-to-r from-emerald-500 to-teal-400") :
                          barWidth > 50 ? (active ? "bg-sky-400" : "bg-gradient-to-r from-indigo-500 to-cyan-400") :
                          active ? "bg-amber-400" : "bg-gradient-to-r from-amber-500 to-orange-400"
                        }`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className={`text-[11px] tabular-nums font-bold w-10 text-right ${active ? (executionAlert ? "text-rose-200" : "text-slate-300") : executionAlert ? "text-rose-700" : "text-slate-500"}`}>
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
            <tr className="bg-slate-100 font-semibold text-xs text-slate-700 border-t-2 border-slate-300">
              <td className="px-4 py-3" colSpan={2}>과정 소계 (13개)</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatWon(programTotal.adjusted)}</td>
              <td className="px-4 py-3 text-right hidden lg:table-cell text-amber-700 tabular-nums">{formatWon(programTotal.executed)}</td>
              <td className="px-4 py-3 text-right hidden lg:table-cell tabular-nums">{formatWon(programTotal.adjusted - programTotal.executed)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatPct(programTotal.adjusted === 0 ? 0 : programTotal.executed / programTotal.adjusted)}</td>
            </tr>

            {commonCourse && commonTotal && (
              <tr
                onClick={() => onSelect(0)}
                className={`cursor-pointer transition-all text-xs border-t border-slate-100 ${
                  selectedCourseId === 0
                    ? "bg-emerald-800 text-white"
                    : "bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800"
                }`}
              >
                <td className="px-4 py-3 font-semibold" colSpan={2}>
                  <div className="flex items-center gap-2">
                    <span>🏢</span>
                    <span>공통 운영비</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatWon(commonTotal.adjusted)}</td>
                <td className="px-4 py-3 text-right hidden lg:table-cell tabular-nums">{formatWon(commonTotal.executed)}</td>
                <td className="px-4 py-3 text-right hidden lg:table-cell tabular-nums">{formatWon(commonTotal.remaining)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPct(commonTotal.executionRate)}</td>
              </tr>
            )}

            <tr className="bg-gradient-to-r from-slate-800 to-slate-950 text-white text-xs font-bold border-t-2 border-slate-700">
              <td className="px-4 py-3.5" colSpan={2}>총 배분 합계</td>
              <td className="px-4 py-3.5 text-right tabular-nums">{formatWon(grandAdjusted)}</td>
              <td className="px-4 py-3.5 text-right hidden lg:table-cell text-amber-300 tabular-nums">{formatWon(programTotal.executed + (commonTotal?.executed ?? 0))}</td>
              <td className="px-4 py-3.5 text-right hidden lg:table-cell text-slate-300 tabular-nums">{formatWon(grandAdjusted - programTotal.executed - (commonTotal?.executed ?? 0))}</td>
              <td className="px-4 py-3.5 text-right text-slate-400">—</td>
            </tr>

            <tr className="bg-gradient-to-r from-indigo-800 to-indigo-950 text-white text-xs">
              <td className="px-4 py-3.5 font-semibold" colSpan={2}>현재 예산현액</td>
              <td className="px-4 py-3.5 text-right font-bold text-emerald-300 tabular-nums">{formatWon(totalBudget)}</td>
              <td className="px-4 py-3.5 hidden lg:table-cell" />
              <td className="px-4 py-3.5 hidden lg:table-cell" />
              <td className="px-4 py-3.5 text-right">
                <span className={`font-bold ${totalBudget - grandAdjusted >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  잔여 {formatWon(totalBudget - grandAdjusted)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
