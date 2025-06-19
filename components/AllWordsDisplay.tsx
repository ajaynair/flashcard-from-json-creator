import React from 'react';
import { WordDefinition } from '../types';
import { ChevronLeftIcon, InformationCircleIcon } from './IconComponents'; // Added for potential future use or consistency
import { formatIntervalForDisplay, DAY_MS, HOUR_MS, MINUTE_MS } from '../spacedRepetition';

interface AllWordsDisplayProps {
  dictionary: WordDefinition[];
  onBack: () => void;
  fileName: string | null;
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) return "Due now";
  if (diff < HOUR_MS) return `In ${Math.round(diff / MINUTE_MS)}m`;
  if (diff < DAY_MS) return `In ${Math.round(diff / HOUR_MS)}h`;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const AllWordsDisplay: React.FC<AllWordsDisplayProps> = ({ dictionary, onBack, fileName }) => {

  const sortedDictionary = [...dictionary].sort((a, b) => {
    // Sort by next review date, then by word alphabetically
    if (a.nextReviewDate !== b.nextReviewDate) {
      return a.nextReviewDate - b.nextReviewDate;
    }
    return a.word.localeCompare(b.word);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 flex flex-col items-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-3xl">
        <header className="mb-6 md:mb-8 py-4 flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              All Words Status
            </h1>
            {fileName && <p className="text-sm text-slate-400 mt-1">Loaded File: <span className="font-medium text-slate-300">{fileName}</span> ({dictionary.length} words)</p>}
          </div>
          <button
            onClick={onBack}
            className="mt-4 sm:mt-0 flex items-center justify-center px-5 py-2.5 border border-indigo-600/50 rounded-lg shadow-md text-sm font-medium text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors duration-150"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            Back to Learning
          </button>
        </header>

        {dictionary.length === 0 ? (
          <div className="bg-slate-800/70 backdrop-blur-md shadow-xl rounded-lg p-6 md:p-8 text-center my-8">
            <InformationCircleIcon className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">No dictionary loaded.</p>
            <p className="text-slate-400 text-sm mt-2">Please upload a JSON file from the main screen to see your words here.</p>
          </div>
        ) : (
          <main className="bg-slate-800/60 backdrop-blur-md shadow-xl rounded-xl p-1 md:p-2">
            <div className="max-h-[75vh] overflow-y-auto pr-2">
              <ul className="space-y-3 p-3 md:p-4">
                {sortedDictionary.map(item => (
                  <li key={item.word} className="bg-slate-700/70 p-4 rounded-lg shadow-md hover:bg-slate-600/70 transition-colors duration-150">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-indigo-300 break-words flex-1 mr-3">{item.word}</h3>
                        <div className="text-xs text-right space-y-0.5">
                            <span className={`capitalize px-2 py-0.5 rounded-full text-white ${
                                item.srsState.status === 'learning' ? 'bg-yellow-500/80' :
                                item.srsState.status === 'reviewing' ? 'bg-green-500/80' :
                                'bg-orange-500/80' // relearning
                            }`}>
                                {item.srsState.status}
                            </span>
                             <p className="text-slate-400">
                                Next: {formatDate(item.nextReviewDate)}
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-300 mt-1.5 text-sm leading-relaxed break-words whitespace-pre-line">{item.definition}</p>
                    <div className="mt-2 pt-2 border-t border-slate-600/50 text-xs text-slate-400">
                      Interval: {item.srsState.interval ? formatIntervalForDisplay(item.srsState.interval) : 'N/A'} | 
                      Ease: {item.srsState.ease.toFixed(2)} | 
                      Step: {item.srsState.step}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </main>
        )}
        <footer className="mt-10 py-4 text-center text-xs text-slate-500">
          <p>This view shows the current status of all words in your deck.</p>
        </footer>
      </div>
    </div>
  );
};

