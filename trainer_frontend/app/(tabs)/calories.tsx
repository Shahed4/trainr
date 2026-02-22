import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { analyzeMealImage, listMealLogs } from "@/lib/api";
import type { MealLogListItem } from "@/lib/types";

/**
 * Calorie tracking tab — shows daily summary, paginated meal log list,
 * and a camera button that sends food photos to Gemini for analysis.
 */
export default function CaloriesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const [items, setItems] = useState<MealLogListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /** Total calories from all loaded items (approximate — see backend for day filtering). */
  const todayCalories = items
    .filter((item) => {
      const d = new Date(item.logged_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    })
    .reduce((sum, item) => sum + item.calories, 0);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await listMealLogs();
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
      const res = await listMealLogs(cursor);
      setItems((prev) => [...prev, ...res.results]);
      setCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch {
      // Fail silently
    } finally {
      setIsLoadingMore(false);
    }
  }

  /** Opens the camera, captures a photo, and sends it for Gemini analysis. */
  async function handleCameraPress() {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Camera access is needed to take meal photos.");
      return;
    }

    const captureResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (captureResult.canceled || captureResult.assets.length === 0) return;

    const capturedImageUri = captureResult.assets[0].uri;
    setIsUploading(true);

    try {
      const mealLog = await analyzeMealImage(capturedImageUri);
      // Prepend the new log to the list
      setItems((prev) => [
        { id: mealLog.id, food_name: mealLog.food_name, calories: mealLog.calories, logged_at: mealLog.logged_at },
        ...prev,
      ]);
      Alert.alert(
        "Meal Analyzed",
        `${mealLog.food_name} — ${mealLog.calories} kcal`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      Alert.alert("Analysis Failed", msg);
    } finally {
      setIsUploading(false);
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderItem({ item }: { item: MealLogListItem }) {
    return (
      <Pressable
        className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"
        onPress={() => router.push(`/calorie-detail/${item.id}`)}
      >
        <View className="flex-1 mr-4">
          <Text className="text-base font-medium text-gray-900 dark:text-white">
            {item.food_name}
          </Text>
          <Text className="text-sm text-gray-400 mt-0.5">
            {formatDate(item.logged_at)}
          </Text>
        </View>
        <Text className="text-base font-semibold text-primary">
          {item.calories} kcal
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
      {/* Daily summary header */}
      <View className="items-center pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <Ionicons name="flame" size={36} color={Colors[colorScheme].tint} />
        <Text className="text-4xl font-bold text-gray-900 dark:text-white mt-1">
          {todayCalories}
        </Text>
        <Text className="text-sm text-gray-400">calories consumed today</Text>
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
            <Ionicons name="camera-outline" size={64} color={Colors[colorScheme].icon} />
            <Text className="text-base text-gray-400 text-center mt-4">
              No meals logged yet. Snap a photo to get AI nutritional analysis.
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

      {/* Camera floating button */}
      <Pressable
        className="absolute bottom-6 self-center px-8 py-4 rounded-full bg-primary flex-row items-center gap-2 shadow-lg"
        onPress={handleCameraPress}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text className="text-white text-base font-semibold">Snap Meal</Text>
          </>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
