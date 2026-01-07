import { useState, useEffect } from 'react';
import { LedgerService } from '@/services/ledgerService';

export interface TracePoint {
  dayIndex: number; // 0 to 29 (Last 30 days)
  date: string;
  voltage: number; // Effort (0-5)
  mood: 'flow' | 'stuck' | 'chill' | 'neutral';
  isGap: boolean; // True if we need a "jumper wire" over a weekend
}

export interface CircuitThread {
  id: string; // e.g., "#python"
  color: string;
  points: TracePoint[];
}

const COLORS = {
  coding: '#10b981', // Emerald
  bugfix: '#ef4444', // Red
  learning: '#f59e0b', // Amber
  meeting: '#6366f1', // Indigo
  planning: '#8b5cf6', // Violet
  review: '#ec4899', // Pink
  other: '#94a3b8'   // Slate
};

export const useCartographer = () => {
  const [threads, setThreads] = useState<CircuitThread[]>([]);
  const [gridData, setGridData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const entries = await LedgerService.getAllEntries();
      const store: Record<string, any> = {};
      for (const e of entries) {
        store[e.date] = e;
      }
      const today = new Date();
      const rawData: any[] = [];
      const DAYS_TO_SHOW = 14; // View last 2 weeks for cleaner UI

      // 1. Generate Last 14 Days (Reverse Chronological)
      for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        rawData.push({
          date: iso,
          data: store[iso] || null,
          index: i
        });
      }

      setGridData(rawData);

      // 2. Extract Threads (Hashtags)
      const threadMap: Record<string, TracePoint[]> = {};

      rawData.forEach((entry, idx) => {
        if (!entry.data) return;
        
        // Find tags (e.g., #python, #sql)
        const text = (entry.data.workLog + " " + entry.data.learningLog).toLowerCase();
        // Regex to find hashtags
        const foundTags = text.match(/#[a-z0-9]+/g) || [];

        const voltage = entry.data.effortRating || 0;
        const mood = entry.data.mood || 'neutral';

        foundTags.forEach(tag => {
          const cleanTag = tag.replace('#', '');
          if (!threadMap[cleanTag]) threadMap[cleanTag] = [];
          
          threadMap[cleanTag].push({ 
              dayIndex: idx, 
              date: entry.date, 
              voltage, 
              mood,
              isGap: false 
          });
        });
      });

      // 3. Format for Renderer
      // Only keep threads that have at least 2 points (otherwise no line to draw)
      const builtThreads = Object.keys(threadMap)
        .filter(tag => threadMap[tag].length >= 1) 
        .map((tag, i) => ({
          id: tag,
          // Cycle through colors based on tag name length or index
          color: (COLORS as any)[tag] || Object.values(COLORS)[i % 5],
          points: threadMap[tag]
        }));

      setThreads(builtThreads);
    };

    loadData();
  }, []);

  return { threads, gridData };
};