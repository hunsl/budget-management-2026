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

  useEffect(() => setDraft(name), [name]);

  const cancel = () => {
    setDraft(name);
    setEditing(false);
  };

  const save = () => {
    const nextName = draft.trim();
    if (!nextName) return;
    onSave(nextName);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") cancel();
          }}
          className="min-w-[220px] rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-lg font-extrabold text-slate-900 outline-none ring-2 ring-indigo-100"
        />
        <button type="button" onClick={save} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
          저장
        </button>
        <button type="button" onClick={cancel} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h2 className="truncate text-lg font-extrabold text-slate-900 md:text-xl font-display">{name}</h2>
        <button type="button" onClick={() => setEditing(true)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600">
          ✎ 과정명 수정
        </button>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{category}</span>
        <span>담당: {manager}</span>
      </div>
    </div>
  );
}
