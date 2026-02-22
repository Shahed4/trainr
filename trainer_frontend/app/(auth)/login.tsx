import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";

/** Login screen with email/password fields and a link to sign up. */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Validates inputs and attempts sign-in via Supabase. */
  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    const errorMessage = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (errorMessage) {
      Alert.alert("Login Failed", errorMessage);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-8"
      >
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-gray-900 dark:text-white">
            trainr
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2">
            Your AI fitness companion
          </Text>
        </View>

        <View className="gap-4">
          <TextInput
            className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 text-base text-gray-900 dark:text-white"
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 text-base text-gray-900 dark:text-white"
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            className="h-14 rounded-xl bg-primary items-center justify-center mt-2"
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">Sign In</Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-gray-500 dark:text-gray-400">
            Don't have an account?
          </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
