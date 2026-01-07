
// IMPORTANT: For Vite applications, environment variables must begin with VITE_
// We use (import.meta as any).env to avoid TypeScript errors when vite types are not loaded.

// 簡化環境變數存取
const env = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || "",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

/**
 * Check if the Firebase configuration is complete.
 * This prevents the app from hanging when cloud features are triggered without keys.
 */
export const isFirebaseConfigured = () => {
  const essentialKeys = ['apiKey', 'projectId', 'appId'];
  const missingKeys = essentialKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    // 增加詳細的除錯訊息，幫助使用者確認環境變數是否有讀取到
    // 這些訊息會顯示在瀏覽器的 Console (按 F12 -> Console 分頁)
    console.group('Firebase Configuration Error');
    console.warn(`[設定檢查] 缺少必要的金鑰: ${missingKeys.join(', ')}`);
    console.log('目前環境變數讀取狀態:', {
        apiKey: firebaseConfig.apiKey ? '✅ 已設定' : '❌ 未讀取到 (MISSING)',
        projectId: firebaseConfig.projectId ? '✅ 已設定' : '❌ 未讀取到 (MISSING)',
        appId: firebaseConfig.appId ? '✅ 已設定' : '❌ 未讀取到 (MISSING)',
        // 提醒：如果是 Vercel，修改變數後必須 Redeploy 才會生效
    });
    console.log('提示：如果您已在 Vercel 設定變數但看到此訊息，請務必執行「Redeploy」以更新網站。');
    console.groupEnd();
    return false;
  }
  return true;
};
