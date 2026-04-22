import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, TypographyProvider } from '../../../theme';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function createTestQueryClient(options = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        ...options.queries,
      },
    },
  });
}

/**
 * @param {import('react').ReactElement} ui
 * @param {{ queryClient?: import('@tanstack/react-query').QueryClient }} [options]
 */
export function renderWithProviders(ui, options = {}) {
  const client = options.queryClient ?? createTestQueryClient();
  const result = render(
    <QueryClientProvider client={client}>
      <ThemeProvider initialScheme="dark">
        <TypographyProvider>
          <SafeAreaProvider initialMetrics={initialMetrics}>{ui}</SafeAreaProvider>
        </TypographyProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { ...result, queryClient: client };
}
