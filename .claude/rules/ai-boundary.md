---
description: 外部AI JSONの4段validation・Human-in-the-loop・Evidence Ref契約。AI import / schema / Decision Pack周辺を触るとき必ず守る。
paths:
  - "src/schemas/**"
  - "src/application/**"
  - "src/**/ai/**"
  - "src/**/decision-pack/**"
  - "src/**/decision_pack/**"
  - "src/**/*proposal*"
  - "src/**/*decision-pack*"
---

# AI boundary rules

正本: B-24 v0.5 / B-25 / B-47 / B-33 / B-32 §10 / B-12 / B-31 §9。
詳細は `docs/DEVELOPMENT_STANDARDS.md` §5。

外部AI JSONは**未信頼入力**。COMES内で生成した値と同じ扱いにしない。

## 4段の検証ゲート（全通過まで保存しない）

1. **Schema Validation** — JSON構文 / 必須項目 / enum / date・date-time形式 / UUID形式 / 条件付き必須（`today`・`within_week` は `due_date` 必須、`delegate` は `delegate_to_person_id`・`delegate_to_name` 必須、`follow_up_required = true` は `follow_up_date` 必須）/ `source_refs` 非空 / 未知プロパティ拒否。
2. **Identity Validation** — `decision_pack_id` が取込対象として実在 / `assignee_person_id`・`related_person_ids`・`delegate_to_person_id` が `people` に実在 / 全て同一 `organization_id` / **`action.assignee_person_id == decision_pack.manager_id`**（B-47）。
3. **Evidence Referential Validation** — 各 `source_ref` が対象Decision Pack / revisionのEvidence Refに一致、または有効なCOMESレコードとして実在。照合キーは最低 `source_type + source_system + source_id`。`label` は照合キーにしない。
4. **Semantic Validation**（JSON Schemaでは表現しない。Application境界で行う）
   - `today` → `due_date = analysis date`
   - `within_week` → `due_date` が analysis date +1〜+7（rolling 7日。カレンダー週に依存しない）
   - `not_urgent` → `due_date` なし、または +7より後
   - 基準日は取込日時や現在日時ではなく**B-24 top-levelの `date`**

## 失敗時

- 保存しない
- 何が不正かを表示する
- **サイレント補正しない**
- LLMで再解釈・修復しない
- 不正IDを埋めるためにレコードを新規作成・推測しない
- assigneeをmanagerへ自動修正しない
- 不整合な `due_bucket / due_date` を自動補正せず、外部AIへ再生成を求める

## 通過後

- AI結果を保存
- 各proposalを `pending` で作成（`pending` を `held` として扱わない）
- Decision Packを `ai_result_imported` へ遷移（B-32 §2）

## Human-in-the-loop

- `pending` → `accepted` / `held` / `rejected` は**人間操作のみ**。
- acceptedのみ即Task化（MVPでは追加の確認モーダルなし）。
- rejectedは通常ビューから外すが履歴には残す。heldはAI Proposal画面に残る。
- AI提案を人間採用前に実行対象・Taskへ自動変換しない。

## 責任分界（B-25）

COMES = 事実・構造化・保存・検証・実行 / AI = 判断・分類・意味づけ・提案。

COMES側でAI出力を自然言語解析し直さない。会社固有の意味判断をCoreへ埋め込まない。

## Decision Pack編集（B-23）

- Source Fact（KPI実績 / 件数 / 期限 / 停滞根拠時刻 / CRM案件状態 / 1on1実施日 / observation記録 / 各種ID / source status）は**編集不可**。
- 人間ができるのは 追加 / 除外 / 補足 / 優先度変更 のみ。除外はSource削除ではない。
- revision / audit（`decision_pack_adjustments`）を保存する。確認後の編集は新revisionを作り `drafting` へ戻す。
- AIへ渡す際は observed fact / system-derived candidate / human-added context / human priority override / excluded を区別する。

## Evidence Ref 契約（B-12 / B-24 / B-31 §9）

許容値の一覧は `docs/DEVELOPMENT_STANDARDS.md` §5「Evidence Ref の意味契約」を正本とする。
実装時に守る不変条件は4つ。

- `source_type` = **何の情報か** / `source_system` = **どこから来たか**。互いに混在させない。
- `source_id` は `source_system` 内で追跡可能な識別子。
- `label` は表示専用。同一性判定・照合キーにしない。
- `decision_pack_note` を優先度変更・除外・編集履歴の表現に使わない（それはrevision / audit）。

## 禁止

- 感情 / 性格 / モチベーション / 能力のスコア化・断定（B-17 / B-19）
- `data_status` が `known` 以外を確定事実として扱う（B-13）
- `source_missing` を0として扱う / 本人の失敗と解釈する
- 個人MVPでCOMESからLLM APIを呼ぶ（B-01 / B-25。Adapterはinterfaceのみ）
