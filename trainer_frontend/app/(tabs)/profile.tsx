import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/lib/auth-context";
import { getProfile, updateProfile } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

const FITNESS_GOALS = ["cutting", "bulking", "maintenance"] as const;
const BODY_TYPES = ["ectomorph", "mesomorph", "endomorph"] as const;
const DIETARY_OPTIONS = ["Vegan", "Vegetarian", "Halal", "Keto", "Gluten-Free", "Dairy-Free", "Paleo"];

const RANK_LABELS: Record<number, string> = {
  0: "Not Tested",
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

/**
 * Profile tab — shows user info, fitness preferences, body type selectors,
 * dietary preferences chips, and action buttons.
 */
export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setDisplayName(data.display_name);
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /** Save a partial profile update. */
  async function saveField(updates: Partial<UserProfile>) {
    setIsSaving(true);
    try {
      const updated = await updateProfile(updates);
      setProfile(updated);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to save.";
      Alert.alert("Error", msg);
    } finally {
      setIsSaving(false);
    }
  }

  /** Toggle a dietary preference in the list. */
  function toggleDietaryPref(pref: string) {
    if (!profile) return;
    const current = profile.dietary_preferences ?? [];
    const updated = current.includes(pref)
      ? current.filter((p) => p !== pref)
      : [...current, pref];
    saveField({ dietary_preferences: updated });
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Profile header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
            </Text>
          </View>
          <TextInput
            className="text-xl font-bold text-gray-900 dark:text-white text-center"
            value={displayName}
            onChangeText={setDisplayName}
            onBlur={() => {
              if (displayName !== profile?.display_name) {
                saveField({ display_name: displayName });
              }
            }}
            placeholder="Your Name"
            placeholderTextColor="#9CA3AF"
          />
          <Text className="text-sm text-gray-400 mt-1">{user?.email}</Text>
          <View className="mt-2 px-4 py-1 rounded-full" style={{ backgroundColor: "#0a7ea420" }}>
            <Text className="text-sm font-medium text-primary">
              {RANK_LABELS[profile?.knowledge_rank ?? 0]}
            </Text>
          </View>
        </View>

        {/* Fitness Goal */}
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Fitness Goal
        </Text>
        <View className="flex-row gap-2 mb-5">
          {FITNESS_GOALS.map((goal) => (
            <Pressable
              key={goal}
              className={`flex-1 py-3 rounded-xl items-center ${
                profile?.fitness_goal === goal
                  ? "bg-primary"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
              onPress={() => saveField({ fitness_goal: goal })}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  profile?.fitness_goal === goal
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {goal}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Body Type */}
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Current Body Type
        </Text>
        <View className="flex-row gap-2 mb-4">
          {BODY_TYPES.map((bt) => (
            <Pressable
              key={bt}
              className={`flex-1 py-3 rounded-xl items-center ${
                profile?.current_body_type === bt
                  ? "bg-primary"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
              onPress={() => saveField({ current_body_type: bt })}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  profile?.current_body_type === bt
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {bt}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Goal Body Type
        </Text>
        <View className="flex-row gap-2 mb-5">
          {BODY_TYPES.map((bt) => (
            <Pressable
              key={bt}
              className={`flex-1 py-3 rounded-xl items-center ${
                profile?.goal_body_type === bt
                  ? "bg-primary"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
              onPress={() => saveField({ goal_body_type: bt })}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  profile?.goal_body_type === bt
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {bt}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Dietary Preferences */}
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Dietary Preferences
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {DIETARY_OPTIONS.map((pref) => {
            const isSelected = profile?.dietary_preferences?.includes(pref);
            return (
              <Pressable
                key={pref}
                className={`px-4 py-2 rounded-full ${
                  isSelected ? "bg-primary" : "bg-gray-100 dark:bg-gray-800"
                }`}
                onPress={() => toggleDietaryPref(pref)}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {pref}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Actions */}
        <View className="gap-3 mt-2">
          <Pressable
            className="flex-row items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
            onPress={() => router.push("/quiz")}
          >
            <Ionicons name="school-outline" size={22} color={Colors[colorScheme].tint} />
            <Text className="flex-1 text-base text-gray-900 dark:text-white">
              Retake Knowledge Quiz
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>

          <Pressable
            className="flex-row items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20"
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="flex-1 text-base text-red-600 dark:text-red-400 font-medium">
              Sign Out
            </Text>
          </Pressable>
        </View>

        {isSaving && (
          <View className="items-center mt-4">
            <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
