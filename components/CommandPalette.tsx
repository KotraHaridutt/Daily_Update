import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk'; 
import { LedgerEntry } from '../types';
import { Search, BookOpen, Code, Zap, FileText } from 'lucide-react';

interface Props {
  entries: LedgerEntry[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectDate: (date: string) => void;
  onSearchChange: (matches: string[]) => void; 
}

export const CommandPalette: React.FC<Props> = ({ 
  entries, 
  isOpen, 
  setIsOpen, 
  onSelectDate,
  onSearchChange 
}) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!search.trim()) {
      onSearchChange([]); 
      return;
    }

    const query = search.toLowerCase().trim();
    
    const matches = entries.filter(entry => {
      const fullText = `
        ${entry.workLog} 
        ${entry.learningLog} 
        ${entry.timeLeakLog} 
        ${entry.freeThought || ''}
      `.toLowerCase();
      return fullText.includes(query);
    }).map(e => e.date);

    onSearchChange(matches);
  }, [search, entries]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Helper to highlight the matching text
  const HighlightedText = ({ text, query }: { text: string, query: string }) => {
    if (!query) return <>{text}</>;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-indigo-100 text-indigo-700 font-bold px-0.5 rounded dark:bg-indigo-900 dark:text-indigo-300">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <Command.Dialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[20vh] px-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-4">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <Command.Input 
            value={search}
            onValueChange={setSearch}
            placeholder="Search entries (e.g. 'React', '#bugfix', 'SQL')..."
            className="w-full py-4 text-lg bg-transparent outline-none text-ink dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 font-sans"
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-smooth">
          <Command.Empty className="py-6 text-center text-gray-400 text-sm">
            No results found for "{search}"
          </Command.Empty>

          {entries.map((entry) => {
             const query = search.toLowerCase().trim();
             
             // 1. Determine WHERE the match is
             const workMatch = entry.workLog.toLowerCase().includes(query);
             const learnMatch = entry.learningLog.toLowerCase().includes(query);
             const leakMatch = entry.timeLeakLog.toLowerCase().includes(query);
             const thoughtMatch = (entry.freeThought || '').toLowerCase().includes(query);

             // 2. Select the snippet based on the match
             let snippetText = entry.workLog;
             let matchSource = "Work";
             
             if (workMatch) { snippetText = entry.workLog; matchSource = "Work"; }
             else if (learnMatch) { snippetText = entry.learningLog; matchSource = "Learn"; }
             else if (leakMatch) { snippetText = entry.timeLeakLog; matchSource = "Leak"; }
             else if (thoughtMatch) { snippetText = entry.freeThought || ''; matchSource = "Thought"; }

             // If the search is empty, just show work log
             if (!search) snippetText = entry.workLog;

             // Don't render if it doesn't match (unless search is empty)
             if (search && !workMatch && !learnMatch && !leakMatch && !thoughtMatch) return null;

             return (
               <Command.Item
                 key={entry.date}
                 value={`${entry.date} ${entry.workLog} ${entry.learningLog} ${entry.timeLeakLog} ${entry.freeThought}`} 
                 onSelect={() => {
                   onSelectDate(entry.date);
                   setIsOpen(false);
                 }}
                 className="group flex flex-col gap-1 p-3 rounded-lg cursor-pointer aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 transition-colors"
               >
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-400 group-aria-selected:text-blue-500">{entry.date}</span>
                    <div className="flex gap-2">
                        {workMatch && <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full"><Code className="w-3 h-3"/> Work</span>}
                        {learnMatch && <span className="flex items-center gap-1 text-[10px] bg-green-50 dark:bg-green-900/30 text-green-600 px-2 py-0.5 rounded-full"><BookOpen className="w-3 h-3"/> Learn</span>}
                        {leakMatch && <span className="flex items-center gap-1 text-[10px] bg-red-50 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full"><Zap className="w-3 h-3"/> Leak</span>}
                        {thoughtMatch && <span className="flex items-center gap-1 text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 px-2 py-0.5 rounded-full"><FileText className="w-3 h-3"/> Thought</span>}
                    </div>
                 </div>
                 
                 <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 font-serif">
                   <HighlightedText text={snippetText} query={query} />
                 </p>
               </Command.Item>
             );
          })}
        </Command.List>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider px-4">
            <span>Pro Tip: Search '#' for tags</span>
            <div className="flex gap-2">
                <span className="bg-white dark:bg-gray-700 px-1 rounded shadow-sm">Enter</span> to select
            </div>
        </div>
      </div>
    </Command.Dialog>
  );
};