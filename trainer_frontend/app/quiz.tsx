import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { getQuizQuestions, submitQuiz } from "@/lib/api";
import type { QuizQuestion, QuizSubmitResponse } from "@/lib/types";

const RANK_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

/**
 * Quiz screen — sequential multiple-choice questions with a progress bar.
 * Shows results with score and rank on completion.
 */
export default function QuizScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getQuizQuestions();
        setQuestions(data);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  /** Record the user's answer and advance to the next question (or submit). */
  async function selectAnswer(optionIndex: number) {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // All questions answered — submit
      setIsSubmitting(true);
      try {
        const response = await submitQuiz(newAnswers);
        setResult(response);
      } catch {
        // Handle error
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </SafeAreaView>
    );
  }

  // ─── Results screen ───────────────────────────────────────────────────
  if (result) {
    const { score, total_questions, assigned_rank } = result.result;
    const percentage = Math.round((score / total_questions) * 100);

    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
          <View className="items-center">
            <Ionicons
              name={percentage >= 70 ? "trophy" : "ribbon"}
              size={72}
              color={Colors[colorScheme].tint}
            />
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
              {percentage}%
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
              {score} out of {total_questions} correct
            </Text>

            <View className="mt-4 px-6 py-3 rounded-2xl bg-primary/10">
              <Text className="text-xl font-bold text-primary">
                {RANK_LABELS[assigned_rank] ?? "Unknown"}
              </Text>
            </View>
            <Text className="text-sm text-gray-400 mt-2">
              Your new knowledge rank
            </Text>
          </View>

          {/* Review answers */}
          <View className="mt-8 gap-4">
            {result.questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.correct_answer_index;
              return (
                <View
                  key={q.id}
                  className={`p-4 rounded-xl border ${
                    isCorrect
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                  }`}
                >
                  <Text className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {i + 1}. {q.question_text}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isCorrect ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    Your answer: {q.options[userAnswer]}
                  </Text>
                  {!isCorrect && (
                    <Text className="text-sm text-green-600 mt-0.5">
                      Correct: {q.options[q.correct_answer_index]}
                    </Text>
                  )}
                  {q.explanation ? (
                    <Text className="text-xs text-gray-400 mt-1">
                      {q.explanation}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          <Pressable
            className="mt-6 bg-primary py-4 rounded-xl items-center"
            onPress={() => router.back()}
          >
            <Text className="text-white text-base font-semibold">Done</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Question screen ──────────────────────────────────────────────────
  if (isSubmitting) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#151718]">
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <Text className="text-gray-400 mt-4">Calculating your rank...</Text>
      </SafeAreaView>
    );
  }

  const question = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#151718]">
      <View className="flex-1 p-5">
        {/* Progress bar */}
        <View className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
          <View
            className="h-2 rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </View>

        <Text className="text-sm text-gray-400 mb-2">
          Question {currentIdx + 1} of {questions.length}
        </Text>
        <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-8 leading-7">
          {question.question_text}
        </Text>

        <View className="gap-3">
          {question.options.map((option, i) => (
            <Pressable
              key={i}
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-700"
              onPress={() => selectAnswer(i)}
            >
              <Text className="text-base text-gray-900 dark:text-white">
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
