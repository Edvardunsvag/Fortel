import type { FortedleServerModelsDTOsSubmitScoreRequest } from "@/shared/api/generated/index";

/**
 * Maps application types to SubmitScoreRequest
 */
export const toSubmitScoreRequest = (
  name: string,
  score: number,
  avatarImageUrl?: string
): FortedleServerModelsDTOsSubmitScoreRequest => {
  return {
    name,
    score,
    avatarImageUrl: avatarImageUrl ?? undefined,
  };
};
