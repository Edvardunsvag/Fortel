import type { FortedleServerModelsSyncRequest } from "@/shared/api/generated/index";

/**
 * Maps application types to SyncRequest
 */
export const toSyncRequest = (accessToken: string): FortedleServerModelsSyncRequest => {
  return {
    accessToken: accessToken.trim(),
  };
};
