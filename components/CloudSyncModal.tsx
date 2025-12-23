
import React, { useState } from 'react';
import { Cloud, Upload, Download, X, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import { saveToCloud, loadFromCloud, CloudBackupData } from '../services/cloudService';
import { isFirebaseConfigured } from '../firebaseConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  getDataToSave: () => CloudBackupData;
  onDataLoaded: (data: CloudBackupData) => void;
}

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
      await saveToCloud(syncId, data);
      setStatus('success');
      setMessage('上傳成功！資料已同步至雲端。');
      setTimeout(() => {
         setStatus('idle');
         setMessage('');
         setMode('menu');
      }, 2000);
    } catch (e: any) {
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
      const data = await loadFromCloud(syncId);
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
      setStatus('error');
      setMessage(e.message || '下載失敗');
    }
  };

  const renderContent = () => {
    if (!isConfigured) {
       return (
         <div className="text-center py-6">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-left text-sm">
               <h4 className="font-bold flex items-center gap-2 mb-2">
                 <AlertCircle size={16} /> 未設定 Firebase
               </h4>
               <p>請開啟專案中的 <code>firebaseConfig.ts</code> 檔案，並填入您的 Firebase 專案設定。</p>
            </div>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700">關閉</button>
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
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-mono"
               />
             </div>

             <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={() => setMode('upload')}
                  disabled={!syncId}
                  className="flex flex-col items-center justify-center p-4 border-2 border-brand-100 bg-white rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
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
                  className="flex flex-col items-center justify-center p-4 border-2 border-purple-100 bg-white rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
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
       <div className="py-2 text-center">
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
             <div className="flex justify-center items-center gap-2 text-brand-600 font-bold mb-4">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-brand-600 border-t-transparent"></span>
                {message}
             </div>
          )}

          {status === 'error' && (
             <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm mb-4 flex items-center justify-center gap-2">
                <AlertCircle size={16} /> {message}
             </div>
          )}
          
          {status === 'success' && (
             <div className="text-green-600 bg-green-50 p-3 rounded-lg text-sm mb-4 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> {message}
             </div>
          )}

          <div className="flex gap-3 justify-center">
             <button 
                onClick={() => { setMode('menu'); setStatus('idle'); setMessage(''); }}
                disabled={status === 'loading'}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
             >
                取消
             </button>
             <button 
                onClick={isUpload ? handleUpload : handleDownload}
                disabled={status === 'loading' || status === 'success'}
                className={`px-6 py-2 text-white rounded-lg font-bold shadow-md transition-all disabled:opacity-50
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
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-fade-in-up overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white">
           <h2 className="text-lg font-bold flex items-center gap-2">
              <Cloud size={20} /> 雲端資料同步
           </h2>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
           </button>
        </div>
        
        <div className="p-6">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};
