export interface Env {
  DB: D1Database;
  AI: any;
  FAMILY_SECRET: string;
}

export interface Meal {
  meal_date: string;
  menu_name: string;
  memo?: string;
  image_url?: string;
  tags?: string;
}

export interface Comment {
  id: number;
  meal_date: string;
  comment_text: string;
  created_at: string;
}

export interface AIRequest {
  action: 'suggest' | 'recent' | 'popular';
  context?: string;
}
