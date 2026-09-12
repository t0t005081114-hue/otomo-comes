# B-12 Decision Pack v1 JSON Schema決定

Status: Accepted
Decision ID: B-12

## 結論

Decision PackはMarkdownではなく**構造化JSONを正本**とし、`schema_version = "1.0"` を持つ。

人間向けMarkdown、Google Drive出力、将来のLLM API入力はこのJSONから生成する。

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
  "source_type": "crm",
  "source_id": "...",
  "source_label": "..."
}
```

`source_type` 例:

- `crm`
- `one_on_one`
- `manager_observation`
- `work_event`
- `kpi_result`
- `manual`

## 禁止事項

- Markdownを正本にしない
- LLM向け自然文だけを正本にしない
- 根拠不明の候補を確定事実として出さない
- 欠損値を0へ変換しない

## Acceptance

B-12は以下を満たすため解決とする。

- schema versionを定義
- Top Levelを定義
- 必須項目を定義
- 各主要候補の最小構造を定義
- source statusを定義
- evidence trackingを定義
- MarkdownとJSON正本を分離
