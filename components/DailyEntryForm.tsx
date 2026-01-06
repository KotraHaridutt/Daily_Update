import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { LedgerEntry, VALIDATION_LIMITS, VAGUE_WORDS } from '../types';
import { TextArea, EffortSlider, ActionButton } from './UIComponents';
import { LedgerService, getTodayISO } from '../services/ledgerService';
import { ChevronDown, ChevronUp, Lock, AlertCircle, Edit2, Tag, Zap } from 'lucide-react';
import { ShutdownModal } from './ShutdownModal';
import { useAudioBiome } from './hooks/useAudioBiome';
import { AudioController } from './AudioController';  
import { PanicMode } from './PanicMode';
import { MnemosyneGhost } from './MnemosyneGhost';

interface Props {
  onSaved: () => void;
  initialData?: LedgerEntry;
  readOnlyMode?: boolean;
  targetDate?: string;
  allowEdit?: boolean;
  bootContext?: string;
  onSummon?: () => void;
}

const QUICK_TAGS = ['#Coding', '#BugFix', '#Meeting', '#Learning', '#Planning', '#Review'];
const TIME_LEAKS = ['📱 Social Media', '🎮 Games', '🛌 Napping', '💭 Overthinking', '🔁 Context Switch', '🐌 Procrastination'];

// --- SNIPPET TEMPLATES ---
const SNIPPETS: Record<string, string> = {
    ';;bug': `**🐛 Bug Report**\n* **Issue:** \n* **Cause:** \n* **Fix:** `,
    ';;meet': `**📅 Meeting Notes**\n* **Topic:** \n* **Decisions:** \n* **Action Items:** `,
    ';;idea': `**💡 New Idea**\n* **Concept:** \n* **Why:** `,
};

// --- MARKDOWN CONFIG ---
const markdownComponents = {
    p: ({node, ...props}: any) => <p className="mb-2 leading-relaxed text-ink dark:text-gray-200" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc list-inside my-2 pl-2 space-y-1 dark:text-gray-300" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal list-inside my-2 pl-2 space-y-1 dark:text-gray-300" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-500 dark:text-gray-400 my-4" {...props} />,
    code: ({node, className, children, ...props}: any) => {
        const content = String(children);
        const isBlock = content.includes('\n'); 
        if (isBlock) {
             return (
                <div className="bg-gray-800 dark:bg-gray-950 text-gray-100 rounded-md p-3 my-3 overflow-x-auto font-mono text-xs border border-gray-700 shadow-sm">
                    <code className={className} {...props}>{children}</code>
                </div>
             );
        }
        return (
            <code className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 font-mono text-sm px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700" {...props}>
                {children}
            </code>
        );
    }
};

export const DailyEntryForm: React.FC<Props> = ({ 
  onSaved, 
  initialData, 
  readOnlyMode = false,
  
  targetDate = getTodayISO(),
  allowEdit = false,
  
  onSummon,
  bootContext
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isShutdownOpen, setIsShutdownOpen] = useState(false);
  const [isPanicOpen, setIsPanicOpen] = useState(false);
  const [ghostMemory, setGhostMemory] = useState<{ date: string; content: string } | null>(null);
  
  const [formData, setFormData] = useState({
    workLog: '',
    learningLog: '',
    timeLeakLog: '',
    effortRating: 0,
    freeThought: '',
    nextDayContext: ''
  });
  
  const [showFreeThought, setShowFreeThought] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const { isPlaying, togglePlay, currentBiome, intensity, triggerTyping } = useAudioBiome(formData.workLog);

  // Refs for Focus Macros
  const workRef = useRef<HTMLTextAreaElement>(null);
  const learnRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (bootContext && !initialData) {
        // If we have a mission from yesterday, and today is empty, PRE-FILL IT
        setFormData(prev => ({
            ...prev,
            workLog: `**🚀 Yesterday's Promise:**\n${bootContext}\n\n`,
            nextDayContext: ''
        }));
        setIsEditing(true); // Auto-open edit mode
    }
  }, [bootContext, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        workLog: initialData.workLog,
        learningLog: initialData.learningLog,
        timeLeakLog: initialData.timeLeakLog,
        effortRating: initialData.effortRating,
        freeThought: initialData.freeThought || '',
        nextDayContext: initialData.nextDayContext || ''
      });
      if (initialData.freeThought) setShowFreeThought(true);
    } else {
      setFormData({ workLog: '', learningLog: '', timeLeakLog: '', effortRating: 0, freeThought: '', nextDayContext: '' });
      setShowFreeThought(false);
    }
  }, [initialData]); 

  useEffect(() => {
    const summonGhost = async () => {
        // 10% chance to be haunted on load
        // CHANGE 0.1 to 1.0 TO TEST IT NOW
        //if (Math.random() > 0.1) return; 

        console.log("👻 Summoning Mnemosyne...");
        const memory = await LedgerService.getGhostMemory();
        if (memory) {
            setGhostMemory(memory);
        }
    };
    summonGhost();
  }, []);

  useEffect(() => {
    const isToday = targetDate === getTodayISO();
    const hasData = initialData && (initialData.workLog.length > 0 || initialData.learningLog.length > 0);
    if (isToday && !hasData) {
        setIsEditing(true);
    } else {
        setIsEditing(false);
    }
  }, [targetDate, initialData]);

  // --- SHORTCUT HANDLER ---
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        // Level 2: Macros
        if (e.altKey) {
            if (['1', '2', '3', '4', '5'].includes(e.key)) {
                e.preventDefault();
                setFormData(prev => ({ ...prev, effortRating: parseInt(e.key) }));
            }
            if (e.key.toLowerCase() === 'w') {
                e.preventDefault();
                // We use getElementById because passing Refs through custom components can be tricky without forwardRef
                document.getElementById('workLog-input')?.focus(); 
            }
            if (e.key.toLowerCase() === 'l') {
                e.preventDefault();
                document.getElementById('learningLog-input')?.focus();
            }
        }
        
        // Save Shortcut
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            handleSubmit();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, formData]); // Re-bind when data changes so handleSubmit has latest state

  const validation = useMemo(() => {
    const workLen = formData.workLog.length;
    const workRemaining = Math.max(0, VALIDATION_LIMITS.WORK_MIN - workLen);
    const workShort = workRemaining > 0;
    const learnEmpty = !formData.learningLog.trim();
    const leakEmpty = !formData.timeLeakLog.trim();
    const effortZero = formData.effortRating === 0;
    
    const isValid = !workShort && !learnEmpty && !leakEmpty && !effortZero; 
    return { workShort, workRemaining, learnEmpty, leakEmpty, effortZero, isValid };
  }, [formData]);

  // --- SNIPPET & MARKDOWN HANDLER ---
  const handleTextChange = (field: keyof typeof formData, val: string, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Check for Snippets (Level 3)
    if (val.endsWith(';;summon') && onSummon) {
        // Remove the command text
        const cleanVal = val.slice(0, -8); // remove ';;summon'
        setFormData({ ...formData, [field]: cleanVal });
        onSummon(); // Trigger the view switch
        return;
    }
    if (val.endsWith(';;panic')) {
        // Remove the trigger word
        setFormData({ ...formData, [field]: val.slice(0, -7) });
        // Open the Overlay
        setIsPanicOpen(true);
        return;
    }
    let finalVal = val;
    Object.entries(SNIPPETS).forEach(([key, snippet]) => {
        if (val.endsWith(key)) {
            finalVal = val.slice(0, -key.length) + snippet;
        }
    });
    setFormData({ ...formData, [field]: finalVal });
  };

  const handleGhostReinforce = () => {
      // Logic to reward XP would go here
      // For now, we just close it after the animation
      setTimeout(() => setGhostMemory(null), 1500);
  };

  const handleGhostDiscard = () => {
      // Logic to mark as 'forgotten' would go here
      setTimeout(() => setGhostMemory(null), 1000);
  };

  // Helper for Ctrl+B (Bold)
  const handleKeyDownTextArea = (e: React.KeyboardEvent<HTMLTextAreaElement>, field: keyof typeof formData) => {
    triggerTyping();
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        const before = val.substring(0, start);
        const selected = val.substring(start, end);
        const after = val.substring(end);
        
        // Wrap selected text in bold
        const newVal = `${before}**${selected}**${after}`;
        setFormData({ ...formData, [field]: newVal });
        
        // We need to wait for react re-render to set cursor, practically hard in simple handler
        // But the text update works.
    }
  };

  const appendText = (field: keyof typeof formData, text: string) => {
    setFormData(prev => {
        const currentVal = prev[field] as string;
        if (currentVal.includes(text)) return prev;
        const prefix = currentVal.length > 0 ? '\n' : ''; 
        return { ...prev, [field]: currentVal + prefix + text };
    });
  };
  const handlePanicClose = (report: string) => {
    setIsPanicOpen(false);
    if (report) {
        // Append the incident report to the Work Log
        setFormData(prev => ({
            ...prev,
            workLog: prev.workLog + '\n\n' + report + '\n\n'
        }));
    }
  };
  // This runs ONLY after you type your "Shutdown Promise" in the modal
  const handleFinalSave = async (context: string) => {
    setIsSaving(true);
    try {
      await LedgerService.saveEntry({
        date: targetDate,
        ...formData,
        nextDayContext: context // <--- We save the promise here!
      });
      
      setIsShutdownOpen(false); // Close modal
      setIsEditing(false);      // Close form
      onSaved();                // Tell App.tsx to reload
    } catch (error) {
      alert("Failed to save. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    
    // 1. Validation
    if (!validation.isValid) return;
    
    // 2. --- ⚔️ BOSS FIGHT LOGIC (Kept intact) ⚔️ ---
    if (formData.workLog.toUpperCase().includes('#PROJECT_LAUNCH')) {
        const lootXP = 5000 + (formData.workLog.length * 2);
        
        const confirmLaunch = window.confirm(
            `⚔️ BOSS FIGHT DETECTED: #PROJECT_LAUNCH ⚔️\n\n` +
            `You are about to deploy a major milestone.\n` +
            `Estimated Loot Drop: +${lootXP} XP\n\n` +
            `Are you ready to commit?`
        );
        
        // If they click Cancel, we STOP here. No Save. No Shutdown.
        if (!confirmLaunch) return;
    }
    // ------------------------------------------------

    // 3. Instead of saving, we open the "System Halt" Terminal
    setIsShutdownOpen(true);
  };

  const showValidationFeedback = hasAttemptedSubmit || (
      formData.workLog.length > 0 || formData.learningLog.length > 0
  );

  // --- READ ONLY VIEW ---
  if (!isEditing) {
    return (
      <div className="animate-fade-in space-y-8 pt-4 relative bg-white dark:bg-gray-900 p-8 rounded-xl border border-border dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
           <div className="flex items-center gap-2 text-subtle dark:text-gray-500">
             <Lock className="w-4 h-4" />
             <span className="text-xs font-sans uppercase tracking-widest">
                {allowEdit ? "Entry Saved" : "Locked"}
             </span>
           </div>
           
           {allowEdit && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
           )}
        </div>
        
        {formData.workLog === '' ? (
            <div className="text-center py-12 text-gray-400 font-serif italic">No entry for this date.</div>
        ) : (
            <>
                <section>
                    <h3 className="text-xs font-sans font-semibold text-subtle dark:text-gray-500 uppercase tracking-wider mb-2">Work</h3>
                    <div className="font-serif text-lg leading-relaxed text-ink dark:text-gray-200">
                        <ReactMarkdown components={markdownComponents}>{formData.workLog}</ReactMarkdown>
                    </div>
                </section>
                <section>
                    <h3 className="text-xs font-sans font-semibold text-subtle dark:text-gray-500 uppercase tracking-wider mb-2">Learning</h3>
                    <div className="font-serif text-lg leading-relaxed text-ink dark:text-gray-200">
                        <ReactMarkdown components={markdownComponents}>{formData.learningLog}</ReactMarkdown>
                    </div>
                </section>
                <div className="grid grid-cols-2 gap-8">
                    <section>
                        <h3 className="text-xs font-sans font-semibold text-subtle dark:text-gray-500 uppercase tracking-wider mb-2">Time Leak</h3>
                        <div className="font-serif text-lg leading-relaxed text-ink dark:text-gray-200">
                             <ReactMarkdown components={markdownComponents}>{formData.timeLeakLog}</ReactMarkdown>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-xs font-sans font-semibold text-subtle dark:text-gray-500 uppercase tracking-wider mb-2">Effort</h3>
                        <div className="flex gap-1 mt-1">
                            {[...Array(formData.effortRating)].map((_, i) => <div key={i} className="h-2 w-8 bg-ink dark:bg-gray-200 rounded-sm" />)}
                            {[...Array(5 - formData.effortRating)].map((_, i) => <div key={`empty-${i}`} className="h-2 w-8 bg-gray-200 dark:bg-gray-700 rounded-sm" />)}
                        </div>
                    </section>
                </div>
                {formData.freeThought && (
                <section className="pt-6 border-t border-border dark:border-gray-800 mt-8">
                    <h3 className="text-xs font-sans font-semibold text-subtle dark:text-gray-500 uppercase tracking-wider mb-2">Free Thought</h3>
                    <div className="font-serif text-base italic text-gray-600 dark:text-gray-400">
                        <ReactMarkdown components={markdownComponents}>{formData.freeThought}</ReactMarkdown>
                    </div>
                </section>
                )}
            </>
        )}
      </div>
    );
  }

  // --- EDIT VIEW ---
  return (
    <div className="animate-fade-in bg-white dark:bg-gray-900 p-8 rounded-xl border border-border dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="mb-8 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
        <span className="text-sm font-mono text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-md">{targetDate}</span>
        <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-400 hover:text-ink dark:hover:text-gray-200 uppercase tracking-wider">
            {initialData ? "Cancel Edit" : "View Mode"}
        </button>
      </div>

      <div className="mb-2">
         <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_TAGS.map(tag => (
                <button
                    key={tag}
                    onClick={() => appendText('workLog', tag)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                    <Tag className="w-3 h-3" />
                    {tag}
                </button>
            ))}
         </div>
         <TextArea
            id="workLog-input"
            label="What I actually worked on"
            placeholder="Supports Markdown! Try typing ';;bug'"
            value={formData.workLog}
            onChange={e => handleTextChange('workLog', e.target.value, e)}
            onKeyDown={e => handleKeyDownTextArea(e, 'workLog')}
            maxLength={VALIDATION_LIMITS.WORK_MAX}
            minLength={VALIDATION_LIMITS.WORK_MIN}
            rows={10}
            autoFocus
            warning={showValidationFeedback && validation.workShort}
         />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <TextArea
            id="learningLog-input"
            label="One thing I learned"
            placeholder="A technical concept or pattern."
            value={formData.learningLog}
            onChange={e => handleTextChange('learningLog', e.target.value, e)}
            onKeyDown={e => handleKeyDownTextArea(e, 'learningLog')}
            maxLength={VALIDATION_LIMITS.LEARN_MAX}
            warning={showValidationFeedback && validation.learnEmpty}
            rows={4}
        />

        <div className="flex flex-col">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 font-sans">
                Where my time leaked
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
                {TIME_LEAKS.map(leak => (
                    <button
                        key={leak}
                        onClick={() => appendText('timeLeakLog', leak)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <Zap className="w-3 h-3" />
                        {leak}
                    </button>
                ))}
            </div>
            <TextArea
                placeholder="Social media, hesitation?"
                value={formData.timeLeakLog}
                onChange={e => handleTextChange('timeLeakLog', e.target.value, e)}
                maxLength={VALIDATION_LIMITS.LEAK_MAX}
                warning={showValidationFeedback && validation.leakEmpty}
                rows={4}
            />
        </div>
      </div>

      <div className="mt-8 mb-8">
        <div className={showValidationFeedback && validation.effortZero ? "p-2 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/50 dark:bg-orange-900/20" : ""}>
            <EffortSlider
            value={formData.effortRating}
            onChange={val => setFormData({ ...formData, effortRating: val })}
            />
        </div>
      </div>

      <div className="mb-8 border-t border-border dark:border-gray-800 pt-4">
        <button
          onClick={() => setShowFreeThought(!showFreeThought)}
          className="flex items-center text-xs font-sans font-semibold text-subtle dark:text-gray-500 hover:text-ink dark:hover:text-gray-200 transition-colors"
        >
          {showFreeThought ? <ChevronUp className="w-3 h-3 mr-1"/> : <ChevronDown className="w-3 h-3 mr-1"/>}
          Free Thought (Optional)
        </button>
        
        {showFreeThought && (
          <div className="mt-4 animate-slide-down">
             <textarea
               className="w-full bg-paper dark:bg-gray-800 border border-border dark:border-gray-700 p-4 font-serif text-base text-ink dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-ink dark:focus:border-gray-400 rounded-sm"
               rows={4}
               placeholder="Unstructured thoughts, rants, or ideas..."
               value={formData.freeThought}
               onChange={e => handleTextChange('freeThought', e.target.value, e as any)}
             />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 mt-8">
        {!validation.isValid && showValidationFeedback && (
           <div className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-sm border border-gray-100 dark:border-gray-700 mb-2">
             <div className="flex items-center gap-2 mb-2 text-ink dark:text-gray-200 font-sans text-xs font-bold uppercase tracking-wider">
               <AlertCircle className="w-3 h-3" />
               Pending Requirements
             </div>
           </div>
        )}
        <ShutdownModal 
          isOpen={isShutdownOpen}
          onConfirm={handleFinalSave}
          onCancel={() => setIsShutdownOpen(false)}
       />
       <AudioController 
            isPlaying={isPlaying} 
            togglePlay={togglePlay} 
            currentBiome={currentBiome}
            intensity={intensity}
       />

        <ActionButton 
          onClick={handleSubmit} 
          disabled={!validation.isValid || isSaving}
          className="w-full"
        >
        
        <PanicMode 
         isOpen={isPanicOpen} 
         onClose={handlePanicClose} 
       />

        <MnemosyneGhost 
           memory={ghostMemory}
           onClose={() => setGhostMemory(null)}
           onReinforce={handleGhostReinforce}
           onDiscard={handleGhostDiscard}
       />

          {isSaving ? 'Saving...' : (initialData ? 'Update Entry' : 'Commit Entry')}
        </ActionButton>
      </div>
    </div>
  );
};