
import React, { useState, useRef } from 'react';
import { Employee, Department } from '../types';
import { DEPARTMENTS } from '../constants';
import { X, Plus, Trash2, Briefcase, Store, Pencil, Save, GripVertical, Users } from 'lucide-react';

interface Props {
  employees: Employee[];
  setEmployees: (emps: Employee[]) => void;
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
}

export const EmployeeManager: React.FC<Props> = ({ employees, setEmployees, isOpen, onClose, storeName }) => {
  const [newName, setNewName] = useState('');
  const [department, setDepartment] = useState<Department>('retail');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // DnD State
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const activeSection = useRef<Department | null>(null);
  const draggedEmp = useRef<Employee | null>(null); // Track the actual employee object being dragged
  const [dragOverDept, setDragOverDept] = useState<Department | null>(null); // For visual feedback

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newId = Date.now().toString();
    setEmployees([...employees, { 
      id: newId, 
      name: newName.trim(), 
      department 
    }]);
    setNewName('');
  };

  const handleRemove = (id: string) => {
    if (window.confirm('確定要刪除此員工嗎？這將會清除該員工的排班資料。')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const startEditing = (emp: Employee) => {
    setEditingId(emp.id);
    setEditName(emp.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      setEmployees(employees.map(e => 
        e.id === editingId ? { ...e, name: editName.trim() } : e
      ));
      setEditingId(null);
      setEditName('');
    }
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number, dept: Department, emp: Employee) => {
    dragItem.current = index;
    activeSection.current = dept;
    draggedEmp.current = emp;
    e.currentTarget.classList.add('opacity-50');
    // Set data transfer for broader compatibility if needed, though we use refs
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number, dept: Department) => {
    // Only allow item sorting within the same department
    if (activeSection.current !== dept) return;
    dragOverItem.current = index;
    e.preventDefault();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, dept: Department) => {
    e.currentTarget.classList.remove('opacity-50');
    
    // Logic for Sorting (Same Department)
    if (dragItem.current !== null && dragOverItem.current !== null && activeSection.current === dept) {
      const deptEmployees = employees.filter(e => e.department === dept);
      const otherEmployees = employees.filter(e => e.department !== dept);
      
      const copyDeptItems = [...deptEmployees];
      const dragItemContent = copyDeptItems[dragItem.current];
      copyDeptItems.splice(dragItem.current, 1);
      copyDeptItems.splice(dragOverItem.current, 0, dragItemContent);
      
      if (dept === 'retail') {
        setEmployees([...copyDeptItems, ...otherEmployees]);
      } else {
        setEmployees([...otherEmployees, ...copyDeptItems]);
      }
    }
    
    // Reset Refs
    dragItem.current = null;
    dragOverItem.current = null;
    activeSection.current = null;
    draggedEmp.current = null;
    setDragOverDept(null);
  };

  // --- Container Drop Logic (For Moving between Departments) ---

  const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>, dept: Department) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedEmp.current && draggedEmp.current.department !== dept) {
      setDragOverDept(dept);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleContainerDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Basic check to avoid flickering when hovering over children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverDept(null);
  };

  const handleContainerDrop = (e: React.DragEvent<HTMLDivElement>, targetDept: Department) => {
    e.preventDefault();
    setDragOverDept(null);

    // If dragging an employee from a DIFFERENT department to this one
    if (draggedEmp.current && draggedEmp.current.department !== targetDept) {
       const empToMove = draggedEmp.current;
       
       // Fix: Use 'employees' directly instead of functional update 'prev => ...'
       // because 'setEmployees' prop is not guaranteed to support functional updates 
       // (it depends on how parent implements it).
       const updatedList = employees.map(emp => 
          emp.id === empToMove.id 
          ? { ...emp, department: targetDept } 
          : emp
       );
       
       setEmployees(updatedList);
    }
  };

  const renderEmployeeList = (dept: Department) => {
    // Safety check in case employees is somehow not an array due to previous error state
    if (!Array.isArray(employees)) return null;

    const filteredEmps = employees.filter(e => e.department === dept);
    const isDragOverTarget = dragOverDept === dept;
    
    return (
      <div 
        className={`mb-6 rounded-xl transition-all duration-200 border-2 ${isDragOverTarget ? 'bg-blue-50 border-blue-300 border-dashed scale-[1.01] shadow-lg' : 'border-transparent'}`}
        onDragOver={(e) => handleContainerDragOver(e, dept)}
        onDragLeave={handleContainerDragLeave}
        onDrop={(e) => handleContainerDrop(e, dept)}
      >
        <div className="p-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2 pl-1">
            {dept === 'retail' ? <Store size={14} /> : <Briefcase size={14} />}
            {DEPARTMENTS[dept]}
            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
              {filteredEmps.length}
            </span>
          </h3>
          
          {filteredEmps.length === 0 ? (
            <div className={`text-sm text-gray-400 italic p-4 border border-dashed border-gray-200 rounded-lg text-center bg-gray-50/50 transition-colors ${isDragOverTarget ? 'bg-blue-100/50 border-blue-200 text-blue-500' : ''}`}>
               {isDragOverTarget ? '放開以移動至此部門' : '此部門尚無員工 (可從另一區拖曳至此)'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmps.map((emp, index) => (
                <div 
                  key={emp.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, dept, emp)}
                  onDragEnter={(e) => handleDragEnter(e, index, dept)}
                  onDragEnd={(e) => handleDragEnd(e, dept)}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-brand-300 hover:shadow-md transition-all cursor-move group select-none"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    
                    {editingId === emp.id ? (
                      <div className="flex items-center gap-2 flex-1 animate-fade-in-up">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="flex-1 px-3 py-1.5 text-sm border border-brand-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        />
                        <button onClick={saveEdit} className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm">
                          <Save size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium text-gray-700 flex-1 pl-1">{emp.name}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {editingId !== emp.id && (
                      <button 
                        onClick={() => startEditing(emp)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                        title="編輯姓名"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleRemove(emp.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {isDragOverTarget && (
                 <div className="p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 text-center text-blue-500 text-sm font-bold animate-pulse">
                    放開以移動
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up ring-1 ring-gray-900/5">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl shrink-0">
          <div>
            <h2 className="text-gray-800 text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-brand-600" /> 
              <span>管理員工名單</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">設定 {storeName} 的排班人員</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
          
          {/* Add New Section - Styled like a Form Card */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 shadow-sm">
             <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">新增員工</label>
             <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                   <button 
                     onClick={() => setDepartment('retail')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${department === 'retail' ? 'bg-white border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-100' : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200'}`}
                   >
                     <Store size={16} /> {DEPARTMENTS.retail}
                   </button>
                   <button 
                     onClick={() => setDepartment('dispensing')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${department === 'dispensing' ? 'bg-white border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-100' : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200'}`}
                   >
                     <Briefcase size={16} /> {DEPARTMENTS.dispensing}
                   </button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="請輸入姓名..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                  />
                  <button 
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-sm font-medium shadow-sm whitespace-nowrap"
                  >
                    <Plus size={18} /> 新增
                  </button>
               </div>
             </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="h-px bg-gray-100 flex-1"></div>
             <span className="text-[10px] text-gray-400 font-medium">提示：可拖曳姓名進行排序或更換部門</span>
             <div className="h-px bg-gray-100 flex-1"></div>
          </div>

          {/* List Section */}
          <div>
             {renderEmployeeList('retail')}
             {renderEmployeeList('dispensing')}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-xl shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-sm text-sm"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
