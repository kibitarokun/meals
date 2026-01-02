# ミールみーる - AI Coding Instructions

## Project Overview
Family meal planning app with Expo/React Native frontend and Cloudflare Workers backend using D1 (SQLite) database and Workers AI.

## Architecture

### Monorepo Structure
- `app/` - Expo React Native frontend (TypeScript)
- `backend/` - Cloudflare Workers API with D1 database and AI bindings
- `doc/` - Japanese specifications

### Key Integration Points
1. **Authentication**: Custom header-based auth using `X-API-KEY` with `FAMILY_SECRET` stored in AsyncStorage ([app/config/api.ts](app/config/api.ts))
2. **API Client**: Axios client created via `createApiClient()` - automatically includes stored API key
3. **Database**: Cloudflare D1 (SQLite) with composite primary keys `(meal_date, meal_type)`
4. **AI**: Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`) for meal suggestions and analysis

### Data Flow
- Frontend → `createApiClient()` → Cloudflare Worker → D1 Database
- AI requests: Frontend → `/ai` endpoint → Workers AI binding → LLM response

## Development Workflows

### Backend Development & Deployment
```bash
cd backend
npm install
npx wrangler login
npx wrangler dev  # Local development
npm run deploy    # Production deployment
```

**Database Migrations**: Execute via `npx wrangler d1 execute meals-db --remote --file=./migrations/001_create_tables.sql`

**Secrets Management**: Set via `npx wrangler secret put FAMILY_SECRET`

### Frontend Development
```bash
cd app
npm install
npm start     # Expo dev server
npm run ios   # iOS simulator
npm run android  # Android emulator
```

**Critical**: Update [app/config/api.ts](app/config/api.ts) `API_BASE_URL` with deployed Worker URL before testing.

## Code Conventions

### Type System
- **Shared types** exist in both `app/types/index.ts` and `backend/src/types.ts` - keep synchronized
- `MealType` must be literal union: `'breakfast' | 'lunch' | 'dinner'` (matches SQL CHECK constraint)
- Dates always stored as ISO strings: `YYYY-MM-DD`

### API Patterns
1. **CORS**: All endpoints include CORS headers via `corsHeaders(origin)` helper
2. **Authentication**: Every non-OPTIONS request validated via `authenticateRequest()`
3. **Error handling**: Use `errorResponse(message, status, origin)` for consistent JSON errors
4. **Database queries**: Use parameterized queries via `.bind()` to prevent SQL injection

### Frontend Navigation
- Bottom tabs: 週 (Week), 月 (Month), AI
- Stack navigation for detail views: Navigate to `'日'` screen with `{ date: string, mealType: MealType }` params
- Use `useIsFocused()` hook to reload data when screen regains focus ([screens/WeekScreen.tsx](app/screens/WeekScreen.tsx#L38))

### State Management
- No global state library - React hooks only
- Data reloading pattern: Call `load*Data()` in `useEffect` with `isFocused` dependency
- AsyncStorage for persistent client data (API key only)

## Critical Implementation Details

### Database Schema
- `shared_meals`: Composite PK `(meal_date, meal_type)`, includes `tags` (AI-generated), `latest_comment` (virtual column via JOIN)
- `meal_comments`: Auto-increment ID, foreign key to meals
- See [backend/migrations/001_create_tables.sql](backend/migrations/001_create_tables.sql)

### AI Tag Generation
When saving meals, [backend/src/ai.ts](backend/src/ai.ts) `generateTags()` automatically enriches meals with AI-generated tags based on `menu_name`.

### Japanese Language Requirements
- UI text: All Japanese (hiragana/kanji preferred for user-facing strings)
- AI responses: Must explicitly instruct LLM to respond in Japanese (see prompts in [backend/src/ai.ts](backend/src/ai.ts#L41))
- Date formatting: Use Japanese format `M/D(曜)` ([screens/WeekScreen.tsx](app/screens/WeekScreen.tsx#L61))

## Common Pitfalls

1. **TypeScript sync**: When changing `MealType` or `Meal` interface, update BOTH `app/types/index.ts` and `backend/src/types.ts`
2. **CORS issues**: Always pass `origin` parameter through to response helpers
3. **Date timezone**: Use `.toISOString().split('T')[0]` for date-only strings to avoid timezone bugs
4. **Composite keys**: DELETE/UPDATE queries must include both `meal_date` AND `meal_type`
5. **Navigation typing**: Import `NavigationProp` with proper `RootStackParamList` type for type-safe navigation

## Testing Checklist
- [ ] Backend: Test with `wrangler dev` before deploying
- [ ] Frontend: Verify `API_BASE_URL` points to deployed Worker
- [ ] Database: Confirm migrations applied with `npx wrangler d1 execute meals-db --remote --command "SELECT * FROM shared_meals LIMIT 1"`
- [ ] Auth: Test with correct `FAMILY_SECRET` value
- [ ] AI: Verify Japanese responses (LLM may default to English without explicit prompting)
