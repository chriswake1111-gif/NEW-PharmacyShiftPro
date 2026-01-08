
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Timestamp, Firestore, enableNetwork } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from '../firebaseConfig';
import { StoreSchedule, Employee, ShiftDefinition } from '../types';

let db: Firestore | null = null;
let app: FirebaseApp | null = null;

/**
 * 安全地初始化 Firebase
 */
const initFirebase = () => {
  if (db) return db; 

  if (isFirebaseConfigured()) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
      console.log("%c Firebase 資料庫實例已準備就緒 ", "color: #0284c7; font-weight: bold;");
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
    throw new Error("Firebase 未正確配置，請檢查 Vercel 環境變數。");
  }

  const cleanSyncId = syncId.trim();
  if (!cleanSyncId) {
    throw new Error("同步代碼不能為空");
  }

  try {
    // 喚醒網路連線，防止冷啟動導致的逾時
    await enableNetwork(database);
    
    const docRef = doc(database, "schedules", cleanSyncId);
    console.log(`正在上傳至: schedules/${cleanSyncId}`);
    
    await setDoc(docRef, {
      ...data,
      serverTimestamp: Timestamp.now()
    });
    
    console.log("雲端同步成功！");
  } catch (error: any) {
    console.error("Cloud Save Detailed Error:", error);
    
    // 針對 Firebase 特有錯誤提供白話文提示
    if (error.code === 'permission-denied') {
      throw new Error("權限不足：請在 Firebase 的 Rules 頁面將規則改為 allow read, write: if true; 並點擊「發佈」。");
    } else if (error.code === 'unavailable') {
      throw new Error("雲端連線失敗，請檢查您的網路或 Firebase 專案 ID 是否正確。");
    } else if (error.message && error.message.includes('not-found')) {
      throw new Error("資料庫實例不存在，請確認已在 Firebase 點擊「建立資料庫」。");
    }
    
    throw new Error(`上傳失敗: ${error.message || '請確認 Firestore 已啟用'}`);
  }
};

/**
 * 從雲端下載資料
 */
export const loadFromCloud = async (syncId: string): Promise<CloudBackupData | null> => {
  const database = initFirebase();
  if (!database) {
    throw new Error("Firebase 未正確配置。");
  }

  const cleanSyncId = syncId.trim();
  try {
    await enableNetwork(database);
    const docRef = doc(database, "schedules", cleanSyncId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as CloudBackupData;
    }
    return null;
  } catch (error: any) {
    console.error("Cloud Load Error:", error);
    throw new Error(`下載失敗: ${error.message}`);
  }
};
