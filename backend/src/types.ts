export interface Env {
  DB: D1Database;
  AI: any;
  FAMILY_SECRET: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface Meal {
  meal_date: string;
  meal_type: MealType;
  menu_name: string;
  memo?: string;
  image_url?: string;
  tags?: string;
}

export interface Comment {
  id: number;
  meal_date: string;
  meal_type: MealType;
  comment_text: string;
  created_at: string;
}

export interface AIRequest {
  action: 'suggest' | 'recent' | 'popular' | 'chat';
  context?: string;
  question?: string;
}
