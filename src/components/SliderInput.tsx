import React from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  darkMode: boolean;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  darkMode,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          {label}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-20 px-2 py-1 rounded text-sm text-right ${darkMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'}`}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200"
      />
    </div>
  );
};
