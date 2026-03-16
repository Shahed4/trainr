import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getFlashcards, getProfile } from "@/lib/api";
import type { FlashCard, UserProfile } from "@/lib/types";

const RANK_LABELS: Record<number, string> = {
  0: "Not Tested",
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

const RANK_COLORS: Record<number, string> = {
  0: "#9CA3AF",
  1: "#10B981",
  2: "#3B82F6",
  3: "#8B5CF6",
};

const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * Education tab — shows the user's knowledge rank and a swipeable
 * flashcard deck. Redirects to the quiz if they haven't taken it yet.
 */
export default function EducationScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const translateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const fetchData = useCallback(async () => {
    try {
      const [profileData, flashcardData] = await Promise.all([
        getProfile(),
        getFlashcards(),
      ]);
      setProfile(profileData);
      setCards(flashcardData);
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Advance to the next card and instantly reset position for a seamless feel. */
  function goToNextCard() {
    setCurrentIndex((prev) => (prev + 1) % Math.max(cards.length, 1));
    setIsFlipped(false);
    rotateY.value = 0;
  }

  /** Toggle flip animation. */
  function toggleFlip() {
    const target = isFlipped ? 0 : 180;
    rotateY.value = withTiming(target, { duration: 300 });
    setIsFlipped(!isFlipped);
  }

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SCREEN_WIDTH * 0.15) {
        const direction = event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
        translateX.value = withTiming(direction, { duration: 150 }, () => {
          runOnJS(goToNextCard)();
          translateX.value = 0;
        });
      } else {
        translateX.value = withTiming(0, { duration: 100 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${(translateX.value / SCREEN_WIDTH) * 12}deg` },
    ],
    opacity: 1 - Math.min(Math.abs(translateX.value) / SCREEN_WIDTH, 0.4),
  }));

  const frontStyle = useAnimatedStyle(() => ({
    opacity: rotateY.value < 90 ? 1 : 0,
    backfaceVisibility: "hidden" as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: rotateY.value >= 90 ? 1 : 0,
    backfaceVisibility: "hidden" as const,
  }));

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </SafeAreaView>
    );
  }

  const rank = profile?.knowledge_rank ?? 0;
  const hasQuiz = rank > 0;
  const currentCard = cards[currentIndex];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
        {/* Header */}
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Education
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
          Level up your fitness knowledge
        </Text>

        {/* Rank badge */}
        <View className="items-center mb-6">
          <View
            className="px-6 py-3 rounded-2xl"
            style={{ backgroundColor: RANK_COLORS[rank] + "20" }}
          >
            <Text
              className="text-lg font-bold text-center"
              style={{ color: RANK_COLORS[rank] }}
            >
              {RANK_LABELS[rank]}
            </Text>
          </View>
          {hasQuiz && (
            <Text className="text-sm text-gray-400 mt-2">
              Swipe cards to learn new facts
            </Text>
          )}
        </View>

        {/* Quiz CTA or Flashcards */}
        {!hasQuiz ? (
          <View className="items-center py-10">
            <Ionicons name="school-outline" size={64} color={Colors[colorScheme].icon} />
            <Text className="text-base text-gray-500 dark:text-gray-400 text-center mt-4 mb-6 px-4">
              Take the knowledge quiz to discover your fitness level and unlock
              personalized learning content.
            </Text>
            <Pressable
              className="bg-primary px-8 py-4 rounded-xl"
              onPress={() => router.push("/quiz")}
            >
              <Text className="text-white text-base font-semibold">
                Take the Quiz
              </Text>
            </Pressable>
          </View>
        ) : cards.length > 0 && currentCard ? (
          <View className="flex-1 items-center">
            <GestureDetector gesture={swipeGesture}>
              <Animated.View
                style={[cardAnimatedStyle, { width: SCREEN_WIDTH - 48 }]}
              >
                <Pressable onPress={toggleFlip}>
                  <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 min-h-[260px] justify-center shadow-sm">
                    <Animated.View style={frontStyle}>
                      <Text className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                        {currentCard.category}
                      </Text>
                      <Text className="text-lg font-medium text-gray-900 dark:text-white leading-7">
                        {currentCard.front_text}
                      </Text>
                      <Text className="text-sm text-gray-400 mt-4">
                        Tap to reveal answer
                      </Text>
                    </Animated.View>
                    <Animated.View style={[backStyle, { position: "absolute", top: 24, left: 24, right: 24 }]}>
                      <Text className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">
                        Answer
                      </Text>
                      <Text className="text-base text-gray-700 dark:text-gray-200 leading-6">
                        {currentCard.back_text}
                      </Text>
                    </Animated.View>
                  </View>
                </Pressable>
              </Animated.View>
            </GestureDetector>
          </View>
        ) : (
          <View className="items-center py-10">
            <Text className="text-gray-400">No flashcards available.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
