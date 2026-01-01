export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface Meal {
  meal_date: string;
  meal_type: MealType;
  menu_name: string;
  memo?: string;
  image_url?: string;
  tags?: string;
  latest_comment?: string;
}

export interface Comment {
  id: number;
  meal_date: string;
  meal_type: MealType;
  comment_text: string;
  created_at: string;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
}
