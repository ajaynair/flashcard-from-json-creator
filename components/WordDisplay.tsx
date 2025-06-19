import React from 'react';
import { WordDefinition } from '../types';
import { SimpleSpacedRepetitionCard, SRSOption, formatIntervalForDisplay } from '../spacedRepetition';

interface WordDisplayProps {
  item: WordDefinition | null;
  isLoading: boolean;
  onSpacedRepetitionChoice: (word: string, choice: SRSOption) => void;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({ item, isLoading, onSpacedRepetitionChoice }) => {
  if (isLoading) {
    return (
      <div className="w-full bg-slate-700/50 shadow-xl rounded-lg p-6 md:p-8 my-6 text-center animate-pulse">
        <div className="h-8 bg-slate-600 rounded w-3/4 mx-auto mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-600 rounded w-full"></div>
          <div className="h-4 bg-slate-600 rounded w-5/6"></div>
          <div className="h-4 bg-slate-600 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const srsCard = new SimpleSpacedRepetitionCard(item.srsState);
  const srsOptions = srsCard.options();

  const handleChoice = (option: SRSOption) => {
    onSpacedRepetitionChoice(item.word, option);
  };

  const buttonBaseClass = "flex-1 text-sm font-medium py-2.5 px-3 sm:px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-150 flex flex-col items-center justify-center space-y-1";

  const buttonStyles = {
    Again: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    Hard: "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400",
    Good: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    Easy: "bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400",
  };

  return (
    <div className="w-full bg-slate-700/80 shadow-2xl rounded-xl p-6 md:p-10 my-8 transition-all duration-300 ease-in-out hover:shadow-indigo-500/30">
      <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-5 break-words">
        {item.word}
      </h2>
      <p className="text-slate-300 text-lg leading-relaxed break-words whitespace-pre-line">{item.definition}</p>
      
      <div className="mt-8 pt-6 border-t border-slate-600/70 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {srsOptions.map((option) => (
          <button
            key={option.label}
            onClick={() => handleChoice(option)}
            className={`${buttonBaseClass} ${buttonStyles[option.label]}`}
            aria-label={`${option.label} - next review in ${formatIntervalForDisplay(option.resultingIntervalDisplay)}`}
          >
            <span>{option.label}</span>
            <span className="text-xs opacity-80">
              ({formatIntervalForDisplay(option.resultingIntervalDisplay)})
            </span>
          </button>
        ))}
      </div>
       {item.srsState.status === 'reviewing' && item.srsState.interval && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          Current interval: {formatIntervalForDisplay(item.srsState.interval)}, Ease: {item.srsState.ease.toFixed(2)}
        </p>
      )}
       {item.srsState.status === 'learning' && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          Learning (Step {item.srsState.step + 1})
        </p>
      )}
       {item.srsState.status === 'relearning' && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          Relearning
        </p>
      )}
    </div>
  );
};

