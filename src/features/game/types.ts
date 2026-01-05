export enum HintType {
  Department = 'department',
  Office = 'office',
  Teams = 'teams',
  Age = 'age',
  Supervisor = 'supervisor',
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
  avatarImageUrl?: string;
  hints: GuessHint[];
  isCorrect: boolean;
}

export interface GameState {
  employeeOfTheDayId: string | null; // Hashed ID for the employee of the day
  guesses: Guess[];
  status: 'idle' | 'playing' | 'won' | 'lost';
  maxGuesses: number;
  currentDate: string; // ISO date string for daily reset
  attemptedByUserId: string | null; // User ID of the user who attempted today
  attemptDate: string | null; // Date when the attempt was made (ISO date string)
  funfactRevealed: boolean; // Whether the funfact and interests hint has been revealed
}

