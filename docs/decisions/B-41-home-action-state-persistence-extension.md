# B-41 HOME操作状態のDB保存拡張

Status: Accepted v1.4
Decision ID: B-41

## 1. 目的

B-33〜B-40で確定したHOMEの期限表示・保留・完了・再掲抑制・単一カード表示を、B-02 + B-32のDBモデル上で実装可能にする。

本DecisionはB-32 v1.3の後発拡張であり、競合箇所ではB-41を優先する。

---

## 2. HOME日次保留

B-39 v1.1の全カード共通 `保留` を保存するため、`home_item_deferrals` を追加する。

### home_item_deferrals

- `id` uuid PK
- `organization_id` uuid FK
- `manager_person_id` uuid FK -> people.id
- `subject_person_id` uuid nullable FK -> people.id
- `home_card_type` enum(self_action, delegation, praise, bottleneck)
- `source_type` text
- `source_system` text
- `source_id` text
- `defer_date` date
- `created_by_user_id` uuid FK -> profiles.user_id
- `created_at` timestamptz

Unique候補:

```text
(organization_id, manager_person_id, home_card_type, subject_person_id, source_type, source_system, source_id, defer_date)
```

原則:
- 保留は当日HOME表示だけに効く。
- 人物対象が明確な候補では `subject_person_id` を保持する。
- 同じ根拠でも別人物の候補は独立して保留できる。
- 元ドメインstatus / due_date / due_at / due_bucket / Evidence Refは変更しない。
- `work_items.status = waiting` で代用しない。
- B-34の `home_task_deferrals` は論理的にB-39/B-41の `home_item_deferrals` へ一般化されたものとし、別テーブルを二重実装しない。

---

## 3. Management Action Receipt

B-35 / B-36 v1.4 / B-37 v1.2の実施済み行動を保存するため、`management_action_receipts` を追加する。

### management_action_receipts

- `id` uuid PK
- `organization_id` uuid FK
- `manager_person_id` uuid FK -> people.id
- `subject_person_id` uuid nullable FK -> people.id
- `action_kind` enum(task_completed, delegation_handled, praise_delivered, bottleneck_resolved)
- `source_type` text
- `source_system` text
- `source_id` text
- `source_ref` jsonb nullable
- `evidence_refs` jsonb not null
- `evidence_fingerprint` text not null
- `performed_by_user_id` uuid FK -> profiles.user_id
- `performed_at` timestamptz
- `note` text nullable
- `request_id` text nullable
- `created_at` timestamptz

原則:
- Receiptは追記型。
- `subject_person_id` は人物対象が明確な場合に保持する。
- `source_type / source_system / source_id` は主参照先を表す。
- `evidence_refs` は実施判断に使ったEvidence Ref集合を保持する。
- `evidence_fingerprint` はB-36 v1.4のcanonical生成手順を使う。
- labelはfingerprintへ含めない。
- 元ドメイン状態は必要な場合のみ別途更新する。
- Praise実施で人物/KPI状態を変更しない。
- Bottleneckは実解消時だけ `resolved` へ変更する。

冪等性:
- UI連打や同一request再送で二重Receiptを作らない。
- `request_id` を利用できる場合は同一requestを一意に扱う。
- request_idが無い場合もApplication層で直近同一操作を防止する。

---

## 4. 再掲抑制

B-37 v1.2に従い、候補生成後かつDecision Pack/HOME掲載前に `management_action_receipts` を照合する。

人物対象あり:

```text
action_kind + subject_person_id + evidence_fingerprint
```

人物対象なし:

```text
action_kind + source_type + source_system + source_id + evidence_fingerprint
```

- 同一比較キーで実施済み → 再掲抑制
- subject_person_idが異なる → 別候補
- 新しいEvidence Refが追加されfingerprintが変わる → 新候補として表示可能
- Evidence Ref配列の順序差だけではfingerprintを変えない
- 日付変更のみ → 新候補扱いにしない
- 安定したfingerprintを生成できない → 推測抑制せず `needs_confirmation`

---

## 5. Task期限表示

B-33 v1.1のローリング7日契約は、既存 `work_items.due_bucket / due_date` を利用するため新規テーブルは不要。

表示時の基準日 `D`:
- `due_date < D` かつ未完了 → HOME/Task表示上は `today` レーンへ昇格し `期限切れ` シグナルを付ける
- 保存済み `due_bucket` / `due_date` は自動変更しない

AI import時のSemantic Validation:
- `today`: `due_date = analysis date`
- `within_week`: analysis date +1〜+7
- `not_urgent`: due_dateなし、または+7より後

不整合はサイレント補正しない。

---

## 6. HOME単一カード表示

B-40 v1.1は表示投影ルールであり、新規永続テーブルは必須としない。

accepted AI Proposal由来Taskは `origin_ai_proposal_id` と `ai_proposals.action_type` を利用してHOME主カードを決める。

主カード:
- priority_task / follow_up / one_on_one / systemization → self_action
- delegate → delegation
- praise → praise
- bottleneck → bottleneck

同一対象はHOME上で1カードだけに投影する。

Task画面では元Taskを保持する。

B-42に従い、HOME側でドメイン行動を完了した場合は、同じaccepted AI ProposalのBacking Taskがあれば同一transactionで完了する。

Task単体完了から元ドメイン成果へは自動昇格しない。

---

## 7. Current State / History分類

### Current State / Daily UI State
- `home_item_deferrals`

### History / Event
- `management_action_receipts`

これらは元のTask / Candidate / Bottleneck等の正本を置換しない。

---

## 8. 優先順位

競合時:

1. B-41 v1.4
2. B-45 / B-44 / B-43 / B-42 / B-40 v1.1 / B-39 v1.1 / B-37 v1.2 / B-36 v1.4 / B-35 / B-34 / B-33 v1.1
3. B-32 v1.3
4. B-02

---

## Acceptance

- HOME保留を4カード共通で永続化できる
- HOME保留とTask `waiting` を分離できる
- 同じ根拠でも異なる人物候補を独立して保留できる
- 実施済み管理行動を追記履歴として保存できる
- 人物対象を `subject_person_id` で区別できる
- B-36 v1.4のcanonical evidence fingerprintをDB上で保持できる
- Evidence Ref順序差で再掲抑制が不安定にならない
- 同じ根拠集合でも異なる人物候補を誤抑制しない
- 同一完了操作の二重実行を防止できる
- 期限超過を表示上だけtodayへ昇格できる
- accepted AI Proposal由来TaskをHOMEで二重表示しない
- HOMEドメイン完了時にBacking Taskを原子的に同期できる
- B-02/B-32の正本モデルを破壊せず後発HOME契約を実装できる
