
import React, { useState } from 'react';
import { Cloud, Upload, Download, X, AlertCircle, CheckCircle, Settings } from 'lucide-react';
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
    try {
      const data = getDataToSave();
      await withTimeout(saveToCloud(syncId, data), 10000, "上傳逾時，請檢查網路連線或 Firebase 金鑰設定。");
      
      setStatus('success');
      setMessage('上傳成功！資料已同步至雲端。');
      setTimeout(() => {
         setStatus('idle');
         setMessage('');
         setMode('menu');
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setMessage(e.message || '上傳失敗');
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
    try {
      const data = await withTimeout(loadFromCloud(syncId), 10000, "下載逾時，請確認同步代碼正確且網路通暢。");
      
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
        setMessage('找不到此代碼的資料，請確認代碼是否正確。');
      }
    } catch (e: any) {
      console.error(e);
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
               偵測到 Firebase 設定不完整。請先在專案根目錄的 <code>.env</code> 檔案中填入您的金鑰資訊。
            </p>
            <div className="flex flex-col gap-3">
               <button 
                  onClick={onClose} 
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
               >
                  我了解了
               </button>
               <a 
                  href="https://console.firebase.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-600 text-sm font-medium hover:underline"
               >
                  前往 Firebase 控制台 →
               </a>
            </div>
         </div>
       );
    }

    if (mode === 'menu') {
       return (
          <div className="space-y-4 py-2">
             <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm mb-4">
                <p className="flex items-start gap-2">
                   <AlertCircle size={16} className="shrink-0 mt-0.5" />
                   <span>請在不同裝置輸入<strong>相同的「同步代碼」</strong>即可共用資料。代碼就像是這份排班表的密碼，請自行設定並記住它。</span>
                </p>
             </div>
             
             <div className="space-y-2">
               <label className="block text-sm font-bold text-gray-700">同步代碼 (Sync ID)</label>
               <input 
                 type="text" 
                 value={syncId}
                 onChange={(e) => setSyncId(e.target.value)}
                 placeholder="例如: store-taichung-888"
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-mono shadow-inner"
               />
             </div>

             <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={() => setMode('upload')}
                  disabled={!syncId}
                  className="flex flex-col items-center justify-center p-4 border-2 border-brand-100 bg-white rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                >
                   <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mb-2 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <Upload size={20} />
                   </div>
                   <span className="font-bold text-gray-800">上傳資料</span>
                   <span className="text-xs text-gray-500 mt-1">覆蓋雲端存檔</span>
                </button>

                <button 
                  onClick={() => setMode('download')}
                  disabled={!syncId}
                  className="flex flex-col items-center justify-center p-4 border-2 border-purple-100 bg-white rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                >
                   <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Download size={20} />
                   </div>
                   <span className="font-bold text-gray-800">下載資料</span>
                   <span className="text-xs text-gray-500 mt-1">還原至此裝置</span>
                </button>
             </div>
          </div>
       );
    }

    // Confirmation Screens
    const isUpload = mode === 'upload';
    return (
       <div className="py-2 text-center animate-fade-in-up">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isUpload ? 'bg-brand-100 text-brand-600' : 'bg-purple-100 text-purple-600'}`}>
             {isUpload ? <Upload size={32} /> : <Download size={32} />}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
             確定要{isUpload ? '上傳' : '下載'}嗎？
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
             {isUpload 
                ? '這將會覆蓋雲端上目前的備份資料。' 
                : '這將會覆蓋您目前瀏覽器上的所有資料，且無法復原。'}
          </p>

          {status === 'loading' && (
             <div className="flex justify-center items-center gap-2 text-brand-600 font-bold mb-4 bg-brand-50 py-2 rounded-lg">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-brand-600 border-t-transparent"></span>
                {message}
             </div>
          )}

          {status === 'error' && (
             <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm mb-4 flex items-center justify-center gap-2 border border-red-100">
                <AlertCircle size={16} /> {message}
             </div>
          )}
          
          {status === 'success' && (
             <div className="text-green-600 bg-green-50 p-3 rounded-lg text-sm mb-4 flex items-center justify-center gap-2 border border-green-100">
                <CheckCircle size={16} /> {message}
             </div>
          )}

          <div className="flex gap-3 justify-center">
             <button 
                onClick={() => { setMode('menu'); setStatus('idle'); setMessage(''); }}
                disabled={status === 'loading'}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50 transition-colors"
             >
                取消
             </button>
             <button 
                onClick={isUpload ? handleUpload : handleDownload}
                disabled={status === 'loading' || status === 'success'}
                className={`px-6 py-2 text-white rounded-lg font-bold shadow-md transition-all disabled:opacity-50 active:scale-95
                   ${isUpload ? 'bg-brand-600 hover:bg-brand-700' : 'bg-purple-600 hover:bg-purple-700'}
                `}
             >
                確認{isUpload ? '上傳' : '下載'}
             </button>
          </div>
       </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center backdrop-blur-md p-4 transition-all">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col animate-fade-in-up overflow-hidden ring-1 ring-black/5">
        <div className="bg-gray-900 px-6 py-5 flex justify-between items-center text-white">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <Cloud size={18} />
              </div>
              <h2 className="text-lg font-bold tracking-tight">雲端資料同步</h2>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
              <X size={24} />
           </button>
        </div>
        
        <div className="p-8">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};
