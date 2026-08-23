import { Env, AIRequest } from './types';
import { getMeals } from './db';

// Workers AI のテキスト生成モデル。
// 先頭から順に試し、失敗した場合は次のモデルにフォールバックする。
// （旧 `@cf/meta/llama-3-8b-instruct` は Cloudflare 側で deprecated となり利用不可）
const TEXT_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct-fast',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Workers AI を呼び出してテキストを取得する。
 * モデルが廃止されていたり一時的に失敗した場合は次のモデルを試し、
 * すべて失敗したら理由付きの Error を投げる。
 */
async function runTextModel(env: Env, messages: ChatMessage[], maxTokens?: number): Promise<string> {
  const failures: string[] = [];

  for (const model of TEXT_MODELS) {
    try {
      const response = await env.AI.run(model, {
        messages,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      });

      const text = typeof response?.response === 'string' ? response.response.trim() : '';
      if (text) {
        return text;
      }
      failures.push(`${model}: empty response`);
    } catch (error: any) {
      failures.push(`${model}: ${error?.message || String(error)}`);
    }
  }

  throw new Error(`Workers AI request failed - ${failures.join(' / ')}`);
}

export async function handleAIRequest(env: Env, request: AIRequest): Promise<string> {
  const { action, context, question } = request;
  
  try {
    switch (action) {
      case 'recent':
        return await getRecentSummary(env);
      
      case 'suggest':
        return await getSuggestions(env);
      
      case 'popular':
        return await getPopularMeals(env);
      
      case 'chat':
        if (!question) {
          return '質問内容を入力してください。';
        }
        return await handleChatQuestion(env, question);
      
      default:
        return 'どのようなご質問でしょうか？';
    }
  } catch (error: any) {
    console.error('AI request error:', action, error?.stack || error?.message || error);
    return '申し訳ございません。エラーが発生しました。';
  }
}

async function getRecentSummary(env: Env): Promise<string> {
  const meals = await getMeals(env, 14);
  
  if (meals.length === 0) {
    return 'まだ献立の登録がありません。';
  }
  
  const mealList = meals.map(m => m.menu_name).join('、');
  
  const prompt = `最近2週間の献立：${mealList}

上記の献立傾向を150文字以内で分析してね。必ず文章を完結させること。日本語で回答すること。`;
  
  try {
    return await runTextModel(env, [
      { role: 'system', content: 'あなたは日本の家庭料理に詳しい献立アドバイザーです。親しみやすい口調で、絵文字も使いながら、指定された文字数内で必ず文章を完結させてください。必ず日本語で回答してください。IMPORTANT: You must respond ONLY in Japanese language. 必ず日本語のみで回答すること。' },
      { role: 'user', content: prompt }
    ], 256);
  } catch (error: any) {
    console.error('Recent summary error:', error?.message || error);
    return `最近は${meals.length}種類の献立を楽しまれていますね！\n\n最近の献立：${meals.slice(0, 5).map(m => m.menu_name).join('、')}など`;
  }
}

async function getSuggestions(env: Env): Promise<string> {
  const meals = await getMeals(env, 14);
  const recentMeals = meals.map(m => m.menu_name).join('、');
  
  const prompt = `最近の献立：${recentMeals || 'まだ献立がありません'}

上記と被らない、今の季節におすすめの献立を3つ番号付きで教えてください。各献立に簡単な説明を付けてください。合計250文字程度で。日本語で回答すること。
IMPORTANT: You must respond ONLY in Japanese language. 必ず日本語のみで回答すること。`;
  
  try {
    return await runTextModel(env, [
      { role: 'system', content: 'あなたは日本の家庭料理に詳しい献立アドバイザーです。親しみやすい口調で、番号付きリストで、指定された文字数内で必ず完結させて日本語で回答してください。IMPORTANT: You must respond ONLY in Japanese language. 必ず日本語のみで回答すること。' },
      { role: 'user', content: prompt }
    ], 512);
  } catch (error: any) {
    console.error('Suggestion error:', error?.message || error);
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

async function handleChatQuestion(env: Env, question: string): Promise<string> {
  // 直近の献立データを取得してコンテキストとして提供
  const meals = await getMeals(env, 30);
  const recentMeals = meals.length > 0 
    ? meals.slice(0, 10).map(m => `${m.meal_date} ${m.meal_type}: ${m.menu_name}`).join('\n')
    : 'まだ献立の登録がありません';
  
  const systemPrompt = `あなたは日本の家庭料理に詳しい献立アドバイザーです。親しみやすい口調で、絵文字も使いながら、300文字程度で必ず文章を完結させて日本語で回答してください。
IMPORTANT: You must respond ONLY in Japanese language. 必ず日本語のみで回答すること。

最近の献立履歴:
${recentMeals}`;
  
  try {
    return await runTextModel(env, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ], 600);
  } catch (error: any) {
    console.error('Chat question error:', error?.message || error);
    return '申し訳ございません。質問の処理中にエラーが発生しました。時間をおいて、もう一度お試しください。';
  }
}

export async function generateTags(env: Env, menuName: string): Promise<string> {
  const prompt = `料理名「${menuName}」から、カテゴリ、主材料、調理法、雰囲気の4項目を抽出し、JSON形式で回答してください。例：{"cat": "和食", "ing": "魚", "method": "煮る", "vibe": "あっさり"}`;
  
  try {
    return await runTextModel(env, [
      { role: 'system', content: '料理の分類専門家として、JSON形式で簡潔に回答してください。' },
      { role: 'user', content: prompt }
    ]);
  } catch (error: any) {
    console.error('Tag generation error:', error?.message || error);
    return '{}';
  }
}
