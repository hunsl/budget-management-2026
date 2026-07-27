/**
 * Firestore에 기존 예산 데이터를 최초 1회 적재하는 스크립트.
 *
 * 사전 준비:
 *   1. Firebase 콘솔에서 Authentication > Users에 최소 1개 이메일/비밀번호 계정을 만든다.
 *   2. src/firebaseConfig.ts에 실제 프로젝트 설정값을 채운다.
 *
 * 실행:
 *   SEED_EMAIL=you@gjf.or.kr SEED_PASSWORD=your-password npm run seed
 *
 * 이 스크립트는 Firebase 클라이언트 SDK로 로그인 후 courses/executions/logs
 * 컬렉션을 채우므로, 서비스 계정 키 같은 비밀 파일이 전혀 필요 없다.
 */
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, writeBatch } from "firebase/firestore";
import { firebaseConfig } from "../src/firebaseConfig";
import { savedBudget20260722 } from "../src/data/savedBudget";

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    console.error("SEED_EMAIL, SEED_PASSWORD 환경변수를 지정해주세요.");
    process.exit(1);
  }
  if (firebaseConfig.apiKey === "REPLACE_ME") {
    console.error("src/firebaseConfig.ts에 실제 Firebase 설정값을 먼저 채워주세요.");
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, email, password);
  console.log(`로그인 성공: ${email}`);

  const { courses, executions, logs } = savedBudget20260722;
  const batch = writeBatch(db);
  courses.forEach((c) => batch.set(doc(db, "courses", String(c.id)), c));
  executions.forEach((e) => batch.set(doc(db, "executions", String(e.id)), e));
  logs.forEach((l) => batch.set(doc(db, "logs", l.id), l));
  await batch.commit();

  console.log(`완료: courses ${courses.length}건, executions ${executions.length}건, logs ${logs.length}건 적재`);
  process.exit(0);
}

main().catch((err) => {
  console.error("시드 작업 실패:", err);
  process.exit(1);
});
