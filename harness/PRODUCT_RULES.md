# OTOMO COMES Product Rules

Status: Product-specific Harness rule.
製品仕様そのものではない。仕様・Accepted Decisionが優先する。

共通の開発標準・Phase Workflow・Independent ReviewはOTOMO COREを参照し、本書ではCOMES固有差分だけを定義する。

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

- `src/core/**` から Next.js / Supabase / Google SDK / CRM client / LLM SDKを直接importしない
- 外部サービス固有型・ID・レスポンス構造をCoreへ露出させない
- 会社CRMの内部テーブル名・列名・ステータス設計をCoreへ持ち込まない
- 外部サービスIDをCore主キーにしない
- 外部連携はAdapter境界へ隔離する
- CRMはGET only。書き戻し・webhook・DB直接接続を実装しない
- GitHub Actionsへbusiness logicを書かない

## 2. Type / Boundary

- TypeScript strictを維持する
- 外部由来入力は境界でruntime validationする
- CRM Read API、Drive / Meet metadata、外部AI JSON、HTTP input、環境変数を未信頼境界として扱う
- DB accessはgenerated TypeScript typesを使う
- MVPでORMを追加しない
- enum相当値を実装判断で増やさない

## 3. Database invariants

正本はSupabase PostgreSQLとAccepted Decision群。
Schema優先順位はB-41 §8に従う。

- `supabase/migrations/` をmigration履歴の正本とする
- 適用済みmigrationを書き換えず、訂正は新規migrationで行う
- destructive changeは明示しHuman Decisionへ戻す
- 日付のみは `date`、時刻込みは `timestamptz`
- `due_date` と `due_at` を混同しない
- 表示基準日は `organization.timezone` で評価する
- 全業務テーブルを `organization_id` で境界付ける
- 人物参照は `people.id` を使い、認証user idや表示名と混同しない
- 表示名を同一性判定キーにしない
- 現在状態と履歴 / eventを分離する
- JSONBへ人物・KPI・Task・organization関係を閉じ込めない
- MVPでは物理削除を基本とせず、仕様で定義された状態遷移を用いる
- `0` と `null` を区別し、欠損を0へ変換しない
- query / joinはorganization境界を越えない

## 4. Security / Sensitive data

ログへ出してよい情報は、run / request識別子、件数、status、error code、duration等の非機微メタデータに限定する。

ログ・error・artifactへ出さない:

- 1on1原文
- 1on1要約本文
- Manager Observation本文
- OAuth / CRM token、Authorization header
- 外部APIレスポンス全文
- 不要な個人情報

認可:

- `organization membership × role × reporting relationship × data sensitivity` を考慮する
- UI表示制御だけで認可しない
- 1on1原文と要約の閲覧権限を分離する
- COMESの権限でGoogle Drive権限を迂回しない
- 名前一致で人物や権限関係を判定しない

保持:

- 1on1原文をCOMES DBへ保存しない。原文正本はGoogle Drive
- 1on1要約 / Manager Observationの初期保持期間は365日
- Decision Pack日次保持は90日
- retention / deletionの新判断はHuman Decision Required

## 5. AI Boundary

外部AI JSONは未信頼入力として扱い、保存前に次の4段Validationを全て通す。

1. Schema Validation
2. Identity Validation
3. Evidence Referential Validation
4. Semantic Validation

主な不変条件:

- `decision_pack_id` と人物IDは取込対象organization内で実在確認する
- `action.assignee_person_id == decision_pack.manager_id`（B-47）
- Evidence Refは最低 `source_type + source_system + source_id` で照合し、`label` を同一性判定に使わない
- `due_bucket` と `due_date` の意味契約はB-33 / B-41に従う
- Validation失敗値を保存・サイレント修復・LLM再解釈しない
- 不正IDを埋めるためにレコードを推測生成しない
- AI結果通過後のproposal初期状態は `pending`
- `pending` → `accepted` / `held` / `rejected` はHuman操作のみ
- acceptedのみTask化する
- 感情・性格・モチベーション・能力スコアを推測・数値化しない
- `data_status != known` を確定事実として扱わない

## 6. B-04 / B-09 Gate

B-04が未解決の間:

- CRM → Daily Work Logの項目mapping / 集計条件を推測実装しない

B-09が未解決の間:

- Meet / Driveのファイル名規則、人物特定、複数ファイル識別を推測実装しない

共通:

- 欠損metricを0補完しない
- 取得不能項目を推測で埋めない

## 7. Testing obligations

COMES固有のbusiness ruleにはunit testを置く。特に次を重点対象とする。

- KPI達成率 / 乖離率 / 連続未達
- 営業日ベース停滞判定
- 委譲評価4軸
- due bucket / rolling 7日 / 期限超過表示
- evidence fingerprint
- 再掲抑制比較キー
- HOME主カード割当・sort policy
- AI import 4段Validation

DB境界では少なくとも次をintegration test対象とする。

- organization越境防止
- B-41のunique constraint
- management action receipt冪等性
- HOME完了処理のtransaction整合
- UUID / FK参照整合

Acceptance ID (`AT-xx` / `FA-xx`) をtest名またはコメントとPhase記録へ対応付ける。

## 8. Claude scoped rules

`.claude/rules/*.md` はCOMES固有不変条件を対象ファイル編集時に強制する補助層として残す。
本書・Accepted Decision・formal specより上位の正本にはしない。
共通OTOMOルールを新たに複製しない。
