import { useQuery } from "@tanstack/react-query";

// Query keys following the pattern from other features
export const optimizelyKeys = {
  all: ["optimizely"] as const,
  userPosts: () => [...optimizelyKeys.all, "userPosts"] as const,
};

// Helper function to get the Optimizely GraphQL endpoint with auth
const getOptimizelyEndpoint = (): string => {
  const singleKey = import.meta.env.VITE_OPTIMIZELY_SINGLE_KEY;
  if (!singleKey) {
    throw new Error("VITE_OPTIMIZELY_SINGLE_KEY is not set in environment variables");
  }
  return `https://cg.optimizely.com/content/v2?auth=${singleKey}`;
};

// GraphQL fetcher function
const graphqlFetcher = async <TData, TVariables>(query: string, variables?: TVariables): Promise<TData> => {
  const endpoint = getOptimizelyEndpoint();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
};

// GraphQL query for UserPosts
const GET_ALL_USER_POSTS = `
  query GetAllUserPosts {
    UserPost {
      items {
        id
        title
        text
        image {
          url
          name
        }
        publishedDate
      }
    }
  }
`;

// Type definitions (will be replaced by generated types later)
export interface UserPost {
  id: string;
  title?: string;
  text?: string;
  image?: {
    url?: string;
    name?: string;
  };
  publishedDate?: string;
}

export interface UserPostsResponse {
  UserPost?: {
    items?: UserPost[];
  };
}

/**
 * Query hook for fetching all user posts from Optimizely
 */
export const useUserPosts = () => {
  return useQuery({
    queryKey: optimizelyKeys.userPosts(),
    queryFn: async () => {
      const data = await graphqlFetcher<UserPostsResponse, undefined>(GET_ALL_USER_POSTS);
      return data.UserPost?.items || [];
    },
    enabled: !!import.meta.env.VITE_OPTIMIZELY_SINGLE_KEY,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
