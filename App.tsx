import React, { useState, useEffect } from 'react';
import { LedgerEntry, DailyStats } from './types';
import { LedgerService, getTodayISO } from './services/ledgerService';
import { DailyEntryForm } from './components/DailyEntryForm';
import { Calendar } from './components/Calendar';
import { RightSidebar } from './components/RightSidebar';
import { CommandPalette } from './components/CommandPalette';
import { CheatSheet } from './components/CheatSheet'; 
import { TechRadar } from './components/TechRadar';
import { Grimoire } from './components/Grimoire';
import { BootSequence } from './components/BootSequence';
import { TheCartographer } from './components/TheCartographer';

// Added ArrowDown to imports
import { Loader2, LayoutDashboard, Calendar as CalIcon, Moon, Sun, Search as SearchIcon, Maximize2, Minimize2, BarChart2, BookOpen, ArrowDown } from 'lucide-react';

const App: React.FC = () => {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const todayISO = getTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [allEntries, setAllEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- BOOT STATE ---
  const [bootData, setBootData] = useState<string | null>(null);
  const [showBoot, setShowBoot] = useState(false);

  const [view, setView] = useState<'entry' | 'stats' | 'grimoire' | 'map'>('entry');
  
  // --- UI STATES ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [searchMatches, setSearchMatches] = useState<string[]>([]);

  // DARK MODE STATE
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const checkBoot = async () => {
        // 1. Get Yesterday's Date
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayISO = yesterday.toISOString().split('T')[0];

        // 2. Find entries
        const all = await LedgerService.getAllEntries();
        const todayEntry = all.find(e => e.date === getTodayISO());
        const yesterdayEntry = all.find(e => e.date === yesterdayISO);

        // 3. Logic: If Today is empty AND Yesterday has context
        if (!todayEntry && yesterdayEntry?.nextDayContext) {
            setBootData(yesterdayEntry.nextDayContext);
            setShowBoot(true);
        }
    };
    checkBoot();
  }, []);

  const handleBootComplete = (accepted: boolean) => {
    setShowBoot(false);
    if (!accepted) setBootData(null); // Clear data if rejected
  };

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
        const isTyping = (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT';

        if (!isTyping) {
            if (e.key === 'ArrowLeft') {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev.toISOString().split('T')[0]);
                setView('entry'); // Switch back to entry if navigating
            }
            if (e.key === 'ArrowRight') {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next.toISOString().split('T')[0]);
                setView('entry');
            }
            if (e.key.toLowerCase() === 't') {
                setSelectedDate(todayISO);
                setView('entry');
            }
        }

        if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
            setIsZenMode(prev => !prev);
        }

        if (e.key === '?' && e.shiftKey && !isTyping) {
            setIsCheatSheetOpen(true);
        }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [selectedDate, todayISO]);

  const currentEntry = allEntries.find(e => e.date === selectedDate);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const entries = await LedgerService.getAllEntries();
      setAllEntries(entries);
      const statsData = await LedgerService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = () => {
    loadData();
  };

  const checkIfEditable = (dateStr: string) => {
    const today = new Date(todayISO);
    const target = new Date(dateStr);
    const diffTime = today.getTime() - target.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays < 1.5 && diffDays >= -0.5; 
  };

  if (isLoading && allEntries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-ink dark:text-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-ink dark:text-gray-100 flex flex-col lg:flex-row font-sans selection:bg-green-200 dark:selection:bg-green-900 transition-colors duration-300 relative">
      
      {/* --- 🚀 BOOT OVERLAY --- */}
      {showBoot && bootData && (
          <BootSequence 
            context={bootData} 
            onComplete={handleBootComplete} 
          />
      )}

      <CommandPalette 
        isOpen={isSearchOpen} 
        setIsOpen={setIsSearchOpen}
        entries={allEntries}
        onSelectDate={(date) => { setSelectedDate(date); setView('entry'); }}
        onSearchChange={setSearchMatches}
      />
      <CheatSheet 
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />

      {/* --- LEFT SIDEBAR --- */}
      <aside className={`
        w-full lg:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 
        h-auto lg:h-screen sticky top-0 overflow-y-auto transition-all duration-500 ease-in-out
        ${isZenMode ? '-ml-72 opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}
      `}>
        <div className="p-6 min-w-[18rem]">
          <header className="mb-8 flex justify-between items-start">
             <div>
                <div className="flex items-center gap-2 mb-1 text-gray-400">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">My Daily Updates</h1>
             </div>
             <div className="flex gap-2">
                <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
                    title="Search (Ctrl+K)"
                >
                    <SearchIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
                    title="Toggle Dark Mode"
                >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
             </div>
          </header>

          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CalIcon className="w-3 h-3" /> Navigation
            </h2>
            <Calendar 
                entries={allEntries} 
                onSelectDate={(date) => { setSelectedDate(date); setView('entry'); }}
                highlightedDates={isSearchOpen && searchMatches.length > 0 ? searchMatches : undefined}
            />
          </div>
          
          <div className="space-y-2 mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Knowledge Base</h2>
            
            <button 
                onClick={() => setView('stats')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    view === 'stats' 
                    ? 'bg-ink text-white dark:bg-white dark:text-gray-900 shadow-md' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                <BarChart2 className="w-4 h-4" />
                Tech Radar
            </button>

            <button 
                onClick={() => setView('grimoire')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    view === 'grimoire' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                <BookOpen className="w-4 h-4" />
                Grimoire
            </button>

            <button 
                onClick={() => setView('map')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    view === 'map' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                <LayoutDashboard className="w-4 h-4" />
                Map
            </button>
          </div>

          {stats && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 transition-colors">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Month Stats</h2>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Streak</span>
                    <span className="font-bold font-mono text-gray-900 dark:text-gray-200">{stats.currentStreak} 🔥</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Completion</span>
                    <span className="font-bold font-mono text-gray-900 dark:text-gray-200">{stats.completionRate}%</span>
                 </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
             <button onClick={() => setIsCheatSheetOpen(true)} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-widest font-bold">
                Press ? for shortcuts
             </button>
          </div>
        </div>
      </aside>

      {/* --- CENTER STAGE --- */}
      <main className="grow p-4 md:p-8 lg:p-12 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-2xl mx-auto">
            {view === 'stats' ? (
                <TechRadar entries={allEntries} onClose={() => setView('entry')} />
            ) : view === 'grimoire' ? (
                <Grimoire entries={allEntries} onClose={() => setView('entry')} />
            ) : view === 'map' ? (
                <TheCartographer />
            ) : (
                <>
                    <div className="mb-8 flex items-baseline justify-between">
                        <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100">
                            {selectedDate === todayISO ? "Today's Log" : `Log for ${selectedDate}`}
                        </h2>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsZenMode(!isZenMode)} className="text-gray-400 hover:text-ink dark:hover:text-gray-200" title="Toggle Zen Mode (Ctrl+\)">
                                {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                {checkIfEditable(selectedDate) ? (
                                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">● Editable</span>
                                ) : (
                                    <span className="text-gray-400 flex items-center gap-1">🔒 Read Only</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DailyEntryForm 
                        key={selectedDate} 
                        targetDate={selectedDate}
                        initialData={currentEntry}
                        onSaved={handleSave}
                        readOnlyMode={!checkIfEditable(selectedDate) && !!currentEntry} 
                        allowEdit={checkIfEditable(selectedDate)}
                        onSummon={() => setView('grimoire')}
                        bootContext={showBoot === false && bootData ? bootData : undefined}
                    />

                    {/* 🔗 DATA LINK CONNECTOR (Visual Flow) */}
                    <div className="flex flex-col items-center justify-center py-8 opacity-40 hover:opacity-100 transition-opacity">
                        {/* Top Line */}
                        <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-emerald-500 dark:from-gray-700"></div>
                        
                        {/* The Node */}
                        <div className="p-1.5 border border-emerald-500/30 rounded-full bg-gray-50 dark:bg-gray-950 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <ArrowDown className="w-3 h-3 text-emerald-500 animate-pulse" />
                        </div>
                        
                        {/* Bottom Line */}
                        <div className="w-px h-8 bg-gradient-to-b from-emerald-500 to-gray-300 dark:to-gray-700"></div>
                    </div>

                    <TheCartographer />
                </>
            )}
        </div>
      </main>

      {/* --- RIGHT SIDEBAR --- */}
      <aside className={`
        w-full lg:w-80 bg-gray-50/50 dark:bg-gray-900/50 border-l border-gray-200 dark:border-gray-800 shrink-0 
        h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto p-6 hidden xl:block transition-all duration-500 ease-in-out
        ${isZenMode ? '-mr-80 opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}
      `}>
         <div className="min-w-[18rem]">
            <RightSidebar currentDate={selectedDate} allEntries={allEntries} />
         </div>
      </aside>
      
      {!isZenMode && (
        <div className="xl:hidden p-6 border-t border-gray-200 dark:border-gray-800 dark:bg-gray-900">
            <RightSidebar currentDate={selectedDate} allEntries={allEntries} />
        </div>
      )}

    </div>
  );
};

export default App;