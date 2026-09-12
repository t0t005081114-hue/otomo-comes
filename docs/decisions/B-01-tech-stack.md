# B-01 実装技術スタック決定

Status: Accepted
Decision ID: B-01

## 結論

OTOMO COMES の MVP は、以下の技術スタックで実装する。

- Web: Next.js 16 / React 19 / TypeScript 5
- UI: Tailwind CSS v4
- Database: Supabase PostgreSQL
- DB Access: `supabase-js` + SQL Migration + generated TypeScript types
- ORM: MVPでは導入しない
- Auth: Supabase Auth
- Validation: Zod
- Deployment: Vercel
- Scheduled Batch: GitHub Actions
- Unit / Integration Test: Vitest
- E2E: Playwright（MVP受け入れテストで必要な範囲のみ）

## 採用理由

### 1. PC / Mobile Webを同一コードベースで提供できる

Next.js + React でPC向けダッシュボードとスマホ向け縦スクロールUIを同一アプリ内で実装する。

重要なのは単純な縮小レスポンシブではなく、同じデータを端末ごとに異なる情報順序で提示できること。

### 2. COMES Core と外部サービスを分離しやすい

COMES Core を純粋なTypeScriptドメイン層として保持し、CRM / Google Drive / Obsidian / AIなどの外部依存をAdapter層に隔離する。

想定境界:

```text
UI / API
  ↓
Application
  ↓
COMES Core
  ↓
Port / Interface
  ↓
Adapter
  ├─ Supabase
  ├─ Company CRM
  ├─ Google Drive / Meet
  ├─ Obsidian export
  └─ AI Analysis（将来）
```

### 3. 個人検証版と公開版を同じCoreから発展させられる

個人検証版ではLLM APIを利用せず、Decision Packを構造化データとして生成する。

検証時:

```text
COMES Core
→ Decision Pack JSON
→ Markdown / Google Drive
→ ChatGPT Scheduled Task
```

公開時:

```text
COMES Core
→ Decision Pack JSON
→ AI Analysis Adapter
→ LLM API
→ COMES UI
```

Google DriveやChatGPT Scheduled TaskはMVP検証用ハーネスであり、COMES Coreの責務に含めない。

### 4. Supabase PostgreSQLを正本DBとする

COMESは「現在状態」と「履歴」を明確に分離し、人物・KPI・タスク・観察・Decision Packを関係データとして扱う必要がある。

PostgreSQLは以下に適する。

- 関係性を持つデータモデル
- 時系列履歴
- 集計クエリ
- 将来のマルチテナント
- RLSによる組織単位のデータ分離

Obsidianは長期記憶・参照層であり、正本DBにはしない。

### 5. MVPではORMを導入しない

理由:

- SupabaseのRLS・Authとの境界を直接確認しやすい
- SQLの意図を隠さない
- 初期段階で不要な抽象化を増やさない
- generated TypeScript typesで型安全性を補える

将来、クエリ量や保守性の問題が明確になった場合のみORM導入を再評価する。

### 6. Supabase Authを最初から採用する

個人検証版は実質1ユーザーでも、公開版でマルチユーザー化することが明確なため、認証境界自体は初期から持つ。

ただし、組織・権限・RLSの詳細モデルはB-02以降で確定する。

### 7. GitHub Actionsは実行基盤でありCoreではない

個人検証版では19:00の日次処理をGitHub Actionsから起動する。

GitHub ActionsにCOMESのビジネスロジックを書かず、Actionsはアプリケーションのバッチエントリーポイントを呼ぶだけとする。

これにより、将来Cron / Queue / Workerへ移行してもCoreを変更しない。

## リポジトリ構成方針

MVPではモノレポ化しない。単一Next.jsリポジトリ内で責務を分離する。

例:

```text
src/
  app/                 # Next.js UI / Route
  application/         # Use Case / orchestration
  core/                # COMES domain logic, pure TypeScript
  adapters/
    database/
    company-crm/
    google-drive/
    obsidian/
    ai/                # interface only in personal MVP
  schemas/             # Zod / boundary schemas
  shared/

tests/
  unit/
  integration/
  e2e/

docs/
```

`core/` から Next.js / Supabase / Google / OpenAI 等を直接importしてはならない。

## AIに関する境界

個人検証版:

- LLM API: 不使用
- AI Analysis Adapter: interfaceのみ保持可
- Decision Pack生成: COMES Coreの責務
- ChatGPTでの最終分析: COMES外の検証ハーネス

OTOMO LAB公開版:

- AI Analysis Adapterを実装
- LLMプロバイダを交換可能にする
- OpenAI等のSDKをCOMES Coreへ直接依存させない

## セキュリティ原則

- RepositoryにAPI Key / Service Account Secretをcommitしない
- CRM連携は読み取り専用
- 外部入力はすべてZod等で境界検証する
- 本番データとテストデータを分離する
- 会社CRMの内部DB構造をCOMES Coreへ漏らさない

## 不採用 / 保留

### Prisma / Drizzle等のORM

MVPでは不採用。必要性が実証された時点で再評価する。

### 独自Backend Server

MVPでは不採用。Next.js + Supabaseで不足が明確になるまで追加しない。

### Turborepo等のモノレポ

MVPでは不採用。複数独立アプリ・パッケージの必要性が発生してから検討する。

### LLM API

個人検証版では不採用。公開版のAI Analysis Adapter実装時に導入する。

## Acceptance

B-01は以下を満たしたため解決とする。

- PC / Mobile Webを同一コードベースで提供可能
- GitHub Actionsによる日次処理が可能
- COMES Coreと外部Adapterの責務境界を維持可能
- 将来マルチテナントへ拡張可能
- AI Analysis Adapterを後付け可能
- 個人検証版でLLM APIなしの運用が可能
