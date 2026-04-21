import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/features/auth";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import { queryClient } from "./src/lib/queryClient";
import { ThemeProvider, useTheme } from "./src/theme";
import { QueryClientProvider } from "@tanstack/react-query";

function AppShell() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.shell }]}>
      <SafeAreaProvider
        style={[styles.provider, { backgroundColor: colors.shell }]}
      >
        <AuthProvider>
          <AuthNavigator />
        </AuthProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider initialScheme="dark">
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ThemeProvider>
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
