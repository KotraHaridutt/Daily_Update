import React, { useState, useEffect } from 'react';
import { LedgerEntry, DailyStats } from './types';
import { LedgerService, getTodayISO } from './services/ledgerService';
import { DailyEntryForm } from './components/DailyEntryForm';
import { Calendar } from './components/Calendar';
import { RightSidebar } from './components/RightSidebar';
import { Loader2, LayoutDashboard, Calendar as CalIcon } from 'lucide-react';

const App: React.FC = () => {
  const [stats, setStats] = useState<DailyStats | null>(null);
  
  // SELECTION STATE
  const todayISO = getTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  
  const [allEntries, setAllEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    // LAYOUT: 3 Columns on Large Screens (Sidebar | Main | HUD)
    <div className="min-h-screen bg-gray-50 text-ink flex flex-col lg:flex-row font-sans selection:bg-gray-200">
      
      {/* --- COLUMN 1: LEFT SIDEBAR (Nav) --- */}
      <aside className="w-full lg:w-72 bg-white border-r border-gray-200 flex-shrink-0 h-auto lg:h-screen sticky top-0 overflow-y-auto">
        <div className="p-6">
          <header className="mb-8">
             <div className="flex items-center gap-2 mb-1 text-gray-400">
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
             </div>
             <h1 className="text-lg font-bold tracking-tight text-gray-900">My Daily Updates</h1>
             <p className="text-xs text-gray-500 mt-2 font-serif italic">"Consistency is quiet."</p>
          </header>

          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CalIcon className="w-3 h-3" /> Navigation
            </h2>
            <Calendar entries={allEntries} onSelectDate={setSelectedDate} />
          </div>

          {stats && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Month Stats</h2>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Streak</span>
                    <span className="font-bold font-mono">{stats.currentStreak} 🔥</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-bold font-mono">{stats.completionRate}%</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold font-mono">{stats.totalEntries}</span>
                 </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* --- COLUMN 2: CENTER STAGE (Writing Form) --- */}
      <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex items-baseline justify-between">
                <h2 className="text-2xl font-serif text-gray-900">
                    {selectedDate === todayISO ? "Today's Log" : `Log for ${selectedDate}`}
                </h2>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                    {checkIfEditable(selectedDate) ? (
                        <span className="text-green-600 flex items-center gap-1">● Editable</span>
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

      {/* --- COLUMN 3: RIGHT SIDEBAR (The HUD) --- */}
      <aside className="w-full lg:w-80 bg-gray-50/50 border-l border-gray-200 flex-shrink-0 h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto p-6 hidden xl:block">
         <RightSidebar currentDate={selectedDate} allEntries={allEntries} />
      </aside>
      
      {/* Mobile/Tablet Fallback for HUD (Show at bottom if screen is small) */}
      <div className="xl:hidden p-6 border-t border-gray-200">
         <RightSidebar currentDate={selectedDate} allEntries={allEntries} />
      </div>

    </div>
  );
};

export default App;
