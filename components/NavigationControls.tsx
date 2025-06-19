import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './IconComponents';

interface NavigationControlsProps {
  currentIndex: number;
  totalItems: number;
  onNext: () => void;
  onPrev: () => void;
  disabled: boolean;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentIndex,
  totalItems,
  onNext,
  onPrev,
  disabled,
}) => {
  if (totalItems <= 0 || disabled) { 
    return null;
  }

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalItems - 1;

  const buttonBaseClass = "px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-150 flex items-center justify-center disabled:cursor-not-allowed";
  const activeButtonClass = "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
  const disabledButtonClass = "bg-slate-600 text-slate-400";

  return (
    <div className="flex justify-between items-center space-x-4 my-8">
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className={`${buttonBaseClass} ${canGoPrev ? activeButtonClass : disabledButtonClass}`}
      >
        <ChevronLeftIcon className="w-5 h-5 mr-2" />
        Previous
      </button>
      <span className="text-slate-400 font-medium text-sm tabular-nums">
        {totalItems > 0 ? currentIndex + 1 : 0} / {totalItems}
      </span>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`${buttonBaseClass} ${canGoNext ? activeButtonClass : disabledButtonClass}`}
      >
        Next
        <ChevronRightIcon className="w-5 h-5 ml-2" />
      </button>
    </div>
  );
};