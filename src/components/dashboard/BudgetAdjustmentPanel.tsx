import { useEffect, useState } from "react";
import type { BudgetChange } from "../../types";
import { formatWon } from "../../store/utils";

type Props = {
  baseBudget: number;
  reduction: number;
  changes: BudgetChange[];
  onChange: (reduction: number, reason: string) => void;
};

export function BudgetAdjustmentPanel({ baseBudget, reduction, changes, onChange }: Props) {
  const [value, setValue] = useState(String(reduction));
  const [reason, setReason] = useState("현재 미배분 예산 감액 반영");
  const currentBudget = baseBudget - reduction;

  useEffect(() => setValue(String(reduction)), [reduction]);

  const save = () => {
    const next = Number(value.replace(/,/g, ""));
    if (!Number.isFinite(next)) return;
    onChange(next, reason);
  };

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm md:p-5" aria-label="현재 예산 조정">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">현시점 반영</span>
            <h2 className="text-base font-bold text-slate-800">미배분 예산 감액</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">현재 미배분액을 감액해 변경된 예산현액을 계산하고, 모든 변경을 이력으로 남깁니다.</p>
        </div>
        <div className="text-left md:text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">조정 후 예산현액</div>
          <div className="mt-0.5 font-mono text-xl font-extrabold text-indigo-700">{formatWon(currentBudget)}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr,1.5fr,auto] md:items-end">
        <label className="text-xs font-semibold text-slate-600">미배분 감액액
          <input
            value={Number(value || 0).toLocaleString("ko-KR")}
            onChange={(e) => setValue(e.target.value.replace(/,/g, ""))}
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-right font-mono text-sm font-bold text-amber-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">변경 사유
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <button onClick={save} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]">변경 반영</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span>기준 예산 {formatWon(baseBudget)}</span><span>·</span><span>변경 이력 {changes.length}건</span>
        {changes[0] && <><span>·</span><span>최근 {new Date(changes[0].changedAt).toLocaleDateString("ko-KR")}</span></>}
      </div>
    </section>
  );
}
