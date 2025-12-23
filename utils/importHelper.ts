
import * as XLSX_PKG from 'xlsx';
import { format, isValid } from 'date-fns';
import { Employee, ScheduleProject, StoreSchedule, BuiltInShifts, Department, ShiftDefinition } from '../types';
import { DEFAULT_SHIFT_DEFINITIONS } from '../constants';

// Handle Import Compatibility for different environments (CDN vs Node)
const XLSX = (XLSX_PKG as any).default || XLSX_PKG;

/**
 * Text mapping for standard shifts. 
 */
const BASE_TEXT_MAP: Record<string, string> = {
  'A': BuiltInShifts.A,
  'P': BuiltInShifts.P,
  'D': BuiltInShifts.D2,
  'D2': BuiltInShifts.D2,
  'A全': BuiltInShifts.A_FULL,
  'P全': BuiltInShifts.P_FULL,
  '全+2': BuiltInShifts.FULL_PLUS_2,
  '例假日': BuiltInShifts.OFF,
  '例': BuiltInShifts.OFF,
  '休': BuiltInShifts.OFF,
  '特休': BuiltInShifts.ANNUAL,
  'A/特休': BuiltInShifts.ANNUAL,
  '上課': BuiltInShifts.LESSON,
  '課': BuiltInShifts.LESSON,
};

/**
 * Normalizes shift text from Excel based on business rules:
 * 1. Ignore parentheses (e.g. "(A1)" -> "A1")
 * 2. Ignore suffixes '1' or '2' (e.g. "A1" -> "A", "全2+2" -> "全+2")
 * 3. Any combination with "特休" becomes ANNUAL (e.g. "A1/特休" -> ANNUAL)
 */
const normalizeAndMapShift = (rawVal: string): string | null => {
  if (!rawVal) return null;

  // 1. Basic cleaning: remove parentheses and spaces
  let text = rawVal.replace(/[()（）\s]/g, '').trim();

  // 2. High priority rule: Any variation of "特休" is ANNUAL
  if (text.includes('特休')) {
    return BuiltInShifts.ANNUAL;
  }

  // 3. Normalize digits 1 and 2
  // Replace A1, A2 with A; P1, P2 with P; 全1, 全2 with 全
  text = text.replace(/A[12]/g, 'A');
  text = text.replace(/P[12]/g, 'P');
  text = text.replace(/D[12]/g, 'D');
  text = text.replace(/全[12]/g, '全');
  
  // Handle "全+2" variations like "全1+2" or "全2+2" or "全+2"
  if (text.includes('全+2') || text.includes('全+2')) {
    return BuiltInShifts.FULL_PLUS_2;
  }
  
  // Try direct mapping after normalization
  if (BASE_TEXT_MAP[text]) return BASE_TEXT_MAP[text];

  // Try split parts (e.g. "A/P" -> take "A")
  if (text.includes('/')) {
    const parts = text.split('/');
    for (const part of parts) {
      const normalizedPart = normalizeAndMapShift(part);
      if (normalizedPart) return normalizedPart;
    }
  }

  return null;
};

const CHINESE_WEEKDAY_MAP: Record<string, number> = {
  '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6
};

const guessDepartment = (roleTitle: string = ''): Department => {
  const t = roleTitle.trim();
  if (t.includes('藥師')) return 'dispensing';
  return 'retail'; 
};

export const parseExcelSchedule = async (file: File): Promise<ScheduleProject> => {
  const buffer = await file.arrayBuffer();
  
  if (!XLSX.read) {
    throw new Error('Excel 解析核心載入失敗，請重新整理頁面再試一次。');
  }

  const workbook = XLSX.read(buffer, { type: 'array' });
  
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[];

  if (rows.length < 5) throw new Error('檔案內容過少，無法解析');

  let headerRowIndex = -1;
  rows.forEach((row, idx) => {
    if (row[0]?.toString().trim() === '日期') {
      headerRowIndex = idx;
    }
  });

  if (headerRowIndex === -1) throw new Error('找不到含有「日期」的標題列 (A欄應為日期)');

  const nameRowIndex = headerRowIndex - 1;
  const idRowIndex = headerRowIndex - 2;

  if (nameRowIndex < 0 || idRowIndex < 0) {
    throw new Error('標題列位置太靠上，無法讀取上方的姓名與工號列');
  }

  const headerRow = rows[headerRowIndex];
  const nameRow = rows[nameRowIndex];
  const idRow = rows[idRowIndex];

  let detectedYear = new Date().getFullYear(); 
  const sheetRocMatch = sheetName.match(/(\d{3})/);
  if (sheetRocMatch) {
      const y = parseInt(sheetRocMatch[1]);
      if (y > 100 && y < 200) detectedYear = y + 1911;
  }

  for(let i=0; i <= headerRowIndex; i++) {
      const rowStr = rows[i].join(' ');
      const rocMatch = rowStr.match(/(\d{3})年度?/);
      if (rocMatch) {
          detectedYear = parseInt(rocMatch[1]) + 1911;
          break;
      }
      const adMatch = rowStr.match(/(20\d{2})年/);
      if (adMatch) {
          detectedYear = parseInt(adMatch[1]);
          break;
      }
  }

  const employees: Employee[] = [];
  const colIndexToEmpId: Record<number, string> = {};
  const skipKeywords = ['日期', '星期', '進貨日', '備註'];

  for (let c = 0; c < headerRow.length; c++) {
    const headerVal = headerRow[c] ? headerRow[c].toString().trim() : '';
    const nameVal = nameRow[c] ? nameRow[c].toString().trim() : '';
    
    if (skipKeywords.includes(headerVal)) continue;
    if (!nameVal) continue;

    const code = idRow[c] ? idRow[c].toString().trim() : '';
    const id = code || `EMP_${Date.now()}_${c}`;

    employees.push({
      id,
      name: nameVal,
      department: guessDepartment(headerVal),
      code,
      role: headerVal
    });
    colIndexToEmpId[c] = id;
  }

  if (employees.length === 0) throw new Error('找不到員工資料');

  const schedule: StoreSchedule = {};
  const newShiftDefs = { ...DEFAULT_SHIFT_DEFINITIONS };
  
  let minDate = new Date(8640000000000000);
  let maxDate = new Date(-8640000000000000);

  let currentYear = detectedYear;
  let lastMonth = -1;
  let isFirstDate = true;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const dateCell = row[0];
    const weekdayCell = row[1];

    if (!dateCell) continue;

    let m = -1, d = -1;
    if (typeof dateCell === 'number') {
       const parsed = XLSX.SSF.parse_date_code(dateCell);
       if (parsed) { m = parsed.m; d = parsed.d; }
    } else {
       const dateStr = dateCell.toString().trim().split(' ')[0];
       const parts = dateStr.split('/');
       if (parts.length >= 2) { m = parseInt(parts[0]); d = parseInt(parts[1]); }
    }

    if (m !== -1 && d !== -1) {
       if (isFirstDate) {
          const weekdayStr = weekdayCell ? weekdayCell.toString().trim() : '';
          const targetWeekday = CHINESE_WEEKDAY_MAP[weekdayStr];
          if (typeof targetWeekday !== 'undefined') {
              const candidates = [detectedYear, detectedYear - 1, detectedYear + 1, 2025, 2026];
              for (const y of candidates) {
                 const testDate = new Date(y, m - 1, d);
                 if (testDate.getDay() === targetWeekday) {
                     currentYear = y;
                     break;
                 }
              }
          } else if (m === 12 && detectedYear > 2000) {
              currentYear = detectedYear - 1;
          }
          lastMonth = m;
          isFirstDate = false;
       }

       if (lastMonth === 12 && m === 1) currentYear++;
       lastMonth = m;
       
       const dateObj = new Date(currentYear, m - 1, d);
       if (isValid(dateObj)) {
          const dateKey = format(dateObj, 'yyyy-MM-dd');
          if (dateObj < minDate) minDate = dateObj;
          if (dateObj > maxDate) maxDate = dateObj;

          if (!schedule[dateKey]) schedule[dateKey] = {};

          for (const [colIdxStr, empId] of Object.entries(colIndexToEmpId)) {
            const colIdx = parseInt(colIdxStr);
            const cellValue = row[colIdx];

            if (cellValue) {
              const valStr = cellValue.toString().trim();
              const matchedCode = normalizeAndMapShift(valStr);

              if (matchedCode) {
                schedule[dateKey][empId] = matchedCode;
              } else {
                const customCode = `CUSTOM_${valStr}`;
                if (!newShiftDefs[customCode]) {
                  newShiftDefs[customCode] = {
                    code: customCode,
                    label: valStr,
                    shortLabel: valStr.substring(0, 2),
                    time: '自訂',
                    hours: 0,
                    color: 'bg-gray-100 text-gray-800 border-gray-300',
                    sortOrder: 99
                  };
                }
                schedule[dateKey][empId] = customCode;
              }
            }
          }
       }
    }
  }

  let storeName = '匯入分店';
  if (rows[headerRowIndex + 1] && rows[headerRowIndex + 1][2]) {
     const loc = rows[headerRowIndex + 1][2].toString();
     if(loc.length < 8) storeName = loc;
  }

  const titleText = `${currentYear}年${format(minDate, 'M')}月 排班表`;

  return {
    id: `proj_${Date.now()}`,
    name: titleText,
    storeName,
    startDate: format(minDate, 'yyyy-MM-dd'),
    endDate: format(maxDate, 'yyyy-MM-dd'),
    employees,
    schedule,
    shiftDefinitions: newShiftDefs,
    lastModified: Date.now()
  };
};
