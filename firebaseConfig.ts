/**
 * Firebase 設定檔
 * 說明：在 Vite 環境下，客戶端環境變數必須以 VITE_ 開頭。
 * 這些變數會在開發環境讀取 .env 檔案，並在建置時被替換為實際數值。
 */

// 修正：透過類型斷言存取 Vite 的環境變數，解決因缺乏 'vite/client' 類型定義而導致的 'ImportMeta' 屬性缺失錯誤
const env = (import.meta as any).env || {};

export const firebaseConfig = {
  // 直接讀取 Vite 的環境變數，編譯時會被替換為實際數值
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || "",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ""
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
