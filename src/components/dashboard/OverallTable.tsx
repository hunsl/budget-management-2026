import type { Course } from "../../types";
import { formatWon, formatPct, courseTotals } from "../../store/utils";

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
    <div className="rounded-2xl glass-card shadow-glass overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">과정별 예산 현황</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">13개 과정 + 공통운영비 집계</p>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">{rows.length}개 과정</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-semibold">과정명</th>
              <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">구분</th>
              <th className="px-4 py-3 text-right font-semibold">조정예산</th>
              <th className="px-4 py-3 text-right font-semibold hidden lg:table-cell">집행액</th>
              <th className="px-4 py-3 text-right font-semibold hidden lg:table-cell">잔액</th>
              <th className="px-4 py-3 text-right font-semibold w-36">집행률</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const active = row.id === selectedCourseId;
              const isUnset = row.category === "미지정";
              const barWidth = row.adjusted > 0 ? Math.min(100, (row.executed / row.adjusted) * 100) : 0;
              const dotColor = CATEGORY_DOT[row.category] ?? "bg-slate-300";
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row.id)}
                  className={`cursor-pointer transition-all duration-150 border-b border-slate-50 ${
                    active
                      ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white"
                      : "hover:bg-slate-50/80"
                  }`}
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
                  <td className={`px-4 py-3 text-right text-sm font-bold font-mono tabular-nums ${active ? "text-white" : isUnset ? "text-slate-400 italic" : "text-slate-900"}`}>
                    {row.adjusted > 0 ? formatWon(row.adjusted) : "미입력"}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-semibold font-mono tabular-nums hidden lg:table-cell ${active ? "text-amber-300" : "text-amber-700"}`}>
                    {formatWon(row.executed)}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-semibold font-mono tabular-nums hidden lg:table-cell ${active ? "text-slate-300" : "text-slate-700"}`}>
                    {formatWon(row.remaining)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className={`w-16 h-1.5 rounded-full overflow-hidden ${active ? "bg-white/10" : "bg-slate-100"}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          barWidth > 80 ? (active ? "bg-emerald-400" : "bg-gradient-to-r from-emerald-500 to-teal-400") :
                          barWidth > 50 ? (active ? "bg-sky-400" : "bg-gradient-to-r from-indigo-500 to-cyan-400") :
                          active ? "bg-amber-400" : "bg-gradient-to-r from-amber-500 to-orange-400"
                        }`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className={`text-xs font-mono tabular-nums font-bold w-10 text-right ${active ? "text-slate-200" : "text-indigo-700"}`}>
                        {formatPct(row.executionRate)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* 소계/합계 */}
          <tfoot>
            <tr className="bg-slate-50 font-semibold text-xs text-slate-700 border-t-2 border-slate-200">
              <td className="px-4 py-3" colSpan={2}>과정 소계 (13개)</td>
              <td className="px-4 py-3 text-right text-sm font-bold font-mono tabular-nums text-slate-900">{formatWon(programTotal.adjusted)}</td>
              <td className="px-4 py-3 text-right hidden lg:table-cell text-sm font-bold font-mono text-amber-700 tabular-nums">{formatWon(programTotal.executed)}</td>
              <td className="px-4 py-3 text-right hidden lg:table-cell text-sm font-bold font-mono tabular-nums">{formatWon(programTotal.adjusted - programTotal.executed)}</td>
              <td className="px-4 py-3 text-right text-sm font-bold font-mono tabular-nums text-indigo-700">{formatPct(programTotal.adjusted === 0 ? 0 : programTotal.executed / programTotal.adjusted)}</td>
            </tr>

            {commonCourse && commonTotal && (
              <tr
                onClick={() => onSelect(0)}
                className={`cursor-pointer transition-all text-xs border-t border-slate-100 ${
                  selectedCourseId === 0
                    ? "bg-emerald-800 text-white"
                    : "hover:bg-emerald-50 text-emerald-800"
                }`}
              >
                <td className="px-4 py-3 font-semibold" colSpan={2}>
                  <div className="flex items-center gap-2">
                    <span>🏢</span>
                    <span>공통 운영비</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold font-mono tabular-nums">{formatWon(commonTotal.adjusted)}</td>
                <td className="px-4 py-3 text-right hidden lg:table-cell font-mono tabular-nums">{formatWon(commonTotal.executed)}</td>
                <td className="px-4 py-3 text-right hidden lg:table-cell font-mono tabular-nums">{formatWon(commonTotal.remaining)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{formatPct(commonTotal.executionRate)}</td>
              </tr>
            )}

            <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs font-bold">
              <td className="px-4 py-3.5" colSpan={2}>총 배분 합계</td>
              <td className="px-4 py-3.5 text-right text-sm font-mono tabular-nums">{formatWon(grandAdjusted)}</td>
              <td className="px-4 py-3.5 text-right hidden lg:table-cell text-sm text-amber-300 font-mono tabular-nums">{formatWon(programTotal.executed + (commonTotal?.executed ?? 0))}</td>
              <td className="px-4 py-3.5 text-right hidden lg:table-cell text-sm text-slate-300 font-mono tabular-nums">{formatWon(grandAdjusted - programTotal.executed - (commonTotal?.executed ?? 0))}</td>
              <td className="px-4 py-3.5 text-right text-slate-400">—</td>
            </tr>

            <tr className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white text-xs">
              <td className="px-4 py-3.5 font-semibold" colSpan={2}>총 사업비 (고정)</td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-emerald-300 font-mono tabular-nums">{formatWon(totalBudget)}</td>
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
