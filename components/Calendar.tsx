import React, { useMemo } from 'react';
import { LedgerEntry } from '../types';

interface CalendarProps {
  entries: LedgerEntry[];
  onSelectDate: (date: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ entries, onSelectDate }) => {
  const today = new Date();
  
  // Generate calendar grid for current month
  const calendarData = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = firstDay.getDay(); // 0 is Sunday
    
    const days = [];
    // Empty slots for start of month
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dateStr);
    }
    
    return days;
  }, []);

  const getEntryStyle = (dateStr: string) => {
    // Safety check if entries is undefined
    if (!entries) return 'border border-border bg-transparent hover:bg-gray-50';

    const entry = entries.find(e => e.date === dateStr);
    if (!entry) return 'border border-border bg-transparent hover:bg-gray-50';

    // Calculate density based on content length (Work + Learning)
    const totalLength = (entry.workLog?.length || 0) + (entry.learningLog?.length || 0);
    
    if (totalLength >= 1000) return 'bg-ink border-transparent text-paper';       
    if (totalLength >= 600) return 'bg-neutral-600 border-transparent text-white'; 
    if (totalLength >= 300) return 'bg-neutral-500 border-transparent text-white'; 
    if (totalLength >= 150) return 'bg-neutral-400 border-transparent text-white'; 
    return 'bg-neutral-300 border-transparent text-ink';                           
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-subtle font-sans">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {calendarData.map((dateStr, index) => {
          if (!dateStr) return <div key={`empty-${index}`} className="aspect-square" />;
          
          const dayNum = parseInt(dateStr.split('-')[2]);
          const style = getEntryStyle(dateStr);
          
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded-sm flex items-center justify-center transition-colors text-xs font-serif ${style}`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
};