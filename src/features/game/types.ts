export enum HintType {
  Department = "department",
  Office = "office",
  Teams = "teams",
  Age = "age",
  Supervisor = "supervisor",
}

export enum HintResult {
  Correct = "correct",
  Incorrect = "incorrect",
  Partial = "partial",
  None = "none",
  Higher = "higher",
  Lower = "lower",
  Equal = "equal",
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

export enum GameSubTab {
  Play = "play",
  Leaderboard = "leaderboard",
  Rules = "rules",
  Employees = "employees",
}

export interface GameState {
  employeeOfTheDayId: string | null; // Hashed ID for the employee of the day
  guesses: Guess[];
  status: "idle" | "playing" | "won";
  currentDate: string; // ISO date string for daily reset
  attemptedByUserId: string | null; // User ID of the user who attempted today
  attemptDate: string | null; // Date when the attempt was made (ISO date string)
  funfactRevealed: boolean; // Whether the funfact and interests hint has been revealed
  roundId: number | null; // ID of the current round from the server
  activeSubTab: GameSubTab; // Active sub-navigation tab within the Game feature
  hasFunfactOrInterests: boolean | null; // Whether the employee of the day has funfact or interests
}
