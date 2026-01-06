import { useState, useEffect } from 'react';
import { LedgerService } from '../services/ledgerService';

export interface TracePoint {
  dayIndex: number; // 0 to 29 (Last 30 days)
  date: string;
  voltage: number; // 0 to 1 (Effort)
  isGap: boolean; // True if this is a "Lazarus Jump"
}

export interface CircuitThread {
  id: string; // e.g., "#python"
  color: string;
  points: TracePoint[];
}

const COLORS = {
  python: '#10b981', // Neon Green
  sql: '#3b82f6',    // Electric Blue
  react: '#f59e0b',  // Amber
  js: '#ec4899',     // Pink
  other: '#6366f1'   // Indigo
};

export const useCartographer = () => {
  const [threads, setThreads] = useState<CircuitThread[]>([]);
  const [gridData, setGridData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const store = await LedgerService.getStore();
      const today = new Date();
      const last30Days: string[] = [];
      const rawData: any[] = [];

      // 1. Generate Last 30 Days
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        last30Days.push(iso);
        rawData.push(store[iso] || null);
      }

      setGridData(rawData);

      // 2. Extract Threads (Hashtags)
      const threadMap: Record<string, TracePoint[]> = {};

      rawData.forEach((entry, idx) => {
        if (!entry) return;
        
        // Find tags (e.g., #python, #sql)
        const text = (entry.workLog + " " + entry.learningLog).toLowerCase();
        const foundTags = text.match(/#[a-z0-9]+/g) || ['#other'];

        // Calculate Voltage (XP / 100)
        const voltage = Math.min((entry.stats?.xp || 0) / 100, 1.2); 

        foundTags.forEach(tag => {
          if (!threadMap[tag]) threadMap[tag] = [];
          
          // Detect Lazarus Jump (Gap > 2 days)
          const lastPoint = threadMap[tag][threadMap[tag].length - 1];
          if (lastPoint && (idx - lastPoint.dayIndex) > 1) {
             // Add a "Gap" point to tell the renderer to draw a jumper cable
             threadMap[tag].push({ dayIndex: idx, date: last30Days[idx], voltage: 0, isGap: true });
          }

          threadMap[tag].push({ dayIndex: idx, date: last30Days[idx], voltage, isGap: false });
        });
      });

      // 3. Format for Renderer
      const builtThreads = Object.keys(threadMap).map(tag => ({
        id: tag,
        color: COLORS[tag.replace('#', '') as keyof typeof COLORS] || COLORS.other,
        points: threadMap[tag]
      }));

      setThreads(builtThreads);
    };

    loadData();
  }, []);

  return { threads, gridData };
};