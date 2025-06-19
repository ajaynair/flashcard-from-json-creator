import React from 'react';
import { WordDefinition, WordStatus } from '../types';
import { ChevronLeftIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from './IconComponents';

interface AllWordsDisplayProps {
  dictionary: WordDefinition[];
  onSetStatus: (word: string, status: WordStatus) => void;
  onBack: () => void;
  fileName: string | null;
}

export const AllWordsDisplay: React.FC<AllWordsDisplayProps> = ({ dictionary, onSetStatus, onBack, fileName }) => {
  const knownWords = dictionary.filter(item => item.status === 'known');
  // Only include words explicitly marked as 'unknown' (which is the default for new words).
  const reviewLaterWords = dictionary.filter(item => item.status === 'unknown'); 

  const renderWordList = (words: WordDefinition[], listType: 'known' | 'reviewLater') => {
    if (words.length === 0) {
      return <p className="text-slate-500 text-sm px-1 py-4">No words in this category yet.</p>;
    }
    return (
      <ul className="space-y-3">
        {words.map(item => (
          <li key={item.word} className="bg-slate-700/70 p-4 rounded-lg shadow-md hover:bg-slate-600/70 transition-colors duration-150">
            <h3 className="text-lg font-semibold text-indigo-300 break-words">{item.word}</h3>
            <p className="text-slate-300 mt-1.5 text-sm leading-relaxed break-words whitespace-pre-line">{item.definition}</p>
            <div className="mt-3 pt-3 border-t border-slate-600/50">
              {listType === 'known' ? (
                <button
                  onClick={() => onSetStatus(item.word, 'unknown')}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 py-1 px-2 rounded hover:bg-amber-500/10 transition-colors"
                  aria-label={`Mark ${item.word} to review later`}
                >
                  <XCircleIcon className="w-4 h-4" />
                  <span>Mark to Review Later</span>
                </button>
              ) : ( // reviewLater list
                <button
                  onClick={() => onSetStatus(item.word, 'known')}
                  className="text-xs font-medium text-green-400 hover:text-green-300 flex items-center space-x-1.5 py-1 px-2 rounded hover:bg-green-500/10 transition-colors"
                  aria-label={`Mark ${item.word} as known`}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Mark as Known</span>
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 flex flex-col items-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-3xl">
        <header className="mb-6 md:mb-8 py-4 flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              All Words Review
            </h1>
            {fileName && <p className="text-sm text-slate-400 mt-1">Loaded File: <span className="font-medium text-slate-300">{fileName}</span></p>}
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
          <main className="space-y-6 md:space-y-8">
            <section className="bg-slate-800/60 backdrop-blur-md shadow-xl rounded-xl p-5 md:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-3">
                Words I Know <span className="text-base font-normal text-slate-400">({knownWords.length})</span>
              </h2>
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                {renderWordList(knownWords, 'known')}
              </div>
            </section>

            <section className="bg-slate-800/60 backdrop-blur-md shadow-xl rounded-xl p-5 md:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-3">
                Words to Review Later <span className="text-base font-normal text-slate-400">({reviewLaterWords.length})</span>
              </h2>
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                {renderWordList(reviewLaterWords, 'reviewLater')}
              </div>
            </section>
          </main>
        )}
        <footer className="mt-10 py-4 text-center text-xs text-slate-500">
          <p>Changes made here are saved and will reflect in the learning view.</p>
        </footer>
      </div>
    </div>
  );
};