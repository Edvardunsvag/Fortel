import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { selectAccessToken } from "@/features/auth/authSlice";
import { createApiClients } from "@/shared/api/client";
import type {
  FortedleServerModelsDTOsGiftcardTransactionDto,
  FortedleServerModelsDTOsSendGiftcardRequest,
  FortedleServerModelsDTOsSendGiftcardResponse,
} from "@/shared/api/generated/index";

// Query keys
export const giftcardKeys = {
  all: ["giftcards"] as const,
  list: () => [...giftcardKeys.all, "list"] as const,
  detail: (id: number) => [...giftcardKeys.all, "detail", id] as const,
  user: (userId: string) => [...giftcardKeys.all, "user", userId] as const,
};

// Type aliases for cleaner usage
export type GiftcardTransaction = FortedleServerModelsDTOsGiftcardTransactionDto;
export type SendGiftcardRequest = FortedleServerModelsDTOsSendGiftcardRequest;
export type SendGiftcardResponse = FortedleServerModelsDTOsSendGiftcardResponse;

/**
 * Query hook for fetching all giftcard transactions
 */
export const useGiftcardTransactions = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<GiftcardTransaction[]>({
    queryKey: giftcardKeys.list(),
    queryFn: async () => {
      const { giftcardsApi } = createApiClients(accessToken);
      const response = await giftcardsApi.apiGiftcardsGet();
      return response.data;
    },
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Query hook for fetching a specific giftcard transaction
 */
export const useGiftcardTransaction = (id: number) => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<GiftcardTransaction>({
    queryKey: giftcardKeys.detail(id),
    queryFn: async () => {
      const { giftcardsApi } = createApiClients(accessToken);
      const response = await giftcardsApi.apiGiftcardsIdGet(id);
      return response.data;
    },
    enabled: id > 0 && !!accessToken,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Query hook for fetching giftcard transactions for a specific user
 */
export const useUserGiftcardTransactions = (userId: string) => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<GiftcardTransaction[]>({
    queryKey: giftcardKeys.user(userId),
    queryFn: async () => {
      const { giftcardsApi } = createApiClients(accessToken);
      const response = await giftcardsApi.apiGiftcardsUserUserIdGet(userId);
      return response.data;
    },
    enabled: !!userId && !!accessToken,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Mutation hook for sending a giftcard
 */
export const useSendGiftcard = () => {
  const queryClient = useQueryClient();
  const accessToken = useAppSelector(selectAccessToken);

  return useMutation<SendGiftcardResponse, Error, SendGiftcardRequest>({
    mutationFn: async (request) => {
      const { giftcardsApi } = createApiClients(accessToken);
      const response = await giftcardsApi.apiGiftcardsSendPost(request);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: giftcardKeys.all });
    },
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return false;
      }
      return failureCount < 1;
    },
  });
};
