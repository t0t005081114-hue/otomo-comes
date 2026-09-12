# B-32 DBスキーマ整合拡張

Status: Accepted
Decision ID: B-32

## 1. 目的

B-02の基本原則を維持したまま、後発のB-10 / B-23 / B-24 / B-26で確定した責務をDBへ保存できるようにする。

B-02は基礎スキーマとして有効とし、本Decisionが競合箇所を上書きする。

---

## 2. 1on1構造化情報

`one_on_one_insights` は個人MVPでも利用する。

B-10に従い、ChatGPTが明示指定されたDrive上の1on1原文から生成した候補を、人間が確認した後にのみ保存する。

既存項目に加えて以下を保持する。

- `origin_type` enum(manual, chatgpt_drive, ai_adapter)
- `generated_by` text nullable
- `confirmed_by_user_id` uuid nullable FK -> profiles.user_id
- `confirmed_at` timestamptz nullable
- `created_at` timestamptz

原則:
- ChatGPT生成候補を未確認のまま正式Insightとして保存しない。
- `origin_type = chatgpt_drive` の場合、`confirmed_by_user_id` と `confirmed_at` を必須とする。
- 1on1原文本文はDBへ保存しない。B-19どおりDriveを正本とする。
- B-02の「one_on_one_insightsが空でも原文参照だけでMVP成立」という旧記述は、日次AI分析に1on1文脈を利用する場合には適用しない。

---

## 3. AI Analysis Result

B-24準拠のAI分析結果を保持するため `ai_analysis_results` を追加する。

### ai_analysis_results

- `id` uuid PK
- `organization_id` uuid FK
- `decision_pack_id` uuid FK
- `schema_version` text
- `analysis_date` date
- `generated_at` timestamptz
- `management_focus_type` text
- `management_focus_summary` text
- `kpi_allocation_comment` text
- `payload` jsonb
- `imported_at` timestamptz
- `is_current_for_date` boolean default true
- `created_at` timestamptz

原則:
- B-24 JSON Schema validationとReferential Validationを通過した結果だけ保存する。
- 同日再取込時も旧結果を削除せず履歴保持する。
- HOMEはB-30に従い、翌朝時点で取込済みの基準結果を固定利用する。

---

## 4. AI Proposal状態

B-24の `accepted / held / rejected` を保持するため `ai_proposals` を追加する。

### ai_proposals

- `id` uuid PK
- `organization_id` uuid FK
- `ai_analysis_result_id` uuid FK
- `action_index` integer
- `action_type` text
- `payload` jsonb
- `status` enum(accepted, held, rejected)
- `decided_by_user_id` uuid nullable FK -> profiles.user_id
- `decided_at` timestamptz nullable
- `task_work_item_id` uuid nullable FK -> work_items.id
- `created_at` timestamptz

Unique候補:
- `(ai_analysis_result_id, action_index)`

原則:
- 採用時は即時タスク化し、`task_work_item_id` を紐付ける。
- 見送りは削除せず履歴保持する。

---

## 5. AI提案から作成されたタスク

B-02 `work_items` に以下を追加する。

- `origin_type` enum(manual, ai_proposal, imported) default manual
- `origin_ai_proposal_id` uuid nullable FK -> ai_proposals.id
- `recommended_action` text nullable
- `expected_outcome` text nullable
- `success_criteria` text nullable
- `estimated_minutes` integer nullable
- `ai_source_refs` jsonb nullable
- `human_notes` text nullable

原則:
- AI生成内容と人間の追記を分離する。
- `origin_type = ai_proposal` の場合は `origin_ai_proposal_id` を保持する。
- `estimated_minutes` がnullでもタスクは有効とする。

---

## 6. Decision Pack Human Adjustment / Audit

B-23の追加・除外・補足・優先度変更を監査可能にするため `decision_pack_adjustments` を追加する。

### decision_pack_adjustments

- `id` uuid PK
- `organization_id` uuid FK
- `decision_pack_id` uuid FK
- `revision` integer
- `operation_type` enum(add, exclude, supplement, priority_override)
- `target_ref` text nullable
- `payload` jsonb
- `edited_by_user_id` uuid FK -> profiles.user_id
- `edited_at` timestamptz

原則:
- Source Fact自体は変更しない。
- Adjustmentは追記型とする。
- priority/exclude履歴をEvidence Refへ混在させない。

---

## 7. Schedule Event

B-26のHOME / Calendarを支える共通予定モデルとして `schedule_events` を追加する。

### schedule_events

- `id` uuid PK
- `organization_id` uuid FK
- `manager_person_id` uuid FK
- `start_at` timestamptz
- `end_at` timestamptz nullable
- `title` text
- `event_type` text nullable
- `related_person_ids` uuid[] nullable
- `source_system` text
- `external_source_id` text nullable
- `is_fixed` boolean default false
- `is_read_only` boolean default false
- `created_at` timestamptz
- `updated_at` timestamptz

Unique候補:
- `(organization_id, source_system, external_source_id)` when external_source_id is not null

原則:
- COMES手入力予定は編集可能。
- 外部連携予定は原則read-only。
- 特定カレンダー製品の構造をCoreへ持ち込まない。

---

## 8. Referential Validation

B-24に従い、AI取込時はJSON Schema validationに加えて根拠参照の実在確認を行う。

最低条件:
- `source_refs` が対象Decision Pack内のEvidence Refと一致する、または
- `source_system = comes` の場合は対応するCOMESレコードが実在する。

解決不能な `source_id` を含むAI結果は保存しない。

---

## 9. Current State / History分類の追加

### Current State

既存B-02に加えて:
- `work_items`（AI task拡張込み）
- `schedule_events`

### History / Event / Snapshot

既存B-02に加えて:
- `one_on_one_insights`（確認情報追加）
- `decision_pack_adjustments`
- `ai_analysis_results`
- `ai_proposals`

---

## 10. 優先順位

競合時は以下を優先する。

1. B-32
2. B-24 / B-23 / B-10 / B-26の各責務専用Decision
3. B-02の旧記述

---

## Acceptance

- 1on1構造化情報のAI由来・人間確認を追跡できる
- AI分析結果を履歴保存できる
- AI Proposalの採用 / 保留 / 見送りを保存できる
- AI提案からタスクへ必要情報を引き継げる
- Decision Pack補正履歴を監査できる
- Schedule Eventを保存できる
- AI根拠参照の実在検証をDB境界で行える
- B-02の基本原則を崩さず後発Decisionと整合する
