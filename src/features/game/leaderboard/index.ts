// Leaderboard is now managed via TanStack Query
// See src/features/leaderboard/queries.ts for the new implementation
export type { LeaderboardEntry, LeaderboardData } from "./types";
export { useLeaderboard, useSubmitScore } from "./queries";
