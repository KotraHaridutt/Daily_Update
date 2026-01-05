import React, { useState, useEffect } from 'react';

interface Props {
  context: string; // The text from yesterday
  onComplete: (accepted: boolean) => void;
}

export const BootSequence: React.FC<Props> = ({ context, onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);

  // The Script
  const sequence = [
    "> BIOS_CHECK... OK",
    "> LOADING_KERNEL... OK",
    "> MOUNTING_DRIVES... OK",
    "> ACCESSING_ARCHIVE_MEMORY...",
    `> FOUND_CONTEXT_PACKET: "${context.slice(0, 30)}..."`,
  ];

  useEffect(() => {
    let delay = 0;
    sequence.forEach((line, i) => {
        delay += 400 + (Math.random() * 300); // Random typing speed
        setTimeout(() => {
            setLines(prev => [...prev, line]);
            if (i === sequence.length - 1) setShowPrompt(true);
        }, delay);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-green-500 font-mono p-8 md:p-20 flex flex-col justify-center">
      <div className="max-w-2xl w-full mx-auto space-y-2">
        {lines.map((line, i) => (
            <div key={i} className="typewriter text-sm md:text-base opacity-90">
                {line}
            </div>
        ))}

        {showPrompt && (
            <div className="mt-8 pt-4 border-t border-green-900 animate-fade-in">
                <p className="text-gray-400 mb-4 text-sm uppercase tracking-widest">
                    Yesterday's Promise detected.
                </p>
                <div className="text-xl md:text-3xl font-bold text-white mb-8 border-l-4 border-green-500 pl-4">
                    "{context}"
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => onComplete(true)}
                        className="bg-green-600 text-black px-8 py-3 font-bold uppercase tracking-wider hover:bg-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-all"
                    >
                        [Y] Accept Mission
                    </button>
                    <button 
                        onClick={() => onComplete(false)}
                        className="border border-green-800 text-green-700 px-8 py-3 font-bold uppercase tracking-wider hover:bg-green-900/20 hover:text-green-500 transition-all"
                    >
                        [N] Discard
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};