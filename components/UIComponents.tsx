import React from 'react';

// --- Text Area with Character Count & Validation ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  maxLength: number;
  minLength?: number;
  warning?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ 
  label, maxLength, minLength = 0, value, warning, className, rows, ...props 
}) => {
  const currentLength = (value as string)?.length || 0;
  
  return (
    <div className="mb-8 group">
      <label className="block text-xs font-sans font-semibold tracking-wider text-subtle mb-3 uppercase">
        {label}
      </label>
      <div className="relative">
        <textarea
          className={`w-full bg-transparent border-l-2 pl-4 py-2 font-serif text-lg leading-relaxed text-ink placeholder-gray-300 focus:outline-none focus:border-ink transition-all resize-none ${warning ? 'border-orange-300' : 'border-border'}`}
          rows={rows || 3}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        {/* Character Count Indicator */}
        <div className={`absolute bottom-2 right-2 text-xs font-sans transition-opacity duration-300 ${currentLength > 0 ? 'opacity-100' : 'opacity-0'}`}>
          <span className={`${(minLength && currentLength < minLength) ? 'text-orange-400' : 'text-subtle'}`}>
            {currentLength}
          </span>
          <span className="text-gray-200"> / {maxLength}</span>
        </div>
      </div>
    </div>
  );
};

// --- Effort Slider ---
interface EffortSliderProps {
  value: number;
  onChange: (val: number) => void;
  readOnly?: boolean;
}

export const EffortSlider: React.FC<EffortSliderProps> = ({ value, onChange, readOnly }) => {
  const labels = {
    1: 'Bare Minimum',
    2: 'Low Energy',
    3: 'Average Focus',
    4: 'Strong Effort',
    5: 'Deep Focus'
  };

  return (
    <div className="mb-8">
      <label className="block text-xs font-sans font-semibold tracking-wider text-subtle mb-4 uppercase">
        Effort Rating <span className="font-normal normal-case text-gray-300 ml-2">(Not mood)</span>
      </label>
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => !readOnly && onChange(rating)}
              disabled={readOnly}
              className={`
                h-12 flex-1 rounded-sm border transition-all duration-300
                ${value === rating 
                  ? 'bg-ink border-ink text-paper' 
                  : 'bg-transparent border-border text-subtle hover:border-gray-400'}
                ${readOnly ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <span className="font-serif text-lg">{rating}</span>
            </button>
          ))}
        </div>
        <div className="text-center font-sans text-sm text-focus h-5">
           {value ? labels[value as keyof typeof labels] : ''}
        </div>
      </div>
    </div>
  );
};

// --- Primary Action Button ---
export const ActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, disabled, className, ...props }) => (
  <button
    disabled={disabled}
    className={`
      px-8 py-3 bg-ink text-paper font-sans text-sm tracking-wide font-medium rounded shadow-sm
      transition-all duration-300 transform hover:-translate-y-0.5
      disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none
      ${className}
    `}
    {...props}
  >
    {children}
  </button>
);