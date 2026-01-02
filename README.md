# うちの晩ごはん - 家族共有献立管理アプリ

「迷わない・打たない・忘れない」3家族の献立共有アプリです。

## 📱 主な機能

- **週画面**: 直近の献立とコメントの確認
- **月画面**: カレンダーでの献立履歴の俯瞰
- **日画面**: 献立の登録と家族間のコメント投稿
- **AIコンシェルジュ**: 自由な質問への回答、献立提案、履歴分析

## 🏗️ プロジェクト構造

```
expo_app/
├── app/              # Expoフロントエンド
│   ├── screens/      # 画面コンポーネント
│   ├── config/       # API設定
│   └── types/        # TypeScript型定義
├── backend/          # Cloudflare Workers
│   ├── src/          # バックエンドソース
│   └── migrations/   # D1データベースマイグレーション
├── doc/              # 仕様書
├── eas.json          # EAS Build設定
├── app.json          # Expo設定
└── index.js          # アプリエントリーポイント
```

**現在のバージョン**: 1.1.0

## 🚀 セットアップ手順

### 1. バックエンドのセットアップ

```bash
cd backend

# 依存パッケージのインストール
npm install

# Cloudflareにログイン
npx wrangler login

# D1データベースの作成
npx wrangler d1 create meals-db

# wrangler.tomlのdatabase_idを更新してから、マイグレーション実行
npx wrangler d1 execute meals-db --remote --file=./migrations/001_create_tables.sql

# 家族用の秘密鍵を設定
npx wrangler secret put FAMILY_SECRET
# → プロンプトで秘密鍵を入力（"ouchi2026"）

# デプロイ
npm run deploy
```

デプロイ後、表示されるWorkerのURLをメモしてください。

### 2. フロントエンドのセットアップ

```bash
# 依存パッケージのインストール（ルートディレクトリで実行）
npm install

# config/api.tsのAPI_BASE_URLを更新
# export const API_BASE_URL = 'https://your-worker.your-subdomain.workers.dev';
```

[app/config/api.ts](app/config/api.ts) を開き、`API_BASE_URL` をデプロイしたWorkerのURLに変更してください。

**注意**: このプロジェクトは package.json がルートディレクトリにあるモノレポ構造です。

### 3. アプリの起動

```bash
# 開発サーバーの起動（ルートディレクトリで実行）
npm start

# iOS シミュレータで起動
npm run ios

# Android エミュレータで起動
npm run android
```

### 4. 初回起動時の設定

アプリを起動したら、バックエンドで設定した `FAMILY_SECRET` を入力してください。この値は端末に保存され、以降の通信で使用されます。

## 📦 本番デプロイ（EAS Build & Update）

### 初回ビルド

```bash
# EASのインストール（初回のみ）
npm install -g eas-cli

# EASにログイン
eas login

# Androidビルド（内部配布用APK）
eas build --platform android --profile preview

# プロダクションビルド
eas build --platform android --profile production

# iOSビルド（Appleアカウントが必要）
eas build --platform ios --profile preview
```

ビルド完了後、表示されるURLを家族に共有してインストールしてもらいます。

### OTA更新（JavaScript変更のみ）

ネイティブコードの変更がない場合、EAS Updateで即座に配信できます：

```bash
# previewビルドユーザー向けに更新配信
npx eas update --branch preview --message "バグ修正"

# productionビルドユーザー向けに更新配信
npx eas update --branch production --message "新機能追加"
```

**自動更新**: アプリは起動時に自動的に更新をチェックして適用します（v1.1.0以降）。

## 🔧 開発コマンド

### バックエンド
```bash
cd backend
npx wrangler dev     # ローカル開発サーバー起動
npm run deploy       # 本番環境へデプロイ
```

### フロントエンド
```bash
# ルートディレクトリで実行
npm start            # Expo開発サーバー起動
npm run ios          # iOSシミュレータで起動
npm run android      # Androidエミュレータで起動

# OTA更新の配信
npx eas update --branch preview --message "変更内容"
```

## 🎨 カラーテーマ

- プライマリ: `#FF6B6B` (献立の赤)
- セカンダリ: `#4ECDC4` (コメントの青緑)
- 背景: `#FFF8F0` (温かみのあるクリーム色)
- カード背景: `#FFFFFF`

## 📝 API仕様

### 認証
全てのリクエストに `X-API-KEY` ヘッダーが必要です。

### データモデル
献立は `(meal_date, meal_type)` の複合主キーで管理されます。
- `meal_type`: `'breakfast'` | `'lunch'` | `'dinner'`

### エンドポイント

#### GET /meals
献立一覧を取得

**クエリパラメータ:**
- `days`: 取得する日数（デフォルト: 7）

**レスポンス:**
```json
{
  "meals": [
    {
      "meal_date": "2025-12-29",
      "meal_type": "dinner",
      "menu_name": "カレーライス",
      "memo": "辛口で作りました",
      "tags": "{\"cat\":\"洋食\",\"ing\":\"肉\"}",
      "latest_comment": "美味しそう✨"
    }
  ]
}
```

#### POST /meals
献立を保存

**リクエストボディ:**
```json
{
  "meal_date": "2025-12-29",
  "meal_type": "dinner",
  "menu_name": "カレーライス",
  "memo": "辛口で作りました"
}
```

#### DELETE /meals
献立を削除

**リクエストボディ:**
```json
{
  "meal_date": "2025-12-29",
  "meal_type": "dinner"
}
```

#### GET /comments?date=YYYY-MM-DD&meal_type=dinner
特定献立のコメント一覧を取得

#### POST /comments
コメントを投稿

**リクエストボディ:**
```json
{
  "meal_date": "2025-12-29",
  "meal_type": "dinner",
  "comment_text": "ごちそうさま！"
}
```

#### POST /ai
AIコンシェルジュに相談

**リクエストボディ（定型質問）:**
```json
{
  "action": "suggest",  // "recent" | "suggest" | "popular"
  "context": {}
}
```

**リクエストボディ（自由質問）:**
```json
{
  "action": "chat",
  "question": "今日は何を作ればいい？"
}
```

**レスポンス:**
```json
{
  "message": "AI からの回答テキスト"
}
```

## 🔐 セキュリティ

- API通信は `X-API-KEY` ヘッダーで認証
- 秘密鍵は Cloudflare の Secret 機能で安全に管理
- アプリ側は AsyncStorage に暗号化して保存

## 📱 対応プラットフォーム

- iOS 13.0以上
- Android 5.0以上

## 🛠️ 技術スタック

- **フロントエンド**: React Native (Expo SDK ~54.0.0)
- **バックエンド**: Cloudflare Workers (TypeScript)
- **データベース**: Cloudflare D1 (SQLite)
- **AI**: Cloudflare Workers AI (@cf/meta/llama-3-8b-instruct)
- **認証**: カスタムヘッダー認証 (X-API-KEY)
- **配信**: EAS Build & EAS Update (OTA更新)
- **ストレージ**: AsyncStorage (ローカル)

