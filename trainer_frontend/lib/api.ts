/**
 * Centralized API client for all backend communication.
 *
 * Every function mirrors a backend view by name (snake_case -> camelCase).
 * Auth tokens are attached automatically via the Supabase session.
 */

import { supabase } from "./supabase";
import type {
  Exercise,
  FlashCard,
  FormAnalysisDetail,
  FormAnalysisListItem,
  MealLogDetail,
  MealLogListItem,
  MealPlanDetail,
  MealPlanListItem,
  PaginatedResponse,
  QuizQuestion,
  QuizSubmitResponse,
  UserProfile,
} from "./types";

// MUST CHANGE LATER: Pull from EXPO_PUBLIC_API_URL env var in production
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Retrieve the current access token from the Supabase session.
 * Returns an empty string if not authenticated.
 */
async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

/**
 * Wrapper around fetch that injects the Authorization header.
 *
 * @param path - Relative API path (e.g. "/api/users/profile/").
 * @param options - Standard RequestInit options.
 * @returns The parsed JSON response.
 * @throws Error if the response is not ok.
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? data.detail ?? "Request failed");
  }

  return data as T;
}

// ─── Users ──────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's profile. Mirrors: get_profile
 * @returns The user's profile, auto-created on first call.
 */
export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/profile/");
}

/**
 * Update the authenticated user's profile. Mirrors: update_profile
 * @param data - Partial profile fields to update.
 * @returns The updated profile.
 */
export async function updateProfile(
  data: Partial<UserProfile>,
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/profile/update/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Calories ───────────────────────────────────────────────────────────

/**
 * Upload a meal photo for AI calorie analysis. Mirrors: analyze_meal_image
 * @param imageUri - Local file URI from expo-image-picker.
 * @returns The created MealLogDetail with full nutritional breakdown.
 */
export async function analyzeMealImage(imageUri: string): Promise<MealLogDetail> {
  const fileName = imageUri.split("/").pop() ?? "meal.jpg";
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const mimeType = fileExtension === "png" ? "image/png" : "image/jpeg";

  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}/api/calories/analyze/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to analyze meal image");
  }
  return data as MealLogDetail;
}

/**
 * List the user's meal logs with cursor pagination. Mirrors: list_meal_logs
 * @param cursor - Optional cursor for the next page.
 */
export async function listMealLogs(
  cursor?: string,
): Promise<PaginatedResponse<MealLogListItem>> {
  const params = cursor ? `?cursor=${cursor}` : "";
  return apiFetch<PaginatedResponse<MealLogListItem>>(
    `/api/calories/logs/${params}`,
  );
}

/**
 * Get full detail for a single meal log. Mirrors: get_meal_log_detail
 * @param logId - The meal log primary key.
 */
export async function getMealLogDetail(logId: number): Promise<MealLogDetail> {
  return apiFetch<MealLogDetail>(`/api/calories/logs/${logId}/`);
}

// ─── Education ──────────────────────────────────────────────────────────

/**
 * Fetch all quiz questions (without answers). Mirrors: get_quiz_questions
 */
export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  return apiFetch<QuizQuestion[]>("/api/education/quiz/");
}

/**
 * Submit quiz answers and receive a graded result. Mirrors: submit_quiz
 * @param answers - Array of chosen option indices, one per question.
 */
export async function submitQuiz(
  answers: number[],
): Promise<QuizSubmitResponse> {
  return apiFetch<QuizSubmitResponse>("/api/education/quiz/submit/", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

/**
 * Fetch flashcards matching the user's knowledge rank. Mirrors: get_flashcards
 */
export async function getFlashcards(): Promise<FlashCard[]> {
  return apiFetch<FlashCard[]>("/api/education/flashcards/");
}

// ─── Meal Plans ─────────────────────────────────────────────────────────

/**
 * Generate a new AI meal plan. Mirrors: generate_meal_plan
 * @param params - Plan configuration (goal, preferences, targets, etc.).
 */
export async function generateMealPlan(params: {
  plan_type: string;
  fitness_goal: string;
  dietary_preferences: string[];
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  favorite_foods: string;
}): Promise<MealPlanDetail> {
  return apiFetch<MealPlanDetail>("/api/meal-plans/generate/", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * List the user's meal plans with cursor pagination. Mirrors: list_meal_plans
 */
export async function listMealPlans(
  cursor?: string,
): Promise<PaginatedResponse<MealPlanListItem>> {
  const params = cursor ? `?cursor=${cursor}` : "";
  return apiFetch<PaginatedResponse<MealPlanListItem>>(
    `/api/meal-plans/${params}`,
  );
}

/**
 * Get full detail for a single meal plan. Mirrors: get_meal_plan_detail
 */
export async function getMealPlanDetail(
  planId: number,
): Promise<MealPlanDetail> {
  return apiFetch<MealPlanDetail>(`/api/meal-plans/${planId}/`);
}

// ─── Form Analysis ──────────────────────────────────────────────────────

/**
 * List available exercises with recording instructions. Mirrors: list_exercises
 */
export async function listExercises(): Promise<Exercise[]> {
  return apiFetch<Exercise[]>("/api/form/exercises/");
}

/**
 * Upload an exercise video for YOLO form analysis. Mirrors: analyze_form
 * @param exerciseId - PK of the exercise to analyze.
 * @param videoUri - Local file URI of the recorded/uploaded video.
 */
export async function analyzeForm(
  exerciseId: number,
  videoUri: string,
): Promise<FormAnalysisDetail> {
  const fileName = videoUri.split("/").pop() ?? "video.mp4";
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const mimeType = fileExtension === "mov" ? "video/quicktime" : "video/mp4";

  const formData = new FormData();
  formData.append("exercise_id", String(exerciseId));
  formData.append("video", {
    uri: videoUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}/api/form/analyze/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to analyze form");
  }
  return data as FormAnalysisDetail;
}

/**
 * List the user's past form analyses with cursor pagination.
 * Mirrors: list_analyses
 */
export async function listAnalyses(
  cursor?: string,
): Promise<PaginatedResponse<FormAnalysisListItem>> {
  const params = cursor ? `?cursor=${cursor}` : "";
  return apiFetch<PaginatedResponse<FormAnalysisListItem>>(
    `/api/form/analyses/${params}`,
  );
}

/**
 * Get full detail for a single form analysis. Mirrors: get_analysis_detail
 */
export async function getAnalysisDetail(
  analysisId: number,
): Promise<FormAnalysisDetail> {
  return apiFetch<FormAnalysisDetail>(`/api/form/analyses/${analysisId}/`);
}
