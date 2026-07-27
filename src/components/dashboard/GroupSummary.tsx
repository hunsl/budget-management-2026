import type { Course } from "../../types";
import { formatWon, formatPct } from "../../store/utils";

const GROUP_ICON: Record<string, string> = {
  "사무관리비": "📁",
  "공공운영비": "🏛️",
  "교육훈련비": "🎓",
  "행사운영비": "🎪",
  "행사실비보상금": "🎁",
  "회의비": "🤝",
};

export function GroupSummary({ courses }: { courses: Course[] }) {
  const grouped = courses
    .flatMap((c) => c.items.filter((i) => !i.isDeleted))
    .reduce<Record<string, { name: string; original: number; adjusted: number; executed: number }>>(
      (acc, item) => {
        if (!acc[item.group]) acc[item.group] = { name: item.group, original: 0, adjusted: 0, executed: 0 };
        acc[item.group].original += item.original;
        acc[item.group].adjusted += item.adjusted;
        acc[item.group].executed += item.executed;
        return acc;
      },
      {}
    );

  const rows = Object.values(grouped);
  const totalAdjusted = rows.reduce((s, g) => s + g.adjusted, 0);

  return (
    <div className="rounded-2xl glass-card shadow-glass p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800">예산구분별 총괄</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">계정과목 단위 집계</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {rows.map((g) => {
          const rate = g.adjusted === 0 ? 0 : g.executed / g.adjusted;
          const variance = g.adjusted - g.original;
          const share = totalAdjusted === 0 ? 0 : (g.adjusted / totalAdjusted) * 100;
          const icon = GROUP_ICON[g.name] ?? "📋";
          return (
            <div key={g.name} className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-all duration-200 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{icon}</span>
                  <span className="font-semibold text-sm text-slate-800">{g.name}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-50 rounded-full px-2 py-0.5">{share.toFixed(1)}%</span>
                </div>
                <span className={`text-xs font-bold font-mono ${variance > 0 ? "text-amber-600" : variance < 0 ? "text-emerald-600" : "text-slate-400"}`}>
                  {variance >= 0 ? "+" : ""}{formatWon(variance)}
                </span>
              </div>
              {/* 집행률 바 */}
              <div className="h-1.5 rounded-full bg-slate-100 mb-3 overflow-hidden">
                <div className="h-full rounded-full progress-gradient transition-all duration-500"
                  style={{ width: `${Math.min(100, rate * 100)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <div className="text-slate-400">조정예산</div>
                  <div className="mt-0.5 text-sm font-bold text-slate-800 tabular-nums font-mono">{formatWon(g.adjusted)}</div>
                </div>
                <div>
                  <div className="text-slate-400">집행액</div>
                  <div className="mt-0.5 text-sm font-bold text-slate-800 tabular-nums font-mono">{formatWon(g.executed)}</div>
                </div>
                <div>
                  <div className="text-slate-400">집행률</div>
                  <div className="mt-0.5 text-sm font-bold text-slate-800 tabular-nums font-mono">{formatPct(rate)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
