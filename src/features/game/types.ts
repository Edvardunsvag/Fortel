export enum HintType {
  Department = 'department',
  Office = 'office',
  Skills = 'skills',
  Seniority = 'seniority',
}

export enum HintResult {
  Correct = 'correct',
  Incorrect = 'incorrect',
  Partial = 'partial',
  None = 'none',
  Higher = 'higher',
  Lower = 'lower',
  Equal = 'equal',
}

export interface GuessHint {
  type: HintType;
  result: HintResult;
  message: string;
}

export interface Guess {
  employeeId: string;
  employeeName: string;
  hints: GuessHint[];
  isCorrect: boolean;
}

export interface GameState {
  employeeOfTheDayId: string | null;
  guesses: Guess[];
  status: 'idle' | 'playing' | 'won' | 'lost';
  maxGuesses: number;
  currentDate: string; // ISO date string for daily reset
}

