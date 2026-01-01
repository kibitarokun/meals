import { Env, AIRequest } from './types';
import { getMeals } from './db';

export async function handleAIRequest(env: Env, request: AIRequest): Promise<string> {
  const { action, context } = request;
  
  try {
    switch (action) {
      case 'recent':
        return await getRecentSummary(env);
      
      case 'suggest':
        return await getSuggestions(env);
      
      case 'popular':
        return await getPopularMeals(env);
      
      default:
        return 'どのようなご質問でしょうか？';
    }
  } catch (error) {
    console.error('AI request error:', error);
    return '申し訳ございません。エラーが発生しました。';
  }
}

async function getRecentSummary(env: Env): Promise<string> {
  const meals = await getMeals(env, 14);
  
  if (meals.length === 0) {
    return 'まだ献立の登録がありません。';
  }
  
  const mealList = meals.map(m => m.menu_name).join('、');
  
  const prompt = `以下は過去2週間の献立リストです：${mealList}。この献立の傾向を簡潔に要約してください。`;
  
  try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: 'あなたは家庭の献立アドバイザーです。簡潔で親しみやすい日本語で回答してください。' },
        { role: 'user', content: prompt }
      ]
    });
    
    return response.response || `最近は${meals.length}種類の献立を楽しまれていますね！`;
  } catch (error) {
    return `最近は${meals.length}種類の献立を楽しまれていますね！\n\n最近の献立：${meals.slice(0, 5).map(m => m.menu_name).join('、')}など`;
  }
}

async function getSuggestions(env: Env): Promise<string> {
  const meals = await getMeals(env, 14);
  const recentMeals = meals.map(m => m.menu_name).join('、');
  
  const prompt = `以下の献立と被らない、冬の夕飯にふさわしい献立を3つ提案してください：${recentMeals || 'まだ献立がありません'}`;
  
  try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: 'あなたは家庭の献立アドバイザーです。季節感があり、栄養バランスの良い献立を提案してください。' },
        { role: 'user', content: prompt }
      ]
    });
    
    return response.response || '1. 鍋料理\n2. グラタン\n3. 豚汁定食';
  } catch (error) {
    return '明日の献立のヒント:\n\n1. 鍋料理 - 体が温まります\n2. グラタン - 冬の定番\n3. 豚汁定食 - 栄養満点';
  }
}

async function getPopularMeals(env: Env): Promise<string> {
  const meals = await getMeals(env, 60);
  
  if (meals.length === 0) {
    return 'まだ十分なデータがありません。';
  }
  
  // Count meal occurrences
  const mealCount: { [key: string]: number } = {};
  meals.forEach(m => {
    mealCount[m.menu_name] = (mealCount[m.menu_name] || 0) + 1;
  });
  
  const sorted = Object.entries(mealCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sorted.length === 0) {
    return '人気の献立データがまだありません。';
  }
  
  const popularList = sorted.map(([name, count], i) => 
    `${i + 1}. ${name} (${count}回)`
  ).join('\n');
  
  return `📊 よく登場する献立トップ5:\n\n${popularList}`;
}

export async function generateTags(env: Env, menuName: string): Promise<string> {
  const prompt = `料理名「${menuName}」から、カテゴリ、主材料、調理法、雰囲気の4項目を抽出し、JSON形式で回答してください。例：{"cat": "和食", "ing": "魚", "method": "煮る", "vibe": "あっさり"}`;
  
  try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: '料理の分類専門家として、JSON形式で簡潔に回答してください。' },
        { role: 'user', content: prompt }
      ]
    });
    
    return response.response || '{}';
  } catch (error) {
    console.error('Tag generation error:', error);
    return '{}';
  }
}
