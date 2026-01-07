import React, { useState } from 'react';
import { Power, Terminal, Loader2, Sparkles, ChevronLeft, Command } from 'lucide-react';
import { generateQuest } from '../services/aiService';

interface Props {
  isOpen: boolean;
  onConfirm: (context: string) => void;
  onCancel: () => void;
  workLog?: string;
  mood?: string;
}

export const ShutdownModal: React.FC<Props> = ({ isOpen, onConfirm, onCancel, workLog = '', mood = 'neutral' }) => {
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    const mission = await generateQuest(workLog, mood);
    if (mission) {
        setContext(mission);
    }
    setIsGenerating(false);
  };

  const hasText = context.trim().length > 0;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in"
        onClick={onCancel}
      />
      
      {/* TERMINAL WINDOW */}
      <div className="relative w-full max-w-xl bg-black border border-green-900/50 shadow-[0_0_30px_rgba(34,197,94,0.1)] font-mono text-sm overflow-hidden animate-scale-up">
        
        {/* Terminal Header */}
        <div className="bg-green-950/20 border-b border-green-900/30 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
                <Terminal className="w-4 h-4" />
                <span className="font-bold tracking-widest uppercase text-xs">dev_journal_v2.0 :: shutdown</span>
            </div>
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-900/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-900/50"></div>
            </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 space-y-6 text-gray-300">
            
            {/* System Status Lines */}
            <div className="space-y-1 text-xs opacity-70 font-mono">
                <p className="text-green-700">{'>'} SYSTEM_CHECK... OK</p>
                <p className="text-green-700">{'>'} SAVING_ENTRY... OK</p>
                <p className="text-gray-500">{'>'} AWAITING_NEXT_CONTEXT...</p>
            </div>

            {/* The Input Field */}
            <div className="relative mt-4">
                <div className="flex justify-between items-end mb-2">
                    <label className="text-green-500 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                        <span className="animate-pulse">_</span> 
                        Define Tomorrow's Mission:
                    </label>
                    
                    {/* AI Button */}
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || workLog.length < 10}
                        className="text-[10px] uppercase tracking-widest text-purple-400 hover:text-purple-300 hover:underline disabled:opacity-30 disabled:no-underline transition-all flex items-center gap-1"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {isGenerating ? "GENERATING..." : "AUTO_GENERATE"}
                    </button>
                </div>

                <div className="relative group bg-gray-900/20 border border-gray-800 focus-within:border-green-600/50 transition-colors p-3 rounded-sm">
                    <span className="absolute left-3 top-3 text-green-600 select-none">{'>'}</span>
                    <textarea 
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="w-full bg-transparent border-none text-gray-200 placeholder-gray-700 focus:ring-0 p-0 pl-4 font-mono leading-relaxed resize-none focus:outline-none"
                        placeholder="Type objective or leave empty to skip..."
                        rows={2}
                        autoFocus
                    />
                </div>
            </div>
        </div>

        {/* TERMINAL FOOTER / ACTIONS */}
        <div className="p-4 bg-black border-t border-green-900/30 flex items-center justify-between">
            
            {/* LEFT: Back Button */}
            <button 
                onClick={onCancel}
                className="group flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-green-400 transition-all uppercase tracking-widest text-xs font-bold"
            >
                <ChevronLeft className="w-3 h-3" />
                Edit
            </button>
            
            {/* RIGHT: Dynamic Action Button */}
            <div className="flex items-center gap-4">
                {hasText ? (
                    // COMMIT BUTTON (Green - "Success" feel)
                    <button 
                        onClick={() => onConfirm(context)}
                        className="flex items-center gap-2 px-6 py-2 bg-green-700 hover:bg-green-600 text-black font-bold uppercase tracking-widest text-xs rounded-sm shadow-[0_0_15px_rgba(21,128,61,0.3)] transition-all hover:shadow-[0_0_20px_rgba(21,128,61,0.5)]"
                    >
                        <Command className="w-3 h-3" />
                        Set_Objective & Exit
                    </button>
                ) : (
                    // SKIP BUTTON (Neutral Gray)
                    <button 
                        onClick={() => onConfirm(context)}
                        className="flex items-center gap-2 px-6 py-2 bg-transparent hover:bg-gray-900 text-gray-500 hover:text-gray-300 font-bold uppercase tracking-widest text-xs border border-gray-800 hover:border-gray-600 transition-all rounded-sm"
                    >
                        Skip {'>>'}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};