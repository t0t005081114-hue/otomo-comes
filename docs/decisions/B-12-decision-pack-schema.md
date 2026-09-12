# B-12 Decision Pack v1 JSON Schema決定

Status: Accepted v1.1
Decision ID: B-12

## 結論

Decision PackはMarkdownではなく**構造化JSONを正本**とし、`schema_version = "1.0"` を持つ。

人間向けMarkdown、Google Drive出力、将来のLLM API入力はこのJSONから生成する。

B-24との根拠参照互換性を保つため、Evidence Refは以下の意味に統一する。

- `source_type` = その根拠が**何の情報か**
- `source_system` = その根拠が**どのシステム・入力元から来たか**

`crm` や `drive` のようなシステム名を `source_type` に入れない。

## Top Level

```json
{
  "schema_version": "1.0",
  "date": "2026-09-12",
  "manager_id": "uuid",
  "generated_at": "2026-09-12T19:00:00+09:00",
  "generation_status": "success",
  "source_status": {},
  "summary": {},
  "kpi_alerts": [],
  "anomalies": [],
  "bottlenecks": [],
  "manager_workload": {},
  "delegation_candidates": [],
  "follow_up_candidates": [],
  "praise_candidates": [],
  "systemization_candidates": [],
  "management_questions": []
}
```

## 必須項目

- `schema_version`
- `date`
- `manager_id`
- `generated_at`
- `generation_status`
- `source_status`
- 各候補配列

候補が0件の場合は `[]` とし、項目自体を省略しない。

## generation_status

- `success`
- `partial`
- `failed`

`failed` の場合も、取得できたsource statusとfailure reasonを残せる構造にする。

## source_status

各入力元の取得状態を保持する。

例:

```json
{
  "crm": {
    "status": "complete",
    "captured_at": "2026-09-12T19:00:05+09:00"
  },
  "one_on_one": {
    "status": "partial",
    "captured_at": "2026-09-12T19:00:08+09:00"
  },
  "manager_observation": {
    "status": "complete",
    "captured_at": "2026-09-12T19:00:09+09:00"
  }
}
```

## KPI Alert

最低限:

- `kpi_definition_id`
- `person_id` nullable
- `label`
- `actual_value`
- `target_value`
- `achievement_rate` nullable
- `evaluation_status`
- `consecutive_miss_count`
- `evidence_refs`
- `data_status`

## Bottleneck

最低限:

- `bottleneck_id`
- `work_item_id` nullable
- `person_id` nullable
- `category`
- `elapsed_business_time`
- `reason`
- `is_external_wait`
- `needs_confirmation`
- `evidence_refs`

## Delegation Candidate

最低限:

- `delegation_candidate_id`
- `work_item_id` nullable
- `work_label`
- `candidate_person_id` nullable
- `classification`
- `answer_clarity`
- `repeatability`
- `failure_risk`
- `candidate_proficiency`
- `evidence_refs`
- `data_status`

## Follow-up Candidate

最低限:

- `person_id`
- `reason_summary`
- `observed_facts`
- `one_on_one_context`
- `work_context`
- `questions_to_confirm`
- `evidence_refs`
- `data_status`

## Praise Candidate

最低限:

- `person_id`
- `observed_behavior`
- `change_summary` nullable
- `process_to_praise`
- `timing_hint` nullable
- `evidence_refs`
- `data_status`

## Systemization Candidate

最低限:

- `work_type_key` nullable
- `work_label`
- `repeat_count` nullable
- `person_dependency`
- `suggested_direction`
- `evidence_refs`
- `data_status`

`suggested_direction` は以下の候補を許容する。

- `procedure`
- `template`
- `delegation`
- `automation`
- `needs_review`

## Management Questions

AI上司 / 人間に判断してほしい論点。

最低限:

- `question_id`
- `topic`
- `question`
- `related_refs`
- `priority`

## Evidence Ref

全候補は可能な限り根拠へ追跡可能にする。

共通形:

```json
{
  "source_type": "work_item",
  "source_system": "crm",
  "source_id": "case_123",
  "label": "A案件"
}
```

### source_type

`source_type` は情報の意味種類を表す。B-24と共通で次を基本とする。

- `kpi_result`
- `work_item`
- `work_event`
- `daily_work_log`
- `one_on_one`
- `manager_observation`
- `bottleneck`
- `delegation_candidate`
- `decision_pack_note`

### source_system

`source_system` は取得元・生成元を表す文字列とする。会社ごとのAdapter追加を阻害しないよう固定enumにはしない。

例:

- `crm`
- `drive`
- `comes`
- `manual`
- `google_calendar`
- `outlook`

原則:

- `source_type` に `crm` / `drive` 等を入れない。
- `source_system` に `work_item` / `kpi_result` 等の情報種類を入れない。
- `source_id` は、その `source_system` 内で追跡可能な識別子を使う。
- `label` は人間が根拠を確認するための短い表示名とする。

## B-24への受け渡し

Decision PackのEvidence RefをAIへ渡す際、`source_type / source_system / source_id / label` を保持する。

AIは根拠の意味種類を勝手に別種類へ変換しない。複数の根拠を統合して新たなCOMES候補を参照する場合のみ、`bottleneck` や `delegation_candidate` 等のCOMES側レコードを根拠として返してよい。

## 禁止事項

- Markdownを正本にしない
- LLM向け自然文だけを正本にしない
- 根拠不明の候補を確定事実として出さない
- 欠損値を0へ変換しない
- システム名と情報種類を同じフィールドに混在させない

## Acceptance

- schema versionを定義
- Top Levelを定義
- 必須項目を定義
- 各主要候補の最小構造を定義
- source statusを定義
- evidence trackingを定義
- MarkdownとJSON正本を分離
- `source_type` と `source_system` の責務を分離
- B-24へ根拠参照を変換なしで受け渡せる