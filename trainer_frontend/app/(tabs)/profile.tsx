import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { generateRecommendations, getProfile, updateProfile } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

const FITNESS_GOALS = ["cutting", "bulking", "maintenance"] as const;
const BODY_TYPES = ["ectomorph", "mesomorph", "endomorph"] as const;
const DIETARY_OPTIONS = [
  "Vegan",
  "Vegetarian",
  "Halal",
  "Keto",
  "Gluten-Free",
  "Dairy-Free",
  "Paleo",
];

const TIMELINE_OPTIONS = [
  { value: "1_month", label: "1 Month" },
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
  { value: "2_plus_years", label: "2+ Years" },
] as const;

const RANK_LABELS: Record<number, string> = {
  0: "Not Tested",
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

/** Fields that trigger an AI recommendation refresh when changed. */
const AI_FIELDS: (keyof UserProfile)[] = [
  "weight",
  "height",
  "timeline",
  "fitness_goal",
  "current_body_type",
  "goal_body_type",
];

/**
 * Profile tab — shows user info, personal stats, fitness preferences,
 * AI recommendations, and action buttons. All edits are buffered locally
 * and saved in a single batch via the "Save Changes" button.
 */
export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setDraft({});
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /** Merged view of server profile + local draft edits. */
  const merged = useMemo<UserProfile | null>(() => {
    if (!profile) return null;
    return { ...profile, ...draft };
  }, [profile, draft]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return Object.keys(draft).some((key) => {
      const k = key as keyof UserProfile;
      const draftVal = draft[k];
      const profileVal = profile[k];
      if (Array.isArray(draftVal) && Array.isArray(profileVal)) {
        return JSON.stringify(draftVal) !== JSON.stringify(profileVal);
      }
      return draftVal !== profileVal;
    });
  }, [profile, draft]);

  /** Update a field in the local draft. */
  function updateDraft(updates: Partial<UserProfile>) {
    setDraft((prev) => ({ ...prev, ...updates }));
  }

  /** Toggle a dietary preference in the local draft. */
  function toggleDietaryPref(pref: string) {
    const current = merged?.dietary_preferences ?? [];
    const updated = current.includes(pref)
      ? current.filter((p) => p !== pref)
      : [...current, pref];
    updateDraft({ dietary_preferences: updated });
  }

  /** Persist all buffered changes, then conditionally refresh AI recommendations. */
  async function handleSave() {
    if (!profile || !hasChanges) return;
    setIsSaving(true);

    const aiFieldChanged = AI_FIELDS.some((key) => key in draft && draft[key] !== profile[key]);

    try {
      const updated = await updateProfile(draft);
      setProfile(updated);
      setDraft({});

      if (aiFieldChanged) {
        setIsGenerating(true);
        try {
          const recs = await generateRecommendations();
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  recommended_daily_calories: recs.daily_calories,
                  recommended_weekly_workouts: recs.weekly_workouts,
                }
              : prev,
          );
        } catch {
          Alert.alert(
            "Recommendations",
            "Profile saved, but we couldn't generate new recommendations. Make sure all fields are filled in.",
          );
        } finally {
          setIsGenerating(false);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to save.";
      Alert.alert("Error", msg);
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading || !merged) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* ── Profile Header ── */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {(merged.display_name || user?.email || "U")[0].toUpperCase()}
            </Text>
          </View>
          <TextInput
            className="text-xl font-bold text-gray-900 dark:text-white text-center"
            value={merged.display_name}
            onChangeText={(text) => updateDraft({ display_name: text })}
            placeholder="Your Name"
            placeholderTextColor="#9CA3AF"
          />
          <Text className="text-sm text-gray-400 mt-1">{user?.email}</Text>
          <View
            className="mt-2 px-4 py-1 rounded-full"
            style={{ backgroundColor: "#0a7ea420" }}
          >
            <Text className="text-sm font-medium text-primary">
              {RANK_LABELS[merged.knowledge_rank ?? 0]}
            </Text>
          </View>
        </View>

        {/* ── AI Recommendations ── */}
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Your Plan
        </Text>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 items-center">
            <Ionicons name="flame-outline" size={24} color="#3B82F6" />
            {isGenerating ? (
              <ActivityIndicator size="small" color="#3B82F6" className="mt-2" />
            ) : merged.recommended_daily_calories ? (
              <>
                <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {merged.recommended_daily_calories}
                </Text>
                <Text className="text-xs text-blue-500/70 dark:text-blue-400/70 font-medium">
                  cal / day
                </Text>
              </>
            ) : (
              <Text className="text-xs text-blue-400 mt-2 text-center">
                Not yet calculated
              </Text>
            )}
          </View>
          <View className="flex-1 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 items-center">
            <Ionicons name="barbell-outline" size={24} color="#22C55E" />
            {isGenerating ? (
              <ActivityIndicator size="small" color="#22C55E" className="mt-2" />
            ) : merged.recommended_weekly_workouts ? (
              <>
                <Text className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {merged.recommended_weekly_workouts}
                </Text>
                <Text className="text-xs text-green-500/70 dark:text-green-400/70 font-medium">
                  workouts / week
                </Text>
              </>
            ) : (
              <Text className="text-xs text-green-400 mt-2 text-center">
                Not yet calculated
              </Text>
            )}
          </View>
        </View>

        {/* ── Personal Info ── */}
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Personal Info
        </Text>
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-xs text-gray-400 mb-1 ml-1">Weight (lbs)</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white"
              value={merged.weight != null ? String(merged.weight) : ""}
              onChangeText={(text) => {
                const num = parseFloat(text);
                updateDraft({ weight: text === "" ? null : (isNaN(num) ? merged.weight : num) });
              }}
              placeholder="e.g. 170"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-400 mb-1 ml-1">Height (in)</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white"
              value={merged.height != null ? String(merged.height) : ""}
              onChangeText={(text) => {
                const num = parseFloat(text);
                updateDraft({ height: text === "" ? null : (isNaN(num) ? merged.height : num) });
              }}
              placeholder="e.g. 70"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Text className="text-xs text-gray-400 mb-1 ml-1">Timeline</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {TIMELINE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              className={`px-4 py-2.5 rounded-xl ${
                merged.timeline === opt.value
                  ? "bg-primary"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
              onPress={() => updateDraft({ timeline: opt.value })}
            >
              <Text
                className={`text-sm font-medium ${
                  merged.timeline === opt.value
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Fitness Goal ── */}
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Fitness Goal
        </Text>
        <View className="flex-row gap-2 mb-5">
          {FITNESS_GOALS.map((goal) => (
            <Pressable
              key={goal}
              className={`flex-1 py-3 rounded-xl items-center ${
                merged.fitness_goal === goal
                  ? "bg-primary"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
              onPress={() => updateDraft({ fitness_goal: goal })}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  merged.fitness_goal === goal
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {goal}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Body Type ── */}
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Current Body Type
        </Text>
        <View className="flex-row gap-2 mb-4">
          {BODY_TYPES.map((bt) => (
            <Pressable
              key={bt}
              className={`flex-1 py-3 rounded-xl items-center ${
                merged.current_body_type === bt
                  ? "bg-primary"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
              onPress={() => updateDraft({ current_body_type: bt })}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  merged.current_body_type === bt
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
                merged.goal_body_type === bt
                  ? "bg-primary"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
              onPress={() => updateDraft({ goal_body_type: bt })}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  merged.goal_body_type === bt
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {bt}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Dietary Preferences ── */}
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Dietary Preferences
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {DIETARY_OPTIONS.map((pref) => {
            const isSelected = merged.dietary_preferences?.includes(pref);
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
                    isSelected
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {pref}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Actions ── */}
        <View className="gap-3 mt-2">
          <Pressable
            className="flex-row items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
            onPress={() => router.push("/quiz")}
          >
            <Ionicons
              name="school-outline"
              size={22}
              color={Colors[colorScheme].tint}
            />
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
      </ScrollView>

      {/* ── Sticky Save Button ── */}
      {hasChanges && (
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3"
          style={{ backgroundColor: colorScheme === "dark" ? "#151718" : "#ffffff" }}
        >
          <Pressable
            className="bg-primary py-4 rounded-2xl items-center flex-row justify-center gap-2"
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text className="text-white text-base font-semibold">
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
