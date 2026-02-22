import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { generateMealPlan } from "@/lib/api";

const PLAN_TYPES = ["daily", "weekly"] as const;
const FITNESS_GOALS = ["cutting", "bulking", "maintenance"] as const;
const DIETARY_OPTIONS = [
  "Vegan",
  "Vegetarian",
  "Halal",
  "Keto",
  "Gluten-Free",
  "Dairy-Free",
  "Paleo",
];

/**
 * Form screen for configuring and generating a new AI meal plan.
 * Collects plan type, fitness goal, dietary preferences, calorie/macro targets,
 * and favorite foods before sending to the backend.
 */
export default function NewMealPlanScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();

  const [planType, setPlanType] = useState<"daily" | "weekly">("daily");
  const [fitnessGoal, setFitnessGoal] = useState<string>("maintenance");
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [calorieTarget, setCalorieTarget] = useState("2000");
  const [proteinTarget, setProteinTarget] = useState("150");
  const [carbsTarget, setCarbsTarget] = useState("200");
  const [fatTarget, setFatTarget] = useState("65");
  const [favoriteFoods, setFavoriteFoods] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  /** Toggle a dietary preference chip. */
  function togglePref(pref: string) {
    setDietaryPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref],
    );
  }

  /** Send preferences to the backend and navigate to the created plan. */
  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const plan = await generateMealPlan({
        plan_type: planType,
        fitness_goal: fitnessGoal,
        dietary_preferences: dietaryPrefs,
        calorie_target: parseInt(calorieTarget) || 2000,
        protein_target: parseInt(proteinTarget) || 150,
        carbs_target: parseInt(carbsTarget) || 200,
        fat_target: parseInt(fatTarget) || 65,
        favorite_foods: favoriteFoods,
      });
      router.replace(`/meal-plan-detail/${plan.id}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      Alert.alert("Generation Failed", msg);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]" edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Plan type toggle */}
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Plan Type
          </Text>
          <View className="flex-row gap-3 mb-5">
            {PLAN_TYPES.map((type) => (
              <Pressable
                key={type}
                className={`flex-1 py-3 rounded-xl items-center ${
                  planType === type ? "bg-primary" : "bg-gray-100 dark:bg-gray-800"
                }`}
                onPress={() => setPlanType(type)}
              >
                <Text
                  className={`text-sm font-medium capitalize ${
                    planType === type ? "text-white" : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Fitness goal */}
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Fitness Goal
          </Text>
          <View className="flex-row gap-2 mb-5">
            {FITNESS_GOALS.map((goal) => (
              <Pressable
                key={goal}
                className={`flex-1 py-3 rounded-xl items-center ${
                  fitnessGoal === goal ? "bg-primary" : "bg-gray-100 dark:bg-gray-800"
                }`}
                onPress={() => setFitnessGoal(goal)}
              >
                <Text
                  className={`text-sm font-medium capitalize ${
                    fitnessGoal === goal ? "text-white" : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {goal}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Dietary preferences */}
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Dietary Preferences
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {DIETARY_OPTIONS.map((pref) => {
              const isSelected = dietaryPrefs.includes(pref);
              return (
                <Pressable
                  key={pref}
                  className={`px-4 py-2 rounded-full ${
                    isSelected ? "bg-primary" : "bg-gray-100 dark:bg-gray-800"
                  }`}
                  onPress={() => togglePref(pref)}
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

          {/* Targets */}
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Daily Targets
          </Text>
          <View className="gap-3 mb-5">
            {[
              { label: "Calories (kcal)", value: calorieTarget, setter: setCalorieTarget },
              { label: "Protein (g)", value: proteinTarget, setter: setProteinTarget },
              { label: "Carbs (g)", value: carbsTarget, setter: setCarbsTarget },
              { label: "Fat (g)", value: fatTarget, setter: setFatTarget },
            ].map((field) => (
              <View key={field.label} className="flex-row items-center gap-3">
                <Text className="text-sm text-gray-600 dark:text-gray-300 w-28">
                  {field.label}
                </Text>
                <TextInput
                  className="flex-1 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 text-base text-gray-900 dark:text-white"
                  keyboardType="numeric"
                  value={field.value}
                  onChangeText={field.setter}
                />
              </View>
            ))}
          </View>

          {/* Favorite foods */}
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Favorite Foods (optional)
          </Text>
          <TextInput
            className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-base text-gray-900 dark:text-white"
            placeholder="e.g., chicken breast, rice, avocado, salmon..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            value={favoriteFoods}
            onChangeText={setFavoriteFoods}
          />

          {/* Generate button */}
          <Pressable
            className="mt-8 bg-primary py-4 rounded-xl items-center"
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#fff" size="small" />
                <Text className="text-white text-base font-semibold">
                  Generating...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-base font-semibold">
                Generate Meal Plan
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
