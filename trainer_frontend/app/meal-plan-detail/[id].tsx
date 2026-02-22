import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getMealPlanDetail } from "@/lib/api";
import type { MealPlanDetail } from "@/lib/types";

/**
 * Detail page for a meal plan — shows expandable day sections,
 * meals with timing and macro breakdowns, substitutions, and tips.
 */
export default function MealPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const [plan, setPlan] = useState<MealPlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMealPlanDetail(Number(id));
        setPlan(data);
        // Auto-expand first day
        if (data.plan_data?.days?.length) {
          setExpandedDay(data.plan_data.days[0].day);
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <Text className="text-gray-400">Meal plan not found.</Text>
      </SafeAreaView>
    );
  }

  const planData = plan.plan_data;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-[#151718]">
      <View className="p-5">
        {/* Header */}
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {planData?.plan_name ?? "Meal Plan"}
        </Text>
        <Text className="text-sm text-gray-400 mt-1">
          {plan.plan_type} plan · {plan.calorie_target} kcal target
        </Text>

        {/* Macro targets */}
        <View className="flex-row gap-3 mt-4 mb-6">
          {[
            { label: "Protein", value: plan.protein_target },
            { label: "Carbs", value: plan.carbs_target },
            { label: "Fat", value: plan.fat_target },
          ].map((macro) => (
            <View
              key={macro.label}
              className="flex-1 items-center py-3 rounded-xl bg-gray-50 dark:bg-gray-800"
            >
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {macro.value}g
              </Text>
              <Text className="text-xs text-gray-400">{macro.label}</Text>
            </View>
          ))}
        </View>

        {/* Days */}
        {planData?.days?.map((day) => (
          <View key={day.day} className="mb-3">
            <Pressable
              className="flex-row items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800"
              onPress={() =>
                setExpandedDay(expandedDay === day.day ? null : day.day)
              }
            >
              <Text className="text-base font-semibold text-gray-900 dark:text-white">
                {day.day}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-gray-400">
                  {day.daily_totals?.calories ?? "—"} kcal
                </Text>
                <Ionicons
                  name={expandedDay === day.day ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#9CA3AF"
                />
              </View>
            </Pressable>

            {expandedDay === day.day && (
              <View className="mt-2 gap-3 pl-2">
                {day.meals?.map((meal, mealIndex) => (
                  <View
                    key={mealIndex}
                    className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700"
                  >
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-base font-medium text-gray-900 dark:text-white">
                        {meal.name}
                      </Text>
                      <Text className="text-sm text-gray-400">
                        {meal.timing}
                      </Text>
                    </View>
                    {meal.foods?.map((food, foodIndex) => (
                      <View
                        key={foodIndex}
                        className="flex-row justify-between py-1.5 border-b border-gray-50 dark:border-gray-800"
                      >
                        <Text className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                          {food.item} ({food.portion})
                        </Text>
                        <Text className="text-sm text-gray-400 ml-2">
                          {food.calories} kcal
                        </Text>
                      </View>
                    ))}
                    <Text className="text-sm font-medium text-primary mt-2">
                      Total: {meal.total_calories} kcal
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Substitutions */}
        {planData?.substitutions?.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Substitutions
            </Text>
            {planData.substitutions.map((sub, i) => (
              <View key={i} className="py-2 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-sm text-gray-900 dark:text-white">
                  {sub.original} → {sub.substitute}
                </Text>
                <Text className="text-xs text-gray-400 mt-0.5">{sub.reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        {planData?.tips?.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Tips
            </Text>
            {planData.tips.map((tip, i) => (
              <View key={i} className="flex-row gap-2 mb-2">
                <Text className="text-primary">•</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text className="text-xs text-gray-400 text-center mt-6">
          Generated {new Date(plan.created_at).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}
