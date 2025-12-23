
import React, { useMemo } from 'react';
import { Employee, StoreSchedule, ShiftDefinition } from '../types';
import { format } from 'date-fns';
import { calculatePeriodStats, EmployeeStats } from '../utils/statistics';

interface Props {
  employees: Employee[];
  schedule: StoreSchedule; 
  dateRange: Date[];
  shiftDefinitions: Record<string, ShiftDefinition>; 
}

export const StatPanel: React.FC<Props> = ({ employees, schedule, dateRange, shiftDefinitions }) => {
  
  // Memoize stats calculation
  const stats = useMemo(() => {
    const result: Record<string, EmployeeStats> = {};
    employees.forEach(emp => {
        result[emp.id] = calculatePeriodStats(emp.id, schedule, dateRange, shiftDefinitions);
    });
    return result;
  }, [employees, schedule, dateRange, shiftDefinitions]);

  return (
    <div className="bg-white p-3 rounded-lg shadow border border-gray-200 mt-4">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>📊</span> 排班統計 ({format(dateRange[0], 'MM/dd')} - {format(dateRange[dateRange.length - 1], 'MM/dd')})
      </h3>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs text-left text-gray-500 border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 p-2 min-w-[100px] font-bold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                統計項目
              </th>
              {employees.map(emp => (
                <th key={emp.id} className="min-w-[80px] border-b border-r border-gray-100 px-1 py-2 text-center bg-gray-50 font-bold text-gray-700 whitespace-nowrap">
                  {emp.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
             {/* Row 1: A/P */}
             <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 p-2 font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    A/P 次數
                </td>
                {employees.map(emp => (
                    <td key={emp.id} className="border-b border-r border-gray-100 p-2 text-center font-medium">
                        {stats[emp.id]?.ap > 0 ? stats[emp.id].ap : '-'}
                    </td>
                ))}
             </tr>

             {/* Row 2: Full */}
             <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 p-2 font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    全班次數
                </td>
                {employees.map(emp => (
                    <td key={emp.id} className="border-b border-r border-gray-100 p-2 text-center font-medium">
                        {stats[emp.id]?.full > 0 ? stats[emp.id].full : '-'}
                    </td>
                ))}
             </tr>

             {/* Row 3: Annual */}
             <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 p-2 font-medium text-green-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    特休 (時)
                </td>
                {employees.map(emp => (
                    <td key={emp.id} className="border-b border-r border-gray-100 p-2 text-center font-medium text-green-600">
                        {stats[emp.id]?.annual > 0 ? stats[emp.id].annual : '-'}
                    </td>
                ))}
             </tr>

             {/* Row 4: OT */}
             <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 p-2 font-bold text-red-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    加班時數
                </td>
                {employees.map(emp => (
                    <td key={emp.id} className="border-b border-r border-gray-100 p-2 text-center font-mono font-bold text-red-600">
                        {stats[emp.id]?.ot > 0 ? `+${stats[emp.id].ot}` : '-'}
                    </td>
                ))}
             </tr>

             {/* Row 5: Total */}
             <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 p-2 font-bold text-indigo-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    總工時
                </td>
                {employees.map(emp => (
                    <td key={emp.id} className="border-b border-r border-gray-100 p-2 text-center font-mono font-bold text-indigo-600">
                        {stats[emp.id]?.total > 0 ? stats[emp.id].total : '-'}
                    </td>
                ))}
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
