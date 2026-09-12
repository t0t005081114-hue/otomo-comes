# B-24 AI Analysis Result Schema

Status: Accepted v0.1
Decision ID: B-24

## 1. Purpose

This decision defines the canonical JSON contract used to import AI analysis results into OTOMO COMES.

The personal MVP does not call an LLM API from COMES. Instead, COMES exports an AI prompt, the user sends it to an external AI, and the external AI must return JSON that conforms to this schema.

The result is then pasted into COMES and validated with normal JSON Schema validation. No LLM is used for interpretation, repair, or normalization during import.

Future architecture may replace the external-AI step with an internal AI Analysis Adapter and LLM API, while preserving the same result contract.

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
AI Proposal tab
  ↓
Human chooses Accept / Hold / Reject
  ↓
Accepted actions become tasks immediately
```

Important:
- Accepting an AI proposal must not open an additional confirmation modal in MVP.
- Accepted proposals are converted directly into tasks.
- Any correction is made afterward in the task itself.
- Rejected proposals are hidden from the normal view but remain available in history.
- Held proposals remain visible in the AI Proposal tab.

## 3. Top-level schema

A single AI result object represents one day of AI proposals.

Required top-level fields:

- `schema_version`
- `date`
- `decision_pack_id`
- `generated_at`
- `management_focus_type`
- `management_focus_summary`
- `actions`

### 3.1 management_focus_type

Allowed values:

- `player_focus`
- `team_follow_focus`
- `delegation_focus`
- `bottleneck_focus`
- `systemization_focus`
- `mixed_focus`

`one_on_one_focus` is intentionally not defined. 1on1 is treated as one of the means used inside `team_follow_focus`, not as a top-level daily management mode.

### 3.2 management_focus_summary

A short human-readable sentence that explains how the playing manager should operate that day.

Example:

```text
明日は新規営業より、停滞案件の解消とメンバーフォローを優先する。
```

This value is stored with the AI proposal set and displayed at the top of the task screen.

The user does not manually edit this value in MVP. If real-world circumstances change, the user edits individual tasks instead.

## 4. Action types

Each action must have exactly one `action_type` from the following fixed enum:

- `priority_task`
- `delegate`
- `follow_up`
- `praise`
- `bottleneck`
- `systemization`
- `one_on_one`

A separate `review` type is not included in v0.1. Review-only behavior can be expressed through `recommended_action` inside another action type, especially `delegate`.

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

These values map directly to the three task lanes in COMES:

```text
today       → 今日やること
within_week → 1週間以内にやること
not_urgent  → 急ぎじゃない
```

### 5.2 due_date rules

- `today` → `due_date` is required.
- `within_week` → `due_date` is required.
- `not_urgent` → `due_date` is optional.

COMES must not force an artificial deadline on a non-urgent action.

### 5.3 priority

Allowed values:

- `high`
- `medium`
- `low`

### 5.4 expected_outcome

Required.

Describes the target state after the action is completed.

Example:

```text
A案件が停滞している理由が明確になり、次のアクションが決まっている。
```

### 5.5 success_criteria

Required.

Defines what must be true for the action to be considered complete.

Example:

```text
担当者・次アクション・期限の3点が決定している。
```

## 6. Person references

Person references must use both COMES internal IDs and human-readable names.

Required assignee fields:

- `assignee_person_id`
- `assignee_name`

Optional related-person fields:

- `related_person_ids`
- `related_person_names`

The internal ID is canonical. The display name exists only to make external-AI output and human review understandable.

## 7. Delegation rule

If `action_type = delegate`, the following fields become required:

- `delegate_to_person_id`
- `delegate_to_name`

For all other action types, these fields are optional / unnecessary.

## 8. Follow-up rule

Follow-up scheduling is supported but must not be generated for every action.

Fields:

- `follow_up_required`: boolean
- `follow_up_date`: date

Rule:

- If `follow_up_required = true`, `follow_up_date` is required.
- Otherwise `follow_up_date` is not required.

The purpose is to connect actions that truly require re-checking to a later follow-up without creating unnecessary recurring work.

## 9. Optional action fields

The following fields are optional in v0.1:

- `estimated_minutes`
- `dependencies`
- `execution_context`
- `suggested_timing`
- `risk_if_ignored`
- `related_person_ids`
- `related_person_names`

### 9.1 estimated_minutes

Optional integer greater than zero.

AI may provide an initial estimate. Humans may edit it later in the task detail.

If omitted:
- the task remains valid;
- the task is excluded from time-capacity totals;
- UI may show `見積未設定`.

### 9.2 dependencies

Optional list of prerequisites or blocking conditions.

### 9.3 execution_context

Optional context such as:

- morning meeting
- 1on1
- phone call
- chat
- desk work

No enum is fixed in v0.1.

### 9.4 suggested_timing

Optional human-readable timing hint such as `午前中`, `朝会後`, or `1on1時`.

### 9.5 risk_if_ignored

Optional short statement describing the risk of not taking the action.

## 10. source_refs

Each action must contain at least one source reference.

Structure:

```json
{
  "source_type": "work_item",
  "source_id": "work_123",
  "label": "A案件 2営業日更新なし"
}
```

### 10.1 source_type enum

Allowed values in v0.1:

- `kpi_result`
- `work_item`
- `work_event`
- `daily_work_log`
- `one_on_one`
- `manager_observation`
- `bottleneck`
- `delegation_candidate`
- `decision_pack_note`

Definitions:

- `kpi_result`: KPI actuals, target gaps, and progress.
- `work_item`: a concrete task, case, or piece of work.
- `work_event`: an event related to work such as rework, overdue, status change, or hand-back.
- `daily_work_log`: daily aggregated operating facts such as completed work, carryovers, delegation counts, and incident counts.
- `one_on_one`: COMES-held structured 1on1 summary / insight reference. Raw transcript is not stored in COMES.
- `manager_observation`: manager-recorded observation fact.
- `bottleneck`: a COMES-held bottleneck candidate / record.
- `delegation_candidate`: a COMES-held delegation candidate / evidence set.
- `decision_pack_note`: only human-added supplemental information entered into the Decision Pack.

`decision_pack_note` must not be used for priority changes, exclusions, or edit history. Those belong to revision / audit history.

System names and storage locations such as `crm`, `drive`, or `task` must not be used as `source_type`. `source_type` describes what kind of information the evidence is, not where it came from.

## 11. Proposal states

Each AI proposal is handled by the human with one of three states:

- `accepted`
- `held`
- `rejected`

Behavior:

### accepted

Immediately creates a task using the AI-provided task data.

No additional confirmation modal is shown in MVP.

### held

Remains in the active AI Proposal tab for later decision.

### rejected

Removed from the normal active view, but retained in date-based AI proposal history.

## 12. Task conversion

When an action is accepted, COMES automatically maps at least the following values into the new task:

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

The user may edit the created task afterward.

AI-provided content and human-authored notes must remain visually and structurally separate in the task detail.

Human notes may include:

- free-form memo
- execution note
- communication caution
- timing adjustment
- post-completion note

Post-completion result notes are optional.

## 13. Daily capacity display

`estimated_minutes` may be used to calculate daily workload feasibility.

Normal work capacity:
- Default normal daily work time = 8 hours.
- User can change the persistent normal work time in settings.
- User can override only today's work time without changing future days.

Capacity display may show:

```text
稼働可能時間
今日タスク見積合計
残り余力 / 超過時間
```

If estimated task time exceeds 100% of the available work time, COMES displays a warning.

This is display-only in MVP:
- no automatic task removal;
- no automatic rescheduling;
- no automatic delegation recommendation triggered solely by capacity overflow.

## 14. JSON Schema validation behavior

COMES must validate pasted external-AI output without using an LLM.

Validation includes at least:

- valid JSON syntax;
- required fields;
- enum validity;
- date/date-time formats;
- conditional required fields;
- non-empty `source_refs`;
- unknown-property rejection where defined.

If validation fails:
- do not save the result;
- show the user what is invalid;
- do not silently repair the JSON;
- do not use an LLM to reinterpret or repair it.

If validation passes:
- save the AI result;
- automatically transition the related Decision Pack status to `AI結果取込済み`.

## 15. Canonical JSON Schema v0.1

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://otomo-lab.com/schemas/comes-ai-analysis-result-v0.1.json",
  "title": "OTOMO COMES AI Analysis Result v0.1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "date",
    "decision_pack_id",
    "generated_at",
    "management_focus_type",
    "management_focus_summary",
    "actions"
  ],
  "properties": {
    "schema_version": {
      "type": "string",
      "const": "0.1"
    },
    "date": {
      "type": "string",
      "format": "date"
    },
    "decision_pack_id": {
      "type": "string",
      "minLength": 1
    },
    "generated_at": {
      "type": "string",
      "format": "date-time"
    },
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
    "management_focus_summary": {
      "type": "string",
      "minLength": 1
    },
    "actions": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/action"
      }
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
        "title": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string",
          "minLength": 1
        },
        "reason": {
          "type": "string",
          "minLength": 1
        },
        "assignee_person_id": {
          "type": "string",
          "minLength": 1
        },
        "assignee_name": {
          "type": "string",
          "minLength": 1
        },
        "related_person_ids": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "uniqueItems": true
        },
        "related_person_names": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "due_bucket": {
          "type": "string",
          "enum": [
            "today",
            "within_week",
            "not_urgent"
          ]
        },
        "due_date": {
          "type": "string",
          "format": "date"
        },
        "priority": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        },
        "recommended_action": {
          "type": "string",
          "minLength": 1
        },
        "expected_outcome": {
          "type": "string",
          "minLength": 1
        },
        "success_criteria": {
          "type": "string",
          "minLength": 1
        },
        "estimated_minutes": {
          "type": "integer",
          "minimum": 1
        },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "execution_context": {
          "type": "string",
          "minLength": 1
        },
        "suggested_timing": {
          "type": "string",
          "minLength": 1
        },
        "risk_if_ignored": {
          "type": "string",
          "minLength": 1
        },
        "follow_up_required": {
          "type": "boolean"
        },
        "follow_up_date": {
          "type": "string",
          "format": "date"
        },
        "delegate_to_person_id": {
          "type": "string",
          "minLength": 1
        },
        "delegate_to_name": {
          "type": "string",
          "minLength": 1
        },
        "source_refs": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/source_ref"
          }
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "due_bucket": {
                "enum": [
                  "today",
                  "within_week"
                ]
              }
            },
            "required": [
              "due_bucket"
            ]
          },
          "then": {
            "required": [
              "due_date"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "action_type": {
                "const": "delegate"
              }
            },
            "required": [
              "action_type"
            ]
          },
          "then": {
            "required": [
              "delegate_to_person_id",
              "delegate_to_name"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "follow_up_required": {
                "const": true
              }
            },
            "required": [
              "follow_up_required"
            ]
          },
          "then": {
            "required": [
              "follow_up_date"
            ]
          }
        }
      ]
    },
    "source_ref": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "source_type",
        "source_id",
        "label"
      ],
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
        "source_id": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string",
          "minLength": 1
        }
      }
    }
  }
}
```

## 16. Accepted example

```json
{
  "schema_version": "0.1",
  "date": "2026-09-13",
  "decision_pack_id": "dp_20260912_001",
  "generated_at": "2026-09-12T20:15:00+09:00",
  "management_focus_type": "team_follow_focus",
  "management_focus_summary": "明日は新規営業より、停滞案件の解消とメンバーフォローを優先する。",
  "actions": [
    {
      "action_type": "follow_up",
      "title": "山田さんのA案件の停滞理由を確認する",
      "description": "A案件が2営業日進捗していないため、現状と次のアクションを本人に確認する。",
      "reason": "案件が停滞状態にあり、次のアクションが未確定のため。",
      "assignee_person_id": "person_manager_001",
      "assignee_name": "マネージャー",
      "related_person_ids": [
        "person_yamada_001"
      ],
      "related_person_names": [
        "山田太郎"
      ],
      "due_bucket": "today",
      "due_date": "2026-09-13",
      "priority": "high",
      "recommended_action": "午前中に山田さんへ直接確認し、停滞理由と次のアクション、期限を決める。",
      "expected_outcome": "A案件が停滞している理由が明確になり、次のアクションが決まっている。",
      "success_criteria": "担当者・次アクション・期限の3点が決定している。",
      "estimated_minutes": 15,
      "execution_context": "chat_or_direct_conversation",
      "suggested_timing": "午前中",
      "risk_if_ignored": "案件の停滞が長期化する可能性がある。",
      "follow_up_required": true,
      "follow_up_date": "2026-09-15",
      "source_refs": [
        {
          "source_type": "work_item",
          "source_id": "work_123",
          "label": "A案件 2営業日更新なし"
        }
      ]
    }
  ]
}
```

## 17. Boundary

This schema describes AI output and task-conversion input only.

It does not change:
- the canonical Decision Pack schema;
- original CRM / 1on1 / observation records;
- the rule that human final judgment remains authoritative;
- the rule that COMES must not infer personality or motivation scores;
- the rule that evidence and human-added supplements remain distinguishable.
