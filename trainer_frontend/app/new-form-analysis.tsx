import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { analyzeForm, listExercises } from "@/lib/api";
import type { Exercise } from "@/lib/types";

const EXERCISE_ICONS: Record<string, string> = {
  "Push-ups": "body-outline",
  "Pull-ups": "arrow-up-circle-outline",
  "Bench Press": "barbell-outline",
  "Curls": "fitness-outline",
  "Crunches": "man-outline",
};

/**
 * Exercise selection and video capture/upload screen.
 * The user picks an exercise, sees the recommended angle, and then
 * records or uploads a video for analysis.
 */
export default function NewFormAnalysisScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await listExercises();
        setExercises(data);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  /** Record a video using the device camera. */
  async function handleRecordVideo() {
    if (!selectedExercise) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed to record exercise videos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 0.7,
      videoMaxDuration: 120,
    });

    if (result.canceled || result.assets.length === 0) return;
    processVideo(result.assets[0].uri);
  }

  /** Pick a video from the device library. */
  async function handleUploadVideo() {
    if (!selectedExercise) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.7,
    });

    if (result.canceled || result.assets.length === 0) return;
    processVideo(result.assets[0].uri);
  }

  /** Send the video to the backend for YOLO analysis. */
  async function processVideo(videoUri: string) {
    if (!selectedExercise) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeForm(selectedExercise.id, videoUri);
      router.replace(`/form-detail/${analysis.id}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Analysis failed.";
      Alert.alert("Error", msg);
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </SafeAreaView>
    );
  }

  // ─── Analyzing state ──────────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <Text className="text-base text-gray-500 dark:text-gray-400 mt-4">
          Analyzing your form...
        </Text>
        <Text className="text-sm text-gray-400 mt-1">
          This may take a moment
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Video capture screen (exercise selected) ─────────────────────────
  if (selectedExercise) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]" edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          {/* Back button */}
          <Pressable
            className="flex-row items-center gap-1 mb-4"
            onPress={() => setSelectedExercise(null)}
          >
            <Ionicons name="chevron-back" size={20} color={Colors[colorScheme].tint} />
            <Text className="text-primary font-medium">Choose Different</Text>
          </Pressable>

          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedExercise.name}
          </Text>

          {/* Recommended angle */}
          <View className="mt-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="videocam-outline" size={18} color="#3B82F6" />
              <Text className="text-sm font-semibold text-blue-600">
                Camera Angle: {selectedExercise.recommended_angle}
              </Text>
            </View>
            <Text className="text-sm text-blue-700 dark:text-blue-300 leading-5">
              {selectedExercise.instructions}
            </Text>
          </View>

          {/* Action buttons */}
          <View className="mt-8 gap-4">
            <Pressable
              className="py-4 rounded-xl bg-primary items-center flex-row justify-center gap-2"
              onPress={handleRecordVideo}
            >
              <Ionicons name="videocam" size={22} color="#fff" />
              <Text className="text-white text-base font-semibold">
                Record Video
              </Text>
            </Pressable>

            <Pressable
              className="py-4 rounded-xl bg-gray-100 dark:bg-gray-800 items-center flex-row justify-center gap-2"
              onPress={handleUploadVideo}
            >
              <Ionicons name="cloud-upload-outline" size={22} color={Colors[colorScheme].tint} />
              <Text className="text-base font-semibold text-gray-900 dark:text-white">
                Upload Video
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Exercise picker ──────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Exercise
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Select the exercise you want to analyze
        </Text>

        <View className="gap-3">
          {exercises.map((exercise) => (
            <Pressable
              key={exercise.id}
              className="flex-row items-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
              onPress={() => setSelectedExercise(exercise)}
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                <Ionicons
                  name={(EXERCISE_ICONS[exercise.name] ?? "barbell-outline") as any}
                  size={24}
                  color={Colors[colorScheme].tint}
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  {exercise.name}
                </Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                  {exercise.recommended_angle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        {exercises.length === 0 && (
          <View className="items-center py-10">
            <Text className="text-gray-400">No exercises available. Seed the database first.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
