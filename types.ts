export interface LedgerEntry {
  id: string;
  date: string; // ISO 8601 YYYY-MM-DD
  workLog: string;
  learningLog: string;
  timeLeakLog: string;
  effortRating: number; // 1-5
  freeThought?: string;
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

export interface DailyStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  completionRate: number;
}

export type ViewState = 'entry' | 'calendar' | 'reading';

export const VALIDATION_LIMITS = {
  WORK_MIN: 40,
  WORK_MAX: 2000,
  LEARN_MAX: 150,
  LEAK_MAX: 100,
};

export const VAGUE_WORDS = [
  'nothing', 'na', 'n/a', 'none', 'same', 'usual', 'idk', 'dunno', 'stuff'
];