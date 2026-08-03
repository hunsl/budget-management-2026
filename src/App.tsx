import { useReducer, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { budgetReducer, initialState } from "./store/budgetReducer";
import { courseTotals, formatWon, formatPct, buildWarnings } from "./store/utils";
import { downloadOverallCSV, downloadCourseCSV, downloadExecutionCSV } from "./store/download";
import { matchesSavedBudgetCourses, savedBudget20260722 } from "./data/savedBudget";
import { useToast } from "./components/shared/Toast";
import {
  downloadBudgetBackup,
  loadPersistedState,
  parseBudgetBackup,
  savePersistedData,
  usePersistence,
} from "./hooks/usePersistence";
import { firebaseConfigured } from "./lib/firebase";
import { useAuth } from "./hooks/useAuth";
import { useFirestoreSync } from "./hooks/useFirestoreSync";
import { LoginScreen } from "./components/auth/LoginScreen";

import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { OverallTable } from "./components/dashboard/OverallTable";
import { GroupSummary } from "./components/dashboard/GroupSummary";
import { CourseReviewTable } from "./components/course/CourseReviewTable";
import { CourseNameEditor } from "./components/course/CourseNameEditor";
import { ItemEditor } from "./components/course/ItemEditor";
import { ExecutionManager } from "./components/execution/ExecutionManager";
import { AnalysisReport } from "./components/report/AnalysisReport";
import { LogPanel } from "./components/shared/LogPanel";

type Tab = "dashboard" | "review" | "execution" | "report" | "log";

const TOTAL_BUDGET = 278_500_000;
const RESTORE_KEY = "budget-mgmt-2026-restored-from-20260722";
/** 서버/로컬이 비어 데이터가 날아간 경우 1회 강제 복원 (키 변경 시 전원 재복원) */
const FORCE_SEED_KEY = "budget-mgmt-2026-force-seed-20260722-v4";

const EXPECTED_COURSE_COUNT = savedBudget20260722.courses.length;

const CATEGORY_COLOR: Record<string, string> = {
  "강사양성형": "bg-violet-50 text-violet-700 ring-violet-200",
  "지역연계·기여형": "bg-blue-50 text-blue-700 ring-blue-200",
  "사무분야": "bg-sky-50 text-sky-700 ring-sky-200",
  "식품분야": "bg-orange-50 text-orange-700 ring-orange-200",
  "IT·디지털분야": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "미지정": "bg-slate-50 text-slate-500 ring-slate-200",
  "공통 운영": "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const CATEGORY_DOT: Record<string, string> = {
  "강사양성형": "bg-violet-500",
  "지역연계·기여형": "bg-blue-500",
  "사무분야": "bg-sky-500",
  "식품분야": "bg-orange-500",
  "IT·디지털분야": "bg-cyan-500",
  "미지정": "bg-slate-300",
  "공통 운영": "bg-emerald-500",
};

function categoryBadge(category: string) {
  const cls = CATEGORY_COLOR[category] ?? "bg-slate-50 text-slate-500 ring-slate-200";
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>{category}</span>;
}

export default function App() {
  // 로그인 필요 여부: Firebase 설정이 안 되어 있으면(로컬 개발 초기 단계) 기존처럼 로그인 없이 동작
  const requireAuth = firebaseConfigured;
  const { user, status: authStatus, login } = useAuth();

  // localStorage에서 복원된 상태로 초기화 (비어 있으면 기본 백업 사용)
  const [state, dispatch] = useReducer(budgetReducer, initialState, (init) => {
    const persisted = loadPersistedState();
    if (!persisted) return init;
    const courses = Array.isArray(persisted.courses) ? persisted.courses : [];
    // 과정이 비었거나 기본 백업보다 현저히 적으면 날아간 캐시로 보고 기본 데이터 사용
    if (courses.length < EXPECTED_COURSE_COUNT) {
      return {
        ...init,
        courses: savedBudget20260722.courses,
        executions: savedBudget20260722.executions,
        logs: savedBudget20260722.logs,
      };
    }
    return { ...init, ...persisted };
  });
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving">("synced");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Firestore 실시간 동기화 (로그인 완료 후에만 활성화)
  const firestoreEnabled = requireAuth && authStatus === "signedIn";
  const { status: firestoreStatus, dispatchSynced } = useFirestoreSync(state, dispatch, firestoreEnabled);

  const restoreSavedBudget = useCallback(() => {
    setIsRestoring(true);
    savePersistedData({
      version: 1,
      savedAt: new Date().toISOString(),
      exportedBy: "system-restore",
      data: {
        courses: savedBudget20260722.courses,
        executions: savedBudget20260722.executions,
        logs: savedBudget20260722.logs,
      },
    });
    return dispatchSynced({
      type: "HYDRATE",
      courses: savedBudget20260722.courses,
      executions: savedBudget20260722.executions,
      logs: savedBudget20260722.logs,
    }).then((ok) => {
      setIsRestoring(false);
      if (!ok) {
        addToast("error", "기본 데이터 복원 저장에 실패했습니다. 상단 '기본데이터 복원'을 다시 눌러주세요.");
        return false;
      }
      localStorage.setItem(FORCE_SEED_KEY, "done");
      localStorage.setItem(RESTORE_KEY, "yes");
      addToast("success", "2026-07-22 기본 예산 데이터로 복원했습니다.");
      return true;
    });
  }, [dispatchSynced, addToast]);

  useEffect(() => {
    if (!user) return;
    const name = user.displayName || user.email?.split("@")[0] || "사용자";
    dispatch({ type: "SET_CURRENT_USER", name });
  }, [user]);

  // 주의: 자동 복원(HYDRATE)은 저장한 데이터를 다시 덮어쓰므로 사용하지 않는다.
  // 복원이 필요할 때만 상단 「기본데이터 복원」 버튼을 누른다.

  // 반응형 감지
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setSidebarOpen(false);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (firebaseConfigured) return; // Firestore가 데이터 원본일 때는 로컬 스냅샷으로 되돌리지 않음
    if (matchesSavedBudgetCourses(state.courses)) return;
    if (localStorage.getItem(RESTORE_KEY) === "yes") return;

    localStorage.setItem(RESTORE_KEY, "yes");
    dispatch({
      type: "HYDRATE",
      courses: savedBudget20260722.courses,
      executions: savedBudget20260722.executions,
      logs: savedBudget20260722.logs,
    });
  }, [state.courses]);

  // localStorage 영속성 + 다른 탭 동기화
  const { lastSavedAt } = usePersistence(state, dispatch, { preferRemote: firebaseConfigured });

  // 저장 상태 표시 (Firebase 미설정 시에는 기존 로컬 저장 타이머 사용)
  useEffect(() => {
    if (firebaseConfigured) return;
    setSyncStatus("saving");
    const timer = setTimeout(() => setSyncStatus("synced"), 800);
    return () => clearTimeout(timer);
  }, [state.courses, state.executions, state.logs]);

  const effectiveSyncStatus: "synced" | "syncing" | "offline" = firebaseConfigured
    ? firestoreStatus
    : syncStatus === "synced" ? "synced" : "syncing";

  const { courses, executions, logs, selectedCourseId, editingItemId, filterMode, sortMode, reportType } = state;

  const programCourses = useMemo(() => courses.filter((c) => c.id !== 0), [courses]);
  const commonCourse = useMemo(() => courses.find((c) => c.id === 0), [courses]);
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? courses[0],
    [courses, selectedCourseId]
  );

  const programSummary = useMemo(() => {
    const totals = programCourses.map((c) => courseTotals(c));
    const adjusted = totals.reduce((s, t) => s + t.adjusted, 0);
    const executed = totals.reduce((s, t) => s + t.executed, 0);
    return { adjusted, executed, remaining: adjusted - executed };
  }, [programCourses]);

  const commonSummary = useMemo(() => {
    if (!commonCourse) return { adjusted: 0, executed: 0 };
    const t = courseTotals(commonCourse);
    return { adjusted: t.adjusted, executed: t.executed };
  }, [commonCourse]);

  const warnings = useMemo(() => buildWarnings(courses), [courses]);

  // Toast 연동 dispatch 래퍼 (Firestore write-through 포함, 실제 저장 성공 여부에 따라 토스트 표시)
  const dispatchWithToast = useCallback(
    (action: Parameters<typeof dispatch>[0]) => {
      dispatchSynced(action).then((ok) => {
        if (!ok) {
          addToast("error", "서버 저장에 실패했습니다. 화면에는 반영됐지만 다른 사람에게는 공유되지 않았어요. 새로고침 후 다시 시도해주세요.");
          return;
        }
        switch (action.type) {
          case "RENAME_COURSE":
            addToast("success", "과정명이 변경되었습니다.");
            break;
          case "UPDATE_ITEM":
            addToast("success", "예산현액이 업데이트되었습니다");
            break;
          case "ADD_ITEM":
            addToast("success", "새 예산 항목이 추가되었습니다");
            break;
          case "DELETE_ITEM":
            addToast("info", "예산 항목이 삭제되었습니다");
            break;
          case "ADD_EXECUTION":
            addToast("success", "집행 내역이 등록되었습니다");
            break;
          case "UPDATE_EXECUTION":
            addToast("success", "집행 내역이 수정되었습니다");
            break;
          case "DELETE_EXECUTION":
            addToast("info", "집행 내역이 삭제되었습니다");
            break;
        }
      });
    },
    [dispatchSynced, addToast],
  );

  const handleExportBackup = useCallback(() => {
    downloadBudgetBackup(state);
    addToast("success", "공유용 백업 파일을 저장했습니다.");
  }, [state, addToast]);

  const handleRestoreSavedBudget = useCallback(() => {
    if (isRestoring) return;
    const ok = window.confirm(
      "2026-07-22 기본 예산 데이터(과정 14개)로 서버 데이터를 덮어쓸까요?\n현재 화면/서버의 과정·집행내역이 기본 백업으로 대체됩니다.",
    );
    if (!ok) return;
    restoreSavedBudget();
  }, [isRestoring, restoreSavedBudget]);

  const handleImportBackup = useCallback((file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = parseBudgetBackup(String(reader.result ?? ""));
        savePersistedData(backup);
        dispatchSynced({
          type: "HYDRATE",
          courses: backup.data.courses,
          executions: backup.data.executions,
          logs: backup.data.logs,
        }).then((ok) => {
          if (firebaseConfigured && !ok) {
            addToast("error", "화면에는 반영됐지만 서버 저장에 실패했습니다. 네트워크/권한을 확인하고 다시 불러와 주세요.");
            return;
          }
          addToast(
            "success",
            firebaseConfigured
              ? "백업 파일을 불러와 모든 사용자에게 반영했습니다."
              : "백업 파일을 불러왔습니다. 현재 상태로 이어서 작업할 수 있습니다.",
          );
        });
      } catch (error) {
        console.error(error);
        addToast("error", "백업 파일을 읽지 못했습니다. JSON 파일을 확인해주세요.");
      } finally {
        if (importInputRef.current) importInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      addToast("error", "파일을 여는 중 문제가 발생했습니다.");
      if (importInputRef.current) importInputRef.current.value = "";
    };
    reader.readAsText(file, "utf-8");
  }, [addToast, dispatchSynced]);

  const totalAllocated = programSummary.adjusted + commonSummary.adjusted;
  const totalExecuted = programSummary.executed + commonSummary.executed;
  const overallExecRate = totalAllocated === 0 ? 0 : totalExecuted / totalAllocated;
  const unallocated = TOTAL_BUDGET - totalAllocated;
  const lastSavedLabel = lastSavedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(lastSavedAt))
    : "이번 세션";

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "총괄 대시보드", icon: "📊" },
    { id: "review", label: "과정별 검토", icon: "📋" },
    { id: "execution", label: "집행내역", icon: "💳" },
    { id: "report", label: "분석 리포트", icon: "📈" },
    { id: "log", label: "수정 이력", icon: "🕓" },
  ];

  if (requireAuth && authStatus === "loading") {
    return (
      <div className="h-full min-h-screen bg-mesh-1 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-sm text-slate-400">불러오는 중...</div>
      </div>
    );
  }

  if (requireAuth && authStatus === "signedOut") {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="h-full bg-mesh-1 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-900 flex flex-col">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => handleImportBackup(e.target.files?.[0])}
      />

      {/* ── 상단 헤더 ── */}
      <header className="relative bg-header-gradient text-white px-4 md:px-6 py-3 md:py-4 shadow-xl shadow-slate-900/10">
        <div className="absolute inset-0 bg-card-shine" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-xl p-2 md:p-2.5 hover:bg-white/10 active:bg-white/20 transition-all duration-200 focus-ring flex-shrink-0"
              title="과정 목록 토글"
              aria-label="사이드바 토글"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <div className="min-w-0">
              <div className="text-[10px] md:text-[11px] text-indigo-300/80 font-semibold uppercase tracking-[0.15em] truncate">2026 경기북부 직업교육훈련</div>
              <div className="text-base md:text-lg font-extrabold tracking-tight mt-0.5 truncate font-display">예산관리 시스템</div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
            {/* 저장/동기화 상태 표시 */}
            <div className="hidden xs:flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                effectiveSyncStatus === "synced" ? "bg-emerald-400"
                : effectiveSyncStatus === "offline" ? "bg-rose-400"
                : "bg-amber-400 animate-pulse"
              }`} />
              <span className="text-[10px] font-medium text-slate-400">
                {effectiveSyncStatus === "synced" ? (firebaseConfigured ? "실시간 동기화됨" : "저장 완료")
                  : effectiveSyncStatus === "offline" ? "오프라인"
                  : "저장 중..."}
              </span>
            </div>
            {requireAuth && user && (
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {state.currentUser}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportBackup}
                className="hidden md:inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-all focus-ring"
                title={`마지막 저장: ${lastSavedLabel}`}
              >
                백업 저장
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="hidden md:inline-flex rounded-xl border border-white/10 bg-slate-950/20 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-all focus-ring"
                title="공유받은 JSON 백업 파일 불러오기"
              >
                백업 불러오기
              </button>
              <button
                onClick={handleRestoreSavedBudget}
                disabled={isRestoring}
                className="rounded-xl border border-amber-300/30 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/30 transition-all focus-ring disabled:opacity-50"
                title="2026-07-22 기본 예산 데이터로 복원"
              >
                {isRestoring ? "복원 중..." : "기본데이터 복원"}
              </button>
            </div>
            {/* 미니 집행률 게이지 */}
            <div className="hidden lg:flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#34d399" strokeWidth="3"
                    strokeDasharray={`${overallExecRate * 94.2} 94.2`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-emerald-300">
                  {(overallExecRate * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">총 집행률</div>
                <div className="text-sm font-semibold text-emerald-300 font-mono">{formatWon(totalExecuted)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">총 사업비</div>
                <div className="text-base md:text-xl font-extrabold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent font-mono">
                  {formatWon(TOTAL_BUDGET)}
                </div>
              </div>
              <div className="hidden md:block w-px h-8 bg-white/20" />
              <div className="text-right hidden md:block">
                <div className="text-[10px] text-slate-400">배분 합계</div>
                <div className="text-sm font-semibold font-mono">{formatWon(totalAllocated)}</div>
              </div>
              <div className="text-right hidden lg:block">
                <div className="text-[10px] text-slate-400">미배분</div>
                <div className={`text-sm font-bold font-mono ${unallocated >= 0 ? "text-sky-300" : "text-rose-400"}`}>
                  {formatWon(unallocated)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── 모바일 오버레이 ── */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 animate-overlay-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── 사이드바 ── */}
        <aside className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 w-72 ${sidebarOpen ? "animate-slide-in-left" : "hidden"}`
            : `${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden`
          }
          bg-sidebar-gradient backdrop-blur-xl border-r border-slate-200/60 flex flex-col shadow-glass md:shadow-none
        `}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">과정 선택</div>
              <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{programCourses.length + (commonCourse ? 1 : 0)}개</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
            {/* 공통운영비 */}
            {commonCourse && (
              <>
                <button
                  onClick={() => { dispatch({ type: "SELECT_COURSE", courseId: 0 }); if (isMobile) setSidebarOpen(false); }}
                  className={`w-full text-left rounded-xl px-3 py-3 transition-all duration-200 group ${
                    selectedCourseId === 0
                      ? "bg-emerald-50 ring-1 ring-emerald-200 shadow-sm"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      selectedCourseId === 0 ? "bg-emerald-500 text-white shadow-sm" : "bg-emerald-100 text-emerald-600"
                    }`}>🏢</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">공통 운영비</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{formatWon(commonSummary.adjusted)}</div>
                    </div>
                  </div>
                </button>
                <div className="mx-3 my-2 border-t border-slate-100" />
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">교육과정 ({programCourses.length})</div>
              </>
            )}

            {/* 13개 과정 */}
            {programCourses.map((course, idx) => {
              const t = courseTotals(course);
              const active = course.id === selectedCourseId;
              const isUnset = course.category === "미지정";
              const execRate = t.adjusted > 0 ? (t.executed / t.adjusted) * 100 : 0;
              const dotColor = CATEGORY_DOT[course.category] ?? "bg-slate-300";
              return (
                <button
                  key={course.id}
                  onClick={() => { dispatch({ type: "SELECT_COURSE", courseId: course.id }); if (isMobile) setSidebarOpen(false); }}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200 group ${
                    active
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? "bg-white/60" : dotColor}`} />
                        <span className={`text-xs font-medium truncate ${isUnset ? "italic opacity-60" : ""}`}>
                          {course.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[11px] ${active ? "text-slate-300" : "text-slate-400"}`}>
                          {t.adjusted > 0 ? formatWon(t.adjusted) : "미입력"}
                        </span>
                        {t.adjusted > 0 && (
                          <div className="flex-1 flex items-center gap-1">
                            <div className={`h-1 rounded-full flex-1 ${active ? "bg-white/10" : "bg-slate-100"}`}>
                              <div className={`h-full rounded-full transition-all ${active ? "bg-emerald-400" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(100, execRate)}%` }} />
                            </div>
                            <span className={`text-[9px] ${active ? "text-slate-400" : "text-slate-400"}`}>
                              {execRate.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 사이드바 하단 요약 */}
          <div className="p-4 border-t border-slate-200/60 bg-gradient-to-t from-slate-100/80 via-slate-50/50 to-transparent">
            <div className="text-[11px] text-slate-500 space-y-1.5">
              <div className="flex justify-between">
                <span>총 사업비</span>
                <span className="font-bold text-slate-800 font-mono">{formatWon(TOTAL_BUDGET)}</span>
              </div>
              <div className="flex justify-between">
                <span>과정 합산</span>
                <span className="font-semibold text-slate-700 font-mono">{formatWon(programSummary.adjusted)}</span>
              </div>
              <div className="flex justify-between">
                <span>공통운영비</span>
                <span className="font-semibold text-slate-700 font-mono">{formatWon(commonSummary.adjusted)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                <span className="font-medium">잔여 배분</span>
                <span className={`font-bold font-mono ${unallocated >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatWon(unallocated)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── 메인 콘텐츠 ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-4 md:p-6 space-y-4 md:space-y-5">

            {/* 현재 선택 과정 + 요약 칩 */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <CourseNameEditor
                  name={selectedCourse.name}
                  category={selectedCourse.category}
                  manager={selectedCourse.manager}
                  onSave={(name) => dispatchWithToast({ type: "RENAME_COURSE", courseId: selectedCourse.id, name })}
                />
              </div>
              <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1 md:pb-0">
                {(() => {
                  const t = courseTotals(selectedCourse);
                  const rate = t.adjusted > 0 ? (t.executed / t.adjusted) * 100 : 0;
                  return (
                    <>
                      <div className="flex items-center gap-1.5 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 px-3 py-1.5 shadow-glass">
                        <span className="text-slate-400 text-xs font-medium">조정</span>
                        <span className="font-bold text-slate-900 text-xs font-mono">{formatWon(t.adjusted)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 px-3 py-1.5 shadow-glass">
                        <span className="text-slate-400 text-xs font-medium">집행</span>
                        <span className="font-bold text-amber-600 text-xs font-mono">{formatWon(t.executed)}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 px-3 py-1.5 shadow-glass">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full progress-gradient transition-all" style={{ width: `${Math.min(100, rate)}%` }} />
                        </div>
                        <span className="font-bold text-slate-900 text-xs font-mono">{formatPct(t.executionRate)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {warnings.some((warning) => warning.level === "critical") && (
              <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2 text-sm">
                  <span aria-hidden="true">⚠️</span>
                  <div>
                    <strong>집행 확인 필요</strong>
                    <p className="mt-0.5 text-xs text-rose-700">집행률이 100% 이상이거나 예산이 없는 항목을 확인해 주세요.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActiveTab("report")} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
                  경고 확인하기
                </button>
              </div>
            )}

            {/* 탭 네비게이션 */}
            <div className="flex items-center gap-0.5 md:gap-1 glass-card rounded-2xl p-1 md:p-1.5 shadow-glass ring-1 ring-white/60 print-hide overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 min-w-0 flex items-center justify-center gap-1.5 md:gap-2 rounded-xl px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 focus-ring ${
                    activeTab === tab.id
                      ? "bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 text-white shadow-lg shadow-slate-900/25"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                  }`}
                >
                  <span className="text-sm md:text-base">{tab.icon}</span>
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                  {tab.id === "log" && logs.length > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600"
                    }`}>{logs.length}</span>
                  )}
                  {tab.id === "report" && warnings.length > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold animate-badge-pulse ${
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600"
                    }`}>{warnings.length}</span>
                  )}
                </button>
              ))}
              <div className="w-px h-6 bg-slate-200 mx-1" />
              <button
                onClick={handleExportBackup}
                className="md:hidden flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
                title={`마지막 저장: ${lastSavedLabel}`}
              >
                저장
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="md:hidden flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
                title="공유받은 JSON 백업 파일 불러오기"
              >
                불러오기
              </button>
              <div className="md:hidden w-px h-6 bg-slate-200 mx-1" />
              <button
                onClick={() => {
                  setIsPrinting(true);
                  requestAnimationFrame(() => {
                    window.print();
                    setIsPrinting(false);
                  });
                }}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                title="현재 탭 인쇄"
              >
                🖨️
              </button>
            </div>

            {/* 인쇄 전용 헤더 — 인쇄 시에만 렌더링 */}
            {isPrinting && (
            <div className="print-header hidden">
              <div style={{ borderBottom: '2pt solid black', paddingBottom: '8pt', marginBottom: '12pt' }}>
                <div style={{ fontSize: '16pt', fontWeight: 'bold', textAlign: 'center' }}>
                  2026 경기북부 직업교육훈련 예산관리
                </div>
                <div style={{ fontSize: '10pt', textAlign: 'center', marginTop: '4pt', color: '#475569' }}>
                  {tabs.find(t => t.id === activeTab)?.label} | {selectedCourse.name} | 출력일: {new Date().toLocaleDateString('ko-KR')}
                </div>
                <div style={{ fontSize: '9pt', textAlign: 'right', marginTop: '4pt', color: '#64748b' }}>
                  총 사업비: {formatWon(TOTAL_BUDGET)} | 과정 합산: {formatWon(programSummary.adjusted)} | 집행액: {formatWon(programSummary.executed)}
                </div>
              </div>
            </div>
            )}

            {/* 탭 콘텐츠 */}
            {activeTab === "dashboard" && (
              <div className="space-y-4 md:space-y-5 animate-fade-up">
                <DashboardHeader
                  totalBudget={TOTAL_BUDGET}
                  programSummary={programSummary}
                  commonSummary={commonSummary}
                  selectedCourse={selectedCourse}
                />
                <div className="grid gap-4 md:gap-5 xl:grid-cols-[1.2fr,0.8fr]">
                  <OverallTable
                    courses={programCourses}
                    commonCourse={commonCourse}
                    totalBudget={TOTAL_BUDGET}
                    selectedCourseId={selectedCourseId}
                    onSelect={(id) => dispatch({ type: "SELECT_COURSE", courseId: id })}
                  />
                  <GroupSummary courses={courses} />
                </div>
                <div className="flex justify-end print-hide">
                  <button
                    onClick={() => downloadOverallCSV(courses)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    📥 총괄현황 CSV 다운로드
                  </button>
                </div>
              </div>
            )}

            {activeTab === "review" && (
              <div className="space-y-4 md:space-y-5 animate-fade-up">
                <CourseReviewTable
                  course={selectedCourse}
                  editingItemId={editingItemId}
                  filterMode={filterMode}
                  sortMode={sortMode}
                  onSelectItem={(id) => dispatch({ type: "SELECT_ITEM", itemId: id })}
                  onFilterChange={(mode) => dispatch({ type: "SET_FILTER", mode })}
                  onSortChange={(mode) => dispatch({ type: "SET_SORT", mode })}
                />
                <ItemEditor
                  course={selectedCourse}
                  editingItemId={editingItemId}
                  executions={executions}
                  logs={logs}
                  onUpdate={(itemId, patch, reason) =>
                    dispatchWithToast({ type: "UPDATE_ITEM", courseId: selectedCourseId, itemId, patch, reason })
                  }
                  onAdd={(item) => dispatchWithToast({ type: "ADD_ITEM", courseId: selectedCourseId, item })}
                  onDelete={(itemId) => dispatchWithToast({ type: "DELETE_ITEM", courseId: selectedCourseId, itemId })}
                  onAddExecution={(row) => dispatchWithToast({ type: "ADD_EXECUTION", row })}
                  onUpdateExecution={(id, patch) => dispatchWithToast({ type: "UPDATE_EXECUTION", id, patch })}
                  onDeleteExecution={(id) => dispatchWithToast({ type: "DELETE_EXECUTION", id })}
                />
                <div className="flex justify-end print-hide">
                  <button
                    onClick={() => downloadCourseCSV(selectedCourse)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    📥 검토표 CSV 다운로드
                  </button>
                </div>
              </div>
            )}

            {activeTab === "execution" && (
              <div className="space-y-4 animate-fade-up">
                <ExecutionManager
                  course={selectedCourse}
                  executions={executions}
                  onAdd={(row) => dispatchWithToast({ type: "ADD_EXECUTION", row })}
                  onUpdate={(id, patch) => dispatchWithToast({ type: "UPDATE_EXECUTION", id, patch })}
                  onDelete={(id) => dispatchWithToast({ type: "DELETE_EXECUTION", id })}
                />
                <div className="flex justify-end print-hide">
                  <button
                    onClick={() => downloadExecutionCSV(selectedCourse, executions)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    📥 집행내역 CSV 다운로드
                  </button>
                </div>
              </div>
            )}

            {activeTab === "report" && (
              <div className="animate-fade-up">
              <AnalysisReport
                courses={courses}
                summary={{ ...programSummary, original: programSummary.adjusted, variance: 0, executionRate: programSummary.adjusted === 0 ? 0 : programSummary.executed / programSummary.adjusted }}
                selectedCourse={selectedCourse}
                reportType={reportType}
                warnings={warnings}
                onReportTypeChange={(t) => dispatch({ type: "SET_REPORT_TYPE", reportType: t })}
              />
              </div>
            )}

            {activeTab === "log" && (
              <div className="rounded-2xl glass-card shadow-glass p-4 md:p-6 animate-fade-up">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">수정 이력</h2>
                    <p className="text-xs text-slate-400 mt-0.5">예산 항목 변경 추적</p>
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1">총 {logs.length}건</span>
                </div>
                <LogPanel logs={logs} courseId={selectedCourseId} />
                {logs.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="text-sm font-semibold text-slate-700 mb-3">전체 이력</div>
                    <LogPanel logs={logs} />
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
