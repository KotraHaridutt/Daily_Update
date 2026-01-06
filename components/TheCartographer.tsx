import React, { useState } from 'react';
import { useCartographer } from './hooks/useCartographer';
import { Zap, Activity, Box, Maximize2 } from 'lucide-react';

export const TheCartographer: React.FC = () => {
  const { threads, gridData } = useCartographer();
  const [isIsometric, setIsIsometric] = useState(false);
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);

  // PCB CONFIG
  const CELL_SIZE = 40;
  const GRID_WIDTH = 30 * CELL_SIZE; // 30 Days
  const GRID_HEIGHT = 400;

  // --- HELPER: DRAW WIRES ---
  const renderWire = (thread: any, index: number) => {
    // Offset Y slightly for each thread so they don't overlap perfectly
    const yBase = 300 - (index * 30); 
    
    let pathD = "";
    
    thread.points.forEach((p: any, i: number) => {
        const x = p.dayIndex * CELL_SIZE + (CELL_SIZE/2);
        // Voltage determines height/glow, not Y position in 2D
        // But for visual flair, let's make voltage spike the line
        const y = yBase - (p.voltage * 50); 

        if (i === 0) {
            pathD += `M ${x} ${y}`;
        } else if (p.isGap) {
            // Lazarus Jump (Curved Arch)
            const prev = thread.points[i-1];
            const prevX = prev.dayIndex * CELL_SIZE + (CELL_SIZE/2);
            const prevY = yBase - (prev.voltage * 50);
            // Cubic Bezier for the jump
            pathD += ` M ${prevX} ${prevY} C ${prevX+50} ${prevY-100}, ${x-50} ${y-100}, ${x} ${y}`;
        } else {
            // Normal connection
            pathD += ` L ${x} ${y}`;
        }
    });

    const isHovered = hoveredThread === thread.id;
    const opacity = hoveredThread && !isHovered ? 0.1 : 1;

    return (
        <g key={thread.id} style={{ opacity, transition: 'all 0.3s' }} 
           onMouseEnter={() => setHoveredThread(thread.id)}
           onMouseLeave={() => setHoveredThread(null)}>
            
            {/* 1. The Glow (Blur) */}
            <path d={pathD} fill="none" stroke={thread.color} strokeWidth={isHovered ? 6 : 3} strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" opacity="0.6" />
            
            {/* 2. The Wire (Solid) */}
            <path d={pathD} fill="none" stroke={thread.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" 
                  strokeDasharray={thread.points.some((p:any) => p.isGap) ? "5,5" : "none"} // Dash the whole line if it has jumps for effect
            />

            {/* 3. The Nodes (Soldering Points) */}
            {thread.points.map((p: any, idx: number) => !p.isGap && (
                <circle key={idx} cx={p.dayIndex * CELL_SIZE + (CELL_SIZE/2)} cy={yBase - (p.voltage * 50)} r={isHovered ? 4 : 2} fill="#fff" />
            ))}
        </g>
    );
  };

  return (
    <div className="w-full h-full bg-slate-950 overflow-hidden flex flex-col relative rounded-xl border border-slate-800 shadow-2xl">
      
      {/* HEADER */}
      <div className="absolute top-4 left-4 z-50 flex gap-4">
        <h2 className="text-slate-400 font-mono uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Motherboard_View_v1.0
        </h2>
        <button 
            onClick={() => setIsIsometric(!isIsometric)}
            className={`px-3 py-1 text-xs font-bold border rounded transition-all flex items-center gap-2
                ${isIsometric ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-transparent text-emerald-500 border-emerald-900'}
            `}
        >
            <Box className="w-3 h-3" /> {isIsometric ? 'DISENGAGE HOLO' : 'ENGAGE HOLO-DECK'}
        </button>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[radial-gradient(circle_at_center,#1e293b_0%,#020617_100%)] perspective-1000">
        
        {/* 3D TRANSFORM WRAPPER */}
        <div 
            className="transition-transform duration-1000 ease-in-out origin-center mt-20 ml-10 mb-20"
            style={{ 
                transform: isIsometric ? 'rotateX(60deg) rotateZ(-15deg) scale(0.9)' : 'none',
                transformStyle: 'preserve-3d'
            }}
        >
            <svg width={GRID_WIDTH} height={GRID_HEIGHT} className="overflow-visible">
                {/* DEFINITIONS */}
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <pattern id="grid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
                        <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="#1e293b" strokeWidth="1" />
                        <circle cx="1" cy="1" r="1" fill="#334155" />
                    </pattern>
                </defs>

                {/* LAYER 1: PCB BASE (The Motherboard) */}
                <rect width={GRID_WIDTH} height={GRID_HEIGHT} fill="url(#grid)" opacity="0.5" />

                {/* LAYER 2: COMPONENTS (The Days) */}
                {gridData.map((day, i) => {
                    if (!day) return null;
                    const height = Math.min((day.stats?.xp || 0), 100);
                    const x = i * CELL_SIZE + 5;
                    const y = 350;
                    
                    // Render "Capacitors" (Buildings) for Isometric View
                    return isIsometric ? (
                         <g key={i} transform={`translate(${x}, ${y})`}>
                            {/* Base */}
                            <rect width={30} height={30} fill="#0f172a" stroke="#334155" />
                            {/* The Tower (Height based on XP) */}
                            {height > 0 && (
                                <>
                                    <rect x="0" y={-height} width={30} height={height} fill="#1e293b" opacity="0.8" />
                                    <rect x="0" y={-height} width={30} height={2} fill={height > 80 ? '#10b981' : '#64748b'} />
                                </>
                            )}
                         </g>
                    ) : null;
                })}

                {/* LAYER 3: TRACES (The Wires) */}
                {/* We render traces AFTER the grid so they float on top */}
                {threads.map((thread, i) => renderWire(thread, i))}

                {/* LAYER 4: IMPEDANCE SPARKS (Conflicts) */}
                {/* Render sparks where multiple threads exist on the same day */}
                {gridData.map((day, i) => {
                   // Calculate how many active threads on this day
                   const activeThreads = threads.filter(t => t.points.some(p => p.dayIndex === i && !p.isGap));
                   if (activeThreads.length > 1) {
                       return (
                           <g key={`spark-${i}`} transform={`translate(${i * CELL_SIZE + 20}, 150)`}>
                               <Zap className="text-yellow-400 w-4 h-4 animate-pulse" />
                               <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                           </g>
                       );
                   }
                   return null;
                })}

            </svg>
        </div>
      </div>
    </div>
  );
};