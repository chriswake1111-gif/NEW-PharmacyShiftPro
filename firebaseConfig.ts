// 修正：在 Vite 專案中，TypeScript 需要此類型定義參考才能辨識 import.meta.env 屬性
/// <reference types="vite/client" />

/**
 * Firebase 設定檔
 * 說明：在 Vite 環境下，客戶端環境變數必須以 VITE_ 開頭。
 * 這些變數會在開發環境讀取 .env 檔案，並在建置時被替換為實際數值。
 */

export const firebaseConfig = {
  // 直接讀取 Vite 的環境變數，編譯時會被替換為實際數值
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

/**
 * 檢查 Firebase 設定是否完整
 */
export const isFirebaseConfigured = (): boolean => {
  // 檢查最關鍵的三個金鑰，確保雲端功能可以正常運作
  const hasApiKey = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "";
  const hasProjectId = !!firebaseConfig.projectId && firebaseConfig.projectId !== "";
  const hasAppId = !!firebaseConfig.appId && firebaseConfig.appId !== "";

  if (!hasApiKey || !hasProjectId || !hasAppId) {
    // 輸出詳細的偵錯表格，方便開發者確認是哪一個環節出錯
    console.group('%c 🔥 Firebase 設定診斷 ', 'background: #f44336; color: #fff; padding: 2px 4px; border-radius: 4px;');
    console.table({
      'VITE_FIREBASE_API_KEY': hasApiKey ? '✅ 已載入' : '❌ 缺失 (或是名稱不正確)',
      'VITE_FIREBASE_PROJECT_ID': hasProjectId ? '✅ 已載入' : '❌ 缺失',
      'VITE_FIREBASE_APP_ID': hasAppId ? '✅ 已載入' : '❌ 缺失'
    });
    console.warn('提示：請確認 Vercel 環境變數名稱是否帶有 "VITE_" 前綴，且設定後有執行 "Redeploy"。');
    console.groupEnd();
    return false;
  }
  return true;
};