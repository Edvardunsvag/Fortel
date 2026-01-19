import type { FortedleServerModelsDTOsSyncRequest } from "@/shared/api/generated/index";

/**
 * Maps application types to SyncRequest
 */
export const toSyncRequest = (accessToken: string): FortedleServerModelsDTOsSyncRequest => {
  return {
    accessToken: accessToken.trim(),
  };
};
