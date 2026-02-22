import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getMealLogDetail } from "@/lib/api";
import type { MealLogDetail } from "@/lib/types";

/** Macro row component for displaying a single nutrient value. */
function MacroRow({ label, value, unit }: { label: string; value: number | string; unit: string }) {
  return (
    <View className="flex-row justify-between py-3 border-b border-gray-100 dark:border-gray-800">
      <Text className="text-base text-gray-600 dark:text-gray-300">{label}</Text>
      <Text className="text-base font-medium text-gray-900 dark:text-white">
        {typeof value === "number" ? value.toFixed(1) : value} {unit}
      </Text>
    </View>
  );
}

/**
 * Detail page for a single meal log — shows the food image,
 * macro breakdown, and micronutrient details.
 */
export default function CalorieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const [detail, setDetail] = useState<MealLogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMealLogDetail(Number(id));
        setDetail(data);
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

  if (!detail) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <Text className="text-gray-400">Meal log not found.</Text>
      </SafeAreaView>
    );
  }

  const micros = detail.nutritional_details ?? {};

  return (
    <ScrollView className="flex-1 bg-white dark:bg-[#151718]">
      {/* Food image */}
      {detail.image_url ? (
        <Image
          source={{ uri: detail.image_url }}
          className="w-full h-64"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-40 bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Text className="text-gray-400">No image available</Text>
        </View>
      )}

      <View className="p-5">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {detail.food_name}
        </Text>
        {detail.description ? (
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {detail.description}
          </Text>
        ) : null}
        {detail.serving_size ? (
          <Text className="text-sm text-gray-400 mt-1">
            Serving: {detail.serving_size}
          </Text>
        ) : null}

        {/* Calorie hero */}
        <View className="items-center my-6 py-5 bg-gray-50 dark:bg-gray-800 rounded-2xl">
          <Text className="text-4xl font-bold text-primary">{detail.calories}</Text>
          <Text className="text-sm text-gray-400 mt-1">calories</Text>
        </View>

        {/* Macros */}
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Macronutrients
        </Text>
        <MacroRow label="Protein" value={detail.protein_g} unit="g" />
        <MacroRow label="Carbohydrates" value={detail.carbs_g} unit="g" />
        <MacroRow label="Fat" value={detail.fat_g} unit="g" />
        <MacroRow label="Fiber" value={detail.fiber_g} unit="g" />

        {/* Micronutrients */}
        {Object.keys(micros).length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">
              Additional Details
            </Text>
            {Object.entries(micros).map(([key, val]) => (
              <MacroRow
                key={key}
                label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                value={val}
                unit={key.includes("pct") ? "%" : key.includes("mg") ? "mg" : "g"}
              />
            ))}
          </>
        )}

        <Text className="text-xs text-gray-400 text-center mt-6">
          Logged {new Date(detail.logged_at).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}
