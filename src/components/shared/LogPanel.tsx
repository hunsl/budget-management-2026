import type { AdjustmentLog } from "../../types";
import { formatWon } from "../../store/utils";

export function LogPanel({ logs, courseId }: { logs: AdjustmentLog[]; courseId?: number }) {
  const filtered = courseId !== undefined
    ? logs.filter((l) => l.courseId === courseId)
    : logs;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-12">
        <div className="text-4xl">🕓</div>
        <div className="text-center">
          <p className="font-semibold text-slate-600 text-sm mb-0.5">수정 이력이 없습니다</p>
          <p className="text-xs">예산 항목을 수정하면 변경 이력이 자동으로 기록됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {filtered.map((log) => {
        if (log.kind === "course") {
          return (
            <div key={log.id} className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-xs hover:border-indigo-200 transition-all hover-lift">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-indigo-900">과정명 변경</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{log.editedAt.slice(0, 16).replace("T", " ")}</span>
              </div>
              <div className="mt-1.5 text-slate-700">
                {log.courseNameBefore} <span className="text-slate-300">→</span> <strong>{log.courseNameAfter}</strong>
              </div>
              <div className="mt-1.5 text-slate-400">사유: <span className="text-slate-600">{log.reason}</span> · {log.editedBy}</div>
            </div>
          );
        }
        const beforeAdj = log.before.adjusted;
        const afterAdj = log.after.adjusted;
        return (
          <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs hover:border-slate-200 transition-all hover-lift">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800">{log.adjustmentRound ? `${log.adjustmentRound}차 조정 · ` : ""}{log.after.name ?? log.before.name ?? log.itemId}</span>
              <span className="text-[10px] text-slate-400 tabular-nums">{log.editedAt.slice(0, 16).replace("T", " ")}</span>
            </div>
            {beforeAdj !== undefined && afterAdj !== undefined && (
              <div className="mt-1.5 text-slate-600 flex items-center gap-2">
                <span className="tabular-nums">{formatWon(beforeAdj)}</span>
                <span className="text-slate-300">→</span>
                <span className="font-semibold tabular-nums">{formatWon(afterAdj)}</span>
              </div>
            )}
            <div className="mt-1.5 flex items-center gap-3 text-slate-400">
              <span>사유: <span className="text-slate-600">{log.reason}</span></span>
              <span>·</span>
              <span>{log.editedBy}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
