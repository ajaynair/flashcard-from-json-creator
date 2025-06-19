import { SRSLogicState } from './types';

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

const INITIAL_EASE = 2.5;
const MINIMUM_EASE = 1.3;

const AGAIN_EASE_DELTA = -0.2;
const HARD_EASE_DELTA = -0.15;
const EASY_EASE_DELTA = 0.15;

const HARD_INTERVAL_MULTIPLIER = 1.2;
const EASY_INTERVAL_BONUS_MULTIPLIER = 1.5; // Python code has this as 1.5, not 1.3

export interface SRSOption {
  label: 'Again' | 'Hard' | 'Good' | 'Easy';
  nextState: SRSLogicState;
  resultingIntervalDisplay: number | null; // The interval that will be set for display purposes
}

export class SimpleSpacedRepetitionCard {
  private state: SRSLogicState;

  constructor(srsState?: SRSLogicState) {
    if (srsState) {
      this.state = { ...srsState };
      this.state.ease = Math.max(srsState.ease, MINIMUM_EASE);
    } else {
      this.state = {
        status: 'learning',
        interval: null,
        ease: INITIAL_EASE,
        step: 0,
      };
    }
  }

  public static newCardState(): SRSLogicState {
    return {
      status: 'learning',
      interval: null,
      ease: INITIAL_EASE,
      step: 0,
    };
  }

  public toPlainObject(): SRSLogicState {
    return { ...this.state };
  }

  public options(): SRSOption[] {
    let options: SRSOption[] = [];

    switch (this.state.status) {
      case 'learning':
      case 'relearning': // Relearning follows similar interval logic to learning but retains ease
        const currentEase = this.state.ease; // Retain ease for relearning
        options = [
          {
            label: 'Again',
            nextState: { status: this.state.status, interval: MINUTE_MS, ease: currentEase, step: 0 },
            resultingIntervalDisplay: MINUTE_MS,
          },
          {
            label: 'Hard',
            nextState: { status: this.state.status, interval: 6 * MINUTE_MS, ease: currentEase, step: this.state.status === 'learning' ? 1 : 0 }, // Learning increments step, relearning resets to review
            resultingIntervalDisplay: 6 * MINUTE_MS,
          },
        ];
        if (this.state.status === 'learning' && this.state.step === 0) {
          options.push({
            label: 'Good',
            nextState: { status: 'learning', interval: 10 * MINUTE_MS, ease: currentEase, step: 1 },
            resultingIntervalDisplay: 10 * MINUTE_MS,
          });
        } else { // Learning step 1 or Relearning
          options.push({
            label: 'Good',
            nextState: { status: 'reviewing', interval: DAY_MS, ease: currentEase, step: 0 },
            resultingIntervalDisplay: DAY_MS,
          });
        }
        options.push({
          label: 'Easy',
          nextState: { status: 'reviewing', interval: 4 * DAY_MS, ease: currentEase, step: 0 },
          resultingIntervalDisplay: 4 * DAY_MS,
        });
        break;

      case 'reviewing':
        const ease = this.state.ease;
        const lastInterval = this.state.interval || DAY_MS; // Should always have interval in review

        const againInterval = 10 * MINUTE_MS;
        const hardInterval = Math.max(MINUTE_MS * 5, Math.round(lastInterval * HARD_INTERVAL_MULTIPLIER)); // Ensure hard interval is reasonable
        const goodInterval = Math.max(hardInterval + MINUTE_MS, Math.round(lastInterval * ease)); // Good is at least a bit more than hard
        const easyInterval = Math.max(goodInterval + MINUTE_MS,Math.round(lastInterval * ease * EASY_INTERVAL_BONUS_MULTIPLIER));

        options = [
          {
            label: 'Again',
            nextState: { status: 'relearning', interval: againInterval, ease: Math.max(MINIMUM_EASE, ease + AGAIN_EASE_DELTA), step: 0 },
            resultingIntervalDisplay: againInterval,
          },
          {
            label: 'Hard',
            nextState: { status: 'reviewing', interval: hardInterval, ease: Math.max(MINIMUM_EASE, ease + HARD_EASE_DELTA), step: 0 },
            resultingIntervalDisplay: hardInterval,
          },
          {
            label: 'Good',
            nextState: { status: 'reviewing', interval: goodInterval, ease: ease, step: 0 },
            resultingIntervalDisplay: goodInterval,
          },
          {
            label: 'Easy',
            nextState: { status: 'reviewing', interval: easyInterval, ease: Math.max(MINIMUM_EASE, ease + EASY_EASE_DELTA), step: 0 },
            resultingIntervalDisplay: easyInterval,
          },
        ];
        break;
    }
    return options;
  }
}

// Helper function to format interval for display
export function formatIntervalForDisplay(ms: number | null): string {
  if (ms === null || ms <= 0) return "<1m"; // Default for immediate/very short

  const totalSeconds = Math.round(ms / 1000);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = Math.round(totalMinutes / 60);
  const totalDays = Math.round(totalHours / 24);

  if (totalDays > 1) return `${totalDays}d`;
  if (totalDays === 1) return `1d`;
  if (totalHours > 1) return `${totalHours}h`;
  if (totalHours === 1) return `1h`;
  if (totalMinutes > 1) return `${totalMinutes}m`;
  if (totalMinutes === 1) return `1m`;
  return `<1m`;
}

