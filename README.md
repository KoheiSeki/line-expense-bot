# LINE 割り勘 Bot

LINE グループ向けの割り勘管理 Bot です。LINE Messaging API と LIFF（LINE Front-end Framework）を組み合わせ、グループ内の支出を記録・精算できます。

## 機能

- **参加**: グループメンバーとして登録（LIFF 経由）
- **登録**: 支出を記録（LIFF フォームで入力）
- **一覧**: 直近の支出一覧を Flex で表示。各行から LIFF（`/liff/edit`・`/liff/delete`）で編集・削除
- **表示**: 未精算の支出を集計し、最小の送金回数で精算方法を Flex メッセージで表示

精算アルゴリズムには貪欲法を採用しており、送金回数を最小化します。

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16 (App Router) |
| フロントエンド | React 19, Tailwind CSS 4, Shadcn/ui, Radix UI |
| バックエンド | Next.js Route Handlers |
| データベース | PostgreSQL (Supabase), Drizzle ORM |
| LINE 連携 | LINE Messaging API SDK, LIFF |
| デプロイ | Vercel |

## アーキテクチャ概要

```
LINE アプリ
  ├── テキスト送信 (参加 / 登録 / 一覧 / 表示 / ヘルプ)
  │     └── Webhook → /api/line/webhook → 各ハンドラー
  │           ├── 参加  → LIFF URL を返信
  │           ├── 登録  → LIFF URL を返信
  │           ├── 一覧  → 支出一覧 Flex（編集・削除用 LIFF リンク付き）
  │           └── 表示  → 精算結果を Flex メッセージで返信
  └── LIFF 画面
        ├── /liff/join     → グループ参加フォーム
        ├── /liff/register → 支出登録フォーム → /api/expenses (POST)
        ├── /liff/edit     → 支出編集（クエリ: groupId, expenseId）→ /api/expenses (PUT)
        └── /liff/delete   → 支出削除確認 → /api/expenses (DELETE)
```

## データベース設計

```
expenses               支出テーブル
  expense_id (PK)
  line_group_id
  payer_user_id
  title
  amount
  paid_at
  created_at

expense_participants   支出参加者テーブル
  expense_id (PK, FK)
  line_user_id (PK)
  share_amount
  created_at

group_members          グループメンバーテーブル
  line_group_id (PK)
  line_user_id (PK)
  display_name
  picture_url
  joined_at
```

## セットアップ

### 必要条件

- Node.js 18 以上
- PostgreSQL（Supabase 推奨）
- LINE Developers アカウント

### 環境変数

`.env.local` ファイルを作成し、以下の変数を設定します。

```env
# PostgreSQL 接続文字列 (Supabase の場合は Connection Pooler の URI)
DATABASE_URL=postgresql://...

# LINE Messaging API チャネルシークレット (LINE Developers > チャネル基本設定)
LINE_CHANNEL_SECRET=your_channel_secret

# LINE Messaging API チャネルアクセストークン (LINE Developers > Messaging API 設定)
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token

# LIFF ID (LINE Developers > LIFF > LIFF アプリ)
NEXT_PUBLIC_LIFF_ID=your_liff_id
```

### インストールと起動

```bash
# 依存関係のインストール
npm install

# データベースのマイグレーション実行
npx drizzle-kit migrate

# 開発サーバーの起動
npm run dev
```

### Webhook のローカル開発

ngrok などを使って外部からアクセスできる URL を発行し、LINE Developers コンソールの Webhook URL に設定します。

```bash
ngrok http 3000
```

Webhook URL: `https://<your-ngrok-id>.ngrok.io/api/line/webhook`

### Vercel へのデプロイ

```bash
# Vercel CLI でデプロイ
npx vercel --prod
```

環境変数は Vercel ダッシュボードまたは CLI で設定します。デプロイ後、LINE Developers コンソールの Webhook URL を Vercel の URL に更新してください。

## LINE Bot の使い方

1. LINE グループに Bot を招待します
2. グループで **「参加」** と送信し、表示される LIFF リンクからメンバー登録します
3. 支出が発生したら **「登録」** と送信し、LIFF フォームで金額・参加者を入力します
4. **「表示」** と送信すると、未精算の支出をもとに最適な精算方法が表示されます

## 主なスクリプト

```bash
npm run dev    # 開発サーバー起動
npm run build  # プロダクションビルド
npm run start  # プロダクションサーバー起動
npm run lint   # ESLint 実行
```
