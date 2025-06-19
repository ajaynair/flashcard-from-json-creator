import React, { useCallback, useRef } from 'react';
import { WordDefinition } from '../types';
import { DocumentArrowUpIcon } from './IconComponents';

interface FileUploadProps {
  onFileLoad: (data: WordDefinition[], fileName: string) => void;
  onError: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
}

const isValidWordDefinitionArray = (data: any): data is WordDefinition[] => {
  if (!Array.isArray(data)) {
    return false;
  }
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.word === 'string' &&
      item.word.trim() !== '' && // Ensure word is not just whitespace
      typeof item.definition === 'string' &&
      item.definition.trim() !== '' // Ensure definition is not just whitespace
  );
};

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoad, onError, setIsLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsLoading(true);
    onError(''); // Clear previous app-level errors

    const reader = new FileReader();
    reader.onload = async (e) => {
      let localError = '';
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);

        if (isValidWordDefinitionArray(jsonData)) {
          if (jsonData.length === 0) {
            // Error will be set in App.tsx to include filename
            onFileLoad([], file.name); 
          } else {
            onFileLoad(jsonData, file.name);
          }
        } else {
          localError = 'Invalid JSON structure. Expected an array of objects with non-empty "word" and "definition" string properties.';
        }
      } catch (error) {
        localError = 'Failed to parse JSON file. Please ensure it is a valid JSON.';
        console.error('File parsing error:', error);
      } finally {
        if (localError) {
            onError(localError); // Set app-level error if localError occurred
        }
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      onError('Failed to read the file.');
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  }, [onFileLoad, onError, setIsLoading]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto my-4 sm:my-0"> {/* Adjusted margin for smaller screens */}
      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        id="fileUploader"
      />
      <button
        onClick={handleButtonClick}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors duration-150"
      >
        <DocumentArrowUpIcon className="w-6 h-6 mr-3" />
        Upload Definitions JSON
      </button>
    </div>
  );
};