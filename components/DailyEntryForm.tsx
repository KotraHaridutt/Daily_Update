import React, { useState, useEffect, useMemo } from 'react';
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
      setFormData({ workLog: '', learningLog: '', timeLeakLog: '', effortRating: 0, freeThought: '' });
      setShowFreeThought(false);
    }

    const isToday = targetDate === getTodayISO();
    setIsEditing(isToday);
  }, [initialData, targetDate]);

  const validation = useMemo(() => {
    const workLen = formData.workLog.length;
    const workRemaining = Math.max(0, VALIDATION_LIMITS.WORK_MIN - workLen);
    const workShort = workRemaining > 0;
    const learnEmpty = !formData.learningLog.trim();
    const leakEmpty = !formData.timeLeakLog.trim();
    const effortZero = formData.effortRating === 0;

    const allText = `${formData.workLog} ${formData.learningLog} ${formData.timeLeakLog}`.toLowerCase();
    const words = allText.split(/[\s,.!?]+/);
    const vagueWord = words.find(w => VAGUE_WORDS.includes(w));
    
    const isValid = !workShort && !learnEmpty && !leakEmpty && !effortZero; 
    return { workShort, workRemaining, learnEmpty, leakEmpty, effortZero, vagueWord, isValid };
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
      <div className="animate-fade-in space-y-8 pt-4 relative bg-white p-8 rounded-xl border border-border shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
           <div className="flex items-center gap-2 text-subtle">
             <Lock className="w-4 h-4" />
             <span className="text-xs font-sans uppercase tracking-widest">
                {allowEdit ? "Locked Entry" : "Entry Locked"}
             </span>
           </div>
           
           {allowEdit && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink hover:text-blue-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200"
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
                    <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Work</h3>
                    <p className="font-serif text-lg leading-relaxed text-ink whitespace-pre-wrap">{formData.workLog}</p>
                </section>
                <section>
                    <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Learning</h3>
                    <p className="font-serif text-lg leading-relaxed text-ink whitespace-pre-wrap">{formData.learningLog}</p>
                </section>
                <div className="grid grid-cols-2 gap-8">
                    <section>
                        <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Time Leak</h3>
                        <p className="font-serif text-lg leading-relaxed text-ink whitespace-pre-wrap">{formData.timeLeakLog}</p>
                    </section>
                    <section>
                        <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Effort</h3>
                        <div className="flex gap-1 mt-1">
                            {[...Array(formData.effortRating)].map((_, i) => <div key={i} className="h-2 w-8 bg-ink rounded-sm" />)}
                            {[...Array(5 - formData.effortRating)].map((_, i) => <div key={`empty-${i}`} className="h-2 w-8 bg-gray-200 rounded-sm" />)}
                        </div>
                    </section>
                </div>
                {formData.freeThought && (
                <section className="pt-6 border-t border-border mt-8">
                    <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Free Thought</h3>
                    <p className="font-serif text-base italic text-gray-600 whitespace-pre-wrap">{formData.freeThought}</p>
                </section>
                )}
            </>
        )}
      </div>
    );
  }

  // --- EDIT VIEW ---
  return (
    <div className="animate-fade-in bg-white p-8 rounded-xl border border-border shadow-sm">
      <div className="mb-8 flex justify-between items-center border-b border-gray-100 pb-4">
        <span className="text-sm font-mono text-gray-500 bg-gray-50 px-3 py-1 rounded-md">{targetDate}</span>
        <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-400 hover:text-ink uppercase tracking-wider">Cancel Edit</button>
      </div>

      {/* --- WORK SECTION --- */}
      <div className="mb-2">
         <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_TAGS.map(tag => (
                <button
                    key={tag}
                    onClick={() => appendText('workLog', tag)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-blue-100 transition-colors"
                >
                    <Tag className="w-3 h-3" />
                    {tag}
                </button>
            ))}
         </div>
         <TextArea
            label="What I actually worked on"
            placeholder="Be specific. What problem did you solve?"
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
        {/* LEFT COL: LEARNING */}
        <TextArea
            label="One thing I learned"
            placeholder="A technical concept or pattern."
            value={formData.learningLog}
            onChange={e => setFormData({ ...formData, learningLog: e.target.value })}
            maxLength={VALIDATION_LIMITS.LEARN_MAX}
            warning={showValidationFeedback && validation.learnEmpty}
            rows={4}
        />

        {/* RIGHT COL: TIME LEAK (Manually Aligned) */}
        <div className="flex flex-col">
            {/* 1. Label First (For Alignment) */}
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 font-sans">
                Where my time leaked
            </label>

            {/* 2. Chips Second */}
            <div className="flex flex-wrap gap-2 mb-2">
                {TIME_LEAKS.map(leak => (
                    <button
                        key={leak}
                        onClick={() => appendText('timeLeakLog', leak)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-red-100 transition-colors"
                    >
                        <Zap className="w-3 h-3" />
                        {leak}
                    </button>
                ))}
            </div>

            {/* 3. Input Third (Label removed to prevent double label) */}
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
        <div className={showValidationFeedback && validation.effortZero ? "p-2 border border-orange-200 rounded-lg bg-orange-50/50" : ""}>
            <EffortSlider
            value={formData.effortRating}
            onChange={val => setFormData({ ...formData, effortRating: val })}
            />
        </div>
      </div>

      <div className="mb-8 border-t border-border pt-4">
        <button
          onClick={() => setShowFreeThought(!showFreeThought)}
          className="flex items-center text-xs font-sans font-semibold text-subtle hover:text-ink transition-colors"
        >
          {showFreeThought ? <ChevronUp className="w-3 h-3 mr-1"/> : <ChevronDown className="w-3 h-3 mr-1"/>}
          Free Thought (Optional)
        </button>
        
        {showFreeThought && (
          <div className="mt-4 animate-slide-down">
             <textarea
               className="w-full bg-paper border border-border p-4 font-serif text-base text-ink placeholder-gray-300 focus:outline-none focus:border-ink rounded-sm"
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
           <div className="w-full bg-gray-50 p-4 rounded-sm border border-gray-100 mb-2">
             <div className="flex items-center gap-2 mb-2 text-ink font-sans text-xs font-bold uppercase tracking-wider">
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