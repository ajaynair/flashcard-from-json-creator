import React from 'react';
import { WordDefinition, WordStatus } from '../types';
import { CheckCircleIcon, XCircleIcon } from './IconComponents';

interface WordDisplayProps {
  item: WordDefinition | null;
  isLoading: boolean;
  onSetStatus: (word: string, status: WordStatus) => void;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({ item, isLoading, onSetStatus }) => {
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

  const handleKnowClick = () => {
    onSetStatus(item.word, 'known');
  };

  const handleReviewClick = () => {
    onSetStatus(item.word, 'unknown');
  };

  const baseButtonClass = "flex-1 sm:flex-none sm:w-auto text-sm font-medium py-2.5 px-5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-150 flex items-center justify-center space-x-2";
  const knownButtonClass = item.status === 'known' ? "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500" : "bg-slate-600 hover:bg-green-600 text-slate-300 hover:text-white focus:ring-green-500";
  const unknownButtonClass = item.status === 'unknown' || !item.status ? "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400" : "bg-slate-600 hover:bg-amber-500 text-slate-300 hover:text-white focus:ring-amber-400";


  return (
    <div className="w-full bg-slate-700/80 shadow-2xl rounded-xl p-6 md:p-10 my-8 transition-all duration-300 ease-in-out hover:shadow-indigo-500/30">
      <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-5 break-words">
        {item.word}
      </h2>
      <p className="text-slate-300 text-lg leading-relaxed break-words whitespace-pre-line">{item.definition}</p>
      <div className="mt-8 pt-6 border-t border-slate-600/70 flex flex-col sm:flex-row justify-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
        <button onClick={handleKnowClick} className={`${baseButtonClass} ${knownButtonClass}`} aria-pressed={item.status === 'known'}>
          <CheckCircleIcon className="w-5 h-5" />
          <span>I Know This</span>
        </button>
        <button onClick={handleReviewClick} className={`${baseButtonClass} ${unknownButtonClass}`} aria-pressed={item.status === 'unknown' || !item.status}>
          <XCircleIcon className="w-5 h-5" />
          <span>Review Later</span>
        </button>
      </div>
    </div>
  );
};