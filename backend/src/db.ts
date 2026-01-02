import { Env, Meal, MealType } from './types';

export async function getMeals(env: Env, days: number = 7): Promise<any[]> {
  const query = `
    SELECT 
      m.*,
      (SELECT comment_text 
       FROM meal_comments 
       WHERE meal_date = m.meal_date AND meal_type = m.meal_type
       ORDER BY created_at DESC 
       LIMIT 1) as latest_comment
    FROM shared_meals m
    WHERE m.meal_date >= date('now', '-' || ? || ' days')
    ORDER BY m.meal_date DESC, 
      CASE m.meal_type 
        WHEN 'dinner' THEN 1 
        WHEN 'lunch' THEN 2 
        WHEN 'breakfast' THEN 3 
        ELSE 4 
      END
  `;
  
  const result = await env.DB.prepare(query).bind(days).all();
  return result.results || [];
}

export async function getMealByDate(env: Env, date: string, mealType: MealType): Promise<Meal | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM shared_meals WHERE meal_date = ? AND meal_type = ?'
  ).bind(date, mealType).first();
  
  return result as Meal | null;
}

export async function saveMeal(env: Env, meal: Meal): Promise<void> {
  const existing = await getMealByDate(env, meal.meal_date, meal.meal_type);
  
  if (existing) {
    await env.DB.prepare(`
      UPDATE shared_meals 
      SET menu_name = ?, memo = ?, image_url = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE meal_date = ? AND meal_type = ?
    `).bind(
      meal.menu_name,
      meal.memo || null,
      meal.image_url || null,
      meal.tags || null,
      meal.meal_date,
      meal.meal_type
    ).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO shared_meals (meal_date, meal_type, menu_name, memo, image_url, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      meal.meal_date,
      meal.meal_type,
      meal.menu_name,
      meal.memo || null,
      meal.image_url || null,
      meal.tags || null
    ).run();
  }
}

export async function getComments(env: Env, date: string, mealType: MealType): Promise<any[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM meal_comments WHERE meal_date = ? AND meal_type = ? ORDER BY created_at DESC'
  ).bind(date, mealType).all();
  
  return result.results || [];
}

export async function saveComment(env: Env, mealDate: string, mealType: MealType, commentText: string): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO meal_comments (meal_date, meal_type, comment_text)
    VALUES (?, ?, ?)
  `).bind(mealDate, mealType, commentText).run();
}

export async function deleteMeal(env: Env, date: string, mealType: MealType): Promise<void> {
  // 献立に関連するコメントも削除
  await env.DB.prepare(
    'DELETE FROM meal_comments WHERE meal_date = ? AND meal_type = ?'
  ).bind(date, mealType).run();
  
  // 献立を削除
  await env.DB.prepare(
    'DELETE FROM shared_meals WHERE meal_date = ? AND meal_type = ?'
  ).bind(date, mealType).run();
}
