import "../global.css";

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/lib/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Root layout wrapping the entire app with theme and auth providers.
 * NativeWind's global.css is imported above for Tailwind styles.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="calorie-detail/[id]"
            options={{ headerShown: true, title: "Meal Detail" }}
          />
          <Stack.Screen
            name="meal-plan-detail/[id]"
            options={{ headerShown: true, title: "Meal Plan" }}
          />
          <Stack.Screen
            name="form-detail/[id]"
            options={{ headerShown: true, title: "Form Analysis" }}
          />
          <Stack.Screen
            name="quiz"
            options={{ headerShown: true, title: "Knowledge Quiz" }}
          />
          <Stack.Screen
            name="new-meal-plan"
            options={{ headerShown: true, title: "New Meal Plan" }}
          />
          <Stack.Screen
            name="new-form-analysis"
            options={{ headerShown: true, title: "Analyze Form" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
