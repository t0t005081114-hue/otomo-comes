# OTOMO COMES Development Standards

Status: Harness v0.1（製品仕様の正本ではない）

本書は実装の「書き方」の標準。**何を作るか**は仕様・Decisionが正本。
本書と正本が矛盾した場合は正本を優先し、本書の修正を人間へ提案する。

根拠は各項に Decision ID で示す。

`.claude/rules/*.md` との関係: **本書がHarness標準の正本**で、`.claude/rules/` は
対象ファイルを編集する瞬間に自動で読み込まれる強制用の抜粋。
rules側が重複して書くのは「破ると実装が壊れる不変条件」だけに限り、
一覧・理由・背景は本書に置く。標準を変えるときは本書を先に直す。

---

## 1. Architecture

### 層構成（B-01）

```
UI / API (src/app)
  ↓
Application (src/application)   … use case / orchestration / transaction境界
  ↓
Core (src/core)                 … 純粋TypeScriptのdomain logic
  ↓
Port / Interface                … Coreが定義するinterface
  ↓
Adapter (src/adapters)          … database / company-crm / google-drive / obsidian / ai
```

想定ディレクトリ（B-01）:

```
src/
  app/            Next.js UI / Route
  application/    Use Case / orchestration
  core/           domain logic, pure TypeScript
  adapters/
    database/
    company-crm/
    google-drive/
    obsidian/
    ai/           個人MVPではinterfaceのみ
  schemas/        Zod / boundary schemas
  shared/
tests/
  unit/
  integration/
  e2e/
```

### 規則

- `src/core/**` から Next.js / `supabase-js` / Google SDK / CRM client / LLM SDK を**直接importしない**（B-01）。Coreが外部を必要とする場合はCoreがPort interfaceを定義し、Adapterが実装する。
- 外部サービス固有の型・ID・レスポンス構造をCoreの型へ露出させない（B-01 / B-03 / B-08）。
- 会社CRMの内部テーブル名・列名・ステータス設計をCoreへ持ち込まない（B-03）。
- 企業固有の意味判断（代理店・上位店・重要顧客などの分類）をCoreの共通ルールにしない（B-25）。
- Google Drive出力・Obsidian出力は補助Harnessであり、失敗してもCoreの成功を無効化しない（B-15 / spec §18 §20）。
- GitHub Actionsはバッチのエントリーポイントを呼ぶだけ。ビジネスロジックを書かない（B-01 / B-14）。
- 外部サービスIDをCoreの主キーにしない（B-02）。

---

## 2. TypeScript

- `strict: true` 前提。`strictNullChecks` を緩めない。
- `any` を使わない。外部由来の未知データは `unknown` で受け、境界でvalidationして型を確定する。
- `as` による型アサーションで検証を代替しない。
- 境界（外部入力が入る場所）を明示する。境界は以下。
  - CRM Read APIレスポンス（B-03）
  - Google Drive / Meetメタデータ（B-08）
  - 外部AI JSON（B-24）
  - HTTP request body / query / route params
  - 環境変数
- 境界はZodでruntime validationする（B-01）。validationを通っていない値をApplication / Coreへ渡さない。
- DBアクセスはgenerated TypeScript typesを使う（B-01）。MVPでORMを導入しない。
- enum相当値は仕様で定義済みのものだけを使う。実装判断で値を増やさない。

---

## 3. Database

正本: Supabase PostgreSQL（B-01 / B-02）。
スキーマの優先順位: **B-41 v1.5 > B-46〜B-33の各後発Decision > B-32 v1.3 > B-02**（B-41 §8）。

### migration

- `supabase/migrations/` のSQLファイル履歴が正本。
- 1 migration = 1つの論理変更。**原子的**に扱う。途中で失敗して一部だけ適用される構成にしない。
- 適用済みmigrationを書き換えない。訂正は新しいmigrationで行う。
- destructive change（DROP / 型変更 / NOT NULL追加 / UNIQUE追加 / データ移行）はmigration先頭コメントで明示し、Phase記録にも書く。人間承認が必要。
- migration失敗は `docs/DECISIONS_AND_FAILURES.md` へ記録する。

### 型

- 日付のみの期限は `date`（`work_items.due_date`、`defer_date` 等）。
- 時刻を含む値は `timestamptz`。
- `due_date`（日付）と `due_at`（日時）を混同しない。AI契約は `due_date` までしか返さないので、任意時刻を補って `due_at` へ変換しない（B-24 / B-32）。
- 表示用の基準日は `organization.timezone` のローカル日付で計算する。`due_at` をUTC日付のまま分類しない（B-43）。

### 整合

- 全業務テーブルに `organization_id` を持たせる（B-02）。
- 人物参照は `people.id`（UUID）。認証ユーザー（`profiles.user_id` / `auth.users.id`）と人物を混同しない（B-02 / B-18）。
- 表示名（`assignee_name`、`related_person_names`、`label`）を正本IDや同一性判定キーにしない（B-24 / B-36 / B-40）。
- 現在状態テーブルと履歴/イベントテーブルを分離する（B-02 §14 / B-32 §11 / B-41 §7）。
- JSONBは外部入力payload / evidence配列 / Decision Pack payload / source statusに限定する。人物・KPI・タスク・組織関係をJSONBに閉じ込めない（B-02 §15）。
- MVPでは物理削除しない。状態遷移（inactive / archived / rejected / expired / resolved / dismissed）で表す（B-02 §16）。
- `0` と `null` を区別する。欠損を0へ変換しない（B-03 §9 / B-13）。

### organization境界

- 全クエリをorganizationでスコープする。
- 複数organizationのレコードが混ざるjoinを書かない。
- Service Role前提のアクセス設計をUIに持ち込まない（B-02 §17）。

---

## 4. Security

### ログ / エラー（B-19 / B-14 / B-03）

出してよい:

```
request_id / run_id / source_type / source_system / record_count / status
error_code / duration_ms / retry_count / person_resolution_status / pack_date / revision
```

出してはいけない:

- 1on1原文
- 1on1要約本文
- Manager Observation本文（`observed_fact` / `manager_impression`）
- Google OAuth access token / refresh token
- CRM Service Token / Authorization header
- 外部APIレスポンス全文
- 顧客・社員の不要な個人情報

エラー文へ原文・secretを連結しない。外部SDK例外はログ前にサニタイズする。

```
NG: Failed to parse transcript: <全文>
OK: Failed to parse transcript file_id=abc123 error_code=PARSE_FAILED
```

### Secret

- API key / service account key / token をリポジトリへcommitしない（B-01 / B-08）。
- `.env` はGit管理外。コミットするのは `.env.example`（値なし）のみ。
- refresh tokenはSecret Store（GitHub Actions Secrets等）に置く。
- GitHub Actions内で対話的OAuth認可を行わない（B-08）。

### 認可（B-18 / B-19）

- 権限判定を `organization membership × role × reporting relationship × data sensitivity` の組み合わせで行う。
- 「`owner` だから全て閲覧可」という実装にしない。
- 権限判定をUIの表示制御だけに依存させない。API / Application層で必ず判定する。
- 1on1原文と要約の閲覧権限を分離する。COMES上の権限でGoogle Drive権限を迂回しない。
- 名前の一致で人物・権限関係を判定しない。

### 機微データの保持（B-19）

- 1on1原文をDBへ保存しない。正本はGoogle Drive。保持するのは参照情報と確認済み要約のみ。
- 1on1要約 / Manager Observationの初期保持期間は1年（論理設定値 `sensitive_management_retention_days = 365`）。
- Decision Pack日次保持は90日（spec §19）。
- 保持期間・削除の新しい判断が必要になったら人間へエスカレーションする。

---

## 5. AI Boundary

外部AI（および将来のLLM API）から来るJSONは**未信頼入力**として扱う（B-24 / B-25 / B-32 §10）。

### 4段の検証ゲート

保存はこの4つを**全て**通過した後だけ行う。

1. **Schema Validation**（B-24 §15.1）
   JSON構文 / 必須項目 / enum / date・date-time形式 / UUID形式 / 条件付き必須 / `source_refs` 非空 / 未知プロパティ拒否。

2. **Identity Validation**（B-24 §15.2 / B-32 §10 / B-47）
   - `decision_pack_id` が取込対象Decision Packとして実在する
   - `assignee_person_id` / `related_person_ids` / `delegate_to_person_id` が `people` に実在する
   - Decision Packと全人物が取込コンテキストと同じ `organization_id`
   - `action.assignee_person_id == decision_pack.manager_id`（B-47）

3. **Evidence Referential Validation**（B-24 §15.3）
   - 各 `source_ref` が対象Decision Pack / revision内のEvidence Refに一致する、または有効なCOMESレコードとして実在する
   - 照合キーは最低 `source_type + source_system + source_id`
   - `label` は照合キーにしない

4. **Semantic Validation**（B-33 / B-41 §5）
   - `due_bucket = today` → `due_date = analysis date`
   - `due_bucket = within_week` → `due_date` が analysis date +1〜+7
   - `due_bucket = not_urgent` → `due_date` なし、または +7より後

### 失敗時（B-24 §15）

- 保存しない
- 何が不正かを表示する
- サイレント修復しない
- LLMで再解釈・修復しない
- 不正IDを埋めるためにレコードを新規作成・推測しない
- assigneeをmanagerへ自動修正しない（B-47）

### 通過後（B-24 §15 / B-32 §2）

- AI結果を保存する
- 各proposalを `pending` で作成する（`pending` を `held` として扱わない）
- Decision Packを `ai_result_imported` へ遷移させる

### Evidence Ref の意味契約（B-12 / B-24 / B-31 §9）

- `source_type` = その根拠が**何の情報か**（`kpi_result` / `work_item` / `work_event` / `daily_work_log` / `one_on_one` / `manager_observation` / `bottleneck` / `delegation_candidate` / `decision_pack_note`）
- `source_system` = **どのシステム・入力元から来たか**（`crm` / `drive` / `comes` / `manual` / `google_calendar` / `outlook` … 固定enumにしない）
- `source_id` = `source_system` 内で追跡可能な識別子
- `label` = 人間向け表示名。同一性判定に使わない
- `source_type` にシステム名を入れない / `source_system` に情報種類を入れない

### Human-in-the-loop（B-17 / B-25 / B-38）

- `pending` → `accepted` / `held` / `rejected` の遷移は人間操作のみ。
- acceptedのみTask化される。
- AI出力をCOMES側で自然言語として再解釈しない。
- COMESは事実・構造化・保存・検証・実行。AIは判断・分類・意味づけ・提案（B-25）。
- 感情 / 性格 / モチベーション / 能力スコアを推測・数値化しない（B-17 / B-19 / spec §16）。
- `data_status` が `known` 以外の値を確定事実として扱わない。`source_missing` を0・本人の失敗として解釈しない（B-13）。

---

## 6. Testing

### 区分

| 区分 | 対象 | 場所 |
|---|---|---|
| unit | business rule / 純粋ロジック | `tests/unit/` |
| integration | DB境界・migration後の制約・transaction | `tests/integration/` |
| e2e | 主要導線（HOME / Task / Decision Pack / AI import） | `tests/e2e/` |

ツールはB-01のとおり Vitest（unit / integration）、Playwright（e2e、Acceptanceで必要な範囲のみ）。

### 必ずunit testを書くbusiness rule

- KPI達成率 / 乖離率 / 連続未達判定（B-05）
- 営業日ベース停滞判定・外部待ちの除外（B-06）
- 委譲評価4軸（B-07）
- `due_bucket` のrolling 7日境界とSemantic Validation（B-33）
- 期限超過の表示昇格（保存値非改変）（B-33 / B-43）
- 手動 / imported Taskのbucket Fallback（B-43）
- evidence fingerprint生成の決定性（順序・重複・label非依存）（B-36）
- 再掲抑制の比較キー（B-37）
- HOME主カード割当（B-40）
- HOME期限ソート / 優先度ソートのnull policy（B-44 / B-45）
- AI import 4段validation（B-24）

### 必ずintegration testを書くDB境界

- `organization_id` 越境が起きないこと
- `home_item_deferrals` の `UNIQUE NULLS NOT DISTINCT` 制約（B-41）
- `management_action_receipts` の冪等性（同一操作の二重実行防止）（B-36 / B-41）
- HOMEドメイン完了 + Receipt + Backing Task完了が同一transactionであること（B-42）
- UUID参照整合 / FK制約

### Acceptanceとの対応

- test名またはコメントにAcceptance ID（`AT-xx` / `FA-xx`）を書く。

```ts
// FA-01 / B-33: within_week は基準日+1〜+7
it("FA-01 rejects within_week when due_date is outside D+1..D+7", ...)
```

- Phase記録のAcceptance表とtestが対応していること。
- BLOCKING AcceptanceにNOT TESTEDを残してPhaseをPASSにしない。

### 禁止

- 本番データをテストに使う（B-01: 本番とテストデータを分離）。
- 機微データ・実在個人情報をfixtureに入れる。
- 実装に合わせてAcceptanceを書き換える。
- 外部CRM / Google実環境へ繋いでunit testを通す（Adapterはテストdoubleで検証し、実データ依存部分はB-04 / B-09解決後）。
