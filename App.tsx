import React, { useState, useEffect } from 'react';
import { LedgerEntry, DailyStats } from './types';
import { LedgerService, getTodayISO } from './services/ledgerService';
import { DailyEntryForm } from './components/DailyEntryForm';
import { Calendar } from './components/Calendar';
import { RightSidebar } from './components/RightSidebar';
import { CommandPalette } from './components/CommandPalette'; // <--- NEW IMPORT
import { Loader2, LayoutDashboard, Calendar as CalIcon, Moon, Sun, Search as SearchIcon } from 'lucide-react';

const App: React.FC = () => {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const todayISO = getTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [allEntries, setAllEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- SEARCH STATE ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMatches, setSearchMatches] = useState<string[]>([]); // Dates that match search

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-ink dark:text-gray-100 flex flex-col lg:flex-row font-sans selection:bg-green-200 dark:selection:bg-green-900 transition-colors duration-300">
      
      {/* --- COMMAND PALETTE (Global) --- */}
      <CommandPalette 
        isOpen={isSearchOpen} 
        setIsOpen={setIsSearchOpen}
        entries={allEntries}
        onSelectDate={setSelectedDate}
        onSearchChange={setSearchMatches}
      />

      {/* --- LEFT SIDEBAR --- */}
      <aside className="w-full lg:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 h-auto lg:h-screen sticky top-0 overflow-y-auto transition-colors duration-300">
        <div className="p-6">
          <header className="mb-8 flex justify-between items-start">
             <div>
                <div className="flex items-center gap-2 mb-1 text-gray-400">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">My Daily Updates</h1>
             </div>
             <div className="flex gap-2">
                {/* Search Trigger Button */}
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
            {/* Pass search matches to Calendar */}
            <Calendar 
                entries={allEntries} 
                onSelectDate={setSelectedDate} 
                highlightedDates={isSearchOpen && searchMatches.length > 0 ? searchMatches : undefined}
            />
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
        </div>
      </aside>

      {/* --- CENTER STAGE --- */}
      <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex items-baseline justify-between">
                <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100">
                    {selectedDate === todayISO ? "Today's Log" : `Log for ${selectedDate}`}
                </h2>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                    {checkIfEditable(selectedDate) ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">● Editable</span>
                    ) : (
                        <span className="text-gray-400 flex items-center gap-1">🔒 Read Only</span>
                    )}
                </div>
            </div>

            <DailyEntryForm 
                key={selectedDate} 
                targetDate={selectedDate}
                initialData={currentEntry}
                onSaved={handleSave}
                readOnlyMode={!checkIfEditable(selectedDate) && !!currentEntry} 
                allowEdit={checkIfEditable(selectedDate)}
            />
        </div>
      </main>

      {/* --- RIGHT SIDEBAR --- */}
      <aside className="w-full lg:w-80 bg-gray-50/50 dark:bg-gray-900/50 border-l border-gray-200 dark:border-gray-800 flex-shrink-0 h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto p-6 hidden xl:block transition-colors duration-300">
         <RightSidebar currentDate={selectedDate} allEntries={allEntries} />
      </aside>
      
      <div className="xl:hidden p-6 border-t border-gray-200 dark:border-gray-800 dark:bg-gray-900">
         <RightSidebar currentDate={selectedDate} allEntries={allEntries} />
      </div>

    </div>
  );
};

export default App;