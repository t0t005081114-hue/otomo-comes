# OTOMO COMES Product Rules

Status: Product-specific Harness rule. Product仕様そのものではなく、formal spec / Accepted Decisionが優先する。

共通のRole Separation、Scope Discipline、Phase Workflow、Risk Classification、Independent Review、Failure schemaはOTOMO COREを参照し、本書ではCOMES固有の実装不変条件だけを定義する。

## 1. Architecture

層構成（B-01）:

```text
UI / API (src/app)
  ↓
Application (src/application)
  ↓
Core (src/core)
  ↓
Port / Interface
  ↓
Adapter (src/adapters)
```

想定: `src/app`, `src/application`, `src/core`, `src/adapters/{database,company-crm,google-drive,obsidian,ai}`, `src/schemas`, `src/shared`。

- `src/core/**` から Next.js / Supabase / Google SDK / CRM client / LLM SDKを直接importしない。Coreが外部を必要とする場合はPort interfaceを定義しAdapterが実装する（B-01）
- 外部サービス固有の型・ID・レスポンス構造をCoreへ露出させない（B-01 / B-03 / B-08）
- 会社CRMの内部table / column / status設計をCoreへ持ち込まない（B-03）
- 企業固有の意味判断をCore共通ruleにしない（B-25）
- Google Drive / Obsidian出力は補助Harnessであり、その失敗だけでCore処理成功を無効化しない（B-15 / spec §18 §20）
- GitHub Actionsはbatch entrypointを呼ぶだけとしbusiness logicを書かない（B-01 / B-14）
- 外部サービスIDをCore主キーにしない（B-02）
- CRMはGET only。書き戻し・webhook・DB直接接続を実装しない（B-03）

## 2. TypeScript / Boundary

- `strict: true` / `strictNullChecks` を維持する
- `any`を使わない。外部由来の未知値は`unknown`で受け境界validation後に型確定する
- `as`による型assertionでruntime validationを代替しない
- 未信頼境界: CRM Read API、Google Drive / Meet metadata、外部AI JSON、HTTP body/query/route params、環境変数
- 境界はZodでruntime validationし、未validation値をApplication / Coreへ渡さない（B-01）
- DB accessはgenerated TypeScript typesを使う。MVPでORMを導入しない（B-01）
- enum相当値は仕様で定義済みのものだけを使い、実装判断で値を増やさない

## 3. Database

正本: Supabase PostgreSQL（B-01 / B-02）。Schema優先順位はB-41 §8に従う。

### Migration

- `supabase/migrations/` のSQL履歴を正本とする
- 1 migration = 1 logical changeとして原子的に扱う
- 適用済みmigrationを書き換えず、訂正は新規migrationで行う
- destructive change（DROP / type change / NOT NULL / UNIQUE / data migration等）は明示しHuman Decisionへ戻す
- migration failureは`docs/DECISIONS_AND_FAILURES.md`へ記録する

### Type / integrity

- 日付のみは`date`、時刻込みは`timestamptz`
- `due_date`と`due_at`を混同せず、AIの`due_date`へ任意時刻を補って`due_at`化しない（B-24 / B-32）
- 表示基準日は`organization.timezone`のlocal dateで評価する（B-43）
- 全業務tableに`organization_id`を持たせる（B-02）
- 人物参照は`people.id` (UUID)を使い、auth user idと混同しない（B-02 / B-18）
- `assignee_name` / `related_person_names` / `label`等の表示名を正本IDや同一性判定keyにしない（B-24 / B-36 / B-40）
- current stateとhistory / eventを分離する（B-02 / B-32 / B-41）
- JSONBは外部payload / evidence / Decision Pack / source status等に限定し、人物・KPI・Task・organization関係を閉じ込めない（B-02）
- MVPでは物理削除を基本とせず、仕様定義済みの状態遷移を用いる（B-02）
- `0`と`null`を区別し、欠損を0へ変換しない（B-03 / B-13）
- query / joinはorganization境界を越えない
- Service Role前提のaccess設計をUIへ持ち込まない（B-02）

## 4. Security / Sensitive Data

### Logs / errors

出してよい例:

`request_id / run_id / source_type / source_system / record_count / status / error_code / duration_ms / retry_count / person_resolution_status / pack_date / revision`

出さない:

- 1on1原文
- 1on1要約本文
- Manager Observation本文（`observed_fact` / `manager_impression`）
- Google OAuth access / refresh token
- CRM Service Token / Authorization header
- 外部API response全文
- 不要な顧客・社員個人情報

error messageへ原文・secretを連結しない。外部SDK例外はlog前にsanitizeする。

### Secrets

- API key / service-account key / tokenをcommitしない（B-01 / B-08）
- `.env`はGit管理外、`.env.example`のみ値なしで管理する
- refresh tokenはSecret Storeへ置く
- GitHub Actions内でinteractive OAuth認可を行わない（B-08）

### Authorization

- `organization membership × role × reporting relationship × data sensitivity`を組み合わせて判定する（B-18 / B-19）
- `owner`だから無条件全閲覧可、のような実装をしない
- UI表示制御だけに認可を依存させずAPI / Application層でも判定する
- 1on1原文と要約の閲覧権限を分離する
- COMES権限でGoogle Drive権限を迂回しない
- 名前一致で人物・権限関係を判定しない

### Retention

- 1on1原文をCOMES DBへ保存しない。原文正本はGoogle Drive
- DBに保持するのは参照情報と確認済み要約のみ
- 1on1要約 / Manager Observation初期保持期間は365日 (`sensitive_management_retention_days = 365`)
- Decision Pack日次保持は90日（spec §19）
- retention / deletionの新判断はHuman Decision Required

## 5. AI Boundary

外部AI JSONは未信頼入力として扱い、保存前に4段Validationを全て通す（B-24 / B-25 / B-32）。

1. Schema Validation: JSON / required / enum / date / UUID / conditional required / `source_refs` non-empty / unknown property rejection
2. Identity Validation: `decision_pack_id`・人物IDの実在、同一organization、`action.assignee_person_id == decision_pack.manager_id`（B-47）
3. Evidence Referential Validation: Evidence Refまたは有効COMES recordへの参照確認。最低照合keyは`source_type + source_system + source_id`、`label`は使わない
4. Semantic Validation: B-33 / B-41に従い、`today`=analysis date、`within_week`=D+1..D+7、`not_urgent`=dueなしまたはD+7より後

Validation失敗時:

- 保存しない
- 不正内容を表示する
- silent repairしない
- LLMで再解釈 / repairしない
- 不正IDを埋めるrecordを推測生成しない
- assigneeをmanagerへ自動修正しない（B-47）

Validation通過後:

- AI結果を保存する
- proposal初期状態は`pending`（`held`扱いしない）
- Decision Packを`ai_result_imported`へ遷移する

### Evidence Ref meaning contract

- `source_type`: 根拠が何の情報か（`kpi_result` / `work_item` / `work_event` / `daily_work_log` / `one_on_one` / `manager_observation` / `bottleneck` / `delegation_candidate` / `decision_pack_note`）
- `source_system`: どのsystem / input由来か（`crm` / `drive` / `comes` / `manual` / `google_calendar` / `outlook`等）。固定enumにしない
- `source_id`: `source_system`内で追跡可能なID
- `label`: human-readable表示名。identity keyに使わない
- `source_type`へsystem名を入れず、`source_system`へ情報種類を入れない

### Human in the loop

- `pending` → `accepted` / `held` / `rejected`はHuman操作のみ
- acceptedのみTask化する
- AI出力をCOMES側でnatural-language再解釈しない
- COMESは事実・構造化・保存・検証・実行、AIは判断・分類・意味づけ・提案（B-25）
- 感情 / 性格 / モチベーション / 能力スコアを推測・数値化しない
- `data_status != known`を確定事実として扱わず、`source_missing`を0や本人の失敗へ解釈しない（B-13）

## 6. B-04 / B-09 Gate

B-04 OPEN中:
- CRM → Daily Work Logの項目mapping / 集計条件を推測実装しない

B-09 OPEN中:
- Meet / Driveのfilename rule、人物特定、複数file識別を推測実装しない

共通:
- 欠損metricを0補完しない
- 取得不能項目を推測で埋めない

B-03 / B-08 / B-10等のAccepted済み領域は、B-04 / B-09依存でない範囲まで止めない。

## 7. Testing Obligations

区分:
- unit: business rule / pure logic → `tests/unit/`
- integration: DB boundary / migration constraint / transaction → `tests/integration/`
- e2e: HOME / Task / Decision Pack / AI import主要導線 → `tests/e2e/`

Unit重点対象:
- KPI達成率 / 乖離率 / 連続未達（B-05）
- 営業日ベース停滞判定 / 外部待ち除外（B-06）
- 委譲評価4軸（B-07）
- due bucket rolling 7日 / Semantic Validation（B-33）
- 期限超過display昇格（保存値非改変）（B-33 / B-43）
- manual / imported Task bucket fallback（B-43）
- evidence fingerprint決定性（B-36）
- 再掲抑制比較key（B-37）
- HOME主card割当（B-40）
- HOME期限 / priority sort null policy（B-44 / B-45）
- AI import 4段Validation（B-24）

Integration重点対象:
- organization越境防止
- `home_item_deferrals`の`UNIQUE NULLS NOT DISTINCT`（B-41）
- `management_action_receipts`冪等性（B-36 / B-41）
- HOME domain完了 + Receipt + Backing Task完了の同一transaction（B-42）
- UUID / FK参照整合

Acceptance ID (`AT-xx` / `FA-xx`) をtest名またはcommentとPhase recordへ対応付ける。BLOCKING AcceptanceにNOT TESTEDを残してPhase PASSにしない。

禁止:
- production dataをtestへ使う
- sensitive data / 実在個人情報をfixtureへ入れる
- implementationに合わせてAcceptanceを書き換える
- external CRM / Google実環境へ接続してunit testを成立させる

## 8. Claude Scoped Rules

`.claude/rules/*.md` はCOMES固有不変条件を対象ファイル編集時に強制する補助層として残す。
Accepted Decision / formal spec / 本書より上位の正本にはしない。
共通OTOMOルールを新たに複製しない。
