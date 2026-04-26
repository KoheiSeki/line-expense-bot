# LINE割り勘Bot 設計ドキュメント

## 概要

LINEグループを活用した割り勘アプリ。既存のLINEグループをそのまま利用し、BotとLIFF画面で経費の登録・精算を行う。

---

## コンセプト

### 前提
- 割り勘のやり取りは基本的にLINEグループで行う

### 方針
- LINE Messaging API（Bot）
- LINE Frontend Framework（LIFF）

---

## ユーザーフロー

### 事前準備
1. 割り勘用グループを作成（既存グループでも可）
2. 作成したBotをグループに追加

### 金額追加
```
1. グループで「登録」と入力
2. BotがLIFFのURLをメッセージで返信
3. LIFF画面（金額・支払い参加者入力フォーム）を表示
4. 入力内容をDBに保存
5. 「登録しました」とグループに通知
```

### 支払い状況の表示
```
1. グループで「表示」と入力
2. DBから未精算の支出を集計
3. 貪欲法で精算ペアを最小化
4. Flex Messageで支払い状況をグループに返信
```

### 精算
```
1. グループで「精算」と入力
2. 未精算の全expensesのsettled_atを現在時刻で更新
3. 「精算が完了しました！」とグループに通知
```

---

## アーキテクチャ構成

```
LINEアプリ
  │
  ├─ メッセージ送信（「登録」「表示」「精算」）
  │       ↓
  │   LINE Platform
  │       ↓ Webhook (POST)
  │   Next.js API Route (/api/line/webhook)
  │       ↓
  │   Supabase (Postgres)
  │
  └─ LIFFリンクをタップ
          ↓
      LIFF画面 (Next.js Page)
          ↓ liff.getProfile() で認証
          ↓
      Next.js API Route (/api/expenses)
          ↓
      Supabase (Postgres)
```

---

## 技術スタック

| レイヤー | 技術 | 備考 |
|---|---|---|
| フロントエンド (LIFF) | Next.js 15 (App Router) | WebhookAPIと同一プロジェクトで完結 |
| UIコンポーネント | Tailwind CSS + Shadcn UI | モダン・軽量 |
| Webhookサーバー | Next.js API Route | 別サーバー不要 |
| LINE連携（Bot） | @line/bot-sdk | 公式SDK |
| LINE連携（LIFF） | LIFF SDK | 公式SDK |
| DB | Supabase (Postgres) | 無料枠が大きい |
| ORM | Drizzle ORM | 型安全・軽量 |
| 言語 | TypeScript (strict) | — |
| デプロイ | Vercel | Next.jsとの親和性が最高 |
| Nodeバージョン管理 | `.node-version` | シンプルに固定 |

---

## DBスキーマ

### 設計方針
- usersテーブル：**不要**（LINE IDをそのまま利用）
- groupsテーブル：**不要**（LINEグループIDをそのまま利用）
- balancesテーブル：**不要**（2テーブルから都度集計）

### テーブル定義

```sql
-- 支出
CREATE TABLE expenses (
  id              SERIAL PRIMARY KEY,
  line_group_id   VARCHAR(50)    NOT NULL,  -- LINEグループID
  payer_user_id   VARCHAR(50)    NOT NULL,  -- LINE UserID（立替払い者）
  title           VARCHAR(100)   NOT NULL,  -- 支出タイトル
  amount          DECIMAL(10,2)  NOT NULL,  -- 支払い金額
  paid_at         DATE           NOT NULL,  -- 支出日
  settled_at      TIMESTAMPTZ,              -- NULL = 未精算
  created_at      TIMESTAMPTZ    DEFAULT NOW()
);

-- 支出参加者
CREATE TABLE expense_participants (
  id              SERIAL PRIMARY KEY,
  expense_id      INTEGER REFERENCES expenses(id),
  line_user_id    VARCHAR(50)    NOT NULL,  -- LINE UserID（参加者）
  share_amount    DECIMAL(10,2)  NOT NULL   -- 負担金額
);
```

### 残高計算クエリ

```sql
-- 未精算の支出から各ユーザーの純残高を算出
SELECT
  user_id,
  SUM(paid) - SUM(owed) AS net_balance
FROM (
  SELECT payer_user_id AS user_id, amount AS paid, 0 AS owed
  FROM expenses
  WHERE line_group_id = $1 AND settled_at IS NULL

  UNION ALL

  SELECT ep.line_user_id AS user_id, 0 AS paid, ep.share_amount AS owed
  FROM expense_participants ep
  JOIN expenses e ON ep.expense_id = e.id
  WHERE e.line_group_id = $1 AND e.settled_at IS NULL
) t
GROUP BY user_id
```

この純残高を取得後、アプリ側で**貪欲法**を適用して精算ペアを最小化する。

---

## プロジェクト構成

```
src/
├── app/
│   ├── api/
│   │   ├── line/
│   │   │   └── webhook/
│   │   │       └── route.ts          # LINE Webhookエンドポイント
│   │   └── expenses/
│   │       └── route.ts              # 経費登録API（LIFF → DB）
│   ├── liff/
│   │   └── register/
│   │       └── page.tsx              # LIFF画面（金額入力フォーム）
│   ├── layout.tsx
│   └── globals.css
│
├── features/
│   ├── webhook/
│   │   ├── handlers/
│   │   │   ├── message.handler.ts    # テキストメッセージの分岐
│   │   │   ├── register.handler.ts  # 「登録」コマンド処理
│   │   │   ├── display.handler.ts   # 「表示」コマンド処理
│   │   │   └── settle.handler.ts    # 「精算」コマンド処理
│   │   └── flex-messages/
│   │       └── balance.flex.ts      # 支払い状況のFlex Message
│   │
│   └── expenses/
│       ├── components/
│       │   ├── expense-form.tsx      # 金額入力フォーム
│       │   └── participant-select.tsx
│       ├── hooks/
│       │   └── use-expense-form.ts
│       ├── services/
│       │   ├── expense.client.service.ts
│       │   └── expense.server.service.ts
│       ├── utils/
│       │   └── settlement.utils.ts   # 貪欲法による精算計算
│       └── types/
│           └── expense.types.ts
│
├── lib/
│   ├── line/
│   │   └── client.ts                 # LINE Bot SDK初期化
│   └── db/
│       ├── schema.ts                 # Drizzle スキーマ定義
│       ├── client.ts                 # DB接続クライアント
│       └── migrations/
│
├── config/
│   └── env.ts                        # 環境変数バリデーション（zod）
│
└── shared/
    └── components/
        └── liff-provider.tsx         # LIFF SDK初期化Provider
```

---

## 環境変数

```bash
# .env.local

# LINE Messaging API
# 取得元: LINE Developers > Messaging APIチャンネル
LINE_CHANNEL_ACCESS_TOKEN=   # Messaging API設定タブ > チャンネルアクセストークン
LINE_CHANNEL_SECRET=         # チャンネル基本設定タブ > Channel secret

# LIFF
# 取得元: LINE Developers > LINEログインチャンネル > LIFFタブ
NEXT_PUBLIC_LIFF_ID=         # LIFF ID（クライアントから参照するためNEXT_PUBLIC必須）

# Supabase
# 取得元: Supabase > Project Settings > Database > Connection string (Transaction)
DATABASE_URL=
```

---

## LINE Developers 構成

```
プロバイダー（開発者名）
├── Messaging APIチャンネル  ← Botのメッセージ処理
│       └── Channel Access Token
│       └── Channel Secret
│       └── Webhook URL: https://your-app.vercel.app/api/line/webhook
│
└── LINEログインチャンネル   ← LIFFのホスト
        └── LIFFアプリ
                └── LIFF ID
                └── Endpoint URL: https://your-app.vercel.app/liff/register
```

---

## セットアップ手順

### 1. 外部サービスの準備

```
① LINE Developers
   └─ プロバイダー作成
   └─ Messaging APIチャンネル作成 → Token / Secret 取得
   └─ LINEログインチャンネル作成 → LIFFアプリ追加 → LIFF ID 取得

② Supabase
   └─ プロジェクト作成 → DATABASE_URL 取得

③ Vercel
   └─ アカウント作成
```

### 2. プロジェクト作成

```bash
npx create-next-app@latest walli-pay-line \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd walli-pay-line

# 依存パッケージ
npm install @line/bot-sdk @line/liff drizzle-orm postgres
npm install @supabase/supabase-js zod

# 開発用
npm install -D drizzle-kit

# Shadcn UI
npx shadcn@latest init
npx shadcn@latest add button input label card select
```

### 3. Nodeバージョン固定

```bash
# .node-version
22.12.0
```

### 4. DB マイグレーション

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 5. デプロイ & Webhook設定

```bash
# Vercelにデプロイ
npx vercel deploy

# デプロイ後にLINE DevelopersのWebhook URLを更新
# https://your-app.vercel.app/api/line/webhook
```

---

## 開発の進め方（推奨順序）

```
Step 1: DB スキーマ定義 → マイグレーション実行
Step 2: Webhookエンドポイント作成 → ngrokでローカルテスト
Step 3: 「登録」「表示」「精算」コマンドの実装
Step 4: LIFF画面（金額入力フォーム）実装
Step 5: 貪欲法による精算計算ロジック実装
Step 6: Flex Messageで支払い状況を表示
Step 7: Vercelデプロイ → LINE Webhook本番設定
```

> **ローカルテストについて**
> LINE WebhookはHTTPSが必須のため、ローカル開発時は `ngrok` を使用する。
> `npx ngrok http 3000` でトンネルを起動し、発行されたURLをWebhook URLに一時設定する。
