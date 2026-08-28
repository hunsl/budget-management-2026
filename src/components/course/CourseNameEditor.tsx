import { useEffect, useState } from "react";

type Props = {
  name: string;
  category: string;
  manager: string;
  onSave: (name: string) => void;
};

export function CourseNameEditor({ name, category, manager, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  useEffect(() => {
    setDraft(name);
    setEditing(false);
  }, [name]);

  const cancel = () => {
    setDraft(name);
    setEditing(false);
  };

  const save = () => {
    const next = draft.trim();
    if (!next) return;
    onSave(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") cancel();
          }}
          className="min-w-[220px] flex-1 rounded-xl border border-indigo-300 bg-white px-3 py-2 text-base font-bold text-slate-900 shadow-sm outline-none ring-2 ring-indigo-500/10"
          aria-label="과정명"
        />
        <button onClick={save} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">저장</button>
        <button onClick={cancel} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">취소</button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-3">
      <h2 className="max-w-full truncate text-lg font-extrabold text-slate-900 md:text-xl">{name}</h2>
      <button
        onClick={() => setEditing(true)}
        className="print-hide inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-700"
        title="과정명 수정"
      >
        <span aria-hidden="true">✎</span> 과정명 수정
      </button>
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">{category}</span>
      <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 sm:inline-flex">담당: {manager}</span>
    </div>
  );
}
