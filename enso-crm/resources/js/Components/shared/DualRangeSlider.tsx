import React, { useState, useEffect, useCallback } from 'react';

interface DualRangeSliderProps {
  label?: string;
  min?: number;
  max?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  label = "min - max",
  min = 0,
  max = 100,
  value,
  onChange,
  className = ''
}) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);

  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - 1);
    setMinVal(val);
    onChange([val, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + 1);
    setMaxVal(val);
    onChange([minVal, val]);
  };

  const getPercent = useCallback((val: number) => {
    return Math.round(((val - min) / (max - min)) * 100);
  }, [min, max]);

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  const inputStyles = `
    absolute w-full h-5 appearance-none bg-transparent pointer-events-none outline-none
    [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:cursor-pointer
    [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none
  `;

  return (
    <div className={`inline-flex flex-col justify-start items-start gap-2 w-full px-1.5 ${className}`}>
      
      {label && (
        <label className="text-xs font-normal text-text-body font-sans">
          {label}
        </label>
      )}

      <div className="flex flex-col w-full gap-2">
        <div className="relative w-full h-5 flex items-center justify-center">
          
          <div className="absolute w-full h-1.5 bg-border-line rounded-full" />
          
          <div 
            className="absolute h-1.5 bg-brand-primary rounded-full transition-all duration-75"
            style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
          />

          <div 
            className="absolute w-5 h-5 bg-bg-card border-2 border-text-body rounded-full transition-all duration-75 shadow-sm"
            style={{ left: `calc(${minPercent}% - 10px)` }}
          />

          <div 
            className="absolute w-5 h-5 bg-bg-card border-2 border-text-body rounded-full transition-all duration-75 shadow-sm"
            style={{ left: `calc(${maxPercent}% - 10px)` }}
          />

          <input
            type="range"
            min={min}
            max={max}
            value={minVal}
            onChange={handleMinChange}
            className={`${inputStyles} z-10`}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={maxVal}
            onChange={handleMaxChange}
            className={`${inputStyles} z-20`}
          />
        </div>

        <div className="w-full flex justify-between items-center px-1">
          <span className="text-xs font-normal text-text-main font-sans text-center">
            {minVal}
          </span>
          <span className="text-xs font-normal text-text-main font-sans text-center">
            {maxVal}
          </span>
        </div>
      </div>
      
    </div>
  );
};