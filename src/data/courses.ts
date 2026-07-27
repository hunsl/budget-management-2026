import type { Course } from "../types";

// ─── 공통 운영비 (id: 0) ──────────────────────────────────────
const commonCourse: Course = {
  id: 0,
  name: "공통 운영(과정 외 운영비)",
  manager: "총괄",
  category: "공통 운영",
  items: [
    { id: "c0-1", group: "사무관리비", name: "교육과정 홍보물 제작", calc: "21,450,000 × 1", unitPrice: 21450000, qty1: 1, original: 21450000, adjusted: 21450000, executed: 0 },
    { id: "c0-2", group: "사무관리비", name: "SNS·문자 홍보", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c0-3", group: "행사운영비", name: "직종설명회 운영", calc: "5,500,000 × 1", unitPrice: 5500000, qty1: 1, original: 5500000, adjusted: 5500000, executed: 0 },
    { id: "c0-4", group: "회의비", name: "강사 간담회", calc: "800,000 × 1", unitPrice: 800000, qty1: 1, original: 800000, adjusted: 800000, executed: 0 },
    { id: "c0-5", group: "교육훈련비", name: "심화교육 특강 강사료", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c0-6", group: "교육훈련비", name: "직종설명회 특강 강사료", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c0-7", group: "교육훈련비", name: "학습동아리 운영(공통)", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c0-8", group: "행사실비보상금", name: "개강/수료식 다과", calc: "1,500,000 × 1", unitPrice: 1500000, qty1: 1, original: 1500000, adjusted: 1500000, executed: 0 },
  ],
};

// ─── 과정 1: 행정회계 사무 OA (1기) ──────────────────────────
const course1: Course = {
  id: 1,
  name: "행정회계 사무 OA(1기)",
  manager: "담당자",
  category: "사무분야",
  items: [
    { id: "c1-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c1-2", group: "사무관리비", name: "교재비", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c1-3", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c1-4", group: "공공운영비", name: "우편발송료", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c1-5", group: "교육훈련비", name: "강사수당", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c1-6", group: "교육훈련비", name: "취업대비특강", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c1-7", group: "교육훈련비", name: "생성형AI 특강", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c1-8", group: "교육훈련비", name: "사후관리특강", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c1-9", group: "교육훈련비", name: "학습동아리", calc: "700,000 × 1", unitPrice: 700000, qty1: 1, original: 700000, adjusted: 700000, executed: 0 },
    { id: "c1-10", group: "교육훈련비", name: "훈련지원금", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
  ],
};

// ─── 과정 2: 행정회계 사무 OA (2기) ──────────────────────────
const course2: Course = {
  id: 2,
  name: "행정회계 사무 OA(2기)",
  manager: "담당자",
  category: "사무분야",
  items: [
    { id: "c2-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c2-2", group: "사무관리비", name: "교재비", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c2-3", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c2-4", group: "공공운영비", name: "우편발송료", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c2-5", group: "교육훈련비", name: "강사수당", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c2-6", group: "교육훈련비", name: "취업대비특강", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c2-7", group: "교육훈련비", name: "생성형AI 특강", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c2-8", group: "교육훈련비", name: "사후관리특강", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c2-9", group: "교육훈련비", name: "학습동아리", calc: "700,000 × 1", unitPrice: 700000, qty1: 1, original: 700000, adjusted: 700000, executed: 0 },
    { id: "c2-10", group: "교육훈련비", name: "훈련지원금", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
  ],
};

// ─── 과정 3: HACCP 전문인력 양성 ─────────────────────────────
const course3: Course = {
  id: 3,
  name: "HACCP 전문인력 양성",
  manager: "담당자",
  category: "식품분야",
  items: [
    { id: "c3-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c3-2", group: "사무관리비", name: "교재비", calc: "1,953,000 × 1", unitPrice: 1953000, qty1: 1, original: 1953000, adjusted: 1953000, executed: 0 },
    { id: "c3-3", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c3-4", group: "사무관리비", name: "실습용역", calc: "10,062,000 × 1", unitPrice: 10062000, qty1: 1, original: 10062000, adjusted: 10062000, executed: 0 },
    { id: "c3-5", group: "공공운영비", name: "우편발송료", calc: "30,000 × 1", unitPrice: 30000, qty1: 1, original: 30000, adjusted: 30000, executed: 0 },
    { id: "c3-6", group: "교육훈련비", name: "강사수당", calc: "15,840,000 × 1", unitPrice: 15840000, qty1: 1, original: 15840000, adjusted: 15840000, executed: 0 },
    { id: "c3-7", group: "교육훈련비", name: "실험보조", calc: "2,800,000 × 1", unitPrice: 2800000, qty1: 1, original: 2800000, adjusted: 2800000, executed: 0 },
    { id: "c3-8", group: "교육훈련비", name: "AI 특강", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c3-9", group: "교육훈련비", name: "학습동아리", calc: "700,000 × 1", unitPrice: 700000, qty1: 1, original: 700000, adjusted: 700000, executed: 0 },
    { id: "c3-10", group: "교육훈련비", name: "훈련지원금", calc: "1,000,000 × 1", unitPrice: 1000000, qty1: 1, original: 1000000, adjusted: 1000000, executed: 0 },
  ],
};

// ─── 과정 4: ERP·지게차 물류관리 실무자 양성 ─────────────────
const course4: Course = {
  id: 4,
  name: "ERP·지게차 물류관리 실무자 양성",
  manager: "담당자",
  category: "지역연계·기여형",
  items: [
    { id: "c4-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c4-2", group: "사무관리비", name: "교육장 임차", calc: "9,980,000 × 1", unitPrice: 9980000, qty1: 1, original: 9980000, adjusted: 9980000, executed: 0 },
    { id: "c4-3", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c4-4", group: "교육훈련비", name: "강사수당(지게차)", calc: "6,630,000 × 1", unitPrice: 6630000, qty1: 1, original: 6630000, adjusted: 6630000, executed: 0 },
    { id: "c4-5", group: "교육훈련비", name: "ERP강사", calc: "4,680,000 × 1", unitPrice: 4680000, qty1: 1, original: 4680000, adjusted: 4680000, executed: 0 },
    { id: "c4-6", group: "교육훈련비", name: "취업/안전 특강", calc: "800,000 × 1", unitPrice: 800000, qty1: 1, original: 800000, adjusted: 800000, executed: 0 },
    { id: "c4-7", group: "교육훈련비", name: "훈련지원금", calc: "750,000 × 1", unitPrice: 750000, qty1: 1, original: 750000, adjusted: 750000, executed: 0 },
  ],
};

// ─── 과정 5: 승강기 전문가 양성 ──────────────────────────────
const course5: Course = {
  id: 5,
  name: "승강기 전문가 양성",
  manager: "담당자",
  category: "지역연계·기여형",
  items: [
    { id: "c5-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c5-2", group: "사무관리비", name: "버스임차", calc: "2,000,000 × 1", unitPrice: 2000000, qty1: 1, original: 2000000, adjusted: 2000000, executed: 0 },
    { id: "c5-3", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c5-4", group: "공공운영비", name: "보험료", calc: "850,000 × 1", unitPrice: 850000, qty1: 1, original: 850000, adjusted: 850000, executed: 0 },
    { id: "c5-5", group: "교육훈련비", name: "교육운영비", calc: "3,800,000 × 1", unitPrice: 3800000, qty1: 1, original: 3800000, adjusted: 3800000, executed: 0 },
    { id: "c5-6", group: "교육훈련비", name: "실습비", calc: "6,000,000 × 1", unitPrice: 6000000, qty1: 1, original: 6000000, adjusted: 6000000, executed: 0 },
  ],
};

// ─── 과정 6: 초등 피지컬 코딩강사 양성 ───────────────────────
const course6: Course = {
  id: 6,
  name: "초등 피지컬 코딩강사 양성",
  manager: "담당자",
  category: "강사양성형",
  items: [
    { id: "c6-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c6-2", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c6-3", group: "사무관리비", name: "소모품비", calc: "60,000 × 1", unitPrice: 60000, qty1: 1, original: 60000, adjusted: 60000, executed: 0 },
    { id: "c6-4", group: "사무관리비", name: "재료비", calc: "3,000,000 × 1", unitPrice: 3000000, qty1: 1, original: 3000000, adjusted: 3000000, executed: 0 },
    { id: "c6-5", group: "사무관리비", name: "교재비", calc: "1,200,000 × 1", unitPrice: 1200000, qty1: 1, original: 1200000, adjusted: 1200000, executed: 0 },
    { id: "c6-6", group: "공공운영비", name: "우편발송료", calc: "100,000 × 1", unitPrice: 100000, qty1: 1, original: 100000, adjusted: 100000, executed: 0 },
    { id: "c6-7", group: "교육훈련비", name: "강사수당", calc: "6,000,000 × 1", unitPrice: 6000000, qty1: 1, original: 6000000, adjusted: 6000000, executed: 0 },
    { id: "c6-8", group: "교육훈련비", name: "취업특강", calc: "1,200,000 × 1", unitPrice: 1200000, qty1: 1, original: 1200000, adjusted: 1200000, executed: 0 },
    { id: "c6-9", group: "교육훈련비", name: "학습동아리", calc: "700,000 × 1", unitPrice: 700000, qty1: 1, original: 700000, adjusted: 700000, executed: 0 },
  ],
};

// ─── 과정 7: AI 딥러닝 전문강사 양성 ─────────────────────────
const course7: Course = {
  id: 7,
  name: "AI 딥러닝 전문강사 양성",
  manager: "담당자",
  category: "강사양성형",
  items: [
    { id: "c7-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c7-2", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c7-3", group: "사무관리비", name: "소모품비", calc: "60,000 × 1", unitPrice: 60000, qty1: 1, original: 60000, adjusted: 60000, executed: 0 },
    { id: "c7-4", group: "사무관리비", name: "재료비", calc: "3,000,000 × 1", unitPrice: 3000000, qty1: 1, original: 3000000, adjusted: 3000000, executed: 0 },
    { id: "c7-5", group: "사무관리비", name: "교재비", calc: "500,000 × 1", unitPrice: 500000, qty1: 1, original: 500000, adjusted: 500000, executed: 0 },
    { id: "c7-6", group: "공공운영비", name: "우편발송료", calc: "100,000 × 1", unitPrice: 100000, qty1: 1, original: 100000, adjusted: 100000, executed: 0 },
    { id: "c7-7", group: "교육훈련비", name: "강사수당", calc: "13,800,000 × 1", unitPrice: 13800000, qty1: 1, original: 13800000, adjusted: 13800000, executed: 0 },
    { id: "c7-8", group: "교육훈련비", name: "보조강사", calc: "2,000,000 × 1", unitPrice: 2000000, qty1: 1, original: 2000000, adjusted: 2000000, executed: 0 },
    { id: "c7-9", group: "교육훈련비", name: "특강", calc: "1,200,000 × 1", unitPrice: 1200000, qty1: 1, original: 1200000, adjusted: 1200000, executed: 0 },
    { id: "c7-10", group: "교육훈련비", name: "학습동아리", calc: "700,000 × 1", unitPrice: 700000, qty1: 1, original: 700000, adjusted: 700000, executed: 0 },
  ],
};

// ─── 과정 8: 늘봄학교 창의융합교육 강사 양성 ─────────────────
const course8: Course = {
  id: 8,
  name: "늘봄학교 창의융합교육 강사 양성",
  manager: "담당자",
  category: "강사양성형",
  items: [
    { id: "c8-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c8-2", group: "사무관리비", name: "교재/재료비", calc: "1,365,000 × 1", unitPrice: 1365000, qty1: 1, original: 1365000, adjusted: 1365000, executed: 0 },
    { id: "c8-3", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c8-4", group: "교육훈련비", name: "강사수당", calc: "8,320,000 × 1", unitPrice: 8320000, qty1: 1, original: 8320000, adjusted: 8320000, executed: 0 },
    { id: "c8-5", group: "교육훈련비", name: "특강", calc: "1,200,000 × 1", unitPrice: 1200000, qty1: 1, original: 1200000, adjusted: 1200000, executed: 0 },
    { id: "c8-6", group: "교육훈련비", name: "학습동아리", calc: "700,000 × 1", unitPrice: 700000, qty1: 1, original: 700000, adjusted: 700000, executed: 0 },
    { id: "c8-7", group: "교육훈련비", name: "훈련지원금", calc: "1,000,000 × 1", unitPrice: 1000000, qty1: 1, original: 1000000, adjusted: 1000000, executed: 0 },
  ],
};

// ─── 과정 9: 중장년 기회강사 양성 ────────────────────────────
const course9: Course = {
  id: 9,
  name: "중장년 기회강사 양성",
  manager: "담당자",
  category: "지역연계·기여형",
  items: [
    { id: "c9-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c9-2", group: "사무관리비", name: "교재", calc: "165,000 × 1", unitPrice: 165000, qty1: 1, original: 165000, adjusted: 165000, executed: 0 },
    { id: "c9-3", group: "사무관리비", name: "프로필 제작", calc: "1,050,000 × 1", unitPrice: 1050000, qty1: 1, original: 1050000, adjusted: 1050000, executed: 0 },
    { id: "c9-4", group: "사무관리비", name: "소개책자", calc: "4,200,000 × 1", unitPrice: 4200000, qty1: 1, original: 4200000, adjusted: 4200000, executed: 0 },
    { id: "c9-5", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c9-6", group: "교육훈련비", name: "강사료", calc: "9,960,000 × 1", unitPrice: 9960000, qty1: 1, original: 9960000, adjusted: 9960000, executed: 0 },
    { id: "c9-7", group: "교육훈련비", name: "특강지원", calc: "1,875,000 × 1", unitPrice: 1875000, qty1: 1, original: 1875000, adjusted: 1875000, executed: 0 },
    { id: "c9-8", group: "교육훈련비", name: "훈련수당", calc: "750,000 × 1", unitPrice: 750000, qty1: 1, original: 750000, adjusted: 750000, executed: 0 },
  ],
};

// ─── 과정 10: AI시대의 캐릭터 크리에이터 양성 ────────────────
const course10: Course = {
  id: 10,
  name: "AI시대의 캐릭터 크리에이터 양성",
  manager: "담당자",
  category: "IT·디지털분야",
  items: [
    { id: "c10-1", group: "사무관리비", name: "심사수당", calc: "400,000 × 1", unitPrice: 400000, qty1: 1, original: 400000, adjusted: 400000, executed: 0 },
    { id: "c10-2", group: "사무관리비", name: "플랫폼 이용료", calc: "200,000 × 1", unitPrice: 200000, qty1: 1, original: 200000, adjusted: 200000, executed: 0 },
    { id: "c10-3", group: "사무관리비", name: "모집홍보비", calc: "1,650,000 × 1", unitPrice: 1650000, qty1: 1, original: 1650000, adjusted: 1650000, executed: 0 },
    { id: "c10-4", group: "공공운영비", name: "우편발송료", calc: "100,000 × 1", unitPrice: 100000, qty1: 1, original: 100000, adjusted: 100000, executed: 0 },
    { id: "c10-5", group: "교육훈련비", name: "강사수당", calc: "8,000,000 × 1", unitPrice: 8000000, qty1: 1, original: 8000000, adjusted: 8000000, executed: 0 },
    { id: "c10-6", group: "교육훈련비", name: "특강", calc: "1,200,000 × 1", unitPrice: 1200000, qty1: 1, original: 1200000, adjusted: 1200000, executed: 0 },
  ],
};

// ─── 과정 11: 미지정 공모과정 (정원 20, A) ────────────────────
const course11: Course = {
  id: 11,
  name: "미지정 공모과정(정원 20, A)",
  manager: "담당자",
  category: "공모과정",
  items: [
    { id: "c11-1", group: "사무관리비", name: "심사수당", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c11-2", group: "사무관리비", name: "모집홍보비", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c11-3", group: "교육훈련비", name: "강사수당", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c11-4", group: "교육훈련비", name: "훈련지원금", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
  ],
};

// ─── 과정 12: 미지정 공모과정 (정원 20, B) ────────────────────
const course12: Course = {
  id: 12,
  name: "미지정 공모과정(정원 20, B)",
  manager: "담당자",
  category: "공모과정",
  items: [
    { id: "c12-1", group: "사무관리비", name: "심사수당", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c12-2", group: "사무관리비", name: "모집홍보비", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c12-3", group: "교육훈련비", name: "강사수당", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c12-4", group: "교육훈련비", name: "훈련지원금", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
  ],
};

// ─── 과정 13: 미지정 공모과정 (정원 15) ──────────────────────
const course13: Course = {
  id: 13,
  name: "미지정 공모과정(정원 15)",
  manager: "담당자",
  category: "공모과정",
  items: [
    { id: "c13-1", group: "사무관리비", name: "심사수당", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c13-2", group: "사무관리비", name: "모집홍보비", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c13-3", group: "교육훈련비", name: "강사수당", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
    { id: "c13-4", group: "교육훈련비", name: "훈련지원금", calc: "1식", unitPrice: 0, qty1: 1, original: 0, adjusted: 0, executed: 0 },
  ],
};

// ─── 전체 과정 목록 export ────────────────────────────────────
export const initialCourses: Course[] = [
  commonCourse,
  course1, course2, course3, course4, course5, course6, course7,
  course8, course9, course10, course11, course12, course13,
];
