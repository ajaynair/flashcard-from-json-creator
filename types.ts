export type CardStatus = 'learning' | 'reviewing' | 'relearning';

// Core state for the SRS algorithm, managed by SimpleSpacedRepetitionCard
export interface SRSLogicState {
  status: CardStatus;
  interval: number | null; // in milliseconds
  ease: number;
  step: number;
}

export interface WordDefinition {
  word: string;
  definition: string;
  srsState: SRSLogicState;
  nextReviewDate: number; // Timestamp for next review (Date.now() for due now)
}
