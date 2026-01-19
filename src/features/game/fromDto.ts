import type {
  FortedleServerModelsDTOsGuessDto,
  FortedleServerModelsDTOsGuessHintDto,
  FortedleServerModelsDTOsRoundDto,
} from "@/shared/api/generated/index";
import type { Guess, GuessHint, HintResult, HintType } from "./types";

export interface RoundDto {
  id: number;
  userId: string;
  date: string;
  status: string;
  employeeOfTheDayId: string | null;
  guesses: Guess[];
  funfactRevealed: boolean;
  startedAt: string;
  finishedAt: string | null;
}

/**
 * Maps the generated GuessDto to the application Guess type
 */
export const guessFromDto = (dto: FortedleServerModelsDTOsGuessDto): Guess => {
  return {
    employeeId: dto.employeeId ?? "",
    employeeName: dto.employeeName ?? "",
    avatarImageUrl: dto.avatarImageUrl ?? undefined,
    hints: (dto.hints ?? []).map(
      (hint: FortedleServerModelsDTOsGuessHintDto): GuessHint => ({
        type: hint.type as HintType,
        result: hint.result as HintResult,
        message: hint.message ?? "",
      })
    ),
    isCorrect: dto.isCorrect ?? false,
  };
};

/**
 * Maps the generated RoundDto to the application RoundDto type
 */
export const roundFromDto = (dto: FortedleServerModelsDTOsRoundDto): RoundDto => {
  return {
    id: dto.id ?? 0,
    userId: dto.userId ?? "",
    date: dto.date ?? "",
    status: dto.status ?? "",
    employeeOfTheDayId: dto.employeeOfTheDayId ?? null,
    guesses: (dto.guesses ?? []).map(guessFromDto),
    funfactRevealed: dto.funfactRevealed ?? false,
    startedAt: dto.startedAt ?? "",
    finishedAt: dto.finishedAt ?? null,
  };
};
