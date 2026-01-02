import React, { useState, useEffect, useMemo } from 'react';
import { LedgerEntry, VALIDATION_LIMITS, VAGUE_WORDS } from '../types';
import { TextArea, EffortSlider, ActionButton } from './UIComponents';
import { LedgerService, getTodayISO } from '../services/ledgerService';
import { ChevronDown, ChevronUp, Lock, AlertCircle, Edit2 } from 'lucide-react';

interface Props {
  onSaved: () => void;
  initialData?: LedgerEntry;
  readOnlyMode?: boolean;
  targetDate?: string; // The date this entry belongs to
  allowEdit?: boolean; // Permission to switch from Read to Edit mode
}

export const DailyEntryForm: React.FC<Props> = ({ 
  onSaved, 
  initialData, 
  readOnlyMode = false,
  targetDate = getTodayISO(),
  allowEdit = false 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  // Internal state to switch from Read-Only to Edit mode
  const [isEditing, setIsEditing] = useState(!readOnlyMode);
  
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
    }
  }, [initialData]);

  // Real-time validation
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

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    if (!validation.isValid) return;
    
    setIsSaving(true);
    try {
      await LedgerService.saveEntry({
        date: targetDate, // Use the fixed target date (Today or Yesterday)
        ...formData
      });
      onSaved();
      // If we were editing inside a modal, switch back to read view might be handled by parent,
      // but keeping it editable is usually better UX until closed.
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
      <div className="animate-fade-in space-y-8 max-w-2xl mx-auto pt-8 relative">
        <div className="text-center mb-8">
           <Lock className="w-4 h-4 mx-auto text-subtle mb-2" />
           <p className="text-xs font-sans text-subtle uppercase tracking-widest">Entry Locked</p>
        </div>

        {/* The Magic "EDIT" Button - Only shows if allowed */}
        {allowEdit && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink hover:text-blue-600 transition-colors bg-gray-50 px-3 py-2 rounded-full border border-gray-200"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        )}
        
        <section>
          <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Work</h3>
          <p className="font-serif text-lg leading-relaxed text-ink border-l-2 border-border pl-4 whitespace-pre-wrap">{formData.workLog}</p>
        </section>

        <section>
          <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Learning</h3>
          <p className="font-serif text-lg leading-relaxed text-ink border-l-2 border-border pl-4 whitespace-pre-wrap">{formData.learningLog}</p>
        </section>

        <section>
          <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Time Leak</h3>
          <p className="font-serif text-lg leading-relaxed text-ink border-l-2 border-border pl-4 whitespace-pre-wrap">{formData.timeLeakLog}</p>
        </section>
        
        <section>
          <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Effort</h3>
          <div className="flex gap-1">
             {[...Array(formData.effortRating)].map((_, i) => (
                <div key={i} className="h-2 w-8 bg-ink rounded-sm" />
             ))}
             {[...Array(5 - formData.effortRating)].map((_, i) => (
                <div key={`empty-${i}`} className="h-2 w-8 bg-gray-200 rounded-sm" />
             ))}
          </div>
        </section>

        {formData.freeThought && (
           <section className="pt-4 border-t border-border mt-8">
            <h3 className="text-xs font-sans font-semibold text-subtle uppercase tracking-wider mb-2">Free Thought</h3>
            <p className="font-serif text-base italic text-gray-600 whitespace-pre-wrap">{formData.freeThought}</p>
          </section>
        )}
      </div>
    );
  }

  // --- EDIT VIEW (No Date Picker!) ---
  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      {/* Visual Indicator of what date we are editing */}
      <div className="mb-6 text-center">
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-mono rounded-full">
          Editing Log for: {targetDate}
        </span>
      </div>

      <TextArea
        label="What I actually worked on"
        placeholder="Be specific. No 'general coding'. What problem did you solve?"
        value={formData.workLog}
        onChange={e => setFormData({ ...formData, workLog: e.target.value })}
        maxLength={VALIDATION_LIMITS.WORK_MAX}
        minLength={VALIDATION_LIMITS.WORK_MIN}
        rows={12}
        autoFocus
        warning={showValidationFeedback && validation.workShort}
      />

      <TextArea
        label="One thing I learned or realized"
        placeholder="A technical concept, a pattern, or a mistake avoided."
        value={formData.learningLog}
        onChange={e => setFormData({ ...formData, learningLog: e.target.value })}
        maxLength={VALIDATION_LIMITS.LEARN_MAX}
        warning={showValidationFeedback && validation.learnEmpty}
      />

      <TextArea
        label="Where my time leaked"
        placeholder="Social media, over-optimizing, hesitation?"
        value={formData.timeLeakLog}
        onChange={e => setFormData({ ...formData, timeLeakLog: e.target.value })}
        maxLength={VALIDATION_LIMITS.LEAK_MAX}
        warning={showValidationFeedback && validation.leakEmpty}
      />

      <div className={showValidationFeedback && validation.effortZero ? "p-2 border border-orange-200 rounded-lg bg-orange-50/50" : ""}>
        <EffortSlider
          value={formData.effortRating}
          onChange={val => setFormData({ ...formData, effortRating: val })}
        />
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

      <div className="flex flex-col items-center gap-4 mt-12 mb-24">
        {!validation.isValid && showValidationFeedback && (
           <div className="w-full bg-gray-50 p-4 rounded-sm border border-gray-100 mb-2">
             <div className="flex items-center gap-2 mb-2 text-ink font-sans text-xs font-bold uppercase tracking-wider">
               <AlertCircle className="w-3 h-3" />
               Pending Requirements
             </div>
             <ul className="text-xs text-subtle space-y-1 list-disc list-inside">
               {validation.workShort && <li>Work log needs {validation.workRemaining} more characters</li>}
               {validation.learnEmpty && <li>Learning log is required</li>}
               {validation.leakEmpty && <li>Time leak log is required</li>}
               {validation.effortZero && <li>Effort rating must be selected</li>}
             </ul>
           </div>
        )}
        
        {validation.vagueWord && (
          <p className="text-xs text-orange-600 font-sans font-medium">
            Try to be more specific than "{validation.vagueWord}".
          </p>
        )}

        <div className="flex gap-4 w-full justify-center">
            {/* If we are "backfilling" via modal, show a Cancel button to go back to read-only */}
            {allowEdit && readOnlyMode && (
                <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-ink transition-colors"
                >
                    Cancel
                </button>
            )}

            <ActionButton 
            onClick={handleSubmit} 
            disabled={!validation.isValid || isSaving}
            className="w-full sm:w-auto"
            >
            {isSaving ? 'Saving...' : (initialData ? 'Update Entry' : 'Commit Entry')}
            </ActionButton>
        </div>
      </div>
    </div>
  );
};