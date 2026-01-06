import React, { useState, useEffect } from 'react';
import { Ghost, RefreshCw, Trash2, ShieldAlert, Skull, Brain } from 'lucide-react';

interface Props {
  memory: { date: string; content: string } | null;
  onClose: () => void;
  onReinforce: () => void; // User saves the memory
  onDiscard: () => void;   // User lets it rot
}

// 🧟 BIT ROT ALGORITHM
const rotText = (text: string, severity: number) => {
  if (severity === 0) return text;
  if (severity >= 100) return "[ DATA_SEGMENT_LOST // 0x00000F ]";

  const chars = text.split('');
  return chars.map(char => {
    // Keep spaces
    if (char === ' ') return ' ';
    
    // Chance to corrupt based on severity (0.0 to 1.0)
    if (Math.random() < (severity / 100)) {
        const glitches = ['*', '#', '$', '%', '&', '0', '1', '!', '?', '_'];
        return glitches[Math.floor(Math.random() * glitches.length)];
    }
    return char;
  }).join('');
};

export const MnemosyneGhost: React.FC<Props> = ({ memory, onClose, onReinforce, onDiscard }) => {
  if (!memory) return null;

  const [severity, setSeverity] = useState(30); // Start at 30% rot
  const [displayContent, setDisplayContent] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 1. ANIMATE ROT
  useEffect(() => {
    if (isDead || isSaved) return;

    // The text shifts and glitches every 200ms
    const interval = setInterval(() => {
        setDisplayContent(rotText(memory.content, isHovered ? Math.max(0, severity - 20) : severity));
    }, 150);

    return () => clearInterval(interval);
  }, [memory, severity, isHovered, isDead, isSaved]);

  // 2. INCREASE ENTROPY OVER TIME (The threat)
  useEffect(() => {
    if (isDead || isSaved) return;
    
    // Every 2 seconds, it gets worse
    const decay = setInterval(() => {
        setSeverity(prev => {
            if (prev >= 90) {
                setIsDead(true); // Memory Dies
                return 100;
            }
            return prev + 5;
        });
    }, 2000);

    return () => clearInterval(decay);
  }, [isSaved, isDead]);

  // --- RENDER: DEAD MEMORY (Graveyard) ---
  if (isDead) {
      return (
        <div className="fixed top-24 right-8 w-80 bg-red-950/90 border border-red-600 p-4 rounded-lg shadow-[0_0_20px_rgba(255,0,0,0.3)] animate-pulse font-mono z-50">
            <div className="flex items-center gap-2 text-red-500 mb-2 font-bold uppercase tracking-widest">
                <Skull className="w-5 h-5" /> Memory Expunged
            </div>
            <div className="bg-black p-3 text-red-800 text-xs font-mono mb-4 break-all">
                0x4F 0x00 [CORRUPTED_SECTOR] {memory.date}
                <br/>&gt;&gt; RECOVERY_FAILED
            </div>
            <button 
                onClick={onDiscard}
                className="w-full py-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-xs border border-red-800 uppercase"
            >
                Close Case
            </button>
        </div>
      );
  }

  // --- RENDER: SAVED MEMORY (Success) ---
  if (isSaved) {
      return (
        <div className="fixed top-24 right-8 w-80 bg-green-950/90 border border-green-500 p-4 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.2)] animate-in fade-in zoom-in font-mono z-50">
            <div className="flex items-center gap-2 text-green-400 mb-2 font-bold uppercase tracking-widest">
                <Brain className="w-5 h-5" /> Memory Reinforced
            </div>
            <div className="text-green-100 text-sm mb-2 italic">
                "{memory.content}"
            </div>
            <div className="text-green-600 text-[10px] uppercase">
                Neural Pathway Strengthened +20XP
            </div>
            <button onClick={onClose} className="absolute top-2 right-2 text-green-700 hover:text-green-400">×</button>
        </div>
      );
  }

  // --- RENDER: THE HAUNTING (Active) ---
  return (
    <div 
        className="fixed top-24 right-8 w-80 bg-gray-900/95 backdrop-blur-sm border-l-4 border-purple-500 p-5 rounded-r-lg shadow-2xl font-mono z-50 transition-all duration-300 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-purple-400">
            <Ghost className={`w-5 h-5 ${severity > 50 ? 'animate-bounce' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-widest">Mnemosyne Protocol</span>
        </div>
        <span className="text-[10px] text-gray-500">{memory.date}</span>
      </div>

      {/* Glitchy Content */}
      <div className="relative bg-black/50 p-3 rounded border border-gray-700 mb-4 min-h-[80px]">
         {/* Scanline Effect */}
         <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
         
         <p className={`text-sm font-mono leading-relaxed transition-colors duration-300 ${isHovered ? 'text-white' : 'text-gray-400 blur-[0.5px]'}`}>
            {displayContent}
         </p>
         
         {/* Integrity Bar */}
         <div className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-1000" style={{ width: `${severity}%` }}></div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button 
            onClick={() => { setIsSaved(true); setTimeout(onReinforce, 2000); }}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-105"
        >
            <RefreshCw className="w-3 h-3" /> Reinforce
        </button>
        
        <button 
            onClick={() => { setSeverity(100); setIsDead(true); }}
            className="px-3 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-700 rounded transition-colors"
            title="Discard Memory"
        >
            <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Warning Label */}
      <div className="mt-2 text-center">
         <span className={`text-[9px] uppercase tracking-widest transition-colors ${severity > 60 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
            {severity > 60 ? '⚠️ Data Decay Imminent' : 'System Stable'}
         </span>
      </div>
    </div>
  );
};