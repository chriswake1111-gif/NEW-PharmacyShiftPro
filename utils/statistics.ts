import { StoreSchedule, ShiftDefinition, parseShiftCode, BuiltInShifts } from '../types';
import { format } from 'date-fns';

export interface EmployeeStats {
  ap: number;
  full: number;
  annual: number;
  ot: number;
  total: number;
}

/**
 * Calculates aggregated statistics for a specific employee over a date range.
 */
export const calculatePeriodStats = (
  empId: string,
  schedule: StoreSchedule,
  dateRange: Date[],
  shiftDefinitions: Record<string, ShiftDefinition>
): EmployeeStats => {
  let apCount = 0;
  let fullCount = 0;
  let annualHours = 0;
  let totalWorkHours = 0;
  let totalOt = 0;

  dateRange.forEach(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const rawValue = schedule[dateStr]?.[empId];
    const { code, ot, isLesson } = parseShiftCode(rawValue);

    if (code && shiftDefinitions[code]) {
      const def = shiftDefinitions[code];

      // 1. Grouping Logic (Counts)
      if (code === BuiltInShifts.A || code === BuiltInShifts.P) {
        apCount++;
      } else if (
        code === BuiltInShifts.A_FULL ||
        code === BuiltInShifts.P_FULL ||
        code === BuiltInShifts.FULL_PLUS_2
      ) {
        fullCount++;
      }

      // 2. Calculation Logic (Hours)
      if (code === BuiltInShifts.ANNUAL) {
        // Annual Leave: use OT value as custom hours if set, otherwise default shift hours
        const hours = ot > 0 ? ot : (def.hours || 8);
        annualHours += hours;
      } else if (code !== BuiltInShifts.OFF) {
        // Working Shifts
        
        // If "Lesson Flag" is ON for a normal shift, it typically doesn't count towards work hours 
        // (based on app rules: "上課不計入工時").
        // However, if the Shift ITSELF is the "LESSON" type (BuiltInShifts.LESSON), 
        // it has 0 base hours and 4 default OT hours defined in constants.
        
        if (!isLesson) {
             const baseHours = def.hours;
             const defaultOt = def.defaultOvertime || 0;
             
             // Total Hours = Base + DefaultOT + ManualOT
             totalWorkHours += baseHours + defaultOt + ot;
             
             // Total OT = DefaultOT + ManualOT
             totalOt += defaultOt + ot;
        }
      }
    }
  });

  return { 
    ap: apCount, 
    full: fullCount, 
    annual: annualHours, 
    ot: totalOt, 
    total: totalWorkHours 
  };
};
