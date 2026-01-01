export interface Meal {
  meal_date: string;
  menu_name: string;
  memo?: string;
  image_url?: string;
  tags?: string;
  latest_comment?: string;
}

export interface Comment {
  id: number;
  meal_date: string;
  comment_text: string;
  created_at: string;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
}
