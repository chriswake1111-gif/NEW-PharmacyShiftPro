
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Timestamp, Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from '../firebaseConfig';
import { StoreSchedule, Employee, ShiftDefinition } from '../types';

let db: Firestore | null = null;

// Initialize Firebase safely
if (isFirebaseConfigured()) {
  try {
    // Prevent multiple initializations to avoid React Hot Refresh issues
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

export interface CloudBackupData {
  employeesMap: Record<string, Employee[]>;
  shiftDefs: Record<string, ShiftDefinition>;
  data: Record<string, StoreSchedule>;
  lastUpdated: string;
  version: number;
}

export const saveToCloud = async (syncId: string, data: CloudBackupData): Promise<void> => {
  if (!db) {
    throw new Error("Firebase 尚未初始化，請檢查 firebaseConfig.ts 設定是否正確");
  }
  if (!syncId.trim()) {
    throw new Error("請輸入同步代碼");
  }

  try {
    const docRef = doc(db, "schedules", syncId);
    await setDoc(docRef, {
      ...data,
      serverTimestamp: Timestamp.now()
    });
  } catch (error: any) {
    console.error("Cloud Save Error:", error);
    if (error.code === 'permission-denied') {
      throw new Error("權限不足：請檢查 Firebase Firestore 的 Security Rules 是否已設為測試模式。");
    }
    throw new Error("上傳失敗：" + (error.message || "未知錯誤"));
  }
};

export const loadFromCloud = async (syncId: string): Promise<CloudBackupData | null> => {
  if (!db) {
    throw new Error("Firebase 尚未初始化，請檢查 firebaseConfig.ts 設定是否正確");
  }
  if (!syncId.trim()) {
    throw new Error("請輸入同步代碼");
  }

  try {
    const docRef = doc(db, "schedules", syncId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as CloudBackupData;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error("Cloud Load Error:", error);
    if (error.code === 'permission-denied') {
      throw new Error("權限不足：請檢查 Firebase Firestore 的 Security Rules。");
    }
    throw new Error("下載失敗：" + (error.message || "未知錯誤"));
  }
};
