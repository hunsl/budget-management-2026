# Requirements Document

## Introduction

예산관리 시스템의 인쇄/리포트 기능을 업데이트한다. 두 가지 주요 변경사항이 있다:

1. **미지정과정 확정 반영**: 과정 11, 12, 13은 기존에 "미지정" 카테고리로 이탤릭/흐림 처리되었으나, 이제 확정되었으므로 일반 과정과 동일하게 표시하고 합계에 정상 포함한다.
2. **중점 검토 포인트 갱신**: AnalysisReport.tsx의 "중점 검토 포인트" 섹션이 하드코딩된 구 내용이므로, 현행 예산 데이터 기반으로 동적 생성하거나 최신 내용으로 교체한다.

## Glossary

- **Budget_System**: 2026 경기북부 직업교육훈련 예산관리 React 애플리케이션
- **Sidebar**: 좌측 과정 선택 패널 (과정 목록 표시)
- **AnalysisReport**: 분석 리포트 탭에서 렌더링되는 리포트 컴포넌트
- **Review_Points_Section**: AnalysisReport 내 "중점 검토 포인트" UI 영역
- **Undesignated_Course**: 과정 11, 12, 13 (기존 category="미지정")
- **Print_Output**: window.print()를 통해 생성되는 인쇄 결과물
- **Course_Data**: src/data/courses.ts에 정의된 과정 데이터 배열

## Requirements

### Requirement 1: 미지정과정 사이드바 정상 표시

**User Story:** As a 예산 담당자, I want 미지정과정(11, 12, 13)이 사이드바에서 일반 과정과 동일하게 표시되기를, so that 확정된 과정임을 시각적으로 확인할 수 있다.

#### Acceptance Criteria

1. WHEN Undesignated_Course가 Sidebar에 렌더링될 때, THE Budget_System SHALL 해당 과정명을 이탤릭 스타일 없이 일반 폰트로 표시한다
2. WHEN Undesignated_Course가 Sidebar에 렌더링될 때, THE Budget_System SHALL 해당 과정명을 opacity-60 없이 완전 불투명(opacity 100%)으로 표시한다
3. WHEN Undesignated_Course가 Sidebar에 렌더링될 때, THE Budget_System SHALL 해당 과정의 카테고리 도트 색상을 "미지정"용 bg-slate-300 대신 확정 카테고리에 맞는 색상으로 표시한다

### Requirement 2: 미지정과정 카테고리 변경

**User Story:** As a 예산 담당자, I want 미지정과정의 카테고리가 "미지정"이 아닌 적절한 확정 카테고리로 변경되기를, so that 총괄표와 그룹 요약에서 정확한 분류로 집계된다.

#### Acceptance Criteria

1. THE Course_Data SHALL 과정 11, 12, 13의 category 값을 "미지정"이 아닌 확정된 카테고리 문자열로 설정한다
2. WHEN 총괄 대시보드가 렌더링될 때, THE Budget_System SHALL 과정 11, 12, 13을 해당 확정 카테고리 그룹에 포함하여 집계한다
3. WHEN 카테고리 배지가 렌더링될 때, THE Budget_System SHALL 과정 11, 12, 13에 확정 카테고리에 해당하는 색상 배지를 표시한다

### Requirement 3: 인쇄 출력에서 미지정과정 정상 포함

**User Story:** As a 예산 담당자, I want 인쇄 출력물에서 미지정과정이 일반 과정과 동일하게 표시되기를, so that 인쇄된 보고서에서 모든 확정 과정이 동등하게 취급된다.

#### Acceptance Criteria

1. WHEN Print_Output이 생성될 때, THE Budget_System SHALL 과정 11, 12, 13을 일반 과정과 동일한 서식(폰트 스타일, 불투명도)으로 인쇄한다
2. WHEN Print_Output의 총괄표가 생성될 때, THE Budget_System SHALL 과정 11, 12, 13의 예산 금액을 전체 합계에 포함한다
3. WHEN Print_Output의 인쇄 헤더가 생성될 때, THE Budget_System SHALL 과정 합산 금액에 과정 11, 12, 13의 조정예산을 포함한다

### Requirement 4: 중점 검토 포인트 동적 생성

**User Story:** As a 예산 담당자, I want 중점 검토 포인트가 현재 예산 데이터를 기반으로 동적으로 생성되기를, so that 항상 최신 상황에 맞는 검토 포인트를 확인할 수 있다.

#### Acceptance Criteria

1. WHEN AnalysisReport가 렌더링될 때, THE Review_Points_Section SHALL 현재 과정 데이터를 분석하여 검토 포인트를 동적으로 생성한다
2. THE Review_Points_Section SHALL 하드코딩된 정적 텍스트 대신 데이터 기반 검토 항목을 표시한다
3. WHEN 증액 과정이 존재할 때, THE Review_Points_Section SHALL 증액 규모가 큰 과정에 대한 검토 포인트를 포함한다
4. WHEN 저집행 항목이 존재할 때, THE Review_Points_Section SHALL 저집행률 항목에 대한 검토 포인트를 포함한다
5. WHEN 미배분 잔액이 존재할 때, THE Review_Points_Section SHALL 잔여 예산 배분에 대한 검토 포인트를 포함한다

### Requirement 5: 중점 검토 포인트 인쇄 반영

**User Story:** As a 예산 담당자, I want 인쇄 출력물에서도 동적 생성된 검토 포인트가 정상 출력되기를, so that 인쇄된 리포트에 최신 검토 사항이 반영된다.

#### Acceptance Criteria

1. WHEN 분석 리포트 탭이 인쇄될 때, THE Print_Output SHALL Review_Points_Section의 동적 생성된 검토 포인트를 가독성 있게 출력한다
2. WHEN 분석 리포트 탭이 인쇄될 때, THE Print_Output SHALL 검토 포인트 영역의 배경색과 텍스트를 인쇄에 적합한 흑백 대비로 렌더링한다
