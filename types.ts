export interface LedgerEntry {
  date: string;
  workLog: string;
  learningLog: string;
  timeLeakLog: string;
  
  // New metrics we added recently
  effortRating: number;
  mood?: 'neutral' | 'flow' | 'stuck' | 'chill'; 
  
  // Optional fields
  freeThought?: string;
  nextDayContext?: string; // For the "Quest Giver" feature
}

export const VALIDATION_LIMITS = {
  WORK_MIN: 10,
  WORK_MAX: 5000,
  LEARN_MAX: 1000,
  LEAK_MAX: 500
};

export interface DailyStats {
  currentStreak: number;
  totalEntries: number;
  completionRate: number;
}