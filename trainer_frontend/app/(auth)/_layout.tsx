import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/auth-context";

/**
 * Auth layout: redirects authenticated users to the main tabs.
 * Unauthenticated users see login/signup screens.
 */
export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  // Still restoring session — show nothing while deciding
  if (isLoading) return null;

  // Already logged in — skip auth screens
  if (session) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
