import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { LedgerEntry, VALIDATION_LIMITS } from '../types';
import { TextArea, EffortSlider, ActionButton } from './UIComponents';
import { LedgerService, getTodayISO } from '../services/ledgerService';
import { ChevronDown, ChevronUp, Lock, AlertCircle, Edit2, Tag, Zap, Sparkles, Loader2 } from 'lucide-react';
import { ShutdownModal } from './ShutdownModal';
import { useAudioBiome } from './hooks/useAudioBiome';
import { AudioController } from './AudioController';
import { PanicMode } from './PanicMode';
import { generateSmartTags, analyzeVibe, VibeCheckResult } from '../services/aiService'; 
import { BrainCircuit } from 'lucide-react';

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
  
  // AI STATE
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [vibeLoading, setVibeLoading] = useState(false);
  const [aiObservation, setAiObservation] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    workLog: '',
    learningLog: '',
    timeLeakLog: '',
    effortRating: 0,
    freeThought: '',
    nextDayContext: '',
    mood: 'neutral' as 'flow' | 'stuck' | 'chill' | 'neutral'
  });
  
  const [showFreeThought, setShowFreeThought] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const { isPlaying, togglePlay, currentBiome, intensity, triggerTyping } = useAudioBiome(formData.workLog);

  // Refs for Focus Macros
  const workRef = useRef<HTMLTextAreaElement>(null);
  const learnRef = useRef<HTMLTextAreaElement>(null);

  const handleVibeCheck = async () => {
      if (formData.workLog.length < 10) {
          alert("Write more text first!");
          return;
      }
      
      setVibeLoading(true);
      setAiObservation(null); // Reset previous message

      const result = await analyzeVibe(formData.workLog);
      
      if (result) {
          // Update Form Data automatically
          setFormData(prev => ({
              ...prev,
              mood: result.mood,
              effortRating: result.effort
          }));

          // Show the AI's "Psychologist" note
          setAiObservation(result.observation);
          
          // Hide note after 5 seconds
          setTimeout(() => setAiObservation(null), 5000);
      }
      setVibeLoading(false);
  };

  useEffect(() => {
    if (bootContext && !initialData) {
        setFormData(prev => ({
            ...prev,
            workLog: `**🚀 Yesterday's Promise:**\n${bootContext}\n\n`,
            nextDayContext: ''
        }));
        setIsEditing(true); 
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
        nextDayContext: initialData.nextDayContext || '',
        mood: 'neutral' as 'flow' | 'stuck' | 'chill' | 'neutral'
      });
      if (initialData.freeThought) setShowFreeThought(true);
    } else {
      setFormData({ workLog: '', learningLog: '', timeLeakLog: '', effortRating: 0, freeThought: '', nextDayContext: '', mood: 'neutral' as 'flow' | 'stuck' | 'chill' | 'neutral' });
      setShowFreeThought(false);
    }
  }, [initialData]); 

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
        if (e.altKey) {
            if (['1', '2', '3', '4', '5'].includes(e.key)) {
                e.preventDefault();
                setFormData(prev => ({ ...prev, effortRating: parseInt(e.key) }));
            }
            if (e.key.toLowerCase() === 'w') {
                e.preventDefault();
                document.getElementById('workLog-input')?.focus(); 
            }
            if (e.key.toLowerCase() === 'l') {
                e.preventDefault();
                document.getElementById('learningLog-input')?.focus();
            }
        }
        
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            handleSubmit();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, formData]);

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

  const handleTextChange = (field: keyof typeof formData, val: string, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    triggerTyping();

    if (val.endsWith(';;summon') && onSummon) {
        const cleanVal = val.slice(0, -8); 
        setFormData({ ...formData, [field]: cleanVal });
        onSummon(); 
        return;
    }
    if (val.endsWith(';;panic')) {
        setFormData({ ...formData, [field]: val.slice(0, -7) });
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
        
        const newVal = `${before}**${selected}**${after}`;
        setFormData({ ...formData, [field]: newVal });
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

  // --- 🤖 AI AUTO TAG HANDLER ---
  const handleAutoTag = async () => {
      // 1. Guard clause: Don't run if text is too short
      if (formData.workLog.length < 10) {
          alert("Please write a bit more before asking AI to tag!");
          return;
      }

      setIsAiLoading(true);
      
      // 2. Call the Service
      const newTags = await generateSmartTags(formData.workLog);
      
      // 3. Append tags to WorkLog
      if (newTags.length > 0) {
          const tagsString = newTags.join(' ');
          appendText('workLog', tagsString);
      } else {
          // If AI fails or returns nothing (maybe API key is wrong)
          alert("AI couldn't generate tags. Check console for API Key errors.");
      }

      setIsAiLoading(false);
  };

  const handlePanicClose = (report: string) => {
    setIsPanicOpen(false);
    if (report) {
        setFormData(prev => ({
            ...prev,
            workLog: prev.workLog + '\n\n' + report + '\n\n'
        }));
    }
  };

  const handleFinalSave = async (context: string) => {
    setIsSaving(true);
    try {
      await LedgerService.saveEntry({
        date: targetDate,
        ...formData,
        nextDayContext: context
      });
      
      setIsShutdownOpen(false); 
      setIsEditing(false);      
      onSaved();                
    } catch (error) {
      alert("Failed to save. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    
    if (!validation.isValid) return;
    
    if (formData.workLog.toUpperCase().includes('#PROJECT_LAUNCH')) {
        const lootXP = 5000 + (formData.workLog.length * 2);
        const confirmLaunch = window.confirm(
            `⚔️ BOSS FIGHT DETECTED: #PROJECT_LAUNCH ⚔️\n\n` +
            `Are you ready to commit?`
        );
        if (!confirmLaunch) return;
    }

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
         {/* 1. HEADER ROW: Tags on Left, AI on Right */}
         <div className="flex justify-between items-end mb-3">
            
            {/* Left: Quick Tags */}
            <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map(tag => (
                    <button
                        key={tag}
                        onClick={() => appendText('workLog', tag)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-blue-100 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all hover:scale-105 active:scale-95"
                    >
                        <Tag className="w-3 h-3" />
                        {tag}
                    </button>
                ))}
            </div>

            {/* Right: The AI "Magic Wand" (Distinct & Bigger) */}
            <button
                onClick={handleAutoTag}
                disabled={isAiLoading}
                className={`
                    relative group overflow-hidden flex items-center gap-2 px-4 py-2 
                    bg-gradient-to-r from-purple-600 to-indigo-600 
                    text-white text-xs font-bold uppercase tracking-widest rounded-lg 
                    shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 
                    transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
                    disabled:opacity-50 disabled:cursor-not-allowed
                    whitespace-nowrap shrink-0
                `}
            >
                {/* Shiny Effect Overlay */}
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12"></div>
                
                {isAiLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>AI Auto-Tag</span>
                    </>
                )}
            </button>
         </div>

         {/* 2. The Text Area */}
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

      {/* EFFORT & MOOD SECTION */}
      <div className="mt-8 mb-8 relative">
        {/* The AI "Psychologist" Popup Bubble */}
        {aiObservation && (
            <div className="absolute -top-12 left-0 right-0 mx-auto w-max max-w-sm z-20 animate-in slide-in-from-bottom-2 fade-in">
                <div className="bg-purple-900 text-purple-100 text-xs px-4 py-2 rounded-full shadow-lg border border-purple-700 flex items-center gap-2">
                    <BrainCircuit className="w-3 h-3 text-purple-300" />
                    "{aiObservation}"
                </div>
                {/* Little Triangle Pointer */}
                <div className="w-2 h-2 bg-purple-900 border-r border-b border-purple-700 transform rotate-45 mx-auto -mt-1"></div>
            </div>
        )}

        <div className={`
             p-4 border rounded-xl transition-colors duration-500
             ${formData.mood === 'flow' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : ''}
             ${formData.mood === 'stuck' ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800' : ''}
             ${formData.mood === 'chill' ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' : ''}
             ${formData.mood === 'neutral' ? 'bg-gray-50/50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700' : ''}
        `}>
            <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Intensity & Mood</span>
                 </div>
                 
                 {/* 🧠 THE VIBE CHECK BUTTON */}
                 <button
                    onClick={handleVibeCheck}
                    disabled={vibeLoading}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                 >
                    {vibeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                    {vibeLoading ? "Reading Mind..." : "Analyze Vibe"}
                 </button>
            </div>

            <EffortSlider
                value={formData.effortRating}
                onChange={val => setFormData({ ...formData, effortRating: val })}
            />
            
            {/* Mood Selector (Visual Feedback) */}
            <div className="flex justify-center gap-2 mt-4">
                {['neutral', 'flow', 'stuck', 'chill'].map((m) => (
                    <button
                        key={m}
                        onClick={() => setFormData({...formData, mood: m as any})}
                        className={`
                            px-3 py-1 rounded text-[10px] uppercase font-bold transition-all
                            ${formData.mood === m 
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-black scale-105 shadow-md' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }
                        `}
                    >
                        {m}
                    </button>
                ))}
            </div>
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
          workLog={formData.workLog}
          mood={formData.mood}
        />
        
        <AudioController 
            isPlaying={isPlaying} 
            togglePlay={togglePlay} 
            currentBiome={currentBiome}
            intensity={intensity}
        />

        <PanicMode 
            isOpen={isPanicOpen} 
            onClose={handlePanicClose} 
        />

        <ActionButton 
          onClick={handleSubmit} 
          disabled={!validation.isValid || isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : (initialData ? 'Update Entry' : 'Commit Entry')}
        </ActionButton>
      </div>
    </div>
  );
};