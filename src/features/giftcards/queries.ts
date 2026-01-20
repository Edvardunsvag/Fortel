import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { giftcardsApi } from "@/shared/api/client";
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
  return useQuery<GiftcardTransaction[]>({
    queryKey: giftcardKeys.list(),
    queryFn: async () => {
      const response = await giftcardsApi.apiGiftcardsGet();
      return response.data;
    },
  });
};

/**
 * Query hook for fetching a specific giftcard transaction
 */
export const useGiftcardTransaction = (id: number) => {
  return useQuery<GiftcardTransaction>({
    queryKey: giftcardKeys.detail(id),
    queryFn: async () => {
      const response = await giftcardsApi.apiGiftcardsIdGet(id);
      return response.data;
    },
    enabled: id > 0,
  });
};

/**
 * Query hook for fetching giftcard transactions for a specific user
 */
export const useUserGiftcardTransactions = (userId: string) => {
  return useQuery<GiftcardTransaction[]>({
    queryKey: giftcardKeys.user(userId),
    queryFn: async () => {
      const response = await giftcardsApi.apiGiftcardsUserUserIdGet(userId);
      return response.data;
    },
    enabled: !!userId,
  });
};

/**
 * Mutation hook for sending a giftcard
 */
export const useSendGiftcard = () => {
  const queryClient = useQueryClient();

  return useMutation<SendGiftcardResponse, Error, SendGiftcardRequest>({
    mutationFn: async (request) => {
      const response = await giftcardsApi.apiGiftcardsSendPost(request);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: giftcardKeys.all });
    },
  });
};
