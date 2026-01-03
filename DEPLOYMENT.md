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
   - **Framework preset**: `None`
   - **Build command**: `npm run web:build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (空欄のままでOK)
5. **Environment variables**:
   - なし（APIキーはユーザーがブラウザで入力）
6. **Save and Deploy**

**重要**: デプロイ設定で「Custom deploy command」が設定されている場合は削除してください。Pagesは自動的にビルド出力をデプロイします。

#### オプション B: Wrangler CLI（手動デプロイ）

```bash
# Wranglerがインストールされていない場合
npm install -g wrangler

# ログイン
npx wrangler login

# Pagesにデプロイ（Cloudflare Pagesとして）
npx wrangler pages deploy dist --project-name=meals-app

# または、既存のPages projectがある場合
npx wrangler pages deploy dist
```

**注意**: Wrangler CLIでデプロイする場合は、`wrangler pages deploy`を使用します（`wrangler deploy`ではありません）。

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
