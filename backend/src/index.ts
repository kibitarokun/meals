import { Env } from './types';
import { authenticateRequest, corsHeaders, jsonResponse, errorResponse } from './auth';
import { getMeals, getMealByDate, saveMeal, getComments, saveComment, deleteMeal } from './db';
import { handleAIRequest, generateTags } from './ai';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || undefined;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    
    // Authenticate all non-OPTIONS requests
    if (!authenticateRequest(request, env)) {
      return errorResponse('Unauthorized', 401, origin);
    }
    
    // Route handling
    try {
      if (url.pathname === '/meals') {
        if (request.method === 'GET') {
          const days = parseInt(url.searchParams.get('days') || '7');
          const meals = await getMeals(env, days);
          return jsonResponse({ meals }, 200, origin);
        }
        
        if (request.method === 'POST') {
          const meal = await request.json() as any;
          
          // Generate AI tags
          if (meal.menu_name) {
            const tags = await generateTags(env, meal.menu_name);
            meal.tags = tags;
          }
          
          await saveMeal(env, meal);
          return jsonResponse({ success: true, message: '献立を保存しました' }, 200, origin);
        }
        
        if (request.method === 'DELETE') {
          const date = url.searchParams.get('date');
          if (!date) {
            return errorResponse('日付パラメータが必要です', 400, origin);
          }
          await deleteMeal(env, date);
          return jsonResponse({ success: true, message: '献立を削除しました' }, 200, origin);
        }
      }
      
      if (url.pathname === '/comments') {
        if (request.method === 'GET') {
          const date = url.searchParams.get('date');
          if (!date) {
            return errorResponse('日付パラメータが必要です', 400, origin);
          }
          const comments = await getComments(env, date);
          return jsonResponse({ comments }, 200, origin);
        }
        
        if (request.method === 'POST') {
          const { meal_date, comment_text } = await request.json() as { meal_date: string; comment_text: string };
          if (!meal_date || !comment_text) {
            return errorResponse('meal_dateとcomment_textが必要です', 400, origin);
          }
          await saveComment(env, meal_date, comment_text);
          return jsonResponse({ success: true, message: 'コメントを投稿しました' }, 200, origin);
        }
      }
      
      if (url.pathname === '/ai' && request.method === 'POST') {
        const aiRequest = await request.json() as any;
        const response = await handleAIRequest(env, aiRequest);
        return jsonResponse({ message: response }, 200, origin);
      }
      
      return errorResponse('Not Found', 404, origin);
      
    } catch (error: any) {
      console.error('Error:', error);
      return errorResponse(error.message || 'Internal Server Error', 500, origin);
    }
  },
};
