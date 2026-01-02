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

  // --- HEATMAP LOGIC ---
  const getEntryStyle = (dateStr: string) => {
    if (!entries) return 'bg-gray-50 text-gray-300 border border-transparent';

    const entry = entries.find(e => e.date === dateStr);
    
    // 1. No Entry (Gray)
    if (!entry) return 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-transparent';

    // 2. Heatmap Colors based on Effort (1-5)
    // using the "Emerald" scale to match GitHub style
    const effort = entry.effortRating || 0;

    switch (effort) {
        case 1: return 'bg-emerald-200 text-emerald-800 border-transparent'; // Low
        case 2: return 'bg-emerald-300 text-emerald-900 border-transparent'; // Mild
        case 3: return 'bg-emerald-500 text-white border-transparent';       // Medium
        case 4: return 'bg-emerald-700 text-white border-transparent';       // High
        case 5: return 'bg-emerald-950 text-white border-transparent';       // Max
        default: return 'bg-gray-100 text-gray-400 border-transparent';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Legend / Key */}
      <div className="flex justify-between items-end mb-3 px-1">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {today.toLocaleString('default', { month: 'long' })}
        </span>
        <div className="flex gap-1 items-center">
            <span className="text-[8px] text-gray-300 uppercase mr-1">Less</span>
            <div className="w-2 h-2 rounded-[1px] bg-gray-100"></div>
            <div className="w-2 h-2 rounded-[1px] bg-emerald-200"></div>
            <div className="w-2 h-2 rounded-[1px] bg-emerald-500"></div>
            <div className="w-2 h-2 rounded-[1px] bg-emerald-950"></div>
            <span className="text-[8px] text-gray-300 uppercase ml-1">More</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-gray-300 font-sans font-bold">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((dateStr, index) => {
          if (!dateStr) return <div key={`empty-${index}`} className="aspect-square" />;
          
          const dayNum = parseInt(dateStr.split('-')[2]);
          const style = getEntryStyle(dateStr);
          const isFuture = dateStr > localToday;
          const entry = entries?.find(e => e.date === dateStr);
          
          return (
            // WRAPPER DIV: Handles Layout + Tooltip
            <div 
                key={dateStr}
                className="aspect-square"
                title={
                    isFuture ? "Future" : 
                    entry ? `${entry.date}: Effort ${entry.effortRating}/5` : 
                    `${dateStr}: No Entry`
                }
            >
                <button
                onClick={() => !isFuture && onSelectDate(dateStr)}
                disabled={isFuture}
                className={`
                    w-full h-full rounded-sm flex items-center justify-center text-[10px] font-mono transition-all duration-200
                    ${isFuture 
                        ? 'opacity-10 cursor-not-allowed bg-gray-100 text-transparent' 
                        : `${style} hover:ring-2 hover:ring-offset-1 hover:ring-gray-200`
                    }
                `}
                >
                {/* Only show numbers for valid days to keep it clean, or remove {dayNum} to make it pure abstract blocks like GitHub */}
                {dayNum}
                </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};