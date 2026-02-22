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
import { listAnalyses } from "@/lib/api";
import type { FormAnalysisListItem } from "@/lib/types";

/**
 * Form tracker tab — shows a paginated list of past form analyses
 * and a floating button to start a new one.
 */
export default function FormScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const [items, setItems] = useState<FormAnalysisListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  /** Fetch the first page of analyses. */
  const fetchInitial = useCallback(async () => {
    try {
      const res = await listAnalyses();
      setItems(res.results);
      setCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch {
      // Silently fail on initial load — list stays empty
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  /** Load the next cursor page. */
  async function loadMore() {
    if (!hasMore || !cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await listAnalyses(cursor);
      setItems((prev) => [...prev, ...res.results]);
      setCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch {
      // Fail silently
    } finally {
      setIsLoadingMore(false);
    }
  }

  /** Format a date string into a short readable form. */
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderItem({ item }: { item: FormAnalysisListItem }) {
    return (
      <Pressable
        className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"
        onPress={() => router.push(`/form-detail/${item.id}`)}
      >
        <View className="flex-1 mr-4">
          <Text className="text-base font-medium text-gray-900 dark:text-white">
            {item.exercise_name}
          </Text>
          <Text className="text-sm text-gray-400 mt-0.5">
            {formatDate(item.analyzed_at)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-semibold text-primary">
            {item.good_reps}/{item.total_reps}
          </Text>
          <Text className="text-xs text-gray-400">good reps</Text>
        </View>
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
          Form Tracker
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Analyze your exercise form with AI
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
            onRefresh={() => {
              setIsRefreshing(true);
              fetchInitial();
            }}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <Ionicons
              name="barbell-outline"
              size={64}
              color={Colors[colorScheme].icon}
            />
            <Text className="text-base text-gray-400 text-center mt-4">
              No analyses yet. Record a video of your exercise to get AI-powered
              form feedback.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              className="items-center py-4"
              onPress={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text className="text-primary font-medium">Load More</Text>
              )}
            </Pressable>
          ) : null
        }
      />

      {/* Floating action button */}
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={() => router.push("/new-form-analysis")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}
