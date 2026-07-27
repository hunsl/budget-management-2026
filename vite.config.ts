import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 프로젝트 페이지(username.github.io/저장소명/)로 배포하므로
// 저장소 이름과 동일한 base 경로가 필요합니다. 저장소 이름을 바꿨다면 이 값도 함께 바꿔주세요.
const BASE_PATH = "/budget-management-2026/";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? BASE_PATH : "/",
});
