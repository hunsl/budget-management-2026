import { useState, useEffect } from "react";
import type { Course, BudgetItem } from "../../types";
import { parseNumber, formatWon, generateNewItemId } from "../../store/utils";

type Props = {
  course: Course;
  editingItemId: string;
  onUpdate: (itemId: string, patch: Partial<BudgetItem>, reason: string) => void;
  onAdd: (item: BudgetItem) => void;
  onDelete: (itemId: string) => void;
};

const GROUPS = ["사무관리비", "공공운영비", "교육훈련비", "행사운영비", "행사실비보상금", "회의비", "기타"];

const inputCls = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none";
const labelCls = "text-[11px] font-medium text-slate-500 uppercase tracking-wider";

export function ItemEditor({ course, editingItemId, onUpdate, onAdd, onDelete }: Props) {
  const item = course.items.find((i) => i.id === editingItemId && !i.isDeleted);

  const [form, setForm] = useState({
    group: "", name: "", unitPrice: "", qty1: "", qty2: "", qty3: "",
    adjusted: "", calc: "", reason: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ group: "교육훈련비", name: "", unitPrice: "", qty1: "1", calc: "" });
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!item) return;
    setForm({
      group: item.group, name: item.name,
      unitPrice: String(item.unitPrice), qty1: String(item.qty1 ?? 1),
      qty2: String(item.qty2 ?? 1), qty3: String(item.qty3 ?? 1),
      adjusted: String(item.adjusted), calc: item.calc, reason: "",
    });
  }, [item]);

  const handleSave = () => {
    if (!item) return;
    onUpdate(item.id, {
      group: form.group, name: form.name,
      unitPrice: parseNumber(form.unitPrice),
      qty1: parseNumber(form.qty1, 1), qty2: parseNumber(form.qty2, 1), qty3: parseNumber(form.qty3, 1),
      adjusted: parseNumber(form.adjusted), calc: form.calc,
    }, form.reason || "수정 사유 미입력");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const handleAdd = () => {
    if (!newItem.name.trim()) return;
    const amount = parseNumber(newItem.unitPrice) * parseNumber(newItem.qty1, 1);
    const id = generateNewItemId(course.id, course.items);
    onAdd({
      id, group: newItem.group, name: newItem.name,
      calc: newItem.calc || `${newItem.unitPrice} × ${newItem.qty1}`,
      unitPrice: parseNumber(newItem.unitPrice), qty1: parseNumber(newItem.qty1, 1),
      original: amount, adjusted: amount, executed: 0,
    });
    setNewItem({ group: "교육훈련비", name: "", unitPrice: "", qty1: "1", calc: "" });
    setShowAddForm(false);
  };

  const f = (key: keyof typeof form, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="rounded-2xl glass-card shadow-glass p-5 print-hide">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">세부 예산 편집기</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">항목 수정 및 추가</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:shadow-glow-indigo shadow-sm shadow-indigo-500/20 transition-all"
        >
          + 항목 추가
        </button>
      </div>

      {showAddForm && (
        <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
          <div className="text-xs font-bold text-indigo-800">신규 항목 추가</div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>예산구분</label>
              <select className={inputCls} value={newItem.group} onChange={(e) => setNewItem((p) => ({ ...p, group: e.target.value }))}>
                {GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>세부항목명</label>
              <input className={inputCls} value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} placeholder="항목명 입력" />
            </div>
            <div>
              <label className={labelCls}>단가</label>
              <input className={inputCls} value={newItem.unitPrice} onChange={(e) => setNewItem((p) => ({ ...p, unitPrice: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>수량</label>
              <input className={inputCls} value={newItem.qty1} onChange={(e) => setNewItem((p) => ({ ...p, qty1: e.target.value }))} placeholder="1" />
            </div>
            <div className="xs:col-span-2">
              <label className={labelCls}>산출근거</label>
              <input className={inputCls} value={newItem.calc} onChange={(e) => setNewItem((p) => ({ ...p, calc: e.target.value }))} placeholder="예: 100,000 × 4H" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all">추가</button>
            <button onClick={() => setShowAddForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-all">취소</button>
          </div>
        </div>
      )}

      {item ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
            <div className="text-sm">
              선택: <span className="font-bold text-slate-800">{item.name}</span>
            </div>
            <span className="text-xs text-slate-400 tabular-nums">현재 {formatWon(item.adjusted)}</span>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div><label className={labelCls}>예산구분</label><select className={inputCls} value={form.group} onChange={(e) => f("group", e.target.value)}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></div>
            <div><label className={labelCls}>세부항목명</label><input className={inputCls} value={form.name} onChange={(e) => f("name", e.target.value)} /></div>
            <div><label className={labelCls}>단가</label><input className={inputCls} value={form.unitPrice} onChange={(e) => f("unitPrice", e.target.value)} /></div>
            <div><label className={labelCls}>수량1</label><input className={inputCls} value={form.qty1} onChange={(e) => f("qty1", e.target.value)} /></div>
            <div><label className={labelCls}>수량2</label><input className={inputCls} value={form.qty2} onChange={(e) => f("qty2", e.target.value)} /></div>
            <div><label className={labelCls}>수량3</label><input className={inputCls} value={form.qty3} onChange={(e) => f("qty3", e.target.value)} /></div>
            <div><label className={labelCls}>조정금액</label><input className={`${inputCls} font-bold`} value={form.adjusted} onChange={(e) => f("adjusted", e.target.value)} /></div>
            <div><label className={labelCls}>산출근거</label><input className={inputCls} value={form.calc} onChange={(e) => f("calc", e.target.value)} /></div>
            <div className="xs:col-span-2">
              <label className={labelCls}>수정 사유 <span className="text-rose-500">*</span></label>
              <input className={inputCls} value={form.reason} onChange={(e) => f("reason", e.target.value)} placeholder="수정 사유를 입력하세요" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave}
              className={`rounded-lg px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all ${
                justSaved
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 ring-2 ring-emerald-300 animate-save-flash"
                  : "bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 hover:shadow-glow-indigo"
              }`}>
              {justSaved ? "✓ 저장됨" : "저장"}
            </button>
            <button onClick={() => onDelete(item.id)}
              className="rounded-lg border border-rose-200 px-5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all">
              삭제
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-12">
          <div className="text-4xl">📋</div>
          <div className="text-center">
            <p className="font-semibold text-slate-600 text-sm mb-0.5">선택된 항목이 없습니다</p>
            <p className="text-xs">검토표에서 항목을 클릭하면 편집할 수 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
