import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { LedgerEntry, VALIDATION_LIMITS, VAGUE_WORDS } from '../types';
import { TextArea, EffortSlider, ActionButton } from './UIComponents';
import { LedgerService, getTodayISO } from '../services/ledgerService';
import { ChevronDown, ChevronUp, Lock, AlertCircle, Edit2, Tag, Zap } from 'lucide-react';

interface Props {
  onSaved: () => void;
  initialData?: LedgerEntry;
  readOnlyMode?: boolean;
  targetDate?: string;
  allowEdit?: boolean;
}

const QUICK_TAGS = ['#Coding', '#BugFix', '#Meeting', '#Learning', '#Planning', '#Review'];
const TIME_LEAKS = ['📱 Social Media', '🎮 Games', '🛌 Napping', '💭 Overthinking', '🔁 Context Switch', '🐌 Procrastination'];

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
  allowEdit = false 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    workLog: '',
    learningLog: '',
    timeLeakLog: '',
    effortRating: 0,
    freeThought: ''
  });
  
  const [showFreeThought, setShowFreeThought] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // --- EFFECT 1: Handle Data Updates (Populate Form) ---
  useEffect(() => {
    if (initialData) {
      setFormData({
        workLog: initialData.workLog,
        learningLog: initialData.learningLog,
        timeLeakLog: initialData.timeLeakLog,
        effortRating: initialData.effortRating,
        freeThought: initialData.freeThought || ''
      });
      if (initialData.freeThought) setShowFreeThought(true);
    } else {
      // Reset if no data for this day
      setFormData({ workLog: '', learningLog: '', timeLeakLog: '', effortRating: 0, freeThought: '' });
      setShowFreeThought(false);
    }
  }, [initialData]); // Removed targetDate from here to prevent loops

  // --- EFFECT 2: Handle Date Selection (Switch Mode) ---
  useEffect(() => {
    const isToday = targetDate === getTodayISO();
    // Only auto-open edit mode if it's today AND we don't have data yet?
    // For now, we simply default to Edit mode when you CLICK a date that is Today.
    // But importantly, this won't run again when you click "Save".
    setIsEditing(isToday);
  }, [targetDate]);

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

  const appendText = (field: keyof typeof formData, text: string) => {
    setFormData(prev => {
        const currentVal = prev[field] as string;
        if (currentVal.includes(text)) return prev;
        const prefix = currentVal.length > 0 ? '\n' : ''; 
        return { ...prev, [field]: currentVal + prefix + text };
    });
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    if (!validation.isValid) return;
    
    setIsSaving(true);
    try {
      await LedgerService.saveEntry({
        date: targetDate,
        ...formData
      });
      // 1. Close Edit Mode IMMEDIATELY
      setIsEditing(false);
      // 2. Notify Parent to reload data
      onSaved();
    } catch (error) {
      alert("Failed to save to cloud. Check console.");
    } finally {
      setIsSaving(false);
    }
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
        {/* If we already have data, we can Cancel Edit. If it's a new entry, we probably can't cancel to anything. */}
        {initialData && (
             <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-400 hover:text-ink dark:hover:text-gray-200 uppercase tracking-wider">Cancel Edit</button>
        )}
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
            label="What I actually worked on"
            placeholder="Supports Markdown! Use **bold** or `code`..."
            value={formData.workLog}
            onChange={e => setFormData({ ...formData, workLog: e.target.value })}
            maxLength={VALIDATION_LIMITS.WORK_MAX}
            minLength={VALIDATION_LIMITS.WORK_MIN}
            rows={10}
            autoFocus
            warning={showValidationFeedback && validation.workShort}
         />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <TextArea
            label="One thing I learned"
            placeholder="A technical concept or pattern."
            value={formData.learningLog}
            onChange={e => setFormData({ ...formData, learningLog: e.target.value })}
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
                onChange={e => setFormData({ ...formData, timeLeakLog: e.target.value })}
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
               onChange={e => setFormData({...formData, freeThought: e.target.value})}
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