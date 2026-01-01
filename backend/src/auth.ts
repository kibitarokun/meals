import { Env } from './types';

export function authenticateRequest(request: Request, env: Env): boolean {
  const apiKey = request.headers.get('X-API-KEY');
  
  if (!apiKey || apiKey !== env.FAMILY_SECRET) {
    return false;
  }
  
  return true;
}

export function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse(data: any, status: number = 200, origin?: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export function errorResponse(message: string, status: number = 400, origin?: string) {
  return jsonResponse({ error: message }, status, origin);
}
