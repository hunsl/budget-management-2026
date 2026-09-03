import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, writeBatch } from "firebase/firestore";
import { firebaseConfig } from "../src/firebaseConfig";
import { savedBudget20260722 } from "../src/data/savedBudget";

const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;
if (!email || !password) throw new Error("SEED_EMAIL, SEED_PASSWORD 환경변수를 지정해주세요.");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, email, password);
const batch = writeBatch(db);
savedBudget20260722.courses.forEach((item) => batch.set(doc(db, "courses", String(item.id)), item));
savedBudget20260722.executions.forEach((item) => batch.set(doc(db, "executions", String(item.id)), item));
savedBudget20260722.logs.forEach((item) => batch.set(doc(db, "logs", item.id), item));
await batch.commit();
console.log(`완료: courses ${savedBudget20260722.courses.length}건, executions ${savedBudget20260722.executions.length}건, logs ${savedBudget20260722.logs.length}건 적재`);
