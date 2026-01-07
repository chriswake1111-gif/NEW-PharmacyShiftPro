
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Timestamp, Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from '../firebaseConfig';
import { StoreSchedule, Employee, ShiftDefinition } from '../types';

let db: Firestore | null = null;
let app: FirebaseApp | null = null;

/**
 * 安全地初始化 Firebase
 */
const initFirebase = () => {
  if (db) return db; // 已經初始化過就直接回傳

  if (isFirebaseConfigured()) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
      console.log("%c Firebase 資料庫連線成功 ", "color: #4caf50; font-weight: bold;");
      return db;
    } catch (e) {
      console.error("Firebase 初始化失敗:", e);
      return null;
    }
  }
  return null;
};

export interface CloudBackupData {
  employeesMap: Record<string, Employee[]>;
  shiftDefs: Record<string, ShiftDefinition>;
  data: Record<string, StoreSchedule>;
  lastUpdated: string;
  version: number;
}

/**
 * 上傳資料到雲端
 */
export const saveToCloud = async (syncId: string, data: CloudBackupData): Promise<void> => {
  const database = initFirebase();
  if (!database) {
    throw new Error("雲端模組未啟動。請確認網站設定中的 API Key。");
  }

  if (!syncId.trim()) {
    throw new Error("同步代碼不能為空");
  }

  try {
    const docRef = doc(database, "schedules", syncId);
    await setDoc(docRef, {
      ...data,
      serverTimestamp: Timestamp.now()
    });
  } catch (error: any) {
    console.error("Cloud Save Error:", error);
    if (error.code === 'permission-denied') {
      throw new Error("資料庫拒絕寫入。請確認 Firebase Firestore 規則是否已開啟（改為 Test Mode）。");
    }
    throw new Error("連線失敗：" + (error.message || "請稍後再試"));
  }
};

/**
 * 從雲端下載資料
 */
export const loadFromCloud = async (syncId: string): Promise<CloudBackupData | null> => {
  const database = initFirebase();
  if (!database) {
    throw new Error("雲端模組未啟動。");
  }

  try {
    const docRef = doc(database, "schedules", syncId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as CloudBackupData;
    }
    return null;
  } catch (error: any) {
    console.error("Cloud Load Error:", error);
    throw new Error("讀取失敗：" + (error.message || "連線異常"));
  }
};
