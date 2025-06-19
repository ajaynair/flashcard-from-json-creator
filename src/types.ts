export type WordStatus = 'known' | 'unknown';

export interface WordDefinition {
  word: string;
  definition: string;
  status?: WordStatus; // status is initialized to 'unknown' in App.tsx
}
