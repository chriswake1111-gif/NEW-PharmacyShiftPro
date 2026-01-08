
import React, { useState } from 'react';
import { Cloud, Upload, Download, X, AlertCircle, CheckCircle, Settings, ExternalLink } from 'lucide-react';
import { saveToCloud, loadFromCloud, CloudBackupData } from '../services/cloudService';
import { isFirebaseConfigured } from '../firebaseConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  getDataToSave: () => CloudBackupData;
  onDataLoaded: (data: CloudBackupData) => void;
}

// Helper to wrap promise with a timeout
const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);
};

export const CloudSyncModal: React.FC<Props> = ({ isOpen, onClose, getDataToSave, onDataLoaded }) => {
  const [syncId, setSyncId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'menu' | 'upload' | 'download'>('menu');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfigured = isFirebaseConfigured();

  const handleUpload = async () => {
    if (!syncId) {
      setStatus('error');
      setMessage('請輸入同步代碼');
      return;
    }

    setStatus('loading');
    setMessage('正在上傳資料...');
    setErrorDetail(null);
    
    try {
      const data = getDataToSave();
      await withTimeout(saveToCloud(syncId, data), 20000, "連線逾時");
      
      setStatus('success');
      setMessage('上傳成功！資料已同步至雲端。');
      setTimeout(() => {
         setStatus('idle');
         setMessage('');
         setMode('menu');
      }, 2000);
    } catch (e: any) {
      console.error("Upload Error Details:", e);
      setStatus('error');
      
      // 根據具體錯誤代碼給予引導
      if (e.message.includes('permission-denied')) {
        setMessage('存取遭拒：請檢查 Firebase 規則。');
        setErrorDetail('請至 Firebase -> Firestore -> Rules 將規則設為 allow read, write: if true;');
      } else if (e.message.includes('連線逾時')) {
        setMessage('上傳逾時：雲端資料庫可能未建立。');
        setErrorDetail('請至 Firebase 點選「Firestore Database」並點擊「建立資料庫」。');
      } else {
        setMessage(e.message || '上傳失敗，請檢查網路。');
      }
    }
  };

  const handleDownload = async () => {
    if (!syncId) {
      setStatus('error');
      setMessage('請輸入同步代碼');
      return;
    }

    setStatus('loading');
    setMessage('正在下載資料...');
    setErrorDetail(null);
    
    try {
      const data = await withTimeout(loadFromCloud(syncId), 20000, "連線逾時");
      
      if (data) {
        onDataLoaded(data);
        setStatus('success');
        setMessage('下載成功！資料已更新。');
        setTimeout(() => {
           onClose();
           setStatus('idle');
           setMessage('');
           setMode('menu');
        }, 1500);
      } else {
        setStatus('error');
        setMessage('找不到此代碼的資料。');
        setErrorDetail('請確認代碼是否輸入正確，或該代碼尚未有資料上傳。');
      }
    } catch (e: any) {
      console.error("Download Error Details:", e);
      setStatus('error');
      setMessage(e.message || '下載失敗');
    }
  };

  const renderContent = () => {
    if (!isConfigured) {
       return (
         <div className="text-center py-10 px-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
               <Settings size={32} className="animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">雲端功能尚未啟動</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
               偵測到 Firebase 設定不完整。請先在 Vercel 環境變數中填入金鑰。
            </p>
            <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">我了解了</button>
         </div>
       );
    }

    if (mode === 'menu') {
       return (
          <div className="space-y-4 py-2">
             <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm mb-4">
                <p className="flex items-start gap-2">
                   <AlertCircle size={16} className="shrink-0 mt-0.5" />
                   <span>輸入<strong>相同的代碼</strong>即可跨裝置同步。</span>
                </p>
             </div>
             
             <div className="space-y-2">
               <label className="block text-sm font-bold text-gray-700">同步代碼 (Sync ID)</label>
               <input 
                 type="text" 
                 value={syncId}
                 onChange={(e) => setSyncId(e.target.value)}
                 placeholder="例如: pharmacy-01"
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-mono shadow-inner"
               />
             </div>

             <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => setMode('upload')} className="flex flex-col items-center justify-center p-4 border-2 border-brand-100 bg-white rounded-xl hover:border-brand-500 transition-all shadow-sm">
                   <Upload size={20} className="text-brand-600 mb-2" />
                   <span className="font-bold text-gray-800">上傳資料</span>
                </button>
                <button onClick={() => setMode('download')} className="flex flex-col items-center justify-center p-4 border-2 border-purple-100 bg-white rounded-xl hover:border-purple-500 transition-all shadow-sm">
                   <Download size={20} className="text-purple-600 mb-2" />
                   <span className="font-bold text-gray-800">下載資料</span>
                </button>
             </div>
          </div>
       );
    }

    const isUpload = mode === 'upload';
    return (
       <div className="py-2 text-center animate-fade-in-up">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isUpload ? 'bg-brand-100 text-brand-600' : 'bg-purple-100 text-purple-600'}`}>
             {isUpload ? <Upload size={32} /> : <Download size={32} />}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">確定要{isUpload ? '上傳' : '下載'}嗎？</h3>
          
          {status === 'loading' && (
             <div className="flex justify-center items-center gap-2 text-brand-600 font-bold mb-4 bg-brand-50 py-3 rounded-xl">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-brand-600 border-t-transparent"></span>
                {message}
             </div>
          )}

          {status === 'error' && (
             <div className="mb-4">
               <div className="text-red-500 bg-red-50 p-3 rounded-xl text-sm flex items-center justify-center gap-2 border border-red-100">
                  <AlertCircle size={16} /> {message}
               </div>
               {errorDetail && (
                 <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200 leading-relaxed">
                   <strong>排除建議：</strong> {errorDetail}
                   <a href="https://console.firebase.google.com/" target="_blank" className="block mt-1 text-brand-600 font-bold flex items-center justify-center gap-1">
                     前往 Firebase 控制台 <ExternalLink size={10} />
                   </a>
                 </div>
               )}
             </div>
          )}
          
          {status === 'success' && (
             <div className="text-green-600 bg-green-50 p-3 rounded-xl text-sm mb-4 flex items-center justify-center gap-2 border border-green-100">
                <CheckCircle size={16} /> {message}
             </div>
          )}

          <div className="flex gap-3 justify-center">
             <button onClick={() => { setMode('menu'); setStatus('idle'); setErrorDetail(null); }} disabled={status === 'loading'} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">取消</button>
             <button onClick={isUpload ? handleUpload : handleDownload} disabled={status === 'loading' || status === 'success'} className={`px-6 py-2 text-white rounded-lg font-bold ${isUpload ? 'bg-brand-600' : 'bg-purple-600'}`}>確認執行</button>
          </div>
       </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col animate-fade-in-up overflow-hidden">
        <div className="bg-gray-900 px-6 py-5 flex justify-between items-center text-white">
           <div className="flex items-center gap-3"><Cloud size={18} /><h2 className="text-lg font-bold">雲端同步</h2></div>
           <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-8">{renderContent()}</div>
      </div>
    </div>
  );
};
