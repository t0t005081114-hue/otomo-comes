# B-02 COMES DB 正本スキーマ決定

Status: Accepted
Decision ID: B-02

## 結論

OTOMO COMES の正本DBは Supabase PostgreSQL とし、**現在状態を表すテーブル**と**履歴・観測イベントを表すテーブル**を明確に分離する。

MVPから将来の公開版まで同じCoreモデルを使えるよう、以下を原則とする。

- すべての業務データは `organization_id` に属する
- 人物は認証ユーザーと分離する
- 現在状態は上書き可能なCurrent Stateとして保持する
- 履歴は追記型Event / Snapshotとして保持する
- 外部サービス固有IDはCOMES Coreの主キーにしない
- AI用Decision Packは構造化JSONを正本とし、Markdownは表示・受け渡し用派生物とする

---

## 1. マルチテナント境界

公開版を見据え、MVPから `organizations` を持つ。

### organizations

- `id` uuid PK
- `name` text
- `timezone` text default `Asia/Tokyo`
- `created_at` timestamptz
- `updated_at` timestamptz

個人検証版では1 organizationのみ使用する。

`organization_id` は原則として全業務テーブルに持たせる。

---

## 2. 認証ユーザーと人物の分離

### profiles

Supabase Auth `auth.users` と1対1で紐付くアプリ利用者。

- `user_id` uuid PK / FK -> auth.users.id
- `display_name` text
- `created_at` timestamptz
- `updated_at` timestamptz

### people

COMESが管理対象とする人物。アプリログイン有無とは独立する。

- `id` uuid PK
- `organization_id` uuid FK
- `auth_user_id` uuid nullable
- `name` text
- `email` text nullable
- `status` enum(active, inactive)
- `created_at` timestamptz
- `updated_at` timestamptz

理由:

- 部下や外部メンバーがCOMESへログインしないケースを扱うため
- CRM / Meet / Observation上の人物をアプリ認証状態から独立して管理するため

---

## 3. 人物名寄せ

### person_external_identities

外部サービス上のIDや別名を `people.id` に紐付ける。

- `id` uuid PK
- `organization_id` uuid FK
- `person_id` uuid FK
- `source_type` text
- `external_id` text nullable
- `external_email` text nullable
- `alias` text nullable
- `is_primary` boolean
- `created_at` timestamptz

Unique候補:

- `(organization_id, source_type, external_id)` where external_id is not null

名寄せ優先順位:

1. 外部ID
2. メール
3. 登録済みalias
4. 名前

曖昧な場合は自動確定しない。

---

## 4. 組織・役割・レポートライン

### roles

- `id` uuid PK
- `organization_id` uuid FK
- `name` text
- `description` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

### person_roles

人物と役割の履歴。

- `id` uuid PK
- `organization_id` uuid FK
- `person_id` uuid FK
- `role_id` uuid FK
- `valid_from` date
- `valid_to` date nullable

### reporting_relationships

上司・部下関係の履歴。

- `id` uuid PK
- `organization_id` uuid FK
- `manager_person_id` uuid FK
- `report_person_id` uuid FK
- `valid_from` date
- `valid_to` date nullable

現在の組織構造は `valid_to is null` から取得する。

---

## 5. Goal / KPI

### goals

現在の目標定義。

- `id` uuid PK
- `organization_id` uuid FK
- `owner_type` enum(person, team, organization)
- `owner_person_id` uuid nullable
- `title` text
- `description` text nullable
- `period_start` date
- `period_end` date
- `status` enum(active, completed, archived)
- `created_at` timestamptz
- `updated_at` timestamptz

MVPではTeamを独立テーブル化せず、必要になった時点で追加可能とする。個人・組織単位を先に扱う。

### kpi_definitions

KPIの設定値。

- `id` uuid PK
- `organization_id` uuid FK
- `goal_id` uuid nullable FK
- `owner_type` enum(person, organization)
- `owner_person_id` uuid nullable
- `name` text
- `value_type` enum(count, rate, amount, duration, score)
- `period_type` enum(daily, weekly, monthly)
- `target_value` numeric
- `warning_threshold` numeric nullable
- `critical_threshold` numeric nullable
- `consecutive_miss_limit` integer nullable
- `unit` text nullable
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

### kpi_results

KPI実績履歴。追記型。

- `id` uuid PK
- `organization_id` uuid FK
- `kpi_definition_id` uuid FK
- `person_id` uuid nullable FK
- `period_start` date
- `period_end` date
- `actual_value` numeric nullable
- `target_value_snapshot` numeric
- `source_type` text
- `source_ref` text nullable
- `captured_at` timestamptz
- `data_status` enum(known, unknown, source_missing, needs_confirmation, not_applicable)

Unique候補:

- `(kpi_definition_id, person_id, period_start, period_end, source_type)`

目標値はResult側にもsnapshotとして残し、過去のKPI評価が後日の設定変更で変わらないようにする。

---

## 6. Work / Task

### work_items

現在の仕事・案件状態。

- `id` uuid PK
- `organization_id` uuid FK
- `external_source_type` text nullable
- `external_source_id` text nullable
- `title` text
- `description` text nullable
- `assignee_person_id` uuid nullable FK
- `owner_manager_person_id` uuid nullable FK
- `status` enum(todo, in_progress, waiting, completed, cancelled)
- `priority` enum(low, medium, high, critical) nullable
- `due_at` timestamptz nullable
- `last_activity_at` timestamptz nullable
- `waiting_reason` text nullable
- `risk_level` enum(low, medium, high) nullable
- `created_at` timestamptz
- `updated_at` timestamptz

Unique候補:

- `(organization_id, external_source_type, external_source_id)` when external_source_id is not null

### work_events

仕事の履歴。追記型。

- `id` uuid PK
- `organization_id` uuid FK
- `work_item_id` uuid FK
- `event_type` text
- `actor_person_id` uuid nullable FK
- `from_status` text nullable
- `to_status` text nullable
- `payload` jsonb
- `source_type` text
- `source_ref` text nullable
- `occurred_at` timestamptz
- `created_at` timestamptz

これにより現在状態と変化履歴を分離する。

---

## 7. Daily Work Log

### daily_work_logs

人物ごとの日次集計ヘッダ。

- `id` uuid PK
- `organization_id` uuid FK
- `person_id` uuid FK
- `work_date` date
- `source_type` text
- `generated_at` timestamptz
- `source_status` enum(complete, partial, missing)
- `notes` text nullable

Unique:

- `(organization_id, person_id, work_date, source_type)`

### daily_work_log_metrics

固定項目と会社固有項目を同じ構造で扱う。

- `id` uuid PK
- `organization_id` uuid FK
- `daily_work_log_id` uuid FK
- `metric_key` text
- `metric_label` text
- `value_numeric` numeric nullable
- `value_text` text nullable
- `unit` text nullable
- `data_status` enum(known, unknown, source_missing, needs_confirmation, not_applicable)
- `source_ref` text nullable

標準 `metric_key` 例:

- `handled_count`
- `completed_count`
- `carryover_count`
- `self_handled_count`
- `delegated_count`
- `returned_count`
- `trouble_count`
- `stagnant_count`

会社固有KPIは `kpi_results` を正本とし、Daily Work Logでは必要に応じて表示用参照にとどめる。

### daily_work_log_highlights

件数だけでは落ちる重要案件・例外。

- `id` uuid PK
- `organization_id` uuid FK
- `daily_work_log_id` uuid FK
- `work_item_id` uuid nullable FK
- `category` enum(important, trouble, stagnation, exception)
- `summary` text
- `source_ref` text nullable

---

## 8. 1on1 Log

### one_on_one_logs

1on1単位の正本。

- `id` uuid PK
- `organization_id` uuid FK
- `manager_person_id` uuid FK
- `subject_person_id` uuid FK
- `held_at` timestamptz
- `source_type` text
- `source_file_id` text nullable
- `source_file_name` text nullable
- `source_modified_at` timestamptz nullable
- `raw_text_ref` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

原文そのものをDBへ保持するか、Drive参照のみとするかはB-19で確定する。

### one_on_one_insights

構造化された観測。AI断定ではなく発言・確認事項として扱う。

- `id` uuid PK
- `organization_id` uuid FK
- `one_on_one_log_id` uuid FK
- `insight_type` enum(concern, success, confidence, anxiety, workload, delegation_request, support_request, change, ongoing_issue, next_check)
- `summary` text
- `evidence_text` text nullable
- `data_status` enum(known, needs_confirmation)
- `created_at` timestamptz

MVPではこのテーブルが空でも `one_on_one_logs` 原文参照だけで成立する。

---

## 9. Manager Observation

### manager_observations

追記型観察ログ。

- `id` uuid PK
- `organization_id` uuid FK
- `observer_person_id` uuid FK
- `subject_person_id` uuid FK
- `work_item_id` uuid nullable FK
- `observation_type` enum(growth, follow_up, delegation, praise, bottleneck)
- `observed_fact` text
- `manager_impression` text nullable
- `next_check` text nullable
- `observed_at` timestamptz
- `source_type` enum(web_text, device_voice_input, imported)
- `created_at` timestamptz

`observed_fact` と `manager_impression` を混在させない。

---

## 10. Bottleneck

### bottlenecks

COMESが管理する現在のボトルネック候補。

- `id` uuid PK
- `organization_id` uuid FK
- `work_item_id` uuid nullable FK
- `person_id` uuid nullable FK
- `category` enum(self_work, other_person_wait, manager_approval_wait, customer_wait, information_missing, priority_unclear, person_dependency, rework, workload_concentration, unknown)
- `status` enum(open, resolved, dismissed)
- `started_at` timestamptz nullable
- `resolved_at` timestamptz nullable
- `evidence` jsonb
- `needs_confirmation` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

### bottleneck_events

履歴追跡が必要になった場合のイベント。

- `id` uuid PK
- `organization_id` uuid FK
- `bottleneck_id` uuid FK
- `event_type` text
- `payload` jsonb
- `occurred_at` timestamptz

MVPでは `bottlenecks` の状態履歴で不足が確認された場合に実装してもよい。論理モデルとしてはイベント分離を許容する。

---

## 11. Delegation Candidate

### delegation_candidates

委譲の最終判断ではなく候補を保持する。

- `id` uuid PK
- `organization_id` uuid FK
- `work_item_id` uuid nullable FK
- `work_type_key` text nullable
- `manager_person_id` uuid FK
- `candidate_person_id` uuid nullable FK
- `classification` enum(full_delegation, review_required, manager_keeps)
- `answer_clarity` enum(low, medium, high, unknown)
- `repeatability` enum(low, medium, high, unknown)
- `failure_risk` enum(low, medium, high, unknown)
- `candidate_proficiency` enum(low, medium, high, unknown)
- `evidence` jsonb
- `status` enum(candidate, accepted, rejected, expired)
- `generated_at` timestamptz
- `decided_at` timestamptz nullable

AIによる推測値をMVPの必須入力にしない。

---

## 12. Decision Pack

### decision_packs

日次判断パックの正本。

- `id` uuid PK
- `organization_id` uuid FK
- `manager_person_id` uuid FK
- `pack_date` date
- `schema_version` text
- `generated_at` timestamptz
- `generation_status` enum(success, partial, failed)
- `source_status` jsonb
- `payload` jsonb
- `revision` integer default 1
- `is_current` boolean default true
- `created_at` timestamptz

Unique候補:

- `(organization_id, manager_person_id, pack_date, revision)`

同日再生成時は旧版を消さず、`is_current=false` として履歴を保持する。

`payload` は B-12 でJSON Schemaを正式化する。

Markdown / Google Drive出力は `payload` から生成する派生物であり正本ではない。

---

## 13. Provenance / Source Tracking

MVPでは外部入力の根拠追跡を必須とする。

各主要履歴テーブルは可能な限り以下を保持する。

- `source_type`
- `source_ref`
- `captured_at` または `occurred_at`
- `data_status`

これにより、AI上司へ「事実」「不明」「取得元欠損」を分けて渡せる。

共通Sourceテーブルの導入はMVPでは行わない。重複が顕著になった場合のみ再評価する。

---

## 14. 現在状態と履歴の境界

### Current State

- organizations
- profiles
- people
- roles
- work_items
- goals
- kpi_definitions
- bottlenecks
- delegation_candidates

### History / Event / Snapshot

- person_roles
- reporting_relationships
- person_external_identities
- kpi_results
- work_events
- daily_work_logs
- daily_work_log_metrics
- daily_work_log_highlights
- one_on_one_logs
- one_on_one_insights
- manager_observations
- decision_packs

原則:

- 「今どうなっているか」はCurrent State
- 「いつ何が起きたか」はHistory / Event
- 現在値を知るために過去ログを毎回再計算する設計にしない
- 過去の判断根拠を失う上書き更新をしない

---

## 15. JSONBの使用方針

JSONBは以下に限定する。

- 外部入力由来の補足payload
- 証拠・根拠配列
- Decision Pack payload
- Source Status

人物、KPI、タスク、組織関係など検索・結合が主要用途のデータをJSONBだけに閉じ込めない。

---

## 16. 削除・保持方針

MVPでは物理削除を原則行わない。

- マスタ系: inactive / archived
- Candidate系: rejected / expired
- Bottleneck: resolved / dismissed
- Decision Pack: revision保持

機微情報の具体的な保持・削除期間はB-19で確定する。

---

## 17. RLS / Security Boundary

B-01でSupabase Auth採用済みのため、公開版を阻害しないよう全業務データに `organization_id` を持つ。

MVPのRLS詳細はB-18で確定するが、以下を前提とする。

- `auth_user_id` と `people.id` を混同しない
- organization membership経由でアクセス制御可能な構造にする
- Service Roleのみを前提としたUIアクセス設計にしない

必要に応じて後続で `organization_memberships` を追加する。

---

## 18. MVPで意図的に持たないもの

以下は現時点で過剰設計として見送る。

- 汎用Event Sourcing基盤
- 複雑なTeam階層テーブル
- KPIツリー / KPI依存グラフ
- 汎用Workflow Engine
- 汎用Source Registry
- Vector DB
- AI Embedding保存
- 人物のモチベーションスコア

必要性が実運用で確認された場合のみ追加する。

---

## 19. Acceptance

B-02は以下を満たしたため解決とする。

- Person / Role / Reporting Relation / Goal / KPI / Work / Daily Work Log / 1on1 / Observation / Bottleneck / Delegation / Decision Packの永続化単位を定義
- Current StateとHistory / Eventを分離
- 人物と認証ユーザーを分離
- 外部サービスIDをCore主キーにしない
- 将来のマルチテナントを阻害しない `organization_id` 境界を確保
- Decision Pack JSONを正本として保持可能
- Obsidian / Drive / ChatGPT等を正本DBから分離
- MVPで不要な汎用基盤を過剰実装しない

次工程では、この論理スキーマを基準にB-03以降の外部契約とB-12のDecision Pack JSON Schemaを確定する。
