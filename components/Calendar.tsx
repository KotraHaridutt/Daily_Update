import React, { useMemo } from 'react';
import { LedgerEntry } from '../types';

interface CalendarProps {
  entries: LedgerEntry[];
  onSelectDate: (date: string) => void;
  highlightedDates?: string[]; // <--- NEW PROP (Dates matching search)
}

export const Calendar: React.FC<CalendarProps> = ({ entries, onSelectDate, highlightedDates }) => {
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
    // 1. SEARCH MODE: If search is active (highlightedDates exists)
    if (highlightedDates) {
        if (highlightedDates.includes(dateStr)) {
            // MATCH! Show Blue/Purple Ring + Original Color
            // We use 'ring' to show it matched without overriding the green effort
            return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500 ring-offset-1 z-10';
        } else {
            // NO MATCH: Fade it out completely
            return 'bg-gray-50 dark:bg-gray-800/30 text-gray-200 dark:text-gray-800 opacity-30';
        }
    }

    // 2. NORMAL MODE: Standard Heatmap
    if (!entries) return 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border border-transparent';

    const entry = entries.find(e => e.date === dateStr);
    
    if (!entry) return 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent';

    const effort = entry.effortRating || 0;

    switch (effort) {
        case 1: return 'bg-emerald-200 text-emerald-800 border-transparent'; 
        case 2: return 'bg-emerald-300 text-emerald-900 border-transparent'; 
        case 3: return 'bg-emerald-500 text-white border-transparent';       
        case 4: return 'bg-emerald-700 text-white border-transparent';       
        case 5: return 'bg-emerald-950 text-white border-transparent';       
        default: return 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Legend / Key */}
      <div className="flex justify-between items-end mb-3 px-1">
        <span className="text-[10px] font-bold text-gray-300 dark:text-gray-500 uppercase tracking-widest">
            {today.toLocaleString('default', { month: 'long' })}
        </span>
        
        {/* Hide legend during search to reduce noise */}
        {!highlightedDates && (
            <div className="flex gap-1 items-center">
                <span className="text-[8px] text-gray-300 dark:text-gray-500 uppercase mr-1">Less</span>
                <div className="w-2 h-2 rounded-[1px] bg-gray-100 dark:bg-gray-800"></div>
                <div className="w-2 h-2 rounded-[1px] bg-emerald-200"></div>
                <div className="w-2 h-2 rounded-[1px] bg-emerald-500"></div>
                <div className="w-2 h-2 rounded-[1px] bg-emerald-950"></div>
                <span className="text-[8px] text-gray-300 dark:text-gray-500 uppercase ml-1">More</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-gray-300 dark:text-gray-600 font-sans font-bold">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((dateStr, index) => {
          if (!dateStr) return <div key={`empty-${index}`} className="aspect-square" />;
          
          const dayNum = parseInt(dateStr.split('-')[2]);
          const style = getEntryStyle(dateStr);
          const isFuture = dateStr > localToday;
          
          // Disable "Future" logic if we are searching (we just want to see data)
          // Actually, keep future logic for consistency, but search matches won't be future anyway.
          
          return (
            <div 
                key={dateStr}
                className="aspect-square"
            >
                <button
                onClick={() => !isFuture && onSelectDate(dateStr)}
                disabled={isFuture}
                className={`
                    w-full h-full rounded-sm flex items-center justify-center text-[10px] font-mono transition-all duration-300
                    ${isFuture 
                        ? 'opacity-10 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-transparent' 
                        : `${style} hover:scale-110` // Added scale effect for search matches
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