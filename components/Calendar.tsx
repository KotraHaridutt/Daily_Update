import React, { useMemo } from 'react';
import { LedgerEntry } from '../types';

interface CalendarProps {
  entries: LedgerEntry[];
  onSelectDate: (date: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ entries, onSelectDate }) => {
  const today = new Date();
  const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
    .toISOString()
    .split('T')[0];
  
  const calendarData = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = firstDay.getDay(); 
    
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  }, []);

  const getEntryStyle = (dateStr: string) => {
    if (!entries) return 'border border-border bg-transparent hover:bg-gray-50';

    const entry = entries.find(e => e.date === dateStr);
    if (!entry) return 'border border-border bg-transparent hover:bg-gray-50';

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
          const isFuture = dateStr > localToday;
          
          return (
            // WRAPPER DIV: Handles Layout + Tooltip (Always Interactive)
            <div 
                key={dateStr}
                className="aspect-square"
                title={isFuture ? "Future date: Cannot edit yet" : `View Log for ${dateStr}`}
            >
                <button
                onClick={() => !isFuture && onSelectDate(dateStr)}
                disabled={isFuture}
                className={`
                    w-full h-full rounded-sm flex items-center justify-center text-xs font-serif transition-colors
                    ${isFuture 
                        ? 'opacity-20 cursor-not-allowed bg-gray-100 text-gray-400' 
                        : style
                    }
                `}
                >
                {dayNum}
                </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};