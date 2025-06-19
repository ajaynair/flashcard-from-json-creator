import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { WordDefinition } from './types';
import { FileUpload } from './components/FileUpload';
import { WordDisplay } from './components/WordDisplay';
import { NavigationControls } from './components/NavigationControls';
import { AllWordsDisplay } from './components/AllWordsDisplay';
import { ExclamationTriangleIcon, InformationCircleIcon, ArrowPathIcon, ClipboardListIcon, SparklesIcon } from './components/IconComponents';
import { SimpleSpacedRepetitionCard, SRSOption, DAY_MS } from './spacedRepetition';

const LOCAL_STORAGE_DICTIONARY_KEY = 'wordDefinerApp_dictionary_srs_v1'; // New key for SRS
const LOCAL_STORAGE_FILENAME_KEY = 'wordDefinerApp_fileName_srs_v1';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const App: React.FC = () => {
  const [dictionary, setDictionary] = useState<WordDefinition[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showAllWordsView, setShowAllWordsView] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedDictionary = localStorage.getItem(LOCAL_STORAGE_DICTIONARY_KEY);
      const storedFileName = localStorage.getItem(LOCAL_STORAGE_FILENAME_KEY);

      if (storedDictionary) {
        const parsedItems: any[] = JSON.parse(storedDictionary);
        const migratedDictionary = parsedItems.map(item => {
          if (item.srsState && typeof item.nextReviewDate === 'number') {
            // Already in new format, ensure srsState is valid
             if (!item.srsState.status || !item.srsState.hasOwnProperty('ease') || !item.srsState.hasOwnProperty('step')) {
                // Corrupted or old srsState, re-initialize
                const card = new SimpleSpacedRepetitionCard();
                return { ...item, srsState: card.toPlainObject(), nextReviewDate: Date.now() };
            }
            return item as WordDefinition;
          }
          // Migration needed from old format (word, definition, status?) or incomplete new format
          const newCardBase = SimpleSpacedRepetitionCard.newCardState();
          let nextReview = Date.now();

          if (item.status === 'known') { // old format
            newCardBase.status = 'reviewing';
            newCardBase.interval = DAY_MS; // Start with a 1-day interval
            // nextReviewDate will be now, to allow immediate review and proper scheduling
          }
          // For 'unknown' or no status, it defaults to a new 'learning' card due now.

          return {
            word: item.word,
            definition: item.definition,
            srsState: newCardBase,
            nextReviewDate: nextReview,
          };
        }).filter(d => d.word && d.definition && d.srsState && typeof d.nextReviewDate === 'number');
        
        setDictionary(migratedDictionary);
      }
      if (storedFileName) {
        setFileName(storedFileName);
      }
    } catch (e) {
      console.error("Failed to load data from localStorage:", e);
      // Avoid clearing potentially good new format data if old format parsing fails
    }
  }, []);

  useEffect(() => {
    try {
      if (dictionary.length > 0 || fileName) { // Save even if dictionary is empty but a file was loaded
        localStorage.setItem(LOCAL_STORAGE_DICTIONARY_KEY, JSON.stringify(dictionary));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_DICTIONARY_KEY);
      }
    } catch (e) {
      console.error("Failed to save dictionary to localStorage:", e);
    }
  }, [dictionary, fileName]);

  useEffect(() => {
    try {
      if (fileName) {
        localStorage.setItem(LOCAL_STORAGE_FILENAME_KEY, fileName);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_FILENAME_KEY);
      }
    } catch (e) {
      console.error("Failed to save fileName to localStorage:", e);
    }
  }, [fileName]);
  
  const reviewableWords = useMemo(() => {
    const now = Date.now();
    const dueWords = dictionary.filter(item => item.nextReviewDate <= now);
    return shuffleArray(dueWords); // Shuffle the due words
  }, [dictionary]);

  const handleFileLoad = useCallback((data: Array<{word: string, definition: string}>, name: string) => {
    const now = Date.now();
    const newDictionary = data.map(item => ({
      ...item,
      srsState: SimpleSpacedRepetitionCard.newCardState(),
      nextReviewDate: now, // All new words are due immediately
    }));
    setDictionary(newDictionary);
    setCurrentIndex(0);
    setFileName(name);
    setError(null);
     if (data.length === 0 && name) {
        setError(`The file "${name}" is valid but contains no definitions.`);
    }
    setShowAllWordsView(false); // Go back to main view
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleSpacedRepetitionChoice = useCallback((wordValue: string, option: SRSOption) => {
    setDictionary(prevDict => {
      return prevDict.map(item => {
        if (item.word === wordValue) {
          const newSrsState = option.nextState;
          const newNextReviewDate = Date.now() + (newSrsState.interval || 0);
          return { ...item, srsState: newSrsState, nextReviewDate: newNextReviewDate };
        }
        return item;
      });
    });
    // currentIndex adjustment will be handled by the useEffect below,
    // as reviewableWords will be a new (shuffled) list.
  }, [/* setDictionary is a dependency but dictionary itself is not needed here */]);


  useEffect(() => {
    // If currentIndex is out of bounds of the new (potentially shuffled) reviewableWords list,
    // or if the list becomes empty, adjust currentIndex.
    if (reviewableWords.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= reviewableWords.length) {
      setCurrentIndex(reviewableWords.length - 1);
    }
    // No change if currentIndex is still valid.
    // This ensures that after a word is answered and reviewableWords is re-shuffled,
    // currentIndex still points to a valid word in the new list.
  }, [reviewableWords, currentIndex]);


  const handleNext = useCallback(() => {
    if (currentIndex < reviewableWords.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, reviewableWords.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);

  const handleReset = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all data? This will clear the loaded dictionary, all word progress, and remove data from local storage.")) {
      setDictionary([]);
      setCurrentIndex(0);
      setFileName(null);
      setError(null);
      setShowAllWordsView(false); 
      // localStorage removal is handled by useEffects for dictionary & fileName when they become empty/null
    }
  }, []);

  const handleToggleAllWordsView = () => {
    setShowAllWordsView(prev => !prev);
    setError(null); 
  };
  
  if (showAllWordsView) {
    return (
      <AllWordsDisplay
        dictionary={dictionary}
        onBack={handleToggleAllWordsView}
        fileName={fileName}
      />
    );
  }

  const currentItem = reviewableWords.length > 0 && currentIndex < reviewableWords.length ? reviewableWords[currentIndex] : null;
  const buttonBaseClass = "w-full sm:w-auto flex items-center justify-center px-5 py-2.5 border rounded-lg shadow-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const totalWordsToReview = reviewableWords.length;
  // const totalKnownWords = dictionary.filter(d => d.srsState.status === 'reviewing' && d.srsState.interval && d.srsState.interval > 7 * DAY_MS).length; // Example of "known"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            SRS Word Definer
          </h1>
          <p className="mt-3 text-lg text-slate-400 max-w-xl mx-auto">
            Learn vocabulary with Spaced Repetition. Progress is saved locally.
          </p>
        </header>

        <main className="bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <FileUpload 
              onFileLoad={handleFileLoad} 
              onError={handleError} 
              setIsLoading={setIsLoading} 
            />
            {(fileName !== null || dictionary.length > 0) && !isLoading && ( // Show buttons if data exists
              <div className="w-full sm:w-auto flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleToggleAllWordsView}
                  className={`${buttonBaseClass} border-sky-600/50 text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 hover:text-sky-200 focus:ring-sky-500`}
                  title="View all words and their status"
                  disabled={isLoading || dictionary.length === 0} 
                >
                  <ClipboardListIcon className="w-5 h-5 mr-2" />
                  View All Words
                </button>
                <button
                  onClick={handleReset}
                  className={`${buttonBaseClass} border-red-600/50 text-red-300 bg-red-500/20 hover:bg-red-500/30 hover:text-red-200 focus:ring-red-500`}
                  title="Reset all data"
                  disabled={isLoading} 
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Reset All Data
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-700 text-red-300 rounded-lg flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {fileName && !error && !isLoading && ( 
            <div className="mt-4 mb-2 text-xs text-center text-slate-500">
              Loaded: <span className="font-medium text-slate-400">{fileName}</span>
              {dictionary.length > 0 && (
                <>
                  {' - '}
                  <span className="font-medium text-indigo-300">{totalWordsToReview}</span> words to review.
                  Total in deck: <span className="font-medium text-slate-400">{dictionary.length}</span>.
                </>
              )}
            </div>
          )}
          
          {isLoading && (
            <WordDisplay item={null} isLoading={true} onSpacedRepetitionChoice={handleSpacedRepetitionChoice} />
          )}

          {!isLoading && !error && dictionary.length === 0 && !fileName && ( 
            <div className="mt-8 p-6 bg-slate-700/50 border border-slate-600 text-slate-400 rounded-lg flex items-start space-x-3">
              <InformationCircleIcon className="h-8 w-8 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-300">Getting Started</h3>
                <p className="text-sm">
                  Upload a JSON file to begin. It should be an array of objects, each with non-empty <code className="bg-slate-600 px-1 py-0.5 rounded text-xs text-indigo-300">word</code> and <code className="bg-slate-600 px-1 py-0.5 rounded text-xs text-indigo-300">definition</code> strings.
                </p>
                 <pre className="mt-1 p-3 bg-slate-900/70 rounded text-xs text-slate-300 overflow-x-auto">
                  <code>
  {`[
    { "word": "Ephemeral", "definition": "Lasting for a very short time." },
    { "word": "Ubiquitous", "definition": "Present, appearing, or found everywhere." }
  ]`}
                  </code>
                </pre>
              </div>
            </div>
          )}
          
          {!isLoading && fileName && dictionary.length === 0 && error && ( // Error from file load but file name is present
             <div className="mt-8 p-6 bg-slate-700/50 border border-slate-600 text-slate-400 rounded-lg flex items-start space-x-3">
              <InformationCircleIcon className="h-8 w-8 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-slate-300">Empty or Invalid File</h3>
                    <p className="text-sm">
                    The file <code className="bg-slate-600 px-1 py-0.5 rounded text-xs text-indigo-300">{fileName}</code> was loaded, but it appears to be empty or does not contain valid definitions.
                    The error was: {error}
                    </p>
                    <p className="text-sm mt-2">You can <button onClick={handleReset} className="text-indigo-400 hover:text-indigo-300 underline font-medium">reset</button> and try uploading a different file.</p>
                </div>
            </div>
          )}


          {!isLoading && !error && dictionary.length > 0 && totalWordsToReview === 0 && ( 
            <div className="mt-8 p-6 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg flex items-center space-x-3">
              <SparklesIcon className="h-8 w-8 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-300">All Reviews Done!</h3>
                <p className="text-sm">
                  You've reviewed all due words in <code className="bg-slate-600 px-1 py-0.5 rounded text-xs text-indigo-300">{fileName || 'the current set'}</code> for now.
                </p>
                <p className="text-sm mt-2">
                  Check back later for more reviews, or <button onClick={handleToggleAllWordsView} className="text-sky-400 hover:text-sky-300 underline font-medium">view all words</button>.
                </p>
              </div>
            </div>
          )}
          
          {!isLoading && currentItem && !error && (
            <WordDisplay item={currentItem} isLoading={false} onSpacedRepetitionChoice={handleSpacedRepetitionChoice} />
          )}

          {!isLoading && !error && totalWordsToReview > 0 && (
            <NavigationControls
              currentIndex={currentIndex}
              totalItems={totalWordsToReview}
              onNext={handleNext}
              onPrev={handlePrev}
              disabled={isLoading || totalWordsToReview === 0}
            />
          )}
        </main>
        <footer className="mt-10 text-center text-xs text-slate-600">
          <p>Spaced Repetition System. Enhanced with local persistence.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

