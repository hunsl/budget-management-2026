import { createContext, useContext, useState, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "info" | "warning";

type ToastMessage = {
  id: number;
  type: ToastType;
  message: string;
  icon: string;
};

type ToastContextValue = {
  addToast: (type: ToastType, message: string) => void;
};

const ICONS: Record<ToastType, string> = {
  success: "✅",
  error: "🚨",
  info: "📋",
  warning: "⚠️",
};

// ─── Context ──────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

// ─── Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id, type, message, icon: ICONS[type] }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer messages={messages} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Toast Container ──────────────────────────────────────────
function ToastContainer({ messages, onRemove }: { messages: ToastMessage[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 pointer-events-none">
      {messages.map((msg) => (
        <ToastItem key={msg.id} msg={msg} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ msg, onRemove }: { msg: ToastMessage; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(msg.id), 3000);
    return () => clearTimeout(timer);
  }, [msg.id, onRemove]);

  const colorMap: Record<ToastType, string> = {
    error: "bg-rose-50 border-rose-200 text-rose-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-glass-lg border backdrop-blur-xl animate-toast-in ${colorMap[msg.type]}`}
      onClick={() => onRemove(msg.id)}
      role="alert"
    >
      <span className="text-base flex-shrink-0">{msg.icon}</span>
      <span className="text-sm font-medium">{msg.message}</span>
    </div>
  );
}
