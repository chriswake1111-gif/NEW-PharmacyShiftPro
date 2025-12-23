
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { 
  Users, 
  Download, 
  Calendar as CalendarIcon, 
  XCircle,
  CheckCircle,
  Clock,
  Minimize2,
  GraduationCap,
  Cloud,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FolderOpen,
  Trash2,
  Plus,
  Eraser,
  Pencil,
  Maximize2,
  HelpCircle,
  AlertTriangle,
  X
} from 'lucide-react';

import { ShiftCode, StoreSchedule, ShiftDefinition, parseShiftCode, BuiltInShifts, ScheduleProject } from './types';
import { DEFAULT_SHIFT_DEFINITIONS } from './constants';
import { exportToExcel } from './utils/export';
import { parseExcelSchedule } from './utils/importHelper';
import { EmployeeManager } from './components/EmployeeManager';
import { ShiftManager } from './components/ShiftManager';
import { StatPanel } from './components/StatPanel';
import { HelpModal } from './components/HelpModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { CloudBackupData } from './services/cloudService';

// --- Dialog Modal Component ---
interface DialogProps {
  isOpen: boolean;
  type: 'confirm' | 'prompt' | 'alert';
  title: string;
  message?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: (value?: string) => void;
  onClose: () => void;
}

const DialogModal: React.FC<DialogProps> = ({ 
  isOpen, type, title, message, defaultValue = '', confirmLabel = '確定', cancelLabel = '取消', isDanger = false, onConfirm, onClose 
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  
  useEffect(() => {
    if (isOpen) setInputValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(type === 'prompt' ? inputValue : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden ring-1 ring-gray-900/5">
        <div className={`px-6 py-4 flex justify-between items-center border-b ${isDanger ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
          <h3 className={`font-bold text-lg flex items-center gap-2 ${isDanger ? 'text-red-700' : 'text-gray-800'}`}>
            {isDanger && <AlertTriangle size={20} />}
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-black/5 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {message && <p className="text-gray-600 mb-4 text-sm leading-relaxed whitespace-pre-line">{message}</p>}
          
          {type === 'prompt' && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          )}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          {type !== 'alert' && (
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
              {cancelLabel}
            </button>
          )}
          <button 
            onClick={handleConfirm} 
            className={`px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- App Component ---

interface PopupPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const calculatePosition = (e: React.MouseEvent): PopupPosition => {
  const x = e.clientX;
  const y = e.clientY;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const showAbove = y > windowHeight / 2;
  const showLeft = x > windowWidth / 2;
  const offset = 12;

  return {
    top: showAbove ? undefined : y + offset,
    bottom: showAbove ? windowHeight - y + offset : undefined,
    left: showLeft ? undefined : x + offset,
    right: showLeft ? windowWidth - x + offset : undefined
  };
};

const ShiftCell = React.memo(({ 
  empId, 
  dateStr, 
  isWeekend, 
  rawValue, 
  shiftDefs, 
  onClick, 
  onDoubleClick 
}: {
  empId: string;
  dateStr: string;
  isWeekend: boolean;
  rawValue: string | undefined;
  shiftDefs: Record<string, ShiftDefinition>;
  onClick: (e: React.MouseEvent, empId: string, dateStr: string) => void;
  onDoubleClick: (e: React.MouseEvent, empId: string, dateStr: string, rawValue: string) => void;
}) => {
  const { code, ot, isLesson } = parseShiftCode(rawValue);
  const shiftDef = code ? shiftDefs[code] : null;
  const colorClass = (isWeekend && shiftDef?.weekendColor) ? shiftDef.weekendColor : (shiftDef?.color || '');

  return (
    <td className={`relative border-b border-r border-gray-100 p-0 sm:p-0.5 text-center h-10 ${isWeekend ? 'bg-orange-50/10' : ''}`}>
      <button
        onClick={(e) => onClick(e, empId, dateStr)}
        onDoubleClick={(e) => rawValue && onDoubleClick(e, empId, dateStr, rawValue)}
        className={`w-full h-full rounded-none sm:rounded flex items-center justify-center transition-all text-xs font-bold shadow-sm select-none relative
          ${shiftDef ? `${colorClass} hover:brightness-95` : 'text-transparent hover:bg-gray-100 hover:text-gray-300'}
        `}
      >
        {shiftDef ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-0.5 leading-none">
             <span className="text-[10px] sm:text-xs">{shiftDef.shortLabel}</span>
             {code === BuiltInShifts.ANNUAL ? (
                (ot > 0 && ot !== shiftDef.hours) && <span className="text-[9px] bg-white/50 px-0.5 rounded text-gray-800 scale-90 sm:scale-100">({ot})</span>
             ) : (
               <div className="flex gap-0.5">
                 {ot > 0 && <span className="text-[8px] sm:text-[9px] bg-white/50 px-0.5 rounded text-gray-800 scale-90 sm:scale-100">+{ot}</span>}
                 {isLesson && <span className="text-[8px] sm:text-[9px] bg-indigo-100 text-indigo-700 px-0.5 rounded border border-indigo-200 scale-90 sm:scale-100">/上</span>}
               </div>
             )}
          </div>
        ) : '+'}
      </button>
    </td>
  );
});

const App: React.FC = () => {
  // --- PROJECT STATE ---
  const [projects, setProjects] = useState<ScheduleProject[]>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_projects');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
     return localStorage.getItem('pharmacy_current_project_id') || null;
  });

  const [activeProject, setActiveProject] = useState<ScheduleProject | null>(null);

  useEffect(() => {
    if (currentProjectId && projects.length > 0) {
      const found = projects.find(p => p.id === currentProjectId);
      if (found) setActiveProject(found);
      else setActiveProject(projects[0]);
    } else if (projects.length > 0) {
       setActiveProject(projects[0]);
       setCurrentProjectId(projects[0].id);
    }
  }, []);

  const updateActiveProject = (updated: ScheduleProject) => {
    setActiveProject(updated);
    setProjects(prev => {
       const newProjects = prev.map(p => p.id === updated.id ? updated : p);
       localStorage.setItem('pharmacy_projects', JSON.stringify(newProjects));
       return newProjects;
    });
  };

  // --- Dialog State ---
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'prompt' | 'alert';
    title: string;
    message?: string;
    defaultValue?: string;
    isDanger?: boolean;
    confirmLabel?: string;
    onConfirm: (val?: string) => void;
  }>({ isOpen: false, type: 'alert', title: '', onConfirm: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  // --- Project Actions ---

  const createNewProject = () => {
     const newProj: ScheduleProject = {
       id: `proj_${Date.now()}`,
       name: `新班表 ${format(new Date(), 'yyyy-MM')}`,
       storeName: '新分店',
       startDate: format(new Date(), 'yyyy-MM-01'),
       endDate: format(new Date(), 'yyyy-MM-28'),
       employees: [],
       schedule: {},
       shiftDefinitions: DEFAULT_SHIFT_DEFINITIONS,
       lastModified: Date.now()
     };
     setProjects(prev => [...prev, newProj]);
     setCurrentProjectId(newProj.id);
     setActiveProject(newProj);
     localStorage.setItem('pharmacy_projects', JSON.stringify([...projects, newProj]));
     setIsProjectMenuOpen(false);
  };

  const deleteProject = (id: string) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: '刪除班表',
      message: '確定要刪除此班表嗎？此動作無法復原。',
      isDanger: true,
      confirmLabel: '刪除',
      onConfirm: () => {
        const newProjects = projects.filter(p => p.id !== id);
        setProjects(newProjects);
        localStorage.setItem('pharmacy_projects', JSON.stringify(newProjects));
        
        if (currentProjectId === id) {
           if (newProjects.length > 0) {
              setCurrentProjectId(newProjects[0].id);
              setActiveProject(newProjects[0]);
           } else {
              setCurrentProjectId(null);
              setActiveProject(null);
           }
        }
      }
    });
  };

  const handleRenameProject = (e: React.MouseEvent, projectId: string, currentName: string) => {
    e.stopPropagation(); // prevent row click
    setDialogConfig({
      isOpen: true,
      type: 'prompt',
      title: '重新命名',
      defaultValue: currentName,
      message: '請輸入新的班表名稱：',
      onConfirm: (newName) => {
        if (newName && newName.trim()) {
            const validName = newName.trim();
            setProjects(prev => {
                const updated = prev.map(p => p.id === projectId ? { ...p, name: validName } : p);
                localStorage.setItem('pharmacy_projects', JSON.stringify(updated));
                return updated;
            });
            if (activeProject?.id === projectId) {
                setActiveProject(prev => prev ? { ...prev, name: validName } : null);
            }
        }
      }
    });
  };

  // --- Derived State ---
  const employees = useMemo(() => activeProject?.employees || [], [activeProject]);
  const storeSchedule = useMemo(() => activeProject?.schedule || {}, [activeProject]);
  const shiftDefs = useMemo(() => activeProject?.shiftDefinitions || DEFAULT_SHIFT_DEFINITIONS, [activeProject]);
  const storeName = activeProject?.storeName || '未命名分店';
  const startDate = activeProject?.startDate || format(new Date(), 'yyyy-MM-dd');
  const endDate = activeProject?.endDate || format(new Date(), 'yyyy-MM-dd');

  // --- View Settings ---
  const [visibleSections, setVisibleSections] = useState({ retail: true, dispensing: true });
  const [isEmpManagerOpen, setIsEmpManagerOpen] = useState(false);
  const [isShiftManagerOpen, setIsShiftManagerOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isClearMenuOpen, setIsClearMenuOpen] = useState(false);
  
  const [toast, setToast] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{empId: string, dateStr: string, position: PopupPosition} | null>(null);
  const [selectedOvertimeCell, setSelectedOvertimeCell] = useState<{empId: string, dateStr: string, baseCode: string, currentOt: number, isLesson: boolean, position: PopupPosition} | null>(null);
  const [selectedAnnualCell, setSelectedAnnualCell] = useState<{empId: string, dateStr: string, position: PopupPosition} | null>(null);

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Derived Data Helpers
  const visibleEmployees = useMemo(() => {
    return [
      ...(visibleSections.retail ? employees.filter(e => e.department === 'retail') : []),
      ...(visibleSections.dispensing ? employees.filter(e => e.department === 'dispensing') : [])
    ];
  }, [employees, visibleSections]);

  const allSortedEmployees = useMemo(() => {
    return [
      ...employees.filter(e => e.department === 'retail'),
      ...employees.filter(e => e.department === 'dispensing')
    ];
  }, [employees]);

  const sortedShifts = useMemo(() => {
    return (Object.values(shiftDefs) as ShiftDefinition[]).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [shiftDefs]);

  const retailCount = visibleSections.retail ? employees.filter(e => e.department === 'retail').length : 0;
  const dispensingCount = visibleSections.dispensing ? employees.filter(e => e.department === 'dispensing').length : 0;

  const dateRange = useMemo(() => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return (start > end) ? [] : eachDayOfInterval({ start, end });
    } catch { return []; }
  }, [startDate, endDate]);

  const displayDays = useMemo(() => {
    const today = new Date();
    return dateRange.map(date => ({
      dateObj: date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayNum: format(date, 'd'),
      weekday: format(date, 'EE', { locale: zhTW }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: isSameDay(date, today)
    }));
  }, [dateRange]);

  useEffect(() => {
     if(currentProjectId) localStorage.setItem('pharmacy_current_project_id', currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  // --- Handlers ---

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newProject = await parseExcelSchedule(file);
      
      // Feature: Prompt for name using Custom Dialog
      setDialogConfig({
        isOpen: true,
        type: 'prompt',
        title: '匯入成功',
        message: '請確認或修改班表名稱：',
        defaultValue: newProject.name,
        onConfirm: (customName) => {
           if (customName && customName.trim()) {
             newProject.name = customName.trim();
           }
           setProjects(prev => [...prev, newProject]);
           setCurrentProjectId(newProject.id);
           setActiveProject(newProject);
           localStorage.setItem('pharmacy_projects', JSON.stringify([...projects, newProject]));
           showToast('Excel 匯入成功！');
           setIsProjectMenuOpen(false);
        }
      });
    } catch (err: any) {
      // Use Dialog for error message so user can see it even if native alert is blocked/unnoticed
      setDialogConfig({
        isOpen: true,
        type: 'alert',
        title: '匯入失敗',
        message: `無法解析檔案：\n${err.message}\n\n請確認您上傳的是正確的 Excel 排班表格式。`,
        isDanger: true,
        confirmLabel: '知道了',
        onConfirm: () => {}
      });
    }
    // Always reset input so user can try again
    e.target.value = '';
  };

  const handleExcelExport = () => {
    if (!activeProject || displayDays.length === 0) return;
    try {
      exportToExcel(storeName, allSortedEmployees, storeSchedule, dateRange, shiftDefs);
      showToast('Excel 下載已開始');
    } catch (error: any) {
      alert(`匯出失敗：${error.message}`);
    }
  };

  const updateSchedule = useCallback((empId: string, dateStr: string, code: ShiftCode) => {
    if (!activeProject) return;
    const newSchedule = { ...activeProject.schedule };
    if (!newSchedule[dateStr]) newSchedule[dateStr] = {};
    newSchedule[dateStr][empId] = code;
    updateActiveProject({ ...activeProject, schedule: newSchedule, lastModified: Date.now() });
    setSelectedCell(null);
  }, [activeProject]);

  const handleUpdateShiftAttributes = useCallback((empId: string, dateStr: string, baseCode: string, otHours: number, isLesson: boolean) => {
    let newCode = baseCode;
    if (otHours > 0 || isLesson) {
      newCode = `${baseCode}:${otHours}`;
      if (isLesson) newCode += `:L`;
    }
    updateSchedule(empId, dateStr, newCode);
    setSelectedOvertimeCell(prev => prev ? { ...prev, currentOt: otHours, isLesson } : null);
  }, [updateSchedule]);

  const handleDeleteShift = useCallback((empId: string, dateStr: string) => {
    if (!activeProject) return;
    const newSchedule = { ...activeProject.schedule };
    if (newSchedule[dateStr]) {
      delete newSchedule[dateStr][empId];
      updateActiveProject({ ...activeProject, schedule: newSchedule, lastModified: Date.now() });
    }
    setSelectedCell(null);
  }, [activeProject]);

  const onCellClick = useCallback((e: React.MouseEvent, empId: string, dateStr: string) => {
    e.preventDefault();
    const position = calculatePosition(e);
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      setSelectedCell({ empId, dateStr, position });
      clickTimeoutRef.current = null;
    }, 250); 
  }, []);

  const onCellDoubleClick = useCallback((e: React.MouseEvent, empId: string, dateStr: string, rawCode: string) => {
    e.preventDefault();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (!rawCode) return;
    const { code, ot, isLesson } = parseShiftCode(rawCode);
    if (!code) return;

    const position = calculatePosition(e);
    if (code === BuiltInShifts.ANNUAL) {
       setSelectedAnnualCell({ empId, dateStr, position });
    } else {
       const def = shiftDefs[code];
       if (def && (def.hours > 0 || code === BuiltInShifts.LESSON) && code !== BuiltInShifts.OFF) {
          setSelectedOvertimeCell({ empId, dateStr, baseCode: code, currentOt: ot, isLesson, position });
       }
    }
  }, [shiftDefs]);

  // Clear Operations
  const clearAllShifts = () => {
    if (!activeProject) return;
    setIsClearMenuOpen(false);
    
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: '清空排班',
      message: '確定要清空此班表的所有排班內容嗎？(員工名單與設定將會保留)',
      isDanger: true,
      confirmLabel: '確認清空',
      onConfirm: () => {
        const updatedProject: ScheduleProject = {
            ...activeProject,
            schedule: {}, 
            lastModified: Date.now()
        };
        updateActiveProject(updatedProject);
        showToast('已清空排班內容');
      }
    });
  };

  const handleDeleteCurrentProject = () => {
    if (!activeProject) return;
    setIsClearMenuOpen(false);
    deleteProject(activeProject.id);
  };

  const getCloudData = (): CloudBackupData => ({
    employeesMap: { [storeName]: employees },
    shiftDefs: shiftDefs,
    data: { [storeName]: storeSchedule },
    lastUpdated: new Date().toISOString(),
    version: 2
  });

  const handleCloudDataLoaded = (cloudData: CloudBackupData) => {
      const importedStoreName = Object.keys(cloudData.data)[0] || '雲端匯入';
      const newProj: ScheduleProject = {
         id: `cloud_${Date.now()}`,
         name: `雲端匯入 ${format(new Date(), 'yyyy-MM-dd')}`,
         storeName: importedStoreName,
         employees: cloudData.employeesMap[importedStoreName] || [],
         schedule: cloudData.data[importedStoreName] || {},
         shiftDefinitions: cloudData.shiftDefs,
         startDate: format(new Date(), 'yyyy-MM-01'),
         endDate: format(new Date(), 'yyyy-MM-28'),
         lastModified: Date.now()
      };
      
      const dates = Object.keys(newProj.schedule).sort();
      if(dates.length > 0) {
          newProj.startDate = dates[0];
          newProj.endDate = dates[dates.length - 1];
      }

      setProjects(prev => [...prev, newProj]);
      setCurrentProjectId(newProj.id);
      setActiveProject(newProj);
      localStorage.setItem('pharmacy_projects', JSON.stringify([...projects, newProj]));
      showToast('雲端資料已匯入為新班表');
  };

  if (!activeProject) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
             <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <CalendarIcon size={40} />
             </div>
             <h1 className="text-2xl font-bold text-gray-800">PharmacyShiftPro</h1>
             <p className="text-gray-500">歡迎使用新版排班系統。請選擇建立新班表，或從 Excel 匯入既有資料。</p>
             
             <div className="grid gap-3">
               <button onClick={() => excelInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-md transition-all">
                  <FileSpreadsheet size={20} /> 從 Excel 匯入班表
               </button>
               <button onClick={createNewProject} className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-brand-100 text-brand-600 rounded-xl hover:bg-brand-50 font-bold transition-all">
                  <Plus size={20} /> 建立空白班表
               </button>
             </div>
             <input type="file" ref={excelInputRef} onChange={handleExcelImport} className="hidden" accept=".xlsx, .xls" />
             
             <DialogModal 
                isOpen={dialogConfig.isOpen}
                type={dialogConfig.type}
                title={dialogConfig.title}
                message={dialogConfig.message}
                defaultValue={dialogConfig.defaultValue}
                isDanger={dialogConfig.isDanger}
                confirmLabel={dialogConfig.confirmLabel}
                onConfirm={dialogConfig.onConfirm}
                onClose={closeDialog}
              />
          </div>
       </div>
     );
  }

  // Render Main App
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-slate-900">
      <input type="file" ref={excelInputRef} onChange={handleExcelImport} className="hidden" accept=".xlsx, .xls" />
      
      <DialogModal 
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        defaultValue={dialogConfig.defaultValue}
        isDanger={dialogConfig.isDanger}
        confirmLabel={dialogConfig.confirmLabel}
        onConfirm={dialogConfig.onConfirm}
        onClose={closeDialog}
      />

      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-xl z-[150] animate-fade-in-up flex items-center gap-3">
          <CheckCircle size={20} className="text-green-400" />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      {!isMaximized && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-brand">
                  <CalendarIcon size={18} />
                </div>
                <h1 className="text-lg font-bold text-gray-800 tracking-tight hidden md:block">
                  Pharmacy<span className="text-brand-600">Shift</span>Pro
                </h1>
              </div>

              {/* Project Selector */}
              <div className="relative group">
                 <button onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 transition-colors">
                    <FolderOpen size={16} className="text-brand-600" />
                    <span className="max-w-[100px] sm:max-w-[150px] truncate">{activeProject.name}</span>
                 </button>
                 
                 {isProjectMenuOpen && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsProjectMenuOpen(false)}></div>
                   <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in-up">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">切換班表</div>
                      <div className="max-h-[300px] overflow-y-auto">
                         {projects.map(p => (
                           <div key={p.id} className={`px-4 py-3 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 cursor-pointer ${p.id === currentProjectId ? 'bg-brand-50/50' : ''}`} onClick={() => { setCurrentProjectId(p.id); setActiveProject(p); setIsProjectMenuOpen(false); }}>
                              <div className="flex flex-col flex-1 mr-2">
                                 <span className={`text-sm font-bold truncate ${p.id === currentProjectId ? 'text-brand-700' : 'text-gray-700'}`}>{p.name}</span>
                                 <span className="text-xs text-gray-400 truncate">{p.storeName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => handleRenameProject(e, p.id, p.name)} className="text-gray-400 hover:text-brand-600 p-1.5 rounded hover:bg-brand-50 transition-colors z-50 relative" title="重新命名"><Pencil size={14}/></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors z-50 relative" title="刪除"><Trash2 size={14}/></button>
                              </div>
                           </div>
                         ))}
                      </div>
                      <div className="p-2 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2">
                         <button onClick={() => excelInputRef.current?.click()} className="flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"><FileSpreadsheet size={14}/> 匯入 Excel</button>
                         <button onClick={createNewProject} className="flex items-center justify-center gap-1 py-2 bg-white border border-gray-300 text-gray-700 rounded text-xs font-bold hover:bg-gray-100"><Plus size={14}/> 新增空白</button>
                      </div>
                   </div>
                   </>
                 )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button onClick={() => setIsShiftManagerOpen(true)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-brand-600 transition-colors">
                <Clock size={14} /><span className="hidden sm:inline">班別設定</span>
              </button>
               <button onClick={() => setIsEmpManagerOpen(true)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-brand-600 transition-colors">
                <Users size={14} /><span className="hidden sm:inline">員工管理</span>
              </button>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

               {/* Clear / Delete Button Dropdown */}
               <div className="relative">
                  <button 
                      onClick={() => setIsClearMenuOpen(!isClearMenuOpen)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors ${isClearMenuOpen ? 'ring-2 ring-red-200 bg-red-100' : ''}`}
                      title="清空或刪除"
                  >
                      <Trash2 size={14} /> <span className="hidden sm:inline">清空</span>
                  </button>
                  
                  {isClearMenuOpen && (
                      <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsClearMenuOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in-up ring-1 ring-gray-900/5">
                          <button onClick={clearAllShifts} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2 transition-colors">
                              <Eraser size={16} /> 清空排班內容
                          </button>
                          <button onClick={handleDeleteCurrentProject} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                              <Trash2 size={16} /> 刪除此班表
                          </button>
                      </div>
                      </>
                  )}
              </div>

               <button 
                  onClick={handleExcelExport} 
                  disabled={displayDays.length === 0} 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50" 
                  title="匯出 Excel"
               >
                <Download size={14} /><span className="hidden lg:inline">匯出</span>
              </button>

               <button onClick={() => setIsCloudSyncOpen(true)} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="雲端同步"><Cloud size={18} /></button>
               <button onClick={() => setIsMaximized(true)} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="放大"><Maximize2 size={18} /></button>
               <button onClick={() => setIsHelpOpen(true)} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors ml-1"><HelpCircle size={20} /></button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full mx-auto flex flex-col ${isMaximized ? '' : 'max-w-[1920px] px-2 sm:px-6 py-4'}`}>
        {!isMaximized && (
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-4">
            <div className="flex items-center gap-4 flex-wrap">
               {/* Display Date Range Info (Static/Editable via Import, simplified here) */}
               <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon size={16} />
                  <span>{startDate} ~ {endDate}</span>
               </div>
               
               {/* Department Toggles for Mobile/Small Screens */}
               <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                 <button 
                   onClick={() => setVisibleSections(p => ({...p, retail: !p.retail}))}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${visibleSections.retail ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                 >
                   {visibleSections.retail ? <Eye size={14} /> : <EyeOff size={14} />} 門市
                 </button>
                 <div className="w-px h-5 bg-gray-200 mx-1"></div>
                 <button 
                   onClick={() => setVisibleSections(p => ({...p, dispensing: !p.dispensing}))}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${visibleSections.dispensing ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                 >
                   {visibleSections.dispensing ? <Eye size={14} /> : <EyeOff size={14} />} 調劑
                 </button>
               </div>
              
              <div className="hidden sm:flex flex-wrap items-center gap-2">
                 {sortedShifts.slice(0, 8).map(def => (
                   <div key={def.code} className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-gray-200 rounded-full shadow-sm cursor-help" title={`${def.label}: ${def.time} (${def.hours}h)`}>
                     <div className={`w-2.5 h-2.5 rounded-full ${def.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                     <span className="text-[10px] font-medium text-gray-600">{def.shortLabel}</span>
                   </div>
                 ))}
                 {sortedShifts.length > 8 && <span className="text-xs text-gray-400">...</span>}
              </div>
            </div>
          </div>
        )}

        {/* Grid Container */}
        <div className={`bg-white border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isMaximized ? 'fixed inset-0 z-[100] h-screen w-screen rounded-none border-0' : 'rounded-xl shadow-lg border h-[calc(100vh-220px)] relative'}`}>
          {isMaximized && (
            <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0 shadow-sm">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm"><CalendarIcon size={18} /></div>
                 <div className="flex flex-col"><span className="font-bold text-gray-800 text-sm">{activeProject.name}</span><span className="text-xs text-gray-500 font-medium">{storeName}</span></div>
               </div>
               <button onClick={() => setIsMaximized(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors shadow-sm">
                 <Minimize2 size={14} /> 縮小
               </button>
            </div>
          )}

          {displayDays.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 font-medium flex-col gap-2">
               <CalendarIcon size={48} className="opacity-20" />
               <p>此專案的日期範圍設定有誤</p>
            </div>
          ) : (
            <div className="overflow-auto flex-1 relative custom-scrollbar">
              <table className="border-collapse w-full">
                <thead className="sticky top-0 z-30 bg-gray-50 text-gray-700 shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-40 bg-gray-50 border-b border-r border-gray-200 w-10 md:w-14 min-w-[40px] p-1 text-center font-bold text-xs text-gray-500">日期</th>
                    {retailCount > 0 && <th colSpan={retailCount} className="border-b border-r border-gray-200 bg-green-50 text-green-700 py-1 text-[10px] font-bold tracking-wider uppercase text-center cursor-pointer hover:bg-green-100" onClick={() => setVisibleSections(p => ({...p, retail: !p.retail}))} title="點擊切換顯示">門市部</th>}
                    {dispensingCount > 0 && <th colSpan={dispensingCount} className="border-b border-r border-gray-200 bg-blue-50 text-blue-700 py-1 text-[10px] font-bold tracking-wider uppercase text-center cursor-pointer hover:bg-blue-100" onClick={() => setVisibleSections(p => ({...p, dispensing: !p.dispensing}))} title="點擊切換顯示">調劑部</th>}
                  </tr>
                  <tr>
                    <th className="sticky left-0 z-40 bg-gray-50 border-b border-r border-gray-200 h-8"></th>
                     {visibleEmployees.map(emp => (
                      <th key={emp.id} className="min-w-[60px] sm:min-w-[80px] border-b border-r border-gray-100 px-1 py-1 text-center bg-gray-50 font-bold text-gray-700 text-xs whitespace-nowrap overflow-hidden text-ellipsis">{emp.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {displayDays.map((dayInfo) => (
                    <tr key={dayInfo.dateStr} className={`hover:bg-gray-50 transition-colors ${dayInfo.isToday ? 'bg-yellow-50/30' : ''}`}>
                      <td className={`sticky left-0 z-20 border-r border-b border-gray-100 p-0.5 text-center font-medium ${dayInfo.isWeekend ? 'bg-orange-50 text-orange-800' : 'bg-white text-gray-500'} ${dayInfo.isToday ? '!bg-yellow-100 text-yellow-900 border-yellow-200' : ''}`}>
                        <div className="flex flex-col items-center justify-center leading-none py-0.5 sm:py-1">
                          <span className="text-xs sm:text-sm font-bold">{dayInfo.dayNum}</span>
                          <span className="text-[8px] sm:text-[9px] font-medium opacity-80 mt-0.5">{dayInfo.weekday}</span>
                        </div>
                      </td>
                      {visibleEmployees.map((emp) => (
                        <ShiftCell
                          key={emp.id}
                          empId={emp.id}
                          dateStr={dayInfo.dateStr}
                          isWeekend={dayInfo.isWeekend}
                          rawValue={storeSchedule[dayInfo.dateStr]?.[emp.id]}
                          shiftDefs={shiftDefs}
                          onClick={onCellClick}
                          onDoubleClick={onCellDoubleClick}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Popups */}
        {selectedCell && (
          <>
            <div className="fixed inset-0 z-[110] cursor-default bg-transparent" onClick={() => setSelectedCell(null)} />
            <div className="fixed bg-white shadow-2xl rounded-xl border border-gray-200 p-4 min-w-[320px] z-[120] animate-fade-in-up" style={{ top: selectedCell.position.top, bottom: selectedCell.position.bottom, left: selectedCell.position.left, right: selectedCell.position.right }}>
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-700">選擇班別</span>
                <button onClick={() => setSelectedCell(null)}><XCircle size={18} className="text-gray-400 hover:text-gray-600"/></button>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                {sortedShifts.map(def => (
                  <button key={def.code} onClick={() => { if (selectedCell) updateSchedule(selectedCell.empId, selectedCell.dateStr, def.code); }} className={`text-sm px-2 py-3 rounded-lg ${def.color} hover:brightness-95 hover:shadow-md transition-all truncate border font-bold flex flex-col items-center justify-center gap-1`}>
                    <span>{def.shortLabel}</span><span className="text-[10px] opacity-70 scale-90">{def.hours}h</span>
                  </button>
                ))}
                <button onClick={() => { if (selectedCell) handleDeleteShift(selectedCell.empId, selectedCell.dateStr); }} className="text-sm px-2 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all font-bold flex items-center justify-center gap-1 col-span-1" title="清除排班">
                  <Trash2 size={16} /> <span className="text-xs">清除</span>
                </button>
              </div>
            </div>
          </>
        )}

        {selectedOvertimeCell && (
          <>
             <div className="fixed inset-0 z-[130] cursor-default bg-transparent" onClick={() => setSelectedOvertimeCell(null)} />
            <div className="fixed bg-white shadow-2xl rounded-xl border border-gray-200 p-4 w-[280px] z-[140] animate-fade-in-up" style={{ top: selectedOvertimeCell.position.top, bottom: selectedOvertimeCell.position.bottom, left: selectedOvertimeCell.position.left, right: selectedOvertimeCell.position.right }}>
               <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2"><Clock size={18} className="text-brand-600" /><span className="text-sm font-bold text-gray-700">設定加班 / 上課</span></div>
                <button onClick={() => setSelectedOvertimeCell(null)}><XCircle size={18} className="text-gray-400 hover:text-gray-600"/></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                 {[1, 2, 3, 4].map(hour => (
                    <button key={hour} onClick={() => { if (selectedOvertimeCell) { handleUpdateShiftAttributes(selectedOvertimeCell.empId, selectedOvertimeCell.dateStr, selectedOvertimeCell.baseCode, hour, selectedOvertimeCell.isLesson); setSelectedOvertimeCell(null); } }} className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-all font-bold ${selectedOvertimeCell.currentOt === hour ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-200' : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100 hover:shadow-sm'}`}>
                       <span className="text-lg">+{hour}</span><span className="text-[10px] opacity-70">小時</span>
                    </button>
                 ))}
              </div>
              <button onClick={() => { if (selectedOvertimeCell) { handleUpdateShiftAttributes(selectedOvertimeCell.empId, selectedOvertimeCell.dateStr, selectedOvertimeCell.baseCode, selectedOvertimeCell.currentOt, !selectedOvertimeCell.isLesson); } }} className={`w-full py-3 mb-3 rounded-lg border flex items-center justify-center gap-2 font-bold transition-all ${selectedOvertimeCell.isLesson ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'}`}>
                  <GraduationCap size={20} /><span>{selectedOvertimeCell.isLesson ? '已安排上課' : '上課 (1300-1700)'}</span>
              </button>
              <button onClick={() => { if (selectedOvertimeCell) { handleUpdateShiftAttributes(selectedOvertimeCell.empId, selectedOvertimeCell.dateStr, selectedOvertimeCell.baseCode, 0, false); setSelectedOvertimeCell(null); } }} className="w-full py-2 text-xs text-gray-500 hover:bg-gray-50 rounded border border-gray-200">清除加班與上課</button>
            </div>
          </>
        )}

        {selectedAnnualCell && (
           <>
             <div className="fixed inset-0 z-[130] cursor-default bg-transparent" onClick={() => setSelectedAnnualCell(null)} />
             <div className="fixed bg-white shadow-2xl rounded-xl border border-gray-200 p-4 w-[300px] z-[140] animate-fade-in-up" style={{ top: selectedAnnualCell.position.top, bottom: selectedAnnualCell.position.bottom, left: selectedAnnualCell.position.left, right: selectedAnnualCell.position.right }}>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                 <div className="flex items-center gap-2"><div className="w-5 h-5 bg-green-100 text-green-700 rounded flex items-center justify-center"><Clock size={14} /></div><span className="text-sm font-bold text-gray-700">設定特休時數</span></div>
                 <button onClick={() => setSelectedAnnualCell(null)}><XCircle size={18} className="text-gray-400 hover:text-gray-600"/></button>
               </div>
               <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(hour => (
                     <button key={hour} onClick={() => { updateSchedule(selectedAnnualCell.empId, selectedAnnualCell.dateStr, `${BuiltInShifts.ANNUAL}:${hour}`); setSelectedAnnualCell(null); }} className="flex flex-col items-center justify-center py-2 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 hover:shadow-sm transition-all font-bold">
                        <span className="text-sm">{hour}</span>
                     </button>
                  ))}
               </div>
             </div>
           </>
        )}

        {displayDays.length > 0 && !isMaximized && <StatPanel employees={allSortedEmployees} schedule={storeSchedule} dateRange={dateRange} shiftDefinitions={shiftDefs} />}
      </main>
      
      <CloudSyncModal isOpen={isCloudSyncOpen} onClose={() => setIsCloudSyncOpen(false)} getDataToSave={getCloudData} onDataLoaded={handleCloudDataLoaded} />
      
      {/* Employee Manager */}
      <EmployeeManager employees={employees} setEmployees={(newEmps) => updateActiveProject({...activeProject, employees: newEmps})} isOpen={isEmpManagerOpen} onClose={() => setIsEmpManagerOpen(false)} storeName={storeName} />
      
      {/* Shift Manager */}
      <ShiftManager shiftDefs={shiftDefs} setShiftDefs={(newDefs) => updateActiveProject({...activeProject, shiftDefinitions: newDefs})} isOpen={isShiftManagerOpen} onClose={() => setIsShiftManagerOpen(false)} />
      
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
