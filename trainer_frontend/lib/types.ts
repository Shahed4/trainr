// ─── User Profile ───────────────────────────────────────────────────────

export interface UserProfile {
  user_id: string;
  display_name: string;
  email: string;
  fitness_goal: "cutting" | "bulking" | "maintenance";
  dietary_preferences: string[];
  current_body_type: string;
  goal_body_type: string;
  knowledge_rank: number;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  created_at: string;
  updated_at: string;
}

// ─── Calories / Meal Logs ───────────────────────────────────────────────

export interface MealLogListItem {
  id: number;
  food_name: string;
  calories: number;
  logged_at: string;
}

export interface MealLogDetail {
  id: number;
  user_id: string;
  food_name: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_size: string;
  nutritional_details: Record<string, number>;
  image_url: string;
  logged_at: string;
}

// ─── Education ──────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: number;
  question_text: string;
  options: string[];
}

export interface QuizQuestionWithAnswer extends QuizQuestion {
  correct_answer_index: number;
  explanation: string;
}

export interface QuizResult {
  id: number;
  score: number;
  total_questions: number;
  assigned_rank: number;
  taken_at: string;
}

export interface QuizSubmitResponse {
  result: QuizResult;
  questions: QuizQuestionWithAnswer[];
}

export interface FlashCard {
  id: number;
  knowledge_level: number;
  category: string;
  front_text: string;
  back_text: string;
}

// ─── Meal Plans ─────────────────────────────────────────────────────────

export interface MealPlanListItem {
  id: number;
  plan_name: string;
  plan_type: "daily" | "weekly";
  fitness_goal: string;
  calorie_target: number;
  created_at: string;
}

export interface MealFood {
  item: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Meal {
  name: string;
  timing: string;
  foods: MealFood[];
  total_calories: number;
}

export interface MealDay {
  day: string;
  meals: Meal[];
  daily_totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface MealPlanData {
  plan_name: string;
  days: MealDay[];
  substitutions: { original: string; substitute: string; reason: string }[];
  tips: string[];
}

export interface MealPlanDetail {
  id: number;
  user_id: string;
  plan_type: "daily" | "weekly";
  fitness_goal: string;
  dietary_preferences: string[];
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  favorite_foods: string;
  plan_data: MealPlanData;
  created_at: string;
}

// ─── Form Analysis ──────────────────────────────────────────────────────

export interface Exercise {
  id: number;
  name: string;
  recommended_angle: string;
  instructions: string;
}

export interface RepDetail {
  rep: number;
  status: "good" | "bad";
  metric_value: number;
  feedback: string;
}

export interface FormAnalysisListItem {
  id: number;
  exercise_name: string;
  total_reps: number;
  good_reps: number;
  bad_reps: number;
  analyzed_at: string;
}

export interface FormAnalysisDetail {
  id: number;
  user_id: string;
  exercise_name: string;
  recommended_angle: string;
  video_url: string;
  total_reps: number;
  good_reps: number;
  bad_reps: number;
  rep_details: RepDetail[];
  load_suggestion: string;
  analyzed_at: string;
}

// ─── Paginated Response ─────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
}
