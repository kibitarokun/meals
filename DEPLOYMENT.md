# Cloudflare Pages Deployment Guide

## デプロイ手順

### 1. Webビルドの依存関係をインストール

```bash
npm install
```

### 2. Webビルドを実行

```bash
npm run web:build
```

これで`dist/`ディレクトリにWebアプリがビルドされます。

### 3. Cloudflare Pagesへのデプロイ

#### オプション A: Cloudflare Dashboard（推奨）

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Pages** → **Create a project** → **Connect to Git**
3. GitHubリポジトリを接続
4. ビルド設定:
   - **Build command**: `npm run web:build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank)
5. **Environment variables**に以下を設定（必要に応じて）:
   - なし（APIキーはユーザーがブラウザで入力）
6. **Save and Deploy**

#### オプション B: Wrangler CLI

```bash
# Wranglerがインストールされていない場合
npm install -g wrangler

# ログイン
npx wrangler login

# デプロイ
npx wrangler pages deploy dist --project-name=meals-app
```

### 4. Web版の特徴

- モバイルアプリと同じUI/UX
- AsyncStorageの代わりにlocalStorageを使用（自動）
- API認証キーはブラウザのlocalStorageに保存
- バックエンドURL: `https://meals-backend.mia-daydream.workers.dev`

### 注意事項

- Expo Webは一部のReact Native機能に制限があります
- カレンダー表示など、Web互換性のないコンポーネントは調整が必要な場合があります
- AsyncStorage → localStorageの変換は`@react-native-async-storage/async-storage`が自動処理

## 開発

ローカルでWeb版を起動:

```bash
npm run web
```

ブラウザで `http://localhost:8081` にアクセス
