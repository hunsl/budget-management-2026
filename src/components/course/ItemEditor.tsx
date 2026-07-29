import { useState, useEffect, useMemo } from "react";
import type { Course, BudgetItem, ExecutionRow } from "../../types";
import { parseNumber, formatWon, formatPct, generateNewItemId } from "../../store/utils";

type Props = {
  course: Course;
  editingItemId: string;
  executions: ExecutionRow[];
  onUpdate: (itemId: string, patch: Partial<BudgetItem>, reason: string) => void;
  onAdd: (item: BudgetItem) => void;
  onDelete: (itemId: string) => void;
  onAddExecution: (row: Omit<ExecutionRow, "id">) => void;
  onUpdateExecution: (id: number, patch: Partial<ExecutionRow>) => void;
  onDeleteExecution: (id: number) => void;
};

const GROUPS = ["사무관리비", "공공운영비", "교육훈련비", "행사운영비", "행사실비보상금", "회의비", "기타"];
const today = new Date().toISOString().slice(0, 10);

const inputCls = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none";
const labelCls = "text-[11px] font-medium text-slate-500 uppercase tracking-wider";

export function ItemEditor({
  course, editingItemId, executions,
  onUpdate, onAdd, onDelete,
  onAddExecution, onUpdateExecution, onDeleteExecution,
}: Props) {
  const item = course.items.find((i) => i.id === editingItemId && !i.isDeleted);

  const [form, setForm] = useState({
    group: "", name: "", unitPrice: "", qty1: "", qty2: "", qty3: "",
    adjusted: "", executed: "", calc: "", reason: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ group: "교육훈련비", name: "", unitPrice: "", qty1: "1", calc: "" });
  const [justSaved, setJustSaved] = useState(false);

  const [execForm, setExecForm] = useState({
    date: today, amount: "", vendor: "", proofNo: "", memo: "",
  });
  const [editExecId, setEditExecId] = useState<number | null>(null);
  const [editExecForm, setEditExecForm] = useState<Partial<ExecutionRow>>({});

  const itemExecs = useMemo(
    () => executions
      .filter((e) => e.courseId === course.id && e.itemId === editingItemId)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    [executions, course.id, editingItemId],
  );
  const execSum = useMemo(
    () => itemExecs.reduce((s, e) => s + e.amount, 0),
    [itemExecs],
  );

  // 항목 선택이 바뀔 때만 폼을 채운다.
  // item 객체 참조(집행액 원격 동기화 등)로 리셋하면 작성 중이던 값이 날아감.
  useEffect(() => {
    if (!item) return;
    setForm({
      group: item.group, name: item.name,
      unitPrice: String(item.unitPrice), qty1: String(item.qty1 ?? 1),
      qty2: String(item.qty2 ?? 1), qty3: String(item.qty3 ?? 1),
      adjusted: String(item.adjusted), executed: String(item.executed),
      calc: item.calc, reason: "",
    });
    setExecForm({ date: today, amount: "", vendor: "", proofNo: "", memo: "" });
    setEditExecId(null);
    setEditExecForm({});
  }, [editingItemId, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- 선택/항목 등장 시에만 초기화

  // 집행내역 CRUD로 item.executed가 바뀌면 입력란도 맞춰 둔다.
  useEffect(() => {
    if (!item) return;
    setForm((p) => (p.executed === String(item.executed) ? p : { ...p, executed: String(item.executed) }));
  }, [item?.executed]); // eslint-disable-line react-hooks/exhaustive-deps

  const draftAdjusted = parseNumber(form.adjusted);
  const draftExecuted = parseNumber(form.executed);

  const handleSave = () => {
    if (!item) return;
    onUpdate(item.id, {
      group: form.group, name: form.name,
      unitPrice: parseNumber(form.unitPrice),
      qty1: parseNumber(form.qty1, 1), qty2: parseNumber(form.qty2, 1), qty3: parseNumber(form.qty3, 1),
      adjusted: draftAdjusted,
      executed: Math.max(0, draftExecuted),
      calc: form.calc,
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

  const handleAddExecution = () => {
    if (!item) return;
    const amount = parseNumber(execForm.amount);
    if (amount <= 0) return;
    onAddExecution({
      courseId: course.id,
      itemId: item.id,
      date: execForm.date || today,
      amount,
      vendor: execForm.vendor.trim() || "-",
      proofNo: execForm.proofNo.trim() || "-",
      memo: execForm.memo.trim() || "-",
    });
    setExecForm({ date: today, amount: "", vendor: "", proofNo: "", memo: "" });
  };

  const handleEditExecSave = (id: number) => {
    onUpdateExecution(id, {
      date: editExecForm.date,
      amount: parseNumber(String(editExecForm.amount ?? 0)),
      vendor: String(editExecForm.vendor ?? "-"),
      proofNo: String(editExecForm.proofNo ?? "-"),
      memo: String(editExecForm.memo ?? "-"),
    });
    setEditExecId(null);
    setEditExecForm({});
  };

  const f = (key: keyof typeof form, val: string) => setForm((p) => ({ ...p, [key]: val }));
  const ef = (key: keyof typeof execForm, val: string) => setExecForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="rounded-2xl glass-card shadow-glass p-5 print-hide">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">세부 예산 편집기</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">항목 수정 · 집행내역 등록</p>
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
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm">
                선택: <span className="font-bold text-slate-800">{item.name}</span>
                <span className="ml-2 text-[11px] text-slate-400">{item.group}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono tabular-nums">현재 조정금액 {formatWon(item.adjusted)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-[10px] text-slate-400 font-medium">집행액</div>
                <div className="text-sm font-bold font-mono tabular-nums text-amber-700">{formatWon(draftExecuted)}</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-[10px] text-slate-400 font-medium">잔액</div>
                <div className="text-sm font-bold font-mono tabular-nums text-slate-700">{formatWon(draftAdjusted - draftExecuted)}</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-[10px] text-slate-400 font-medium">집행률</div>
                <div className="text-sm font-bold font-mono tabular-nums text-indigo-700">
                  {formatPct(draftAdjusted === 0 ? 0 : draftExecuted / draftAdjusted)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div><label className={labelCls}>예산구분</label><select className={inputCls} value={form.group} onChange={(e) => f("group", e.target.value)}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></div>
            <div><label className={labelCls}>세부항목명</label><input className={inputCls} value={form.name} onChange={(e) => f("name", e.target.value)} /></div>
            <div><label className={labelCls}>단가</label><input className={inputCls} value={form.unitPrice} onChange={(e) => f("unitPrice", e.target.value)} /></div>
            <div><label className={labelCls}>수량1</label><input className={inputCls} value={form.qty1} onChange={(e) => f("qty1", e.target.value)} /></div>
            <div><label className={labelCls}>수량2</label><input className={inputCls} value={form.qty2} onChange={(e) => f("qty2", e.target.value)} /></div>
            <div><label className={labelCls}>수량3</label><input className={inputCls} value={form.qty3} onChange={(e) => f("qty3", e.target.value)} /></div>
            <div><label className={labelCls}>조정금액</label><input className={`${inputCls} font-bold`} value={form.adjusted} onChange={(e) => f("adjusted", e.target.value)} /></div>
            <div>
              <label className={labelCls}>집행액 (합계)</label>
              <input
                className={`${inputCls} font-bold text-amber-800`}
                value={form.executed}
                onChange={(e) => f("executed", e.target.value)}
                placeholder="0"
              />
              {itemExecs.length > 0 && execSum !== draftExecuted && (
                <p className="mt-1 text-[10px] text-amber-600">
                  내역 합계 {formatWon(execSum)}과 다릅니다. 내역 등록 시 자동 반영됩니다.
                </p>
              )}
            </div>
            <div className="xs:col-span-2"><label className={labelCls}>산출근거</label><input className={inputCls} value={form.calc} onChange={(e) => f("calc", e.target.value)} /></div>
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

          {/* ─── 이 항목의 집행내역 ─── */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-xs font-bold text-amber-900">이 항목 집행내역</div>
                <p className="text-[10px] text-amber-700/80 mt-0.5">
                  {itemExecs.length}건 · 합계 {formatWon(execSum)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-white/80 p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-600">집행 등록</div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>일자</label>
                  <input type="date" className={inputCls} value={execForm.date} onChange={(e) => ef("date", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>금액</label>
                  <input className={inputCls} value={execForm.amount} onChange={(e) => ef("amount", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>거래처</label>
                  <input className={inputCls} value={execForm.vendor} onChange={(e) => ef("vendor", e.target.value)} placeholder="거래처명" />
                </div>
                <div>
                  <label className={labelCls}>증빙번호</label>
                  <input className={inputCls} value={execForm.proofNo} onChange={(e) => ef("proofNo", e.target.value)} placeholder="증빙-2026-XXX" />
                </div>
                <div className="xs:col-span-2">
                  <label className={labelCls}>내용 / 비고</label>
                  <input className={inputCls} value={execForm.memo} onChange={(e) => ef("memo", e.target.value)} placeholder="집행 내용 (예: 교재 구입, 강사료 지급)" />
                </div>
              </div>
              <button
                onClick={handleAddExecution}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-all"
              >
                집행 등록
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-amber-100 bg-white">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-amber-50/80 text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="px-2.5 py-2 text-left font-semibold">일자</th>
                    <th className="px-2.5 py-2 text-right font-semibold">금액</th>
                    <th className="px-2.5 py-2 text-left font-semibold">거래처</th>
                    <th className="px-2.5 py-2 text-left font-semibold">증빙</th>
                    <th className="px-2.5 py-2 text-left font-semibold">내용</th>
                    <th className="px-2.5 py-2 text-center font-semibold w-24">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {itemExecs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                        등록된 집행내역이 없습니다. 위에서 일자·금액·내용을 입력해 등록하세요.
                      </td>
                    </tr>
                  )}
                  {itemExecs.map((row) => {
                    const isEditing = editExecId === row.id;
                    return (
                      <tr key={row.id} className="border-t border-slate-50 hover:bg-amber-50/40">
                        <td className="px-2.5 py-2 tabular-nums whitespace-nowrap">
                          {isEditing
                            ? <input type="date" className="rounded border border-slate-200 px-1.5 py-1 text-xs w-[8.5rem]"
                                value={String(editExecForm.date ?? row.date)}
                                onChange={(e) => setEditExecForm((p) => ({ ...p, date: e.target.value }))} />
                            : row.date}
                        </td>
                        <td className="px-2.5 py-2 text-right font-semibold tabular-nums text-amber-800 whitespace-nowrap">
                          {isEditing
                            ? <input className="rounded border border-slate-200 px-1.5 py-1 text-xs w-24 text-right"
                                value={String(editExecForm.amount ?? row.amount)}
                                onChange={(e) => setEditExecForm((p) => ({ ...p, amount: parseNumber(e.target.value) }))} />
                            : formatWon(row.amount)}
                        </td>
                        <td className="px-2.5 py-2 text-slate-700 max-w-[7rem] truncate" title={row.vendor}>
                          {isEditing
                            ? <input className="rounded border border-slate-200 px-1.5 py-1 text-xs w-full min-w-[5rem]"
                                value={String(editExecForm.vendor ?? row.vendor)}
                                onChange={(e) => setEditExecForm((p) => ({ ...p, vendor: e.target.value }))} />
                            : row.vendor}
                        </td>
                        <td className="px-2.5 py-2 text-slate-500 max-w-[6rem] truncate" title={row.proofNo}>
                          {isEditing
                            ? <input className="rounded border border-slate-200 px-1.5 py-1 text-xs w-full min-w-[5rem]"
                                value={String(editExecForm.proofNo ?? row.proofNo)}
                                onChange={(e) => setEditExecForm((p) => ({ ...p, proofNo: e.target.value }))} />
                            : row.proofNo}
                        </td>
                        <td className="px-2.5 py-2 text-slate-700 max-w-[10rem]" title={row.memo}>
                          {isEditing
                            ? <input className="rounded border border-slate-200 px-1.5 py-1 text-xs w-full min-w-[6rem]"
                                value={String(editExecForm.memo ?? row.memo)}
                                onChange={(e) => setEditExecForm((p) => ({ ...p, memo: e.target.value }))} />
                            : <span className="line-clamp-2">{row.memo}</span>}
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => handleEditExecSave(row.id)}
                                className="rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white">저장</button>
                              <button onClick={() => { setEditExecId(null); setEditExecForm({}); }}
                                className="rounded border border-slate-200 px-2 py-1 text-[10px]">취소</button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => {
                                  setEditExecId(row.id);
                                  setEditExecForm({
                                    date: row.date, amount: row.amount,
                                    vendor: row.vendor, proofNo: row.proofNo, memo: row.memo,
                                  });
                                }}
                                className="rounded border border-slate-200 px-2 py-1 text-[10px] hover:bg-slate-50"
                              >
                                수정
                              </button>
                              <button onClick={() => onDeleteExecution(row.id)}
                                className="rounded border border-rose-200 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-50">
                                삭제
                              </button>
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
