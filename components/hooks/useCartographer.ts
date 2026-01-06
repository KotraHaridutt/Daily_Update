import { useState, useEffect } from 'react';
import { LedgerService } from '../../services/ledgerService';

interface ThreadPoint {
  dayIndex: number;
  voltage: number;
  isGap: boolean;
}

interface Thread {
  id: string;
  color: string;
  points: ThreadPoint[];
}

interface DayGridData {
  date: string;
  stats?: {
    xp: number;
  };
}

export const useCartographer = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [gridData, setGridData] = useState<DayGridData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const entries = await LedgerService.getAllEntries();
        
        // Create grid data for last 30 days
        const today = new Date();
        const grid: DayGridData[] = [];
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const entry = entries.find(e => e.date === dateStr);
          grid.push({
            date: dateStr,
            stats: {
              xp: entry ? Math.min((entry.effortRating || 0) * 20, 100) : 0
            }
          });
        }
        
        setGridData(grid);

        // Create threads from entries
        const newThreads: Thread[] = [];
        const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];
        
        entries.slice(0, 6).forEach((entry, idx) => {
          const threadPoints: ThreadPoint[] = [];
          
          grid.forEach((day, dayIndex) => {
            if (day.date === entry.date) {
              threadPoints.push({
                dayIndex,
                voltage: (entry.effortRating || 0) / 5,
                isGap: false
              });
            }
          });

          if (threadPoints.length > 0) {
            newThreads.push({
              id: `thread-${idx}`,
              color: colors[idx % colors.length],
              points: threadPoints
            });
          }
        });

        setThreads(newThreads);
      } catch (error) {
        console.error('Error loading cartographer data:', error);
      }
    };

    loadData();
  }, []);

  return { threads, gridData };
};
