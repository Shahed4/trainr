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

/** Sign-up screen with email/password fields and a link back to login. */
export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Validates inputs and attempts registration via Supabase. */
  async function handleSignUp() {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const errorMessage = await signUp(email.trim(), password);
    setIsSubmitting(false);

    if (errorMessage) {
      Alert.alert("Sign Up Failed", errorMessage);
    } else {
      Alert.alert(
        "Account Created",
        "Check your email to verify your account, then sign in.",
      );
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
            Create Account
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2">
            Start your fitness journey
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
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 text-base text-gray-900 dark:text-white"
            placeholder="Confirm Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Pressable
            className="h-14 rounded-xl bg-primary items-center justify-center mt-2"
            onPress={handleSignUp}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-gray-500 dark:text-gray-400">
            Already have an account?
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-primary font-semibold">Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
