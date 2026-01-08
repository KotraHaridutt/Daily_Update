import React from 'react';
import { LedgerEntry } from '../types';
import { AlertCircle, Zap, TrendingUp, History, Calendar } from 'lucide-react';

interface Props {
  currentDate: string;
  allEntries: LedgerEntry[];
}

export const RightSidebar: React.FC<Props> = ({ currentDate, allEntries }) => {
  
  // 1. GET YESTERDAY'S DATA
  const getYesterdayContext = () => {
    const today = new Date(currentDate);
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const yestISO = yest.toISOString().split('T')[0];
    
    return allEntries.find(e => e.date === yestISO);
  };

  const yesterdayEntry = getYesterdayContext();

  // 2. CALCULATE TOP TIME LEAKS (This Month)
  const getTopLeaks = () => {
    const leakMap: Record<string, number> = {};
    const currentMonth = currentDate.slice(0, 7); // "2023-10"

    allEntries
        .filter(e => e.date.startsWith(currentMonth))
        .forEach(e => {
            const leaks = e.timeLeakLog.split('\n').filter(l => l.trim().length > 0);
            leaks.forEach(leak => {
                // Clean up markdown/emoji if needed
                const clean = leak.replace(/[*_#]/g, '').trim(); 
                // Group by common terms (simplified logic)
                if (clean.includes('Social')) leakMap['Social Media'] = (leakMap['Social Media'] || 0) + 1;
                else if (clean.includes('Game')) leakMap['Games'] = (leakMap['Games'] || 0) + 1;
                else if (clean.includes('Nap')) leakMap['Napping'] = (leakMap['Napping'] || 0) + 1;
                else if (clean.includes('Think')) leakMap['Overthinking'] = (leakMap['Overthinking'] || 0) + 1;
                else if (clean.includes('Switch')) leakMap['Context Switch'] = (leakMap['Context Switch'] || 0) + 1;
                else if (clean.includes('Procrast')) leakMap['Procrastination'] = (leakMap['Procrastination'] || 0) + 1;
                else leakMap['Misc'] = (leakMap['Misc'] || 0) + 1;
            });
        });

    return Object.entries(leakMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
  };

  const topLeaks = getTopLeaks();

  // 3. GENERATE EFFORT SPARKLINE (Last 7 Days)
  const renderEffortSparkline = () => {
    const dataPoints: number[] = [];
    const today = new Date(currentDate);
    
    // Get last 7 days of effort
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const entry = allEntries.find(e => e.date === iso);
        dataPoints.push(entry ? entry.effortRating : 0);
    }

    // SVG CONFIG
    const width = 100;
    const height = 40;
    const maxVal = 5;
    const stepX = width / (dataPoints.length - 1);

    // Calculate Points: "x,y x,y x,y"
    // Note: SVG Y coordinates are inverted (0 is top, 40 is bottom)
    const points = dataPoints.map((val, index) => {
        const x = index * stepX;
        // Invert Y: value 5 -> y=0 (top), value 0 -> y=40 (bottom)
        const y = height - (val / maxVal) * height; 
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-16 mt-4 relative group">
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="effortGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.5"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                    </linearGradient>
                </defs>

                {/* The Filled Area */}
                <path 
                    d={`M 0,${height} ${points.split(' ').map(p => 'L ' + p).join(' ')} L ${width},${height} Z`} 
                    fill="url(#effortGradient)" 
                />

                {/* The Line Itself */}
                <polyline 
                    points={points} 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* Dots on points */}
                {dataPoints.map((val, index) => {
                    const x = index * stepX;
                    const y = height - (val / maxVal) * height;
                    return (
                        <circle 
                            key={index} 
                            cx={x} cy={y} r="1.5" 
                            fill={val > 0 ? "#fff" : "transparent"} 
                            stroke="#10b981" strokeWidth="1"
                        />
                    );
                })}
            </svg>
            
            {/* Tooltip Overlay (Simple) */}
            <div className="absolute top-0 right-0 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Last 7 Days
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. YESTERDAY'S CONTEXT */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3 text-gray-400 dark:text-gray-500">
            <History className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Yesterday's Context</span>
        </div>
        
        {yesterdayEntry ? (
            <div>
                 <div className="text-xs text-gray-400 mb-1">{yesterdayEntry.date}</div>
                 <div className="text-sm font-serif text-gray-800 dark:text-gray-200 line-clamp-3 italic">
                    "{yesterdayEntry.workLog.slice(0, 100)}..."
                 </div>
                 <div className="mt-3 flex flex-wrap gap-1">
                     {yesterdayEntry.mood && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 uppercase font-bold">
                            Mood: {yesterdayEntry.mood}
                        </span>
                     )}
                 </div>
            </div>
        ) : (
            <div className="text-sm text-gray-400 italic">No entry found for yesterday.</div>
        )}
      </div>

      {/* 2. TOP LEAKS */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
         <div className="flex items-center gap-2 mb-4 text-orange-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Top Leaks (Month)</span>
        </div>
        
        {topLeaks.length > 0 ? (
            <div className="space-y-3">
                {topLeaks.map(([name, count]) => (
                    <div key={name} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{name}</span>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-orange-400 rounded-full" 
                                    style={{ width: `${Math.min(count * 20, 100)}%` }} 
                                />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white text-xs w-4 text-right">{count}</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-sm text-gray-400 italic">No leaks recorded yet. Good job!</div>
        )}
      </div>

      {/* 3. EFFORT TREND (Now with Sparkline!) */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
         <div className="flex items-center gap-2 mb-2 text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Effort Trend</span>
        </div>
        
        {renderEffortSparkline()}
        
        <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono uppercase">
            <span>7 Days Ago</span>
            <span>Today</span>
        </div>
      </div>

    </div>
  );
};