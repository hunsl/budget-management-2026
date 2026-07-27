import type { WarningItem } from "../../types";

const levelStyle: Record<WarningItem["level"], string> = {
  critical: "bg-rose-50 border-rose-200 text-rose-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-slate-50 border-slate-200 text-slate-700",
};

const levelDot: Record<WarningItem["level"], string> = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-slate-400",
};

export function WarningPanel({ warnings }: { warnings: WarningItem[] }) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-700 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        검증 경고 없음 — 모든 항목이 정상 범위입니다
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {warnings.map((w) => (
        <div key={w.id} className={`rounded-lg border px-4 py-2.5 text-xs flex items-start gap-2.5 ${levelStyle[w.level]}`}>
          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${levelDot[w.level]}`} />
          <div>
            <span className="font-bold">[{w.type}]</span> {w.message}
          </div>
        </div>
      ))}
    </div>
  );
}
