---
description: Supabase/Postgres schema・migration・organization境界のルール。migrationやDB Adapterを触るとき必ず守る。
paths:
  - "supabase/**"
  - "**/*.sql"
  - "src/**/database/**"
  - "src/**/db/**"
  - "src/**/migrations/**"
  - "tests/integration/**"
---

# Database rules

正本の優先順位（B-41 §8）:

**B-41 v1.5 > B-46 / B-45 / B-44 / B-43 / B-42 / B-40 / B-39 / B-37 / B-36 / B-35 / B-34 / B-33 > B-32 v1.3 > B-02**

詳細は `docs/DEVELOPMENT_STANDARDS.md` §3。

## migration

- `supabase/migrations/` のSQL履歴が正本。
- 1 migration = 1論理変更。**原子的**に適用できる形にする。部分適用で壊れる構成にしない。
- **適用済みmigrationを書き換えない。** 訂正は新しいmigrationを足す。
- destructive change（DROP / 型変更 / NOT NULL追加 / UNIQUE追加 / データ移行）はファイル先頭コメントで明示し、**人間承認を得る**。
- migration失敗は `docs/DECISIONS_AND_FAILURES.md` に記録する。

## 型

- 日付のみ → `date`（`work_items.due_date`、`home_item_deferrals.defer_date`）
- 時刻込み → `timestamptz`
- `due_date`（日付）と `due_at`（日時）を混同しない。AI契約は `due_date` までしか返さないので、任意時刻を補って `due_at` へ変換しない（B-24 / B-32）。
- 表示上の基準日は `organization.timezone` のローカル日付。`due_at` をUTC日付のまま分類しない（B-43）。

## 整合

- 全業務テーブルに `organization_id`（B-02）。
- 人物は `people.id`。認証ユーザー `profiles.user_id` / `auth.users.id` と混同しない（B-02 / B-18）。
- 表示名（`assignee_name` / `related_person_names` / `label`）を正本IDや同一性判定キーにしない。
- 現在状態テーブルと履歴/イベントテーブルを分ける（B-02 §14 / B-32 §11 / B-41 §7）。
  - Current State: `work_items`, `work_item_related_people`, `schedule_events`, `home_daily_ai_baselines`, `home_item_deferrals`
  - History / Event: `one_on_one_insights`, `decision_pack_adjustments`, `ai_analysis_results`, `ai_proposals`, `management_action_receipts`
- JSONBは外部payload / evidence配列 / Decision Pack payload / source statusのみ。人物・KPI・タスク・組織関係をJSONBに閉じ込めない（B-02 §15）。
- 物理削除しない。状態遷移で表す（B-02 §16）。
- `0` と `null` を区別する。欠損を0にしない（B-03 §9 / B-13）。

## B-41で追加された2テーブル

### home_item_deferrals（当日HOME表示だけのdefer）

- unique制約はPostgreSQLの `UNIQUE NULLS NOT DISTINCT` を使う（`subject_person_id` がnullでも重複を防ぐため）。
- `work_items.status = waiting` で代用しない。
- B-34の `home_task_deferrals` は本テーブルへ一般化済み。別テーブルを二重実装しない。

### management_action_receipts（実施済み管理行動の追記履歴）

- 追記型。元データを置換しない。
- `evidence_fingerprint` はB-36 §evidence_fingerprintのcanonical手順（`source_type|source_system|source_id` に正規化 → 重複除去 → code point昇順sort → `\n` 連結 → SHA-256 → 小文字hex64）。`label` を含めない。
- Evidence Refが0件の候補ではfingerprintを生成せず、再掲抑制の自動対象にしない。
- 同一操作の二重実行を防ぐ（`request_id` が使える場合は同一requestとして扱う）。

## organization境界

全クエリをorganizationでスコープする。越境joinを書かない。
Service Role前提のアクセス設計をUIに持ち込まない（B-02 §17）。

## 勝手に作らないもの（B-02 §18）

汎用Event Sourcing基盤 / 複雑なTeam階層テーブル / KPIツリー / 汎用Workflow Engine /
汎用Source Registry / Vector DB / AI Embedding保存 / 人物モチベーションスコア。

必要だと判断した場合はDecisionを人間へ提案してから。
