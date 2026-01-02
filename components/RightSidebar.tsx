import React, { useMemo } from 'react';
import { LedgerEntry } from '../types';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';

interface RightSidebarProps {
  currentDate: string;
  allEntries: LedgerEntry[];
}

const TIME_LEAKS_LIST = ['Social Media', 'Games', 'Napping', 'Overthinking', 'Context Switch', 'Procrastination'];

export const RightSidebar: React.FC<RightSidebarProps> = ({ currentDate, allEntries }) => {
  
  // 1. Get Yesterday's Data
  const yesterdayEntry = useMemo(() => {
    const curr = new Date(currentDate);
    curr.setDate(curr.getDate() - 1); // Subtract 1 day
    const yStr = curr.toISOString().split('T')[0];
    return allEntries.find(e => e.date === yStr);
  }, [currentDate, allEntries]);

  // 2. Calculate Top Time Leaks (This Month)
  const leakStats = useMemo(() => {
    const currentMonth = new Date(currentDate).getMonth();
    const monthEntries = allEntries.filter(e => new Date(e.date).getMonth() === currentMonth);
    
    const counts: Record<string, number> = {};
    monthEntries.forEach(entry => {
        TIME_LEAKS_LIST.forEach(leak => {
            if (entry.timeLeakLog.includes(leak)) {
                counts[leak] = (counts[leak] || 0) + 1;
            }
        });
    });

    // Sort by frequency and take top 3
    return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
  }, [allEntries, currentDate]);

  // 3. Last 7 Days Effort Graph data
  const effortHistory = useMemo(() => {
    // Get last 7 entries sorted by date
    return [...allEntries]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7);
  }, [allEntries]);

  return (
    <div className="space-y-6">
        
      {/* WIDGET 1: YESTERDAY'S REVIEW (The Accountability Mirror) */}
      <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Yesterday's Context</h3>
        </div>
        
        {yesterdayEntry ? (
            <div className="space-y-3">
                <div className="text-xs text-subtle font-mono">{yesterdayEntry.date}</div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">You Worked On</p>
                    <p className="text-sm text-ink font-serif line-clamp-3 leading-relaxed">
                        {yesterdayEntry.workLog}
                    </p>
                </div>
                {yesterdayEntry.learningLog && (
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">You Learned</p>
                        <p className="text-sm text-ink font-serif line-clamp-2 leading-relaxed">
                            {yesterdayEntry.learningLog}
                        </p>
                    </div>
                )}
            </div>
        ) : (
            <div className="py-4 text-center">
                <p className="text-xs text-gray-400 italic">No entry found for yesterday.</p>
                <p className="text-[10px] text-gray-300 mt-1">Starting fresh today!</p>
            </div>
        )}
      </div>

      {/* WIDGET 2: TOP LEAKS (The Warning System) */}
      <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-400">
            <Zap className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Top Leaks (Month)</h3>
        </div>
        
        {leakStats.length > 0 ? (
            <div className="space-y-3">
                {leakStats.map(([leak, count]) => (
                    <div key={leak} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{leak}</span>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-orange-400 rounded-full" 
                                    style={{ width: `${Math.min((count / 5) * 100, 100)}%` }}
                                />
                            </div>
                            <span className="font-mono text-xs font-bold">{count}</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-xs text-gray-400 italic">No major leaks detected yet.</p>
        )}
      </div>

      {/* WIDGET 3: EFFORT TREND (The Mini Graph) */}
      <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-400">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Effort Trend (Last 7)</h3>
        </div>
        
        <div className="flex items-end justify-between h-16 gap-1">
            {effortHistory.map((entry) => (
                <div key={entry.date} className="flex flex-col items-center gap-1 flex-1">
                     <div 
                        className={`w-full rounded-sm transition-all ${
                            entry.effortRating >= 4 ? 'bg-emerald-500' : 
                            entry.effortRating >= 3 ? 'bg-emerald-300' : 'bg-gray-200'
                        }`}
                        style={{ height: `${(entry.effortRating / 5) * 100}%` }}
                     />
                </div>
            ))}
            {/* Fillers if less than 7 days */}
            {[...Array(Math.max(0, 7 - effortHistory.length))].map((_, i) => (
                <div key={i} className="flex-1 h-full flex items-end">
                    <div className="w-full h-0.5 bg-gray-100"></div>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
};