import { useState } from "react";
import type { Course, ExecutionRow } from "../../types";
import { formatAmount, parseNumber } from "../../store/utils";

type Props = {
  course: Course;
  executions: ExecutionRow[];
  onAdd: (row: Omit<ExecutionRow, "id">) => void;
  onUpdate: (id: number, patch: Partial<ExecutionRow>) => void;
  onDelete: (id: number) => void;
};

const today = new Date().toISOString().slice(0, 10);
const inputCls = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none";
const labelCls = "text-[11px] font-medium text-slate-500 uppercase tracking-wider";

export function ExecutionManager({ course, executions, onAdd, onUpdate, onDelete }: Props) {
  const activeItems = course.items.filter((i) => !i.isDeleted);
  const courseExecs = executions.filter((e) => e.courseId === course.id);

  const [form, setForm] = useState({
    date: today, itemId: activeItems[0]?.id ?? "",
    amount: "", vendor: "", proofNo: "", memo: "",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExecutionRow>>({});
  const [filterItemId, setFilterItemId] = useState<string>("all");

  const f = (key: keyof typeof form, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleAdd = () => {
    if (!form.itemId || !form.amount) return;
    const amount = parseNumber(form.amount);
    if (amount <= 0) return;
    onAdd({ courseId: course.id, itemId: form.itemId, date: form.date, amount, vendor: form.vendor || "-", proofNo: form.proofNo || "-", memo: form.memo || "-" });
    setForm((p) => ({ ...p, amount: "", vendor: "", proofNo: "", memo: "" }));
  };

  const handleEditSave = (id: number) => {
    onUpdate(id, { ...editForm, amount: parseNumber(String(editForm.amount ?? 0)) });
    setEditId(null);
    setEditForm({});
  };

  const filtered = filterItemId === "all" ? courseExecs : courseExecs.filter((e) => e.itemId === filterItemId);

  const monthlyTotal = filtered.reduce<Record<string, number>>((acc, e) => {
    const month = e.date.slice(0, 7);
    acc[month] = (acc[month] ?? 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="rounded-2xl glass-card shadow-glass p-5 space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800">집행내역 관리</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">{course.name}</p>
      </div>

      {/* 등록 폼 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 print-hide">
        <div className="text-xs font-bold text-slate-700">집행내역 등록</div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:grid-cols-3">
          <div><label className={labelCls}>집행일자</label><input type="date" className={inputCls} value={form.date} onChange={(e) => f("date", e.target.value)} /></div>
          <div><label className={labelCls}>항목 선택</label><select className={inputCls} value={form.itemId} onChange={(e) => f("itemId", e.target.value)}>{activeItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
          <div><label className={labelCls}>집행금액</label><input className={inputCls} value={form.amount} onChange={(e) => f("amount", e.target.value)} placeholder="0" /></div>
          <div><label className={labelCls}>거래처</label><input className={inputCls} value={form.vendor} onChange={(e) => f("vendor", e.target.value)} placeholder="거래처명" /></div>
          <div><label className={labelCls}>증빙번호</label><input className={inputCls} value={form.proofNo} onChange={(e) => f("proofNo", e.target.value)} placeholder="증빙-2026-XXX" /></div>
          <div><label className={labelCls}>비고</label><input className={inputCls} value={form.memo} onChange={(e) => f("memo", e.target.value)} placeholder="메모" /></div>
        </div>
        <button onClick={handleAdd}
          className="rounded-lg bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 px-5 py-2.5 text-xs font-semibold text-white hover:shadow-glow-indigo shadow-sm transition-all">
          등록
        </button>
      </div>

      {/* 필터 + 월별 집계 */}
      <div className="flex flex-wrap items-center gap-3 print-hide">
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
          value={filterItemId} onChange={(e) => setFilterItemId(e.target.value)}>
          <option value="all">전체 항목</option>
          {activeItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(monthlyTotal).map(([month, total]) => (
            <span key={month} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] text-slate-600 font-medium tabular-nums">
              {month}: {formatAmount(total)}원
            </span>
          ))}
        </div>
      </div>

      {/* 집행내역 목록 */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
        <table className="min-w-[820px] w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="sticky top-0 z-10 bg-slate-900 text-[10px] text-slate-200 uppercase tracking-wider shadow-sm">
              <th className="px-3 py-3 text-left font-semibold">일자</th>
              <th className="px-3 py-3 text-left font-semibold">항목</th>
              <th className="px-3 py-3 text-right font-semibold">금액</th>
              <th className="px-3 py-3 text-left font-semibold">거래처</th>
              <th className="px-3 py-3 text-left font-semibold">증빙번호</th>
              <th className="px-3 py-3 text-left font-semibold">비고</th>
              <th className="px-3 py-3 text-center font-semibold print-hide">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <div className="text-4xl">💳</div>
                  <div>
                    <p className="font-semibold text-slate-600 text-sm mb-0.5">등록된 집행 내역이 없습니다</p>
                    <p className="text-xs">위 등록 폼에서 집행 내역을 추가해주세요.</p>
                  </div>
                </div>
              </td></tr>
            )}
            {filtered.map((row) => {
              const itemName = activeItems.find((i) => i.id === row.itemId)?.name ?? row.itemId;
              const isEditing = editId === row.id;
              return (
                <tr key={row.id} className="border-b border-slate-100 even:bg-slate-50/60 hover:bg-cyan-50/70 transition-colors">
                  <td className="px-3 py-2.5 text-xs tabular-nums">
                    {isEditing
                      ? <input type="date" className="rounded-lg border border-slate-200 px-2 py-1 text-xs w-32"
                          value={String(editForm.date ?? row.date)} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} />
                      : row.date}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{itemName}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums text-indigo-900 bg-indigo-50/30">
                    {isEditing
                      ? <input className="rounded-lg border border-slate-200 px-2 py-1 text-xs w-28 text-right"
                          value={String(editForm.amount ?? row.amount)} onChange={(e) => setEditForm((p) => ({ ...p, amount: parseNumber(e.target.value) }))} />
                      : formatAmount(row.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {isEditing
                      ? <input className="rounded-lg border border-slate-200 px-2 py-1 text-xs w-24"
                          value={String(editForm.vendor ?? row.vendor)} onChange={(e) => setEditForm((p) => ({ ...p, vendor: e.target.value }))} />
                      : row.vendor}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-400">{row.proofNo}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-400">{row.memo}</td>
                  <td className="px-3 py-2.5 text-center print-hide">
                    {isEditing ? (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleEditSave(row.id)} className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white">저장</button>
                        <button onClick={() => { setEditId(null); setEditForm({}); }} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px]">취소</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => { setEditId(row.id); setEditForm({ date: row.date, amount: row.amount, vendor: row.vendor }); }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] hover:bg-slate-50 transition-all">수정</button>
                        <button onClick={() => onDelete(row.id)}
                          className="rounded-lg border border-rose-200 px-2.5 py-1 text-[10px] text-rose-600 hover:bg-rose-50 transition-all">삭제</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
