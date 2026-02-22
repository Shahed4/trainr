import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getAnalysisDetail } from "@/lib/api";
import type { FormAnalysisDetail } from "@/lib/types";

/**
 * Detail page for a form analysis — shows exercise info, rep summary
 * chart, per-rep breakdown, and load suggestion.
 */
export default function FormDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const [detail, setDetail] = useState<FormAnalysisDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAnalysisDetail(Number(id));
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
        <Text className="text-gray-400">Analysis not found.</Text>
      </SafeAreaView>
    );
  }

  const formPercentage =
    detail.total_reps > 0
      ? Math.round((detail.good_reps / detail.total_reps) * 100)
      : 0;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-[#151718]">
      <View className="p-5">
        {/* Exercise header */}
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {detail.exercise_name}
        </Text>
        <Text className="text-sm text-gray-400 mt-1">
          {detail.recommended_angle} · {new Date(detail.analyzed_at).toLocaleString()}
        </Text>

        {/* Rep summary */}
        <View className="flex-row gap-3 mt-6">
          <View className="flex-1 items-center py-4 rounded-2xl bg-green-50 dark:bg-green-900/20">
            <Text className="text-3xl font-bold text-green-600">
              {detail.good_reps}
            </Text>
            <Text className="text-xs text-green-600 mt-1">Good Reps</Text>
          </View>
          <View className="flex-1 items-center py-4 rounded-2xl bg-red-50 dark:bg-red-900/20">
            <Text className="text-3xl font-bold text-red-500">
              {detail.bad_reps}
            </Text>
            <Text className="text-xs text-red-500 mt-1">Bad Reps</Text>
          </View>
          <View className="flex-1 items-center py-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">
              {formPercentage}%
            </Text>
            <Text className="text-xs text-gray-400 mt-1">Form Score</Text>
          </View>
        </View>

        {/* Load suggestion */}
        {detail.load_suggestion ? (
          <View className="mt-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="bulb-outline" size={18} color="#3B82F6" />
              <Text className="text-sm font-semibold text-blue-600">
                Load Suggestion
              </Text>
            </View>
            <Text className="text-sm text-blue-700 dark:text-blue-300 leading-5">
              {detail.load_suggestion}
            </Text>
          </View>
        ) : null}

        {/* Per-rep breakdown */}
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
          Rep Breakdown
        </Text>
        {detail.rep_details?.map((rep) => (
          <View
            key={rep.rep}
            className={`flex-row items-start p-4 rounded-xl mb-2 ${
              rep.status === "good"
                ? "bg-green-50 dark:bg-green-900/10"
                : "bg-red-50 dark:bg-red-900/10"
            }`}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{
              backgroundColor: rep.status === "good" ? "#10B98120" : "#EF444420",
            }}>
              <Text className={`text-sm font-bold ${
                rep.status === "good" ? "text-green-600" : "text-red-500"
              }`}>
                #{rep.rep}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={rep.status === "good" ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={rep.status === "good" ? "#10B981" : "#EF4444"}
                />
                <Text className={`text-sm font-medium capitalize ${
                  rep.status === "good" ? "text-green-600" : "text-red-500"
                }`}>
                  {rep.status}
                </Text>
              </View>
              <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {rep.feedback}
              </Text>
            </View>
          </View>
        ))}

        {detail.rep_details?.length === 0 && (
          <Text className="text-sm text-gray-400 text-center py-4">
            No reps detected in this video.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
