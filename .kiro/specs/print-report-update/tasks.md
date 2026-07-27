# Implementation Plan: print-report-update

## Overview

두 가지 변경을 구현한다: (1) 과정 11, 12, 13의 카테고리를 "미지정"에서 "공모과정"으로 확정하고 관련 UI 정리, (2) AnalysisReport의 하드코딩된 검토 포인트를 동적 생성 함수로 교체.

## Tasks

- [ ] 1. 미지정과정 카테고리 변경 및 사이드바 정리
  - [x] 1.1 courses.ts에서 과정 11, 12, 13의 category를 "공모과정"으로 변경
    - `src/data/courses.ts`에서 course11, course12, course13의 `category: "미지정"`을 `category: "공모과정"`으로 수정
    - _Requirements: 2.1_
  - [-] 1.2 App.tsx에 "공모과정" 카테고리 색상 매핑 추가 및 isUnset 로직 제거
    - `CATEGORY_COLOR`에 `"공모과정": "bg-pink-50 text-pink-700 ring-pink-200"` 추가
    - `CATEGORY_DOT`에 `"공모과정": "bg-pink-500"` 추가
    - 사이드바 과정 목록에서 `const isUnset = course.category === "미지정";` 변수 및 `isUnset ? "italic opacity-60" : ""` 조건부 클래스 제거
    - _Requirements: 1.1, 1.2, 1.3, 2.3_

- [ ] 2. Checkpoint - 미지정과정 변경 확인
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. 중점 검토 포인트 동적 생성 구현
  - [ ] 3.1 ReviewPoint 타입을 src/types/index.ts에 추가
    - `export type ReviewPoint = { text: string; };` 타입 정의 추가
    - _Requirements: 4.1_
  - [ ] 3.2 generateReviewPoints 함수를 src/store/utils.ts에 구현
    - `generateReviewPoints(courses: Course[], totalBudget: number): ReviewPoint[]` 함수 작성
    - 증액 과정 검토, 저집행 항목 검토, 미배분 잔액 검토, 기준성 항목 증액 검토 로직 포함
    - 빈 배열 시 기본 "특이사항 없음" 포인트 반환
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 3.3 generateReviewPoints에 대한 property test 작성
    - **Property 1: 증액 과정 존재 시 검토 포인트 포함**
    - **Property 2: 저집행 과정 존재 시 검토 포인트 포함**
    - **Property 3: 미배분 잔액 존재 시 검토 포인트 포함**
    - fast-check 라이브러리 사용, 최소 100회 반복
    - **Validates: Requirements 4.3, 4.4, 4.5**
  - [ ] 3.4 AnalysisReport.tsx에서 하드코딩된 검토 포인트를 동적 생성으로 교체
    - `generateReviewPoints` import 추가
    - 하드코딩된 `<ul>` 블록(3개 `<li>`)을 `generateReviewPoints(courses, 278_500_000)` 호출 결과로 교체
    - `reviewPoints.map()`으로 동적 렌더링
    - _Requirements: 4.1, 4.2, 5.1_

- [ ] 4. 인쇄 CSS 확인 및 최종 검증
  - [ ] 4.1 인쇄 시 검토 포인트 영역이 정상 출력되는지 확인
    - `src/index.css`의 `@media print` 규칙에서 검토 포인트 영역이 숨겨지지 않는지 확인
    - 필요 시 `print-color-adjust: exact` 또는 `-webkit-print-color-adjust: exact` 추가
    - _Requirements: 3.1, 5.1, 5.2_

- [ ] 5. Final checkpoint - 전체 빌드 및 동작 확인
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 변경 대상 파일: `src/data/courses.ts`, `src/App.tsx`, `src/types/index.ts`, `src/store/utils.ts`, `src/components/report/AnalysisReport.tsx`
- TOTAL_BUDGET 상수(278_500_000)는 App.tsx에 이미 정의되어 있으므로 AnalysisReport에서 직접 사용하거나 prop으로 전달
- Property tests validate universal correctness properties from the design document
