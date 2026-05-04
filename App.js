import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/features/auth';
import { OnboardingGateProvider } from './src/features/onboarding';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { queryClient } from './src/lib/queryClient';
import { ThemeProvider, TypographyProvider, useTheme } from './src/theme';
import { QueryClientProvider } from '@tanstack/react-query';

function AppShell() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.shell }]}>
      <SafeAreaProvider style={[styles.provider, { backgroundColor: colors.shell }]}>
        <AuthProvider>
          <OnboardingGateProvider>
            <AuthNavigator />
          </OnboardingGateProvider>
        </AuthProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider initialScheme="dark">
        <TypographyProvider>
          <QueryClientProvider client={queryClient}>
            <AppShell />
          </QueryClientProvider>
        </TypographyProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  provider: {
    flex: 1,
  },
});
