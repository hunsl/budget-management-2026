type Tone = "default" | "dark" | "amber" | "emerald" | "rose";

const toneMap: Record<Tone, string> = {
  default: "bg-white/90 backdrop-blur-sm ring-slate-200/60 text-slate-900",
  dark: "bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 ring-slate-800 text-white shadow-inner-light",
  amber: "bg-gradient-to-br from-amber-50 to-orange-50 ring-amber-200/60 text-amber-900",
  emerald: "bg-gradient-to-br from-emerald-50 to-teal-50 ring-emerald-200/60 text-emerald-900",
  rose: "bg-gradient-to-br from-rose-50 to-pink-50 ring-rose-200/60 text-rose-900",
};

export function StatCard({
  title, value, sub, tone = "default",
}: {
  title: string; value: string; sub: string; tone?: Tone;
}) {
  return (
    <div className={`rounded-xl p-4 ring-1 transition-all duration-200 hover-lift ${toneMap[tone]}`}>
      <div className={`text-[11px] font-medium uppercase tracking-wider ${tone === "dark" ? "text-slate-400" : "text-slate-500"}`}>{title}</div>
      <div className="mt-2 text-xl font-extrabold truncate font-mono">{value}</div>
      <div className={`mt-1 text-[11px] truncate ${tone === "dark" ? "text-slate-400" : "text-slate-500"}`}>{sub}</div>
    </div>
  );
}
