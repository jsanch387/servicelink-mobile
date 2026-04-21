import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide React Query client — tuned for mobile (cache, retries, garbage collection).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 15 * 60 * 1000,
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
  },
});
