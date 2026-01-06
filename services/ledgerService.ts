import { LedgerEntry, DailyStats } from '../types';
import { supabase } from './supabaseClient';

// Helper to get today's date in YYYY-MM-DD
export const getTodayISO = (): string => {
  const local = new Date();
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
};

export const LedgerService = {
  // FETCH ALL ENTRIES (Async)
  getAllEntries: async (): Promise<LedgerEntry[]> => {
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
      return [];
    }

    // Map database columns (snake_case) to app types (camelCase)
    return data.map((row: any) => ({
      id: row.id,
      date: row.date,
      workLog: row.work_log,
      learningLog: row.learning_log,
      timeLeakLog: row.time_leak_log,
      effortRating: row.effort_rating,
      freeThought: row.free_thought,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.created_at).getTime(), // Supabase handles timestamps
    }));
  },

  // GET SINGLE ENTRY
  getEntryByDate: async (date: string): Promise<LedgerEntry | undefined> => {
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('date', date)
      .single();

    if (error || !data) return undefined;

    return {
      id: data.id,
      date: data.date,
      workLog: data.work_log,
      learningLog: data.learning_log,
      timeLeakLog: data.time_leak_log,
      effortRating: data.effort_rating,
      freeThought: data.free_thought,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.created_at).getTime(),
    };
  },

  // SAVE OR UPDATE (Upsert)
  saveEntry: async (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    // Map app types to database columns
    const dbPayload = {
      date: entry.date,
      work_log: entry.workLog,
      learning_log: entry.learningLog,
      time_leak_log: entry.timeLeakLog,
      effort_rating: entry.effortRating,
      free_thought: entry.freeThought,
    };

    // Upsert: Updates if date exists, Inserts if it doesn't
    const { error } = await supabase
      .from('daily_entries')
      .upsert(dbPayload, { onConflict: 'date' });

    if (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  },

  // CALCULATE STATS (Now Async)
  getStats: async (): Promise<DailyStats> => {
    const entries = await LedgerService.getAllEntries();
    const sortedDates = entries.map(e => e.date).sort();
    
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalEntries: 0, completionRate: 0 };
    }

    // --- Same Logic as before, just reused ---
    let maxStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    
    const today = getTodayISO();
    const dateSet = new Set(sortedDates);
    
    // Current Streak
    let checkDate = new Date();
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

    // Longest Streak
    if (sortedDates.length > 0) {
        tempStreak = 1;
        maxStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prev = new Date(sortedDates[i-1]);
            const curr = new Date(sortedDates[i]);
            const diffTime = Math.abs(curr.getTime() - prev.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) tempStreak++;
            else tempStreak = 1;
            
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        }
    }

    const firstDate = new Date(sortedDates[0]);
    const now = new Date();
    const totalDaysSinceStart = Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)) || 1;
    
    return {
      currentStreak,
      longestStreak: maxStreak,
      totalEntries: sortedDates.length,
      completionRate: Math.round((sortedDates.length / totalDaysSinceStart) * 100)
    };
  },

  // GET RANDOM PAST ENTRY FOR GHOST
  getGhostMemory: async (): Promise<{ date: string; content: string } | null> => {
    const entries = await LedgerService.getAllEntries();
    if (entries.length === 0) return null;

    // Get a random entry from the past (not today)
    const today = getTodayISO();
    const pastEntries = entries.filter(e => e.date !== today && e.workLog.length > 50);
    
    if (pastEntries.length === 0) return null;

    const randomEntry = pastEntries[Math.floor(Math.random() * pastEntries.length)];
    
    return {
      date: randomEntry.date,
      content: randomEntry.workLog
    };
  }
};