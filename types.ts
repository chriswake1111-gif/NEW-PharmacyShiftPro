

export type ShiftCode = string;

export const BuiltInShifts = {
  A: 'A',
  P: 'P',
  A2: 'A2',
  P2: 'P2',
  D2: 'D2',
  A_FULL: 'A_FULL',
  P_FULL: 'P_FULL',
  FULL_PLUS_2: 'FULL_PLUS_2',
  OFF: 'OFF',
  ANNUAL: 'ANNUAL',
  LESSON: 'LESSON',
  N: 'N'
} as const;

export interface ShiftDefinition {
  code: string;
  label: string;
  time: string;
  color: string;
  weekendColor?: string;
  shortLabel: string;
  description?: string;
  hours: number; 
  defaultOvertime?: number;
  sortOrder?: number;
}

export type Department = 'retail' | 'dispensing';

export interface Employee {
  id: string;
  name: string;
  department: Department;
  code?: string; // For imported ID like G239
  role?: string; // For imported role like 藥助
}

// Map: DateString (YYYY-MM-DD) -> EmployeeID -> ShiftCode
export type DailySchedule = Record<string, ShiftCode>;
export type StoreSchedule = Record<string, DailySchedule>;

export interface ShiftStats {
  [key: string]: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ParsedShift {
  code: string | null;
  ot: number;
  isLesson: boolean;
}

export interface ScheduleProject {
  id: string;
  name: string; // e.g., "115年1月-沙鹿店"
  storeName: string;
  startDate: string;
  endDate: string;
  employees: Employee[];
  schedule: StoreSchedule;
  shiftDefinitions: Record<string, ShiftDefinition>;
  lastModified: number;
}

export const parseShiftCode = (value: string | undefined): ParsedShift => {
  if (!value || typeof value !== 'string') {
    return { code: null, ot: 0, isLesson: false };
  }
  
  const parts = value.split(':');
  const code = parts[0];
  
  let ot = 0;
  // Parse OT if present (2nd part)
  if (parts.length > 1) {
    const parsed = parseInt(parts[1], 10);
    if (!isNaN(parsed)) {
      ot = parsed;
    }
  }

  // Parse Lesson Flag if present (3rd part, e.g., "A:0:L")
  const isLesson = parts.length > 2 && parts[2] === 'L';

  return { 
    code, 
    ot,
    isLesson
  };
};
