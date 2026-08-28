import type { Course } from "../../types";
import { formatWon, formatPct } from "../../store/utils";

type Props = {
  totalBudget: number;
  budgetReduction: number;
  programSummary: { adjusted: number; executed: number; remaining: number };
  commonSummary: { adjusted: number; executed: number };
  selectedCourse: Course;
};

function MiniGauge({ rate, size = 56, stroke = 4, color = "#34d399" }: { rate: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, rate));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
        {(pct * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export function DashboardHeader({ totalBudget, budgetReduction, programSummary, commonSummary, selectedCourse }: Props) {
  const totalExecuted = programSummary.executed + commonSummary.executed;
  const totalAdjusted = programSummary.adjusted + commonSummary.adjusted;
  const execRate = totalAdjusted === 0 ? 0 : totalExecuted / totalAdjusted;
  const unallocated = totalBudget - totalAdjusted;
  const isMobileView = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div className="rounded-2xl glass-card-dark p-4 md:p-6 text-white shadow-glass-lg overflow-hidden relative">
      {/* 배경 메시 그라데이션 */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.1) 0px, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(139,92,246,0.08) 0px, transparent 50%)`,
      }} />
      <div className="absolute inset-0 bg-card-shine" />

      <div className="relative">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4 md:mb-6">
          <div>
            <div className="text-[10px] md:text-[11px] text-indigo-300/80 font-semibold uppercase tracking-[0.15em]">2026 경기북부 직업교육훈련</div>
            <h1 className="mt-1 md:mt-1.5 text-xl md:text-2xl font-extrabold font-display tracking-tight">예산 총괄 현황</h1>
          </div>
          <div className="rounded-xl bg-white/[0.07] backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 text-right border border-white/10 self-start">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">선택 과정</div>
            <div className="mt-0.5 text-xs md:text-sm font-semibold truncate max-w-[200px]">{selectedCourse.name}</div>
          </div>
        </div>

        {/* 총 사업비 + 게이지 */}
        <div className="mb-4 md:mb-6 rounded-xl bg-white/[0.06] border border-white/10 px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-5">
            <MiniGauge rate={execRate} size={isMobileView ? 52 : 64} stroke={isMobileView ? 4 : 5} />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">현재 예산현액</div>
              <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mt-1 font-mono">
                {formatWon(totalBudget)}
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">미배분 감액 반영</div>
            <div className={`text-xl md:text-2xl font-bold mt-1 font-mono ${unallocated >= 0 ? "text-sky-300" : "text-rose-400"}`}>
              <span className="block text-amber-300 text-sm">-{formatWon(budgetReduction)}</span>
              <span className="block text-xs text-slate-300 mt-0.5">잔여 {formatWon(unallocated)}</span>
            </div>
          </div>
        </div>

        {/* 4개 지표 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: "과정별 합산", value: formatWon(programSummary.adjusted), sub: "13개 과정", icon: "📚" },
            { label: "공통운영비", value: formatWon(commonSummary.adjusted), sub: "과정 외 운영", icon: "🏢" },
            { label: "총 집행액", value: formatWon(totalExecuted), sub: "누적 집행", icon: "💰", accent: true },
            { label: "집행률", value: formatPct(execRate), sub: "배분예산 대비", icon: "📊" },
          ].map((card, i) => (
            <div key={i} className="rounded-xl bg-white/[0.06] border border-white/[0.08] p-3 md:p-4 hover:bg-white/[0.12] hover:border-white/[0.15] transition-all duration-300 hover-lift shadow-inner-light">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                <span className="text-xs md:text-sm">{card.icon}</span>
                <span className="text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-[0.1em]">{card.label}</span>
              </div>
              <div className={`text-base md:text-lg font-extrabold font-mono ${card.accent ? "text-gradient-warm" : "text-white"}`}>{card.value}</div>
              <div className="text-[9px] md:text-[10px] text-slate-500 mt-0.5 md:mt-1">{card.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
