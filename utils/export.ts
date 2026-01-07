
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Employee, StoreSchedule, ShiftDefinition, parseShiftCode, BuiltInShifts } from '../types';

export const exportToExcel = (
  storeName: string,
  employees: Employee[],
  schedule: StoreSchedule,
  dateRange: Date[],
  shiftDefinitions: Record<string, ShiftDefinition>
) => {
  const { utils, writeFile } = XLSX;

  if (!utils || !writeFile) {
    throw new Error("Excel 函式庫未正確載入，請重新整理頁面後再試。");
  }

  const { book_new, book_append_sheet, aoa_to_sheet } = utils;

  // 1. 準備表頭資料
  // 第一列：員工編號, 姓名, 星期, [一, 二, 三...]
  const row1 = ['員工編號', '姓名', '星期'];
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  dateRange.forEach(date => {
    row1.push(weekdays[date.getDay()]);
  });

  // 第二列：空, 空, 日期, [1/19, 1/20...]
  const row2 = ['', '', '日期'];
  dateRange.forEach(date => {
    row2.push(format(date, 'M/d'));
  });

  const finalData: any[][] = [row1, row2];
  const merges: XLSX.Range[] = [];

  // 合併表頭的 A1:A2 (員工編號) 和 B1:B2 (姓名)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
  merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });

  // 2. 填充員工資料 (每人 3 列)
  let currentRow = 2; // 從第 3 列開始 (索引 2)
  
  employees.forEach(emp => {
    // 取得該員工所有日期的班別文字
    const shiftRowData = dateRange.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return getCellText(schedule, dateKey, emp.id, shiftDefinitions);
    });

    // 第一列：班別排班
    finalData.push([emp.code || '', emp.name, '班別排班', ...shiftRowData]);
    
    // 第二列：地點
    finalData.push(['', '', '地點', ...dateRange.map(() => '')]);
    
    // 第三列：備註
    finalData.push(['', '', '備註', ...dateRange.map(() => '')]);

    // 合併左側員工編號與姓名 (垂直合併 3 列)
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + 2, c: 0 } });
    merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow + 2, c: 1 } });

    currentRow += 3;
  });

  // 3. 建立 Worksheet
  const ws = aoa_to_sheet(finalData);
  ws['!merges'] = merges;

  // 設定欄位寬度
  const wscols = [
    { wch: 10 }, // 員工編號
    { wch: 12 }, // 姓名
    { wch: 10 }, // 項目
    ...dateRange.map(() => ({ wch: 6 })) // 日期欄位寬度
  ];
  ws['!cols'] = wscols;

  // 4. 寫入檔案
  const wb = book_new();
  const safeSheetName = (storeName || '排班表').substring(0, 31);
  book_append_sheet(wb, ws, safeSheetName);
  
  const fileName = `${storeName}_排班表_${format(new Date(), 'yyyyMMdd')}.xlsx`;
  writeFile(wb, fileName);
};

/**
 * 取得儲存格顯示文字 (與畫面顯示一致)
 */
function getCellText(schedule: StoreSchedule, dateKey: string, empId: string, shiftDefinitions: Record<string, ShiftDefinition>): string {
  const cellData = schedule[dateKey]?.[empId];
  if (!cellData) return '';

  const { code, ot, isLesson } = parseShiftCode(cellData);
  
  if (code && shiftDefinitions[code]) {
    let text = shiftDefinitions[code].shortLabel || code;
    
    // 特殊處理特休與加班顯示格式
    if (code === BuiltInShifts.ANNUAL) {
       if (ot > 0 && ot !== shiftDefinitions[code].hours) text += `(${ot})`;
    } else {
       if (ot > 0) text += `+${ot}`;
       if (isLesson) text += `/上`;
    }
    return text;
  }
  return '';
}
