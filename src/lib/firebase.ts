import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "../firebaseConfig";

export const firebaseConfigured = firebaseConfig.apiKey !== "REPLACE_ME";

const app = initializeApp(firebaseConfig);

// 오프라인에서도 마지막으로 받은 데이터를 볼 수 있도록 로컬 캐시(IndexedDB)를 활성화한다.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth = getAuth(app);
