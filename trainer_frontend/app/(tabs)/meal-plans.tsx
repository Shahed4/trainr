import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { listMealPlans } from "@/lib/api";
import type { MealPlanListItem } from "@/lib/types";

/**
 * Meal plans tab — shows a paginated list of generated plans
 * and a floating button to create a new one.
 */
export default function MealPlansScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const [items, setItems] = useState<MealPlanListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await listMealPlans();
      setItems(res.results);
      setCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  async function loadMore() {
    if (!hasMore || !cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await listMealPlans(cursor);
      setItems((prev) => [...prev, ...res.results]);
      setCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch {
      // Silently handle
    } finally {
      setIsLoadingMore(false);
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function renderItem({ item }: { item: MealPlanListItem }) {
    return (
      <Pressable
        className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"
        onPress={() => router.push(`/meal-plan-detail/${item.id}`)}
      >
        <View className="flex-1 mr-4">
          <Text className="text-base font-medium text-gray-900 dark:text-white">
            {item.plan_name}
          </Text>
          <Text className="text-sm text-gray-400 mt-0.5">
            {formatDate(item.created_at)} · {item.plan_type}
          </Text>
        </View>
        <Text className="text-base font-semibold text-primary">
          {item.calorie_target} kcal
        </Text>
      </Pressable>
    );
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
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Meal Plans
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          AI-generated plans tailored to your goals
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); fetchInitial(); }}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <Ionicons name="nutrition-outline" size={64} color={Colors[colorScheme].icon} />
            <Text className="text-base text-gray-400 text-center mt-4">
              No meal plans yet. Tap the + button to generate your first personalized plan.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable className="items-center py-4" onPress={loadMore} disabled={isLoadingMore}>
              {isLoadingMore ? <ActivityIndicator size="small" /> : <Text className="text-primary font-medium">Load More</Text>}
            </Pressable>
          ) : null
        }
      />

      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={() => router.push("/new-meal-plan")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}
