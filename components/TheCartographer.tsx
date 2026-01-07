import React, { useState } from 'react';
import { useCartographer } from '@/src/hooks/useCartographer';
import { Cpu, Zap, Activity } from 'lucide-react';

export const TheCartographer: React.FC = () => {
  const { threads, gridData } = useCartographer();
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);

  // PCB DIMENSIONS
  const CELL_WIDTH = 60;
  const CELL_HEIGHT = 200; // Height of the drawing area
  const TOTAL_WIDTH = gridData.length * CELL_WIDTH;

  // --- HELPER: DRAW WIRES ---
  const renderWire = (thread: any, index: number) => {
    // We stagger the Y position of wires so they don't overlap
    // "Bus" lines run at the bottom
    const busY = 150 + (index * 10); 
    
    let pathD = "";
    
    thread.points.forEach((p: any, i: number) => {
        const x = p.dayIndex * CELL_WIDTH + (CELL_WIDTH/2);
        const nodeY = 80; // The chip is at the top
        
        if (i === 0) {
            // Start at the chip
            pathD += `M ${x} ${nodeY} L ${x} ${busY}`;
        } else {
            // Draw line from previous bus position to current bus position
            const prev = thread.points[i-1];
            const prevX = prev.dayIndex * CELL_WIDTH + (CELL_WIDTH/2);
            pathD += ` L ${prevX} ${busY} L ${x} ${busY} L ${x} ${nodeY}`;
        }
    });

    const isHovered = hoveredThread === thread.id;
    
    return (
        <g key={thread.id} 
           style={{ opacity: hoveredThread && !isHovered ? 0.1 : 1, transition: 'opacity 0.3s' }}
           onMouseEnter={() => setHoveredThread(thread.id)}
           onMouseLeave={() => setHoveredThread(null)}
        >
            {/* Glow Effect */}
            <path d={pathD} fill="none" stroke={thread.color} strokeWidth={isHovered ? 4 : 2} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" filter="url(#glow)" />
            {/* Solid Wire */}
            <path d={pathD} fill="none" stroke={thread.color} strokeWidth={1} strokeLinecap="square" />
            
            {/* The Tag Label (Only show on first point) */}
            {thread.points.length > 0 && (
                <text x={thread.points[0].dayIndex * CELL_WIDTH} y={busY + 4} fill={thread.color} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    #{thread.id}
                </text>
            )}
        </g>
    );
  };

  return (
    <div className="w-full bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-2xl overflow-hidden relative group">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 z-10 relative">
        <h2 className="text-slate-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" /> 
            System_Bus_Map // Last 14 Cycles
        </h2>
      </div>

      {/* SCROLLABLE CANVAS */}
      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div style={{ width: Math.max(TOTAL_WIDTH, 800), height: 350 }} className="relative">
            
            <svg width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none z-0">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                {/* Render Wires */}
                {threads.map((thread, i) => renderWire(thread, i))}
            </svg>

            {/* RENDER CHIPS (DAYS) */}
            <div className="flex z-10 relative" style={{ height: 100 }}>
                {gridData.map((day, i) => {
                    const hasData = !!day.data;
                    const mood = day.data?.mood || 'neutral';
                    
                    // Chip Colors based on Mood
                    const chipColor = 
                        mood === 'flow' ? 'bg-emerald-500 shadow-emerald-500/50' :
                        mood === 'stuck' ? 'bg-red-500 shadow-red-500/50' :
                        mood === 'chill' ? 'bg-blue-500 shadow-blue-500/50' :
                        'bg-slate-700';

                    return (
                        <div key={i} style={{ width: CELL_WIDTH }} className="flex flex-col items-center justify-start pt-4 relative group/chip">
                            {/* The Chip */}
                            <div className={`
                                w-8 h-10 rounded-sm border border-slate-900 transition-all duration-300
                                ${hasData ? chipColor + ' shadow-lg' : 'bg-slate-900 border-slate-800'}
                            `}>
                                {/* Pins */}
                                <div className="absolute -left-1 top-2 w-1 h-1 bg-slate-500 rounded-full"></div>
                                <div className="absolute -right-1 top-2 w-1 h-1 bg-slate-500 rounded-full"></div>
                                <div className="absolute -left-1 top-6 w-1 h-1 bg-slate-500 rounded-full"></div>
                                <div className="absolute -right-1 top-6 w-1 h-1 bg-slate-500 rounded-full"></div>
                            </div>

                            {/* Date Label */}
                            <span className="mt-2 text-[10px] font-mono text-slate-500 rotate-0">
                                {day.date.slice(5)}
                            </span>

                            {/* XP Indicator (Voltage) */}
                            {hasData && (
                                <div className="absolute -bottom-6 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-yellow-500" />
                                    <span className="text-[9px] font-bold text-slate-400">{day.data.effortRating}v</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
      </div>
    </div>
  );
};