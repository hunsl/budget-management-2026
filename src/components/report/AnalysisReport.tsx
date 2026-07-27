import type { Course, CourseTotals, ReportType, WarningItem } from "../../types";
import { StatCard } from "../shared/StatCard";
import { WarningPanel } from "../shared/WarningPanel";
import { formatWon, formatPct, courseTotals, toItemDetailed } from "../../store/utils";

type Props = {
  courses: Course[];
  summary: CourseTotals;
  selectedCourse: Course;
  reportType: ReportType;
  warnings: WarningItem[];
  onReportTypeChange: (t: ReportType) => void;
};

export function AnalysisReport({ courses, summary, selectedCourse, reportType, warnings, onReportTypeChange }: Props) {
  const selectedTotals = courseTotals(selectedCourse);
  const overBudget = courses.filter((c) => {
    const t = courseTotals(c);
    return t.adjusted > t.original;
  });

  const topVariance = courses
    .flatMap((c) => c.items.filter((i) => !i.isDeleted).map((i) => ({
      course: c.name, name: i.name, variance: i.adjusted - i.original,
    })))
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 5);

  const reportText: Record<ReportType, string> = {
    summary: `전체 조정예산은 계획예산 대비 ${summary.variance >= 0 ? "+" : ""}${formatWon(summary.variance)} 변동되었습니다. 현재 집행률은 ${formatPct(summary.executionRate)}이며, 공통 운영비와 일부 과정에서 증액 검토가 확인됩니다.`,
    selected: `${selectedCourse.name}의 조정예산은 ${formatWon(selectedTotals.adjusted)}이며, 집행률은 ${formatPct(selectedTotals.executionRate)}입니다. ${selectedTotals.variance > 0 ? "증액 항목의 사유 검토가 필요합니다." : "감액 조정 항목의 적정성을 확인하면 됩니다."}`,
    risk: `현재 경고는 ${warnings.length}건입니다. 기준성 항목, 저집행 항목, 증액 과정은 총괄 검토 시 별도 코멘트가 필요합니다.`,
    common: `공통 운영비 조정예산은 ${formatWon(courseTotals(courses[0]).adjusted)}이며, 집행률은 ${formatPct(courseTotals(courses[0]).executionRate)}입니다. 홍보비·특강비 등 기준성 항목의 집행 진도를 점검하세요.`,
  };

  const detailedItems = toItemDetailed(selectedCourse);
  const lowExec = detailedItems.filter((i) => i.executionRate < 0.3);
  const increased = detailedItems.filter((i) => i.variance > 0);

  return (
    <div className="rounded-2xl glass-card shadow-glass p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">분석 리포트</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">예산 조정 방향과 검토 포인트 자동 요약</p>
        </div>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          value={reportType} onChange={(e) => onReportTypeChange(e.target.value as ReportType)}>
          <option value="summary">전체 요약</option>
          <option value="selected">선택 과정</option>
          <option value="risk">리스크 중심</option>
          <option value="common">공통 운영비</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-slate-800">자동 생성 코멘트</span>
            </div>
            <div className="text-sm leading-7 text-slate-600">{reportText[reportType]}</div>
          </div>

          {reportType === "risk" && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">검증 경고 목록</div>
              <WarningPanel warnings={warnings.slice(0, 8)} />
            </div>
          )}

          {reportType === "selected" && (
            <div className="space-y-3">
              {increased.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="text-xs font-bold text-amber-800 mb-2">증액 항목 ({increased.length}건)</div>
                  <ul className="space-y-1 text-sm text-amber-700">
                    {increased.map((i) => (
                      <li key={i.id} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-amber-400" />
                        {i.name}: <span className="font-semibold tabular-nums">+{formatWon(i.variance)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {lowExec.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="text-xs font-bold text-slate-700 mb-2">저집행 항목 ({lowExec.length}건)</div>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {lowExec.map((i) => (
                      <li key={i.id} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                        {i.name}: <span className="font-semibold tabular-nums">{formatPct(i.executionRate)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">⚡</span>
              <span className="text-xs font-bold text-amber-800">중점 검토 포인트</span>
            </div>
            <ul className="space-y-2 text-sm leading-6 text-amber-800">
              <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-amber-400 mt-2.5 flex-shrink-0" />공통 운영 예산과 과정 직접비를 분리 관리하되 총괄표는 통합 반영</li>
              <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-amber-400 mt-2.5 flex-shrink-0" />증액 항목은 기준 변경인지 물량 변경인지 사유 구분 필요</li>
              <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-amber-400 mt-2.5 flex-shrink-0" />훈련지원금, 홍보비, 특강비 등 기준성 항목은 내부 기준과 정합성 재확인</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold text-slate-800">핵심 지표</div>
              <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">자동 생성</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard title="증액 과정" value={`${overBudget.length}개`} sub="공통 운영 포함" tone="amber" />
              <StatCard title="최대 변동 항목" value={topVariance[0]?.name ?? "-"} sub={topVariance[0]?.course ?? "-"} />
              <StatCard title="전체 잔액" value={formatWon(summary.remaining)} sub="집행 가능 재원" tone="emerald" />
              <StatCard title="선택 과정 집행률" value={formatPct(selectedTotals.executionRate)} sub={selectedCourse.name} tone="dark" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <div className="text-xs font-bold text-slate-800 mb-4">주요 조정 항목 TOP 5</div>
            <div className="space-y-3">
              {topVariance.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
                    <div>
                      <span className="text-xs font-medium text-slate-800">{item.name}</span>
                      <span className="ml-2 text-[10px] text-slate-400">{item.course}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${item.variance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {item.variance >= 0 ? "+" : ""}{formatWon(item.variance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
