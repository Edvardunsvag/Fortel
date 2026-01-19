import type {
  FortedleServerModelsDTOsLeaderboardDto,
  FortedleServerModelsDTOsLeaderboardEntryDto,
} from "@/shared/api/generated/index";
import type { LeaderboardData, LeaderboardEntry } from "./types";

/**
 * Maps the generated LeaderboardEntryDto to the application LeaderboardEntry type
 */
export const leaderboardEntryFromDto = (dto: FortedleServerModelsDTOsLeaderboardEntryDto): LeaderboardEntry => {
  return {
    rank: dto.rank ?? 0,
    name: dto.name ?? "",
    score: dto.score ?? 0,
    avatarImageUrl: dto.avatarImageUrl ?? null,
    submittedAt: dto.submittedAt?.toString() ?? "",
  };
};

/**
 * Maps the generated LeaderboardDto to the application LeaderboardData type
 */
export const leaderboardFromDto = (dto: FortedleServerModelsDTOsLeaderboardDto): LeaderboardData => {
  return {
    date: dto.date ?? "",
    leaderboard: (dto.leaderboard ?? []).map(leaderboardEntryFromDto),
  };
};
