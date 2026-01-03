import React from 'react';

// --- 1. THE NEW GRADIENT SLIDER (Dark Mode Compatible) ---
interface EffortSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export const EffortSlider: React.FC<EffortSliderProps> = ({ value, onChange }) => {
  const levels = [
    { val: 1, label: 'Cool',   color: 'bg-blue-300 dark:bg-blue-700',   active: 'bg-blue-400 dark:bg-blue-500',   glow: 'shadow-blue-200 dark:shadow-blue-900' },
    { val: 2, label: 'Steady', color: 'bg-teal-300 dark:bg-teal-700',   active: 'bg-teal-400 dark:bg-teal-500',   glow: 'shadow-teal-200 dark:shadow-teal-900' },
    { val: 3, label: 'Strong', color: 'bg-green-300 dark:bg-green-700',  active: 'bg-green-500 dark:bg-green-500',  glow: 'shadow-green-200 dark:shadow-green-900' },
    { val: 4, label: 'Heavy',  color: 'bg-orange-300 dark:bg-orange-700', active: 'bg-orange-500 dark:bg-orange-500', glow: 'shadow-orange-200 dark:shadow-orange-900' },
    { val: 5, label: 'Max',    color: 'bg-red-400 dark:bg-red-700',    active: 'bg-red-600 dark:bg-red-500',    glow: 'shadow-red-200 dark:shadow-red-900' },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">
          Effort Intensity
        </label>
        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${value > 0 ? 'text-ink dark:text-gray-100' : 'text-gray-300 dark:text-gray-600'}`}>
          {value === 0 ? 'Select Level' : levels[value - 1].label}
        </span>
      </div>

      <div className="flex gap-1 h-12 w-full">
        {levels.map((level) => {
          const isActive = value >= level.val;
          const isExact = value === level.val;
          
          return (
            <button
              key={level.val}
              onClick={() => onChange(level.val)}
              type="button"
              className={`
                flex-1 rounded-sm transition-all duration-300 relative overflow-hidden group
                ${isActive ? level.active : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}
                ${isExact ? `shadow-[0_0_15px_-3px] ${level.glow} z-10 scale-[1.02]` : ''}
              `}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="flex justify-between mt-2 text-[10px] text-gray-300 dark:text-gray-600 font-sans font-bold uppercase tracking-widest">
        <span>Low</span>
        <span>High Burn</span>
      </div>
    </div>
  );
};

// --- 2. TEXT AREA (Dark Mode Compatible) ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  warning?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, warning, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 font-sans">
          {label}
        </label>
      )}
      <div className="relative group">
        <textarea
          {...props}
          className={`
            w-full font-serif text-lg leading-relaxed
            border-b-2 transition-all duration-300 outline-none resize-none py-2
            placeholder:text-gray-200 dark:placeholder:text-gray-700 placeholder:italic
            
            /* Light Mode Colors */
            bg-white text-ink border-gray-100 focus:border-ink
            
            /* Dark Mode Colors */
            dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800 dark:focus:border-gray-400
            
            ${warning 
              ? 'border-red-300 focus:border-red-500 bg-red-50/10 dark:bg-red-900/10' 
              : ''
            }
            ${className}
          `}
        />
        {/* Character Count */}
        {props.maxLength && (
          <div className={`
            absolute bottom-2 right-2 text-[10px] font-mono transition-colors
            ${(props.value as string)?.length > (props.maxLength * 0.9) ? 'text-orange-500 font-bold' : 'text-gray-200 dark:text-gray-700'}
          `}>
            {(props.value as string)?.length || 0} / {props.maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 3. ACTION BUTTON (Dark Mode Compatible) ---
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const ActionButton: React.FC<ActionButtonProps> = ({ children, className = '', disabled, ...props }) => {
  return (
    <button
      disabled={disabled}
      className={`
        px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-sm
        transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        
        bg-ink text-white 
        dark:bg-gray-100 dark:text-gray-900 dark:hover:shadow-white/10
        
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};