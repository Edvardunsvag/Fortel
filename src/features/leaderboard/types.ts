export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatarImageUrl: string | null;
  submittedAt: string;
}

export interface LeaderboardData {
  date: string;
  leaderboard: LeaderboardEntry[];
}
