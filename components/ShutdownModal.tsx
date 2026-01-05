import React, { useState, useEffect } from 'react';
import { Power, ArrowRight, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onConfirm: (context: string) => void;
  onCancel: () => void;
}

export const ShutdownModal: React.FC<Props> = ({ isOpen, onConfirm, onCancel }) => {
  const [context, setContext] = useState('');
  const [step, setStep] = useState(0); // 0: Hidden, 1: Dim, 2: Terminal Slide

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTimeout(() => setStep(2), 500); // Delay for dramatic effect
    } else {
      setStep(0);
    }
  }, [isOpen]);

  if (!isOpen && step === 0) return null;

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-700 flex items-center justify-center ${step >= 1 ? 'bg-black/90 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
      
      {/* TERMINAL WINDOW */}
      <div className={`w-full max-w-lg bg-gray-950 border border-gray-800 rounded-lg shadow-2xl overflow-hidden transition-all duration-500 transform ${step === 2 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}>
        
        {/* Terminal Header */}
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-800">
           <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
           </div>
           <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">SYSTEM_HALT_SEQUENCE</div>
        </div>

        {/* Terminal Body */}
        <div className="p-8 font-mono">
            <div className="space-y-2 mb-6 text-sm">
                <p className="text-green-500">{`> INITIATING SHUTDOWN...`}</p>
                <p className="text-green-500">{`> SAVING WORK LOGS... DONE.`}</p>
                <p className="text-gray-400 animate-pulse">{`> DEFINE ENTRY POINT FOR NEXT SESSION:`}</p>
            </div>

            <textarea 
                className="w-full bg-gray-900 border border-gray-700 text-green-400 p-4 rounded focus:outline-none focus:border-green-500 transition-colors h-32 text-sm"
                placeholder="// e.g. Fix the Auth Bug, then Refactor API..."
                value={context}
                onChange={e => setContext(e.target.value)}
                autoFocus
            />
            
            <div className="flex justify-end gap-4 mt-6">
                <button 
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-300 text-xs uppercase font-bold tracking-wider px-4 py-2"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => onConfirm(context)}
                    className="bg-green-600 hover:bg-green-500 text-black font-bold text-xs uppercase tracking-wider px-6 py-2 rounded flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                >
                    <Power className="w-4 h-4" />
                    Commit & Shutdown
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};