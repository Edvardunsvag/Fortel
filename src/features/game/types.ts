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

export enum GameMode {
  Classic = 'classic',
  FunFact = 'funfact',
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
  funfact?: string | null; // Funfact of the guessed employee (for FunFact mode)
}

export interface GameState {
  mode: GameMode | null; // Selected game mode
  classicEmployeeOfTheDayId: string | null; // Hashed ID for classic mode
  funfactEmployeeOfTheDayId: string | null; // Hashed ID for funfact mode
  guesses: Guess[];
  status: 'idle' | 'playing' | 'won' | 'lost';
  maxGuesses: number;
  currentDate: string; // ISO date string for daily reset
  attemptedByUserId: string | null; // User ID of the user who attempted today
  attemptDate: string | null; // Date when the attempt was made (ISO date string)
}

