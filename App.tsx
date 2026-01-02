import React, { useState, useEffect } from 'react';
import { ViewState, LedgerEntry, DailyStats } from './types';
import { LedgerService, getTodayISO } from './services/ledgerService';
import { DailyEntryForm } from './components/DailyEntryForm';
import { Calendar } from './components/Calendar';
import { BookOpen, Calendar as CalendarIcon, X, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('entry');
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [todayEntry, setTodayEntry] = useState<LedgerEntry | undefined>(undefined);
  
  // State for the Modal
  const [viewingEntry, setViewingEntry] = useState<LedgerEntry | null>(null);
  const [viewingDate, setViewingDate] = useState<string | null>(null); // New: Track which date is clicked even if empty
  
  const [allEntries, setAllEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayISO = getTodayISO();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const entries = await LedgerService.getAllEntries();
      setAllEntries(entries);
      const statsData = await LedgerService.getStats();
      setStats(statsData);
      setTodayEntry(entries.find(e => e.date === todayISO));
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
    // If we were in a modal, close it
    setViewingEntry(null);
    setViewingDate(null);
  };

  // --- LOGIC: The 2-Day Rule ---
  const checkIfEditable = (dateStr: string) => {
    const today = new Date(todayISO); // Use our ISO string to ensure local time consistency
    const target = new Date(dateStr);
    
    // Calculate difference in milliseconds
    const diffTime = today.getTime() - target.getTime();
    // Convert to days (1 day = 86400000 ms)
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    // Allow edit if it's Today (diff=0) or Yesterday (diff=1)
    // We use < 1.5 to account for slight timezone jitters, but strictly it handles 0 and 1.
    return diffDays < 1.5 && diffDays >= -0.5; 
  };

  const handleDateSelect = (date: string) => {
    const entry = allEntries.find(e => e.date === date);
    setViewingDate(date);
    
    if (entry) {
      setViewingEntry(entry);
    } else {
        // If no entry exists but it's editable (Yesterday), we open the modal in "Create" mode
        // For older dates without entries, we usually do nothing or show "No entry".
        if (checkIfEditable(date)) {
            setViewingEntry({ date: date } as LedgerEntry); // Dummy entry to trigger modal
        }
    }
  };

  // Helper to close modal
  const closeModal = () => {
      setViewingEntry(null);
      setViewingDate(null);
  }

  if (isLoading && allEntries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-subtle" />
          <p className="text-xs uppercase tracking-widest text-subtle">Syncing with Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-gray-200">
      
      {/* Header */}
      <header className="px-6 py-8 md:py-12 flex justify-between items-end max-w-4xl mx-auto w-full">
        <div>
           <h1 className="text-sm font-bold tracking-widest uppercase mb-1">My Daily Updates</h1>
           <p className="text-xs text-subtle font-serif italic">Consistency is quiet.</p>
        </div>
        
        {stats && (
          <div className="text-right flex gap-4 md:gap-8 text-xs font-mono text-subtle">
            <div><span className="block text-ink font-bold">{stats.currentStreak}</span><span>Current</span></div>
            <div><span className="block text-ink font-bold">{stats.longestStreak}</span><span>Best</span></div>
            <div><span className="block text-ink font-bold">{stats.completionRate}%</span><span>Rate</span></div>
            <div><span className="block text-ink font-bold">{stats.totalEntries}</span><span>Total</span></div>
          </div>
        )}
      </header>

      <main className="flex-grow px-6 max-w-4xl mx-auto w-full">
        {/* Toggle */}
        <div className="flex gap-8 border-b border-border mb-12">
          <button
            onClick={() => { closeModal(); setView('entry'); }}
            className={`pb-4 text-xs font-semibold tracking-wider uppercase transition-colors ${view === 'entry' ? 'text-ink border-b-2 border-ink' : 'text-gray-300 hover:text-subtle'}`}
          >
            Today
          </button>
          <button
             onClick={() => { closeModal(); setView('calendar'); }}
             className={`pb-4 text-xs font-semibold tracking-wider uppercase transition-colors ${view === 'calendar' ? 'text-ink border-b-2 border-ink' : 'text-gray-300 hover:text-subtle'}`}
          >
            Consistency
          </button>
        </div>

        {/* TODAY VIEW - Always writes to Today */}
        {view === 'entry' && (
          <DailyEntryForm 
            onSaved={handleSave} 
            initialData={todayEntry} 
            readOnlyMode={false}
            targetDate={todayISO} 
            allowEdit={true} // Today is always editable
          />
        )}

        {/* CALENDAR VIEW */}
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

      {/* --- MODAL (For Past Entries) --- */}
      {viewingEntry && viewingDate && (
        <div className="fixed inset-0 bg-paper/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-border shadow-2xl rounded-sm max-h-[90vh] overflow-y-auto relative">
            
            <div className="sticky top-0 bg-white border-b border-border p-4 flex justify-between items-center z-10">
              <span className="font-mono text-xs text-subtle">{viewingEntry.date}</span>
              <button onClick={closeModal} className="text-ink hover:bg-gray-100 p-2 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8">
               <DailyEntryForm 
                initialData={viewingEntry.id ? viewingEntry : undefined} // Pass data if it exists
                onSaved={handleSave} 
                // Logic: Default to ReadOnly unless it's a new backfill. 
                // If it's a new backfill (no ID), start in edit mode.
                readOnlyMode={!!viewingEntry.id} 
                targetDate={viewingDate}
                allowEdit={checkIfEditable(viewingDate)} // ONLY pass true if Today or Yesterday
               />
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 text-center text-[10px] text-gray-300 uppercase tracking-widest">
        Sit Down. Think. Write.
      </footer>
    </div>
  );
};

export default App;