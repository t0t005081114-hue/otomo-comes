# B-24 AI Analysis Result Schema

Status: Accepted v0.5
Decision ID: B-24

## 1. Purpose

This decision defines the canonical JSON contract used to import AI analysis results into OTOMO COMES.

The personal MVP does not call an LLM API from COMES. COMES exports an AI prompt, the user sends it to an external AI, and the external AI returns JSON that conforms to this schema.

The result is pasted into COMES and validated with normal JSON Schema validation. No LLM is used for interpretation, repair, or normalization during import.

Future architecture may replace the external-AI step with an internal AI Analysis Adapter and LLM API while preserving this contract.

## 2. Core flow

```text
Decision Pack
  ↓
AI prompt generation in COMES
  ↓
External AI
  ↓
Fixed JSON response
  ↓
COMES JSON Schema validation
  ↓
COMES identity / referential validation
  ↓
AI Proposal tab (`pending`)
  ↓
Human chooses Accept / Hold / Reject
  ↓
Accepted actions become tasks immediately
```

Important:
- Imported proposals start as `pending` until the human makes a decision.
- Accepting an AI proposal does not open an additional confirmation modal in MVP.
- Accepted proposals become tasks immediately.
- Corrections are made afterward in the task itself.
- Rejected proposals are hidden from the normal view but retained in history.
- Held proposals remain visible in the AI Proposal tab.

## 3. Top-level schema

Required fields:

- `schema_version`
- `date`
- `decision_pack_id`
- `generated_at`
- `management_focus_type`
- `management_focus_summary`
- `kpi_allocation_comment`
- `actions`

### 3.1 management_focus_type

Allowed values:

- `player_focus`
- `team_follow_focus`
- `delegation_focus`
- `bottleneck_focus`
- `systemization_focus`
- `mixed_focus`

`one_on_one_focus` is intentionally not defined. 1on1 is one means inside `team_follow_focus`.

### 3.2 management_focus_summary

A short human-readable sentence explaining how the playing manager should operate that day.

This is used for the HOME top `今日のモード` line and the task screen management focus.

The user does not manually edit this value in MVP.

### 3.3 kpi_allocation_comment

A short human-readable comment for the HOME lower block `今月の進捗 + AIコメント`.

Purpose:
- interpret the current self / organization KPI situation;
- explain how the manager should allocate attention today;
- avoid merely repeating KPI numbers;
- keep this separate from the top-level daily management focus summary.

Rules:
- base the comment only on KPI definitions, targets, actuals, trends, scope, and other explicit Decision Pack facts;
- do not infer KPI meaning that was not supplied;
- do not infer personality or motivation;
- keep it concise enough for the HOME cockpit.

Example:

```text
自分KPIは計画線上だがチームKPIに遅れがあるため、今日は個人数字の上積みより停滞案件のフォローへ時間を配分する。
```

## 4. Action types

Each action has exactly one `action_type`:

- `priority_task`
- `delegate`
- `follow_up`
- `praise`
- `bottleneck`
- `systemization`
- `one_on_one`

A separate `review` type is not included. Review behavior can be expressed through `recommended_action`, especially inside `delegate`.

## 5. Required action fields

Each action must include:

- `action_type`
- `title`
- `description`
- `reason`
- `assignee_person_id`
- `assignee_name`
- `due_bucket`
- `priority`
- `recommended_action`
- `expected_outcome`
- `success_criteria`
- `source_refs`

### 5.1 due_bucket

Allowed values:

- `today`
- `within_week`
- `not_urgent`

Mapping:

```text
today       → 今日やること
within_week → 1週間以内にやること
not_urgent  → 急ぎじゃない
```

### 5.2 due_date rules

- `today` → `due_date` required
- `within_week` → `due_date` required
- `not_urgent` → `due_date` optional

`due_date` is a calendar date only. It must not be converted into an arbitrary time-of-day by the AI contract.

### 5.3 priority

Allowed values:

- `high`
- `medium`
- `low`

## 6. Internal ID contract

The following fields reference canonical COMES UUID primary keys and must use UUID format in the external AI JSON:

- `decision_pack_id` → `decision_packs.id`
- `assignee_person_id` → `people.id`
- every value in `related_person_ids` → `people.id`
- `delegate_to_person_id` → `people.id`

The display-name fields exist only for human readability and external-AI handling. IDs are canonical.

Import rules:
- UUID syntax is checked by JSON Schema;
- `decision_pack_id` must resolve to the Decision Pack being imported against;
- all person IDs must resolve to existing `people` records;
- all resolved people and the Decision Pack must belong to the same `organization_id` as the import context;
- a missing, cross-organization, or unresolved internal ID causes import failure;
- COMES must not create or guess an internal record to repair an invalid ID.

## 7. Person references

Required assignee fields:

- `assignee_person_id`
- `assignee_name`

Optional related-person fields:

- `related_person_ids`
- `related_person_names`

The internal ID is canonical. The display name exists for human readability and external-AI handling.

## 8. Delegation rule

If `action_type = delegate`, these fields are required:

- `delegate_to_person_id`
- `delegate_to_name`

## 9. Follow-up rule

Fields:

- `follow_up_required`
- `follow_up_date`

If `follow_up_required = true`, `follow_up_date` is required.

## 10. Optional action fields

- `estimated_minutes`
- `dependencies`
- `execution_context`
- `suggested_timing`
- `risk_if_ignored`
- `related_person_ids`
- `related_person_names`

`estimated_minutes` is optional. If omitted, the task remains valid and is excluded from time-capacity totals.

## 11. source_refs

Each action must contain at least one source reference.

The canonical meaning is shared with B-12.

```json
{
  "source_type": "work_item",
  "source_system": "crm",
  "source_id": "case_123",
  "label": "A案件 2営業日更新なし"
}
```

### 11.1 source_type

`source_type` describes what kind of information the evidence is.

Allowed values:

- `kpi_result`
- `work_item`
- `work_event`
- `daily_work_log`
- `one_on_one`
- `manager_observation`
- `bottleneck`
- `delegation_candidate`
- `decision_pack_note`

### 11.2 source_system

`source_system` describes where the evidence came from.

It is a required non-empty string and is intentionally not a fixed enum so company-specific Adapters can be added without changing the Core schema.

Examples:

- `crm`
- `drive`
- `comes`
- `manual`
- `google_calendar`
- `outlook`

Rules:
- system names such as `crm`, `drive`, or `calendar` must not be used as `source_type`;
- information kinds such as `work_item` or `kpi_result` must not be used as `source_system`;
- the AI should preserve `source_type / source_system / source_id / label` from the Decision Pack whenever it is citing the same evidence;
- the AI must not invent a new `source_system` or silently reinterpret the origin;
- if the AI cites a COMES-generated candidate such as a bottleneck record, `source_system = "comes"` is appropriate.

`decision_pack_note` must not be used for priority changes, exclusions, or edit history. Those belong to revision / audit history.

## 12. Proposal states

Each imported AI proposal has one of four COMES-side lifecycle states:

- `pending`
- `accepted`
- `held`
- `rejected`

These states are not part of the external AI JSON payload. COMES creates each imported proposal as `pending` after the full AI result passes validation.

### pending
The proposal has been imported but the human has not decided yet. `pending` must not be treated as `held`.

### accepted
Immediately creates a task. No additional confirmation modal is shown in MVP.

### held
Remains in the active AI Proposal tab after an explicit human hold decision.

### rejected
Removed from the active view but retained in date-based history.

Only a human action transitions `pending` to `accepted`, `held`, or `rejected`.

## 13. Task conversion

When an action is accepted, COMES maps at least:

- title
- description
- assignee
- related person(s)
- due bucket
- due date when present
- priority
- recommended action
- expected outcome
- success criteria
- estimated minutes when present
- source references
- AI-origin metadata

AI-provided content and human-authored notes remain visually and structurally separate.

## 14. Daily capacity display

`estimated_minutes` may be used to calculate daily workload feasibility.

Normal work capacity:
- default daily work time = 8 hours;
- user can change the persistent normal work time;
- user can override only today's work time.

If estimated task time exceeds 100% of available work time, COMES displays a warning only. It does not automatically remove, reschedule, or delegate tasks.

## 15. Validation behavior

COMES validates pasted external-AI output without using an LLM.

### 15.1 JSON Schema validation

Includes at least:
- valid JSON syntax;
- required fields;
- enum validity;
- date/date-time formats;
- UUID format for canonical COMES IDs;
- conditional required fields;
- non-empty `source_refs`;
- unknown-property rejection where defined.

### 15.2 Identity validation

After JSON Schema validation passes, COMES validates canonical internal IDs:

- `decision_pack_id` exists and is the target Decision Pack;
- `assignee_person_id` exists;
- every `related_person_ids` value exists;
- `delegate_to_person_id` exists when supplied;
- all of those records belong to the active organization.

Any unresolved or cross-organization internal ID causes import failure.

### 15.3 Evidence referential validation

COMES must verify that every `source_ref` resolves to either:

1. an Evidence Ref contained in the referenced Decision Pack / revision; or
2. an existing COMES record that is valid as an evidence source.

Rules:
- matching uses at least `source_type + source_system + source_id`;
- `label` is display text and must not be the canonical lookup key;
- an unresolved `source_ref` causes import validation failure;
- COMES does not create missing evidence records automatically;
- COMES does not ask an LLM to repair an unresolved reference.

If any validation fails:
- do not save the result;
- show what is invalid;
- do not silently repair it;
- do not use an LLM to reinterpret or repair it.

If all validation passes:
- save the AI result;
- create each imported proposal with COMES-side status `pending`;
- automatically transition the related Decision Pack status to `AI結果取込済み`.

## 16. Canonical JSON Schema v0.4

Decision v0.5 tightens canonical COMES IDs to UUID format, so the external AI JSON Schema is bumped to v0.4.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://otomo-lab.com/schemas/comes-ai-analysis-result-v0.4.json",
  "title": "OTOMO COMES AI Analysis Result v0.4",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "date",
    "decision_pack_id",
    "generated_at",
    "management_focus_type",
    "management_focus_summary",
    "kpi_allocation_comment",
    "actions"
  ],
  "properties": {
    "schema_version": { "type": "string", "const": "0.4" },
    "date": { "type": "string", "format": "date" },
    "decision_pack_id": { "type": "string", "format": "uuid" },
    "generated_at": { "type": "string", "format": "date-time" },
    "management_focus_type": {
      "type": "string",
      "enum": [
        "player_focus",
        "team_follow_focus",
        "delegation_focus",
        "bottleneck_focus",
        "systemization_focus",
        "mixed_focus"
      ]
    },
    "management_focus_summary": { "type": "string", "minLength": 1 },
    "kpi_allocation_comment": { "type": "string", "minLength": 1 },
    "actions": {
      "type": "array",
      "items": { "$ref": "#/$defs/action" }
    }
  },
  "$defs": {
    "action": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "action_type",
        "title",
        "description",
        "reason",
        "assignee_person_id",
        "assignee_name",
        "due_bucket",
        "priority",
        "recommended_action",
        "expected_outcome",
        "success_criteria",
        "source_refs"
      ],
      "properties": {
        "action_type": {
          "type": "string",
          "enum": [
            "priority_task",
            "delegate",
            "follow_up",
            "praise",
            "bottleneck",
            "systemization",
            "one_on_one"
          ]
        },
        "title": { "type": "string", "minLength": 1 },
        "description": { "type": "string", "minLength": 1 },
        "reason": { "type": "string", "minLength": 1 },
        "assignee_person_id": { "type": "string", "format": "uuid" },
        "assignee_name": { "type": "string", "minLength": 1 },
        "related_person_ids": {
          "type": "array",
          "items": { "type": "string", "format": "uuid" },
          "uniqueItems": true
        },
        "related_person_names": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "due_bucket": {
          "type": "string",
          "enum": ["today", "within_week", "not_urgent"]
        },
        "due_date": { "type": "string", "format": "date" },
        "priority": {
          "type": "string",
          "enum": ["high", "medium", "low"]
        },
        "recommended_action": { "type": "string", "minLength": 1 },
        "expected_outcome": { "type": "string", "minLength": 1 },
        "success_criteria": { "type": "string", "minLength": 1 },
        "estimated_minutes": { "type": "integer", "minimum": 1 },
        "dependencies": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "execution_context": { "type": "string", "minLength": 1 },
        "suggested_timing": { "type": "string", "minLength": 1 },
        "risk_if_ignored": { "type": "string", "minLength": 1 },
        "follow_up_required": { "type": "boolean" },
        "follow_up_date": { "type": "string", "format": "date" },
        "delegate_to_person_id": { "type": "string", "format": "uuid" },
        "delegate_to_name": { "type": "string", "minLength": 1 },
        "source_refs": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/$defs/source_ref" }
        }
      },
      "allOf": [
        {
          "if": {
            "properties": { "due_bucket": { "enum": ["today", "within_week"] } },
            "required": ["due_bucket"]
          },
          "then": { "required": ["due_date"] }
        },
        {
          "if": {
            "properties": { "action_type": { "const": "delegate" } },
            "required": ["action_type"]
          },
          "then": { "required": ["delegate_to_person_id", "delegate_to_name"] }
        },
        {
          "if": {
            "properties": { "follow_up_required": { "const": true } },
            "required": ["follow_up_required"]
          },
          "then": { "required": ["follow_up_date"] }
        }
      ]
    },
    "source_ref": {
      "type": "object",
      "additionalProperties": false,
      "required": ["source_type", "source_system", "source_id", "label"],
      "properties": {
        "source_type": {
          "type": "string",
          "enum": [
            "kpi_result",
            "work_item",
            "work_event",
            "daily_work_log",
            "one_on_one",
            "manager_observation",
            "bottleneck",
            "delegation_candidate",
            "decision_pack_note"
          ]
        },
        "source_system": { "type": "string", "minLength": 1 },
        "source_id": { "type": "string", "minLength": 1 },
        "label": { "type": "string", "minLength": 1 }
      }
    }
  }
}
```

## 17. Accepted example

```json
{
  "schema_version": "0.4",
  "date": "2026-09-13",
  "decision_pack_id": "7f2d06f8-5230-4b3d-ae9e-8975350ef7bf",
  "generated_at": "2026-09-12T20:15:00+09:00",
  "management_focus_type": "team_follow_focus",
  "management_focus_summary": "明日は新規営業より、停滞案件の解消とメンバーフォローを優先する。",
  "kpi_allocation_comment": "自分KPIは計画線上だがチームKPIに遅れがあるため、今日は個人数字の上積みより停滞案件のフォローへ時間を配分する。",
  "actions": [
    {
      "action_type": "follow_up",
      "title": "山田さんのA案件の停滞理由を確認する",
      "description": "A案件が2営業日進捗していないため、現状と次のアクションを本人に確認する。",
      "reason": "案件が停滞状態にあり、次のアクションが未確定のため。",
      "assignee_person_id": "97295b25-28b2-4e70-b469-0ab7be46cff1",
      "assignee_name": "マネージャー",
      "related_person_ids": ["664ae08d-4231-4eb1-92ed-5fcfb654d4ad"],
      "related_person_names": ["山田太郎"],
      "due_bucket": "today",
      "due_date": "2026-09-13",
      "priority": "high",
      "recommended_action": "午前中に山田さんへ直接確認し、停滞理由と次のアクション、期限を決める。",
      "expected_outcome": "A案件が停滞している理由が明確になり、次のアクションが決まっている。",
      "success_criteria": "担当者・次アクション・期限の3点が決定している。",
      "estimated_minutes": 15,
      "follow_up_required": true,
      "follow_up_date": "2026-09-15",
      "source_refs": [
        {
          "source_type": "work_item",
          "source_system": "crm",
          "source_id": "case_123",
          "label": "A案件 2営業日更新なし"
        }
      ]
    }
  ]
}
```

## 18. Boundary

This schema describes AI output and task-conversion input only.

It does not change:
- the canonical Decision Pack role defined by B-12;
- original CRM / 1on1 / observation records;
- the rule that human final judgment remains authoritative;
- the rule that COMES must not infer personality or motivation scores;
- the rule that evidence and human-added supplements remain distinguishable.

The source reference semantics in B-12 and B-24 are intentionally aligned so the AI can preserve evidence references without inventing a conversion rule.
