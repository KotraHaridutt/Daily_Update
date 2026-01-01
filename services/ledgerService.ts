import { LedgerEntry, DailyStats } from '../types';

const STORAGE_KEY = 'daily_execution_ledger_v1';

/**
 * DATABASE SCHEMA (Conceptual - SQLite)
 * 
 * TABLE entries (
 *   id TEXT PRIMARY KEY,
 *   date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD
 *   work_log TEXT NOT NULL,
 *   learning_log TEXT NOT NULL,
 *   time_leak_log TEXT NOT NULL,
 *   effort_rating INTEGER NOT NULL CHECK(effort_rating BETWEEN 1 AND 5),
 *   free_thought TEXT,
 *   created_at INTEGER NOT NULL,
 *   updated_at INTEGER NOT NULL
 * );
 */

// Helper to generate UUID-like string
const generateId = () => Math.random().toString(36).substr(2, 9);

export const getTodayISO = (): string => {
  const local = new Date();
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
};

// Simulate API calls
export const LedgerService = {
  getAllEntries: (): LedgerEntry[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load entries", e);
      return [];
    }
  },

  getEntryByDate: (date: string): LedgerEntry | undefined => {
    const entries = LedgerService.getAllEntries();
    return entries.find(e => e.date === date);
  },

  saveEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>): LedgerEntry => {
    const entries = LedgerService.getAllEntries();
    const now = Date.now();
    
    // Check if update or create
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    let savedEntry: LedgerEntry;

    if (existingIndex >= 0) {
      // Update
      savedEntry = {
        ...entries[existingIndex],
        ...entry,
        updatedAt: now,
      };
      entries[existingIndex] = savedEntry;
    } else {
      // Create
      savedEntry = {
        ...entry,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      entries.push(savedEntry);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return savedEntry;
  },

  getStats: (): DailyStats => {
    const entries = LedgerService.getAllEntries();
    const sortedDates = entries.map(e => e.date).sort();
    
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalEntries: 0, completionRate: 0 };
    }

    // Calculate Streaks
    let maxStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    
    // Naive streak calculation (assuming sorted dates)
    const today = getTodayISO();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    
    // Convert to Set for easy lookup
    const dateSet = new Set(sortedDates);
    
    // Calculate Current Streak
    let checkDate = new Date();
    // If today is filled, start from today, else start from yesterday
    if (!dateSet.has(today)) {
       checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      if (dateSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate Longest Streak
    // Convert dates to timestamps to check continuity
    if (sortedDates.length > 0) {
        tempStreak = 1;
        maxStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prev = new Date(sortedDates[i-1]);
            const curr = new Date(sortedDates[i]);
            const diffTime = Math.abs(curr.getTime() - prev.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        }
    }

    // Completion Rate (based on first entry date)
    const firstDate = new Date(sortedDates[0]);
    const now = new Date();
    const totalDaysSinceStart = Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)) || 1;
    
    return {
      currentStreak,
      longestStreak: maxStreak,
      totalEntries: sortedDates.length,
      completionRate: Math.round((sortedDates.length / totalDaysSinceStart) * 100)
    };
  }
};