import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { WordDefinition, WordStatus } from './types';
import { FileUpload } from './components/FileUpload';
import { WordDisplay } from './components/WordDisplay';
import { NavigationControls } from './components/NavigationControls';
import { AllWordsDisplay } from './components/AllWordsDisplay';
import { ExclamationTriangleIcon, InformationCircleIcon, ArrowPathIcon, CheckCircleIcon, ClipboardListIcon } from './components/IconComponents';

const LOCAL_STORAGE_DICTIONARY_KEY = 'wordDefinerApp_dictionary';
const LOCAL_STORAGE_FILENAME_KEY = 'wordDefinerApp_fileName';

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
        const parsedDictionary: WordDefinition[] = JSON.parse(storedDictionary);
        if (Array.isArray(parsedDictionary) && parsedDictionary.every(item => typeof item.word === 'string' && typeof item.definition === 'string')) {
          setDictionary(parsedDictionary);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_DICTIONARY_KEY);
        }
      }
      if (storedFileName) {
        setFileName(storedFileName);
      }
    } catch (e) {
      console.error("Failed to load data from localStorage:", e);
      localStorage.removeItem(LOCAL_STORAGE_DICTIONARY_KEY);
      localStorage.removeItem(LOCAL_STORAGE_FILENAME_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      if (dictionary.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_DICTIONARY_KEY, JSON.stringify(dictionary));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_DICTIONARY_KEY);
      }
    } catch (e) {
      console.error("Failed to save dictionary to localStorage:", e);
    }
  }, [dictionary]);

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
  
  const filteredDictionary = useMemo(() => {
    return dictionary.filter(item => item.status !== 'known');
  }, [dictionary]);

  const handleFileLoad = useCallback((data: WordDefinition[], name: string) => {
    const newDictionary = data.map(item => ({ ...item, status: 'unknown' as WordStatus }));
    setDictionary(newDictionary);
    setCurrentIndex(0);
    setFileName(name);
    setError(null);
     if (data.length === 0 && name) { // If a file was loaded but it's empty
        // FileUpload handles error for unparseable, this is for valid but empty
        setError(`The file "${name}" is valid but contains no definitions.`);
    }
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredDictionary.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, filteredDictionary.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);

  const handleSetWordStatus = useCallback((wordValue: string, status: WordStatus) => {
    const currentWordInFilteredListBeforeUpdate = filteredDictionary[currentIndex];
    
    setDictionary(prevDict => 
      prevDict.map(item => 
        item.word === wordValue ? { ...item, status } : item
      )
    );

    if (status === 'known' && currentWordInFilteredListBeforeUpdate?.word === wordValue) {
      // The word just marked 'known' was the current word in the filtered list.
      // Adjust currentIndex: if it was the last item, it should go to the new last item.
      // Otherwise, it can stay, as subsequent items shift up.
      // The `filteredDictionary` will update in the next render cycle based on the new `dictionary`.
      // `Math.min` ensures index doesn't exceed new bounds. `Math.max(0, ...)` ensures it's not negative.
      // We calculate the expected new length of the filtered list if this word is removed.
      const newFilteredLength = filteredDictionary.filter(item => item.status !== 'known' && item.word !== wordValue).length;
      setCurrentIndex(prevIdx => Math.min(prevIdx, Math.max(0, newFilteredLength -1)));
    }
  }, [currentIndex, filteredDictionary]);


  const handleReset = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all data? This will clear the loaded dictionary, all word progress, and remove data from local storage.")) {
      setDictionary([]);
      setCurrentIndex(0);
      setFileName(null);
      setError(null);
      setShowAllWordsView(false); // Go back to main view if in AllWordsView
      localStorage.removeItem(LOCAL_STORAGE_DICTIONARY_KEY);
      localStorage.removeItem(LOCAL_STORAGE_FILENAME_KEY);
    }
  }, []);

  const handleToggleAllWordsView = () => {
    setShowAllWordsView(prev => !prev);
    setError(null); // Clear errors when switching views
  };
  
  if (showAllWordsView) {
    return (
      <AllWordsDisplay
        dictionary={dictionary}
        onSetStatus={handleSetWordStatus}
        onBack={handleToggleAllWordsView}
        fileName={fileName}
      />
    );
  }

  const currentItem = filteredDictionary.length > 0 && currentIndex < filteredDictionary.length ? filteredDictionary[currentIndex] : null;
  const buttonBaseClass = "w-full sm:w-auto flex items-center justify-center px-5 py-2.5 border rounded-lg shadow-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            JSON Word Definer
          </h1>
          <p className="mt-3 text-lg text-slate-400 max-w-xl mx-auto">
            Upload, learn, and track your vocabulary. Progress is saved in your browser.
          </p>
        </header>

        <main className="bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <FileUpload 
              onFileLoad={handleFileLoad} 
              onError={handleError} 
              setIsLoading={setIsLoading} 
            />
            <div className="w-full sm:w-auto flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleToggleAllWordsView}
                className={`${buttonBaseClass} border-sky-600/50 text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 hover:text-sky-200 focus:ring-sky-500`}
                title="View all words and their status"
                disabled={dictionary.length === 0 || isLoading}
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

          {fileName && !error && dictionary.length > 0 && (
            <div className="mt-4 mb-2 text-xs text-center text-slate-500">
              Loaded: <span className="font-medium text-slate-400">{fileName}</span>
              {' - '}
              Reviewing: <span className="font-medium text-indigo-300">{filteredDictionary.length}</span> of <span className="font-medium text-slate-400">{dictionary.length}</span> words.
            </div>
          )}
          
          {isLoading && (
            <WordDisplay item={null} isLoading={true} onSetStatus={handleSetWordStatus} />
          )}

          {!isLoading && !error && dictionary.length === 0 && !fileName && (
            <div className="mt-8 p-6 bg-slate-700/50 border border-slate-600 text-slate-400 rounded-lg flex items-start space-x-3">
              <InformationCircleIcon className="h-8 w-8 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-300">Getting Started</h3>
                <p className="text-sm">
                  Upload a JSON file to begin. It should be an array of objects, each with non-empty <code className="bg-slate-600 px-1 py-0.5 rounded text-xs text-indigo-300">word</code> and <code className="bg-slate-600 px-1 py-0.5 rounded text-xs text-indigo-300">definition</code> strings.
                </p>
                <p className="text-sm mt-2">Example:</p>
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

          {!isLoading && !error && dictionary.length > 0 && filteredDictionary.length === 0 && (
            <div className="mt-8 p-6 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg flex items-center space-x-3">
              <CheckCircleIcon className="h-8 w-8 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-300">All Words Mastered!</h3>
                <p className="text-sm">
                  You've marked all words in <code className="bg-slate-600 px-1 py-0.5 rounded text-xs text-indigo-300">{fileName || 'the current set'}</code> as known.
                </p>
                <p className="text-sm mt-2">
                  You can <button onClick={handleReset} className="text-indigo-400 hover:text-indigo-300 underline font-medium">reset progress</button>, <button onClick={handleToggleAllWordsView} className="text-sky-400 hover:text-sky-300 underline font-medium">view all words</button>, or upload a new file.
                </p>
              </div>
            </div>
          )}
          
          {!isLoading && currentItem && !error && (
            <WordDisplay item={currentItem} isLoading={false} onSetStatus={handleSetWordStatus} />
          )}

          {!isLoading && !error && filteredDictionary.length > 0 && (
            <NavigationControls
              currentIndex={currentIndex}
              totalItems={filteredDictionary.length}
              onNext={handleNext}
              onPrev={handlePrev}
              disabled={isLoading || filteredDictionary.length === 0}
            />
          )}
        </main>
        <footer className="mt-10 text-center text-xs text-slate-600">
          <p>A React & Tailwind CSS Application. Enhanced with local persistence & review modes.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
