import { useEffect, useState } from "react";
import type { AdjustmentLog, BudgetItem, Course } from "../../types";
import { formatWon, generateNewItemId, parseNumber } from "../../store/utils";

type Props = {
  course: Course;
  editingItemId: string;
  onUpdate: (itemId: string, patch: Partial<BudgetItem>, reason: string) => void;
  onAdd: (item: BudgetItem) => void;
  onDelete: (itemId: string) => void;
  logs: AdjustmentLog[];
};

const GROUPS = ["사무관리", "공통운영비", "교육훈련비", "강사운영비", "강사수당 및 보상금", "회의비", "기타"];
const inputCls = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20";
const labelCls = "text-[11px] font-medium text-slate-500";

export function ItemEditor({ course, editingItemId, onUpdate, onAdd, onDelete, logs }: Props) {
  const item = course.items.find((entry) => entry.id === editingItemId && !entry.isDeleted);
  const itemLogs = item
    ? logs.filter((log) => log.courseId === course.id && log.itemId === item.id && log.kind !== "course")
    : [];
  const latestRound = itemLogs.find((log) => log.adjustmentRound)?.adjustmentRound ?? 0;
  const [form, setForm] = useState({ group: "", name: "", unitPrice: "", qty1: "", qty2: "", qty3: "", adjusted: "", calc: "", reason: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ group: GROUPS[2], name: "", unitPrice: "", qty1: "1", calc: "" });
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!item) return;
    setForm({
      group: item.group, name: item.name, unitPrice: String(item.unitPrice), qty1: String(item.qty1 ?? 1),
      qty2: String(item.qty2 ?? 1), qty3: String(item.qty3 ?? 1), adjusted: String(item.adjusted), calc: item.calc, reason: "",
    });
  }, [item]);

  const setField = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!item) return;
    onUpdate(item.id, {
      group: form.group, name: form.name, unitPrice: parseNumber(form.unitPrice),
      qty1: parseNumber(form.qty1, 1), qty2: parseNumber(form.qty2, 1), qty3: parseNumber(form.qty3, 1),
      adjusted: parseNumber(form.adjusted), calc: form.calc,
    }, form.reason.trim() || "사유 미입력");
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1500);
  };

  const handleAdd = () => {
    if (!newItem.name.trim()) return;
    const amount = parseNumber(newItem.unitPrice) * parseNumber(newItem.qty1, 1);
    onAdd({
      id: generateNewItemId(course.id, course.items), group: newItem.group, name: newItem.name.trim(),
      calc: newItem.calc || `${newItem.unitPrice} × ${newItem.qty1}`, unitPrice: parseNumber(newItem.unitPrice),
      qty1: parseNumber(newItem.qty1, 1), original: amount, adjusted: amount, executed: 0,
    });
    setNewItem({ group: GROUPS[2], name: "", unitPrice: "", qty1: "1", calc: "" });
    setShowAddForm(false);
  };

  return (
    <div className="rounded-2xl glass-card p-5 shadow-glass print-hide">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">예산 항목 편집</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">항목 금액을 재조정하거나 새 항목을 추가할 수 있습니다.</p>
        </div>
        <button onClick={() => setShowAddForm((value) => !value)} className="rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-glow-indigo">
          + 항목 추가
        </button>
      </div>

      {showAddForm && (
        <div className="mb-5 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="text-xs font-bold text-indigo-800">새 항목 추가</div>
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
            <label className={labelCls}>예산 구분<select className={inputCls} value={newItem.group} onChange={(event) => setNewItem((prev) => ({ ...prev, group: event.target.value }))}>{GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
            <label className={labelCls}>항목명<input className={inputCls} value={newItem.name} onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))} placeholder="항목명 입력" /></label>
            <label className={labelCls}>단가<input className={inputCls} value={newItem.unitPrice} onChange={(event) => setNewItem((prev) => ({ ...prev, unitPrice: event.target.value }))} placeholder="0" /></label>
            <label className={labelCls}>수량<input className={inputCls} value={newItem.qty1} onChange={(event) => setNewItem((prev) => ({ ...prev, qty1: event.target.value }))} placeholder="1" /></label>
            <label className="xs:col-span-2"><span className={labelCls}>산출근거</span><input className={inputCls} value={newItem.calc} onChange={(event) => setNewItem((prev) => ({ ...prev, calc: event.target.value }))} placeholder="예: 100,000 × 4회" /></label>
          </div>
          <div className="flex gap-2"><button onClick={handleAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">추가</button><button onClick={() => setShowAddForm(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">취소</button></div>
        </div>
      )}

      {item ? (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div className="min-w-0 text-sm"><span className="text-slate-500">선택 항목</span>{" "}<span className="font-bold text-slate-800">{item.name}</span><p className="mt-1 text-[11px] text-slate-500">2026.07.22 기준 이후에도 금액을 다시 조정할 수 있으며, 저장할 때마다 이력이 남습니다.</p></div>
            <div className="rounded-lg bg-white/80 px-3 py-2 text-right"><div className="text-[10px] font-semibold text-slate-400">최초 계획액</div><div className="text-xs font-semibold text-slate-700 tabular-nums">{formatWon(item.original)}</div></div>
            <div className="rounded-lg bg-slate-900 px-3 py-2 text-right text-white"><div className="text-[10px] font-semibold text-slate-300">현재 조정액{latestRound > 0 ? ` · ${latestRound}차` : ""}</div><div className="text-sm font-bold tabular-nums">{formatWon(item.adjusted)}</div></div>
          </div>

          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
            <label className={labelCls}>예산 구분<select className={inputCls} value={form.group} onChange={(event) => setField("group", event.target.value)}>{GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
            <label className={labelCls}>항목명<input className={inputCls} value={form.name} onChange={(event) => setField("name", event.target.value)} /></label>
            <label className={labelCls}>단가<input className={inputCls} value={form.unitPrice} onChange={(event) => setField("unitPrice", event.target.value)} /></label>
            <label className={labelCls}>수량 1<input className={inputCls} value={form.qty1} onChange={(event) => setField("qty1", event.target.value)} /></label>
            <label className={labelCls}>수량 2<input className={inputCls} value={form.qty2} onChange={(event) => setField("qty2", event.target.value)} /></label>
            <label className={labelCls}>수량 3<input className={inputCls} value={form.qty3} onChange={(event) => setField("qty3", event.target.value)} /></label>
            <label className={labelCls}>현재 조정금액 (재조정 가능)<input className={`${inputCls} font-bold`} value={form.adjusted} onChange={(event) => setField("adjusted", event.target.value)} /></label>
            <label className={labelCls}>산출근거<input className={inputCls} value={form.calc} onChange={(event) => setField("calc", event.target.value)} /></label>
            <label className="xs:col-span-2"><span className={labelCls}>조정 사유</span><input className={inputCls} value={form.reason} onChange={(event) => setField("reason", event.target.value)} placeholder="예: 2차 조정, 실제 견적 반영" /></label>
          </div>

          <div className="flex gap-2 pt-1"><button onClick={handleSave} className={`rounded-lg px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all ${justSaved ? "bg-gradient-to-r from-emerald-500 to-teal-500 ring-2 ring-emerald-300 animate-save-flash" : "bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 hover:shadow-glow-indigo"}`}>{justSaved ? "저장됨" : "변경 저장"}</button><button onClick={() => onDelete(item.id)} className="rounded-lg border border-rose-200 px-5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">항목 삭제</button></div>

          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">이 항목의 조정 이력</h3><p className="text-[11px] text-slate-400">이전 금액을 덮어쓰지 않고 변경 차수별로 보관합니다.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">총 {itemLogs.length}건</span></div>
            {itemLogs.length === 0 ? <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-400">아직 저장된 추가 조정이 없습니다. 저장하면 1차 조정으로 기록됩니다.</p> : <div className="max-h-48 space-y-2 overflow-y-auto pr-1">{itemLogs.slice(0, 8).map((log) => <div key={log.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">{log.adjustmentRound ? `${log.adjustmentRound}차 조정` : "기존 조정"}</span><span className="font-semibold text-slate-700 tabular-nums">{formatWon(Number(log.before.adjusted ?? 0))}</span><span className="text-slate-300">→</span><span className="font-bold text-indigo-700 tabular-nums">{formatWon(Number(log.after.adjusted ?? log.before.adjusted ?? 0))}</span><span className="text-slate-400">{log.reason || "사유 미입력"}</span></div><span className="shrink-0 text-[10px] text-slate-400 tabular-nums">{log.editedAt.slice(0, 16).replace("T", " ")}</span></div>)}</div>}
          </div>
        </div>
      ) : <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400"><div className="text-4xl">🧾</div><div className="text-center"><p className="mb-0.5 text-sm font-semibold text-slate-600">선택된 항목이 없습니다</p><p className="text-xs">위 검토표에서 항목을 선택하면 편집할 수 있습니다.</p></div></div>}
    </div>
  );
}
