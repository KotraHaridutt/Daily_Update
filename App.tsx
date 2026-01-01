import React, { useState, useEffect } from 'react';
import { ViewState, LedgerEntry, DailyStats } from './types';
import { LedgerService, getTodayISO } from './services/ledgerService';
import { DailyEntryForm } from './components/DailyEntryForm';
import { Calendar } from './components/Calendar';
import { BookOpen, Calendar as CalendarIcon, X } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('entry');
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [todayEntry, setTodayEntry] = useState<LedgerEntry | undefined>(undefined);
  const [viewingEntry, setViewingEntry] = useState<LedgerEntry | null>(null);
  const [allEntries, setAllEntries] = useState<LedgerEntry[]>([]);

  const todayISO = getTodayISO();

  const loadData = () => {
    const entries = LedgerService.getAllEntries();
    setAllEntries(entries);
    setStats(LedgerService.getStats());
    setTodayEntry(entries.find(e => e.date === todayISO));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = () => {
    loadData();
    // Stay on entry page, data refreshes, user can continue editing if they want
  };

  const handleDateSelect = (date: string) => {
    const entry = allEntries.find(e => e.date === date);
    if (entry) {
      setViewingEntry(entry);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-gray-200">
      
      {/* --- Minimal Header --- */}
      <header className="px-6 py-8 md:py-12 flex justify-between items-end max-w-4xl mx-auto w-full">
        <div>
           <h1 className="text-sm font-bold tracking-widest uppercase mb-1">Execution Ledger</h1>
           <p className="text-xs text-subtle font-serif italic">Consistency is quiet.</p>
        </div>
        
        {/* Simple Stats Display - Text Only */}
        {stats && (
          <div className="text-right flex gap-4 md:gap-8 text-xs font-mono text-subtle">
            <div>
              <span className="block text-ink font-bold">{stats.currentStreak}</span>
              <span>Current</span>
            </div>
            <div>
              <span className="block text-ink font-bold">{stats.longestStreak}</span>
              <span>Best</span>
            </div>
            <div>
              <span className="block text-ink font-bold">{stats.completionRate}%</span>
              <span>Rate</span>
            </div>
            <div>
              <span className="block text-ink font-bold">{stats.totalEntries}</span>
              <span>Total</span>
            </div>
          </div>
        )}
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-grow px-6 max-w-4xl mx-auto w-full">
        
        {/* View Toggle */}
        <div className="flex gap-8 border-b border-border mb-12">
          <button
            onClick={() => { setViewingEntry(null); setView('entry'); }}
            className={`pb-4 text-xs font-semibold tracking-wider uppercase transition-colors ${view === 'entry' ? 'text-ink border-b-2 border-ink' : 'text-gray-300 hover:text-subtle'}`}
          >
            Today
          </button>
          <button
             onClick={() => { setViewingEntry(null); setView('calendar'); }}
             className={`pb-4 text-xs font-semibold tracking-wider uppercase transition-colors ${view === 'calendar' ? 'text-ink border-b-2 border-ink' : 'text-gray-300 hover:text-subtle'}`}
          >
            Consistency
          </button>
        </div>

        {/* --- Today / Write View --- */}
        {view === 'entry' && (
          <DailyEntryForm 
            onSaved={handleSave} 
            initialData={todayEntry} 
            readOnlyMode={false} 
          />
        )}

        {/* --- Calendar View --- */}
        {view === 'calendar' && (
          <div className="animate-fade-in">
             <div className="text-center mb-12">
                <p className="font-serif text-lg text-ink mb-2">Month View</p>
                <p className="text-xs text-subtle">Darker blocks indicate deeper work.</p>
             </div>
             <Calendar entries={allEntries} onSelectDate={handleDateSelect} />
          </div>
        )}
      </main>

      {/* --- Read Modal (For Past Entries) --- */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-paper/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-border shadow-2xl rounded-sm max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex justify-between items-center z-10">
              <span className="font-mono text-xs text-subtle">{viewingEntry.date}</span>
              <button onClick={() => setViewingEntry(null)} className="text-ink hover:bg-gray-100 p-2 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-8">
               <DailyEntryForm initialData={viewingEntry} onSaved={() => {}} readOnlyMode={true} />
            </div>
          </div>
        </div>
      )}

      {/* --- Footer --- */}
      <footer className="py-8 text-center text-[10px] text-gray-300 uppercase tracking-widest">
        Sit Down. Think. Write.
      </footer>
    </div>
  );
};

export default App;