import React, { useMemo, useState } from 'react';
import { LedgerEntry } from '../types';
import { BookOpen, Copy, Check, Terminal, Code, Database, Layers, X, Search, Zap as ZapIcon } from 'lucide-react';

interface Props {
  entries: LedgerEntry[];
  onClose: () => void;
}

interface Snippet {
  id: string;
  date: string;
  language: string;
  code: string;
  lines: number;
  type: 'scroll' | 'tome';
}

const getLanguageStyle = (lang: string) => {
  const l = lang.toLowerCase().trim();
  if (['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript', 'node'].includes(l)) 
    return { color: 'text-yellow-400', border: 'border-yellow-400/50', bg: 'bg-yellow-400/10', icon: <ZapIcon className="w-4 h-4" />, name: 'Lightning (JS)' };
  if (['py', 'python', 'django', 'flask'].includes(l)) 
    return { color: 'text-green-400', border: 'border-green-400/50', bg: 'bg-green-400/10', icon: <Code className="w-4 h-4" />, name: 'Nature (Python)' };
  if (['sql', 'plsql', 'postgres', 'mysql', 'db'].includes(l)) 
    return { color: 'text-blue-400', border: 'border-blue-400/50', bg: 'bg-blue-400/10', icon: <Database className="w-4 h-4" />, name: 'Water (SQL)' };
  if (['css', 'html', 'scss', 'tailwind'].includes(l)) 
    return { color: 'text-pink-400', border: 'border-pink-400/50', bg: 'bg-pink-400/10', icon: <Layers className="w-4 h-4" />, name: 'Illusion (UI)' };
  if (['sh', 'bash', 'zsh', 'terminal', 'shell', 'cmd'].includes(l)) 
    return { color: 'text-gray-400', border: 'border-gray-500/50', bg: 'bg-gray-500/10', icon: <Terminal className="w-4 h-4" />, name: 'Dark Arts (Shell)' };
  
  return { color: 'text-indigo-400', border: 'border-indigo-400/50', bg: 'bg-indigo-400/10', icon: <Code className="w-4 h-4" />, name: 'Arcane (Other)' };
};

export const Grimoire: React.FC<Props> = ({ entries, onClose }) => {
  const [filter, setFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- HARVEST SPELLS (NUCLEAR OPTION) ---
  const snippets = useMemo(() => {
    const extracted: Snippet[] = [];
    
    console.log(`🧙 Grimoire Scanning ${entries.length} entries...`);

    entries.forEach((entry, entryIndex) => {
      const fullText = `${entry.workLog}\n${entry.learningLog}\n${entry.freeThought || ''}`;
      
      // DEBUG: Log the text of the first entry to see what we are parsing
      if (entryIndex === 0) console.log("🔍 Sample Text:", fullText.substring(0, 100) + "...");

      // NEW STRATEGY: Simple Split
      // We look for triple backticks. The content between them is the block.
      // odd indexes = code blocks (1, 3, 5...)
      const parts = fullText.split('```');
      
      if (parts.length > 1) {
          // Iterate over every ODD part (which is content inside backticks)
          for (let i = 1; i < parts.length; i += 2) {
             const rawBlock = parts[i];
             if (!rawBlock.trim()) continue;

             // Logic: Usually the first word is the language (e.g. "python\n...")
             // But sometimes it's just code.
             // We split by newline to check.
             const lines = rawBlock.split('\n');
             let lang = 'txt';
             let code = rawBlock;

             // If the first line is short and has no spaces, assume it's a language tag
             const firstLine = lines[0].trim();
             if (firstLine.length > 0 && firstLine.length < 15 && !firstLine.includes(' ')) {
                lang = firstLine;
                code = lines.slice(1).join('\n').trim(); // Remove the language line
             } else {
                code = rawBlock.trim(); // It was just code with no language tag
             }

             if (code) {
                 extracted.push({
                   id: `${entry.date}-${i}`,
                   date: entry.date,
                   language: lang,
                   code: code,
                   lines: code.split('\n').length,
                   type: code.split('\n').length > 15 ? 'tome' : 'scroll'
                 });
             }
          }
      }
    });

    console.log(`🧙 Harvested ${extracted.length} spells.`);
    return extracted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  const filteredSnippets = snippets.filter(s => 
    s.code.toLowerCase().includes(filter.toLowerCase()) || 
    s.language.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-fade-in bg-white dark:bg-gray-900 p-8 rounded-xl border border-border dark:border-gray-800 shadow-sm h-full overflow-y-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-500" /> 
                The Grimoire
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {snippets.length} spells harvested.
            </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search spells..." 
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>
      </div>

      {/* GALLERY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSnippets.map((snippet) => {
            const style = getLanguageStyle(snippet.language);
            
            return (
                <div 
                    key={snippet.id} 
                    className={`group relative flex flex-col bg-gray-50 dark:bg-gray-950 border ${style.border} rounded-lg overflow-hidden transition-all hover:shadow-lg hover:scale-[1.01]`}
                >
                    <div className={`px-4 py-3 border-b ${style.border} ${style.bg} flex justify-between items-center`}>
                        <div className="flex items-center gap-2">
                            <span className={style.color}>{style.icon}</span>
                            <span className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>
                                {style.name}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 opacity-70">
                            {snippet.date}
                        </span>
                    </div>

                    <div className="p-4 flex-grow font-mono text-xs overflow-x-auto text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900">
                        <pre className="whitespace-pre-wrap break-all">
                            {snippet.type === 'scroll' 
                                ? snippet.code 
                                : snippet.code.split('\n').slice(0, 10).join('\n') + '\n... (Read more)'
                            }
                        </pre>
                    </div>

                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <div className="flex gap-2">
                             <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                {snippet.lines} LoC
                             </span>
                             {snippet.type === 'tome' && (
                                 <span className="text-[10px] uppercase font-bold text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded">
                                    Tome
                                 </span>
                             )}
                        </div>
                        <button 
                            onClick={() => handleCopy(snippet.code, snippet.id)}
                            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-ink dark:hover:text-white transition-colors"
                        >
                            {copiedId === snippet.id ? (
                                <><Check className="w-3 h-3 text-green-500" /> Copied</>
                            ) : (
                                <><Copy className="w-3 h-3" /> Copy</>
                            )}
                        </button>
                    </div>
                </div>
            );
        })}
      </div>

      {filteredSnippets.length === 0 && (
        <div className="text-center py-20 opacity-50">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-serif italic text-gray-500">Your grimoire is empty.</p>
            <div className="mt-6 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg inline-block text-left border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Check the Console (F12):</p>
                <p className="text-xs text-gray-400 mb-4">If "Sample Text" is missing the backticks, the entries aren't saving correctly.</p>
                <code className="block font-mono text-sm text-purple-600 dark:text-purple-400">
                    ```python<br/>
                    print("This format is guaranteed to work")<br/>
                    ```
                </code>
            </div>
        </div>
      )}
    </div>
  );
};