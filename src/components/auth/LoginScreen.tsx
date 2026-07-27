import { useState, type FormEvent } from "react";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
};

function friendlyError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "auth/too-many-requests":
      return "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";
    default:
      return "로그인 중 문제가 발생했습니다. 다시 시도해주세요.";
  }
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full min-h-screen bg-mesh-1 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl glass-card shadow-glass ring-1 ring-white/60 p-8">
        <div className="text-center mb-6">
          <div className="text-[11px] text-indigo-500/80 font-semibold uppercase tracking-[0.15em]">2026 경기북부 직업교육훈련</div>
          <div className="text-xl font-extrabold tracking-tight mt-1 text-slate-900 font-display">예산관리 시스템</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">이메일</label>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="name@gjf.or.kr"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">비밀번호</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 text-rose-600 text-xs px-3 py-2.5 ring-1 ring-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 text-white text-sm font-semibold py-2.5 mt-2 shadow-lg shadow-slate-900/25 hover:opacity-90 transition-all disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-5">
          계정이 없다면 관리자에게 문의해주세요.
        </p>
      </div>
    </div>
  );
}
