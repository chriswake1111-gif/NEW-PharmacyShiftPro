
import React, { useState } from 'react';
import { X, MousePointer, MousePointer2, Cloud, AlertCircle, Clock, RotateCcw, FileJson, Upload, Maximize2, GraduationCap, ChevronLeft, ChevronRight, CheckCircle, Trash2, Users, Eye, GripVertical } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PAGES = [
  {
    title: "快速入門",
    icon: <Clock className="text-white" size={20} />,
    content: (
      <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <span className="text-2xl">🚀</span> 開始使用三步驟
          </h3>
          <ol className="space-y-4 text-sm text-gray-600 list-decimal pl-5">
            <li>
              <strong>選擇分店與日期：</strong>
              <p className="mt-1">由左上角選單切換分店（資料各自獨立），並點擊日期欄位設定排班區間（如：2023/10/01 ~ 2023/10/31）。</p>
            </li>
            <li>
              <strong>建立員工名單：</strong>
              <p className="mt-1">點擊上方 <Users size={14} className="inline"/> <strong>員工</strong> 按鈕，新增員工。支援拖曳排序。</p>
            </li>
            <li>
              <strong>開始排班：</strong>
              <p className="mt-1">在格子內點擊滑鼠左鍵，即可選擇班別。</p>
            </li>
          </ol>
          <div className="mt-4 bg-blue-50 p-3 rounded-lg text-blue-800 text-xs leading-relaxed flex gap-2 items-start">
            <span className="text-lg">💡</span>
            <span>系統會自動記憶您最後一次操作的分店與日期，下次開啟時無需重新設定。</span>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "排班操作",
    icon: <MousePointer className="text-white" size={20} />,
    content: (
      <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-6">
          {/* Click */}
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-3 rounded-xl text-gray-600 shrink-0 border border-gray-200">
               <MousePointer size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-base">左鍵單擊：選擇班別</h4>
              <p className="text-sm text-gray-600 mb-2">點擊格子開啟選單，可選擇 A班、P班、D班、休假等。</p>
              <div className="flex gap-2 text-xs">
                <span className="bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                   <Trash2 size={12} /> 清除 (變空白)
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                   <RotateCcw size={12} /> 回復預設 (復原)
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Double Click */}
          <div className="flex items-start gap-4">
            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shrink-0 border border-indigo-100">
               <MousePointer2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-base">左鍵雙擊：進階設定</h4>
              <p className="text-sm text-gray-600 mb-2">針對「已排好」的格子快速點兩下，可設定：</p>
              <ul className="text-sm text-gray-600 space-y-2 pl-2">
                <li className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-700 px-1.5 rounded text-xs font-bold">+1~4</span>
                  <span>設定加班時數</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded text-xs font-bold flex items-center gap-1"><GraduationCap size={12}/> 上課</span>
                  <span>標記為上課 (不計工時)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "檢視與管理",
    icon: <Users className="text-white" size={20} />,
    content: (
      <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
           <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
            介面小技巧
          </h3>
          <div className="space-y-5">
             <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600 mt-1"><GripVertical size={18} /></div>
                <div>
                   <h4 className="font-bold text-gray-900 text-sm">拖曳排序</h4>
                   <p className="text-xs text-gray-500 leading-relaxed">
                     在「管理員工」或「管理班別」視窗中，按住列表左側的拖曳手柄，即可上下移動調整順序。這會直接影響排班表上的顯示順序。
                   </p>
                </div>
             </div>
             
             <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-1"><Eye size={18} /></div>
                <div>
                   <h4 className="font-bold text-gray-900 text-sm">手機版檢視切換</h4>
                   <p className="text-xs text-gray-500 leading-relaxed">
                     使用手機操作時，若畫面太窄，可點擊上方的 <strong>「門市 / 調劑」</strong> 切換按鈕，暫時隱藏不需編輯的部門，讓畫面更清爽。
                   </p>
                </div>
             </div>

             <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-800 text-white rounded-lg mt-1"><Maximize2 size={18} /></div>
                <div>
                   <h4 className="font-bold text-gray-900 text-sm">專注模式</h4>
                   <p className="text-xs text-gray-500 leading-relaxed">
                     點擊右上角 <Maximize2 size={12} className="inline"/> 放大按鈕，可隱藏選單與統計表，讓表格佔滿螢幕，適合專心排班。
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "雲端同步",
    icon: <Cloud className="text-white" size={20} />,
    content: (
      <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <Cloud size={20} className="text-brand-600"/> 跨裝置使用
             </h3>
             <div className="space-y-4">
               <p className="text-sm text-gray-600">
                 本系統資料預設儲存在您的電腦/手機中。若要在不同裝置間接續工作（例如：在藥局排一半，回家用手機繼續），請使用雲端同步功能。
               </p>

               <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                  <h4 className="font-bold text-gray-800 mb-2">如何同步？</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-gray-600">
                    <li>點擊右上角 <Cloud size={14} className="inline"/> <strong>雲端</strong> 圖示。</li>
                    <li>輸入一組自訂的 <strong>「同步代碼」</strong> (例如：pharmacy-888)。</li>
                    <li>點擊 <strong>「上傳」</strong> 將目前進度存到雲端。</li>
                    <li>在另一台裝置輸入 <strong>相同的代碼</strong>，點擊 <strong>「下載」</strong> 即可接續工作。</li>
                  </ol>
               </div>
             </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex gap-3 items-start">
           <AlertCircle className="text-yellow-600 shrink-0" size={20} />
           <div className="text-xs text-yellow-800 leading-relaxed">
              <strong className="block mb-1 text-sm">資料安全提醒</strong>
              請定期使用 <FileJson size={12} className="inline"/> <strong>備份 (JSON)</strong> 功能下載檔案至電腦留存。
              Excel 匯出檔僅供列印與閱讀，<strong>無法</strong> 用來還原系統資料。
           </div>
        </div>
      </div>
    )
  }
];

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const nextPage = () => {
    if (currentPage < PAGES.length - 1) setCurrentPage(curr => curr + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(curr => curr - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center backdrop-blur-md p-4 transition-all">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up ring-1 ring-white/20">
        
        {/* Header */}
        <div className="bg-brand-600 px-6 py-4 flex justify-between items-center shrink-0 text-white shadow-md">
          <h2 className="text-lg font-bold flex items-center gap-2">
            📖 使用說明
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
           {PAGES[currentPage].content}
        </div>

        {/* Footer / Navigation */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
           
           {/* Left Button */}
           <button 
             onClick={prevPage}
             disabled={currentPage === 0}
             className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
               ${currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-brand-600'}
             `}
           >
             <ChevronLeft size={18} /> 上一頁
           </button>

           {/* Dots Indicator */}
           <div className="flex gap-2">
              {PAGES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 
                    ${idx === currentPage ? 'bg-brand-600 w-6' : 'bg-gray-300 hover:bg-brand-300'}
                  `}
                />
              ))}
           </div>

           {/* Right Button */}
           {currentPage < PAGES.length - 1 ? (
             <button 
               onClick={nextPage}
               className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-brand-600 transition-colors"
             >
               下一頁 <ChevronRight size={18} />
             </button>
           ) : (
             <button 
               onClick={onClose}
               className="flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all transform hover:scale-105"
             >
               <CheckCircle size={16} /> 完成
             </button>
           )}

        </div>
      </div>
    </div>
  );
};
