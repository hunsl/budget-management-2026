/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Pretendard Variable"', 'Pretendard', '"Noto Sans KR"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Segoe UI"', 'sans-serif'],
        display: ['Inter', '"Pretendard Variable"', '"Noto Sans KR"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-card': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 50%, rgba(49,46,129,0.85) 100%)',
        'mesh-1': 'radial-gradient(at 40% 20%, rgba(99,102,241,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(16,185,129,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(244,114,182,0.05) 0px, transparent 50%)',
        'mesh-2': 'radial-gradient(at 0% 0%, rgba(99,102,241,0.12) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(16,185,129,0.08) 0px, transparent 50%)',
        'sidebar-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
        'header-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #312e81 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)',
        'btn-primary': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'btn-accent': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'progress-bar': 'linear-gradient(90deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.15)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'toast-in': 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'save-flash': 'save-flash 1.5s ease-out',
        'fade-up': 'fade-up 0.25s ease-out',
        'badge-pulse': 'badge-pulse 2s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-in': 'overlay-in 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
};
