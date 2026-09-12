# B-36 Management Action Receipt 契約

Status: Accepted v1.2
Decision ID: B-36

## 結論

HOMEの共通「完了」操作で発生する実施済み記録は、元データの意味を壊さず監査可能にするため、共通の追記型 `management_action_receipts` として保持する。

B-35で定義したカード別の「完了」の意味を、この共通Receiptで記録する。

## 対象

HOME上段4カードの完了操作:

- 自分が動く → task completed
- 手放す → delegation handled
- 褒める → praise delivered
- 詰まりを取る → bottleneck resolved

## management_action_receipts

最低限以下を保持する。

- `id` uuid PK
- `organization_id` uuid FK
- `manager_person_id` uuid FK -> people.id
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

`source_type / source_system / source_id` は主参照先を表し、B-12 / B-24のEvidence Refと同じ意味を使う。

- `source_type` = 何の情報か
- `source_system` = どのシステム・生成元から来たか
- `source_id` = source_system内で追跡可能な識別子

`evidence_refs` は、その実施判断に使ったEvidence Ref集合を保持する。

`evidence_fingerprint` は、再掲抑制を安定して行うための機械比較キーであり、`evidence_refs` の各要素から `source_type / source_system / source_id` を取り出し、順序を正規化したうえで決定的に生成する。

labelはfingerprintへ含めない。

## 原則

- Receiptは追記型とし、実施履歴を後から失わない。
- 元データそのものをReceiptで置換しない。
- 元ドメインの状態変更が必要な場合のみ、各ドメインの正本状態を別途更新する。
- 「完了」というUI文言を理由に、無関係な元タスク・人物状態を一律completedへ変更しない。
- `source_type / source_system / source_id` から主参照先へ追跡可能にする。
- 複数根拠を持つ行動は `evidence_refs` 全体を保存する。
- `label` 等の表示文言は同一性判定キーにしない。

## カード別の状態反映

### 自分が動く

対象が `work_items` のタスクである場合:

- `work_items.status = completed`
- `management_action_receipts.action_kind = task_completed`

### 手放す

委譲候補そのものを「業務完了」とは扱わない。

- 実施済み事実を `delegation_handled` Receiptとして記録する
- `delegation_candidates` の既存classificationや根拠は保持する
- 候補自体の状態変更は、既存status契約と矛盾しない範囲でのみ行う

### 褒める

Praiseは人物状態ではないため、人物レコードやKPIを変更しない。

- `praise_delivered` Receiptを記録する
- 何を根拠に褒めたかを `evidence_refs` で追跡できる

### 詰まりを取る

対象のボトルネックが実際に解消された場合:

- `bottlenecks.status = resolved`
- `resolved_at` を記録
- `bottleneck_resolved` Receiptを記録する

単に確認しただけの場合はresolvedにしない。

## 冪等性

同一対象への連打で重複Receiptが増えないよう、Application層で同一完了操作の二重実行を防止する。

少なくとも以下を利用する。

- organization
- action_kind
- source_type
- source_system
- source_id
- evidence_fingerprint
- request_id（利用可能な場合）

同一request_idは同一操作として扱う。

## B-34 / B-39との関係

`保留` は当日の表示上のdeferであり、Management Action Receiptには記録しない。

Receiptは「実際にマネジメント行動を実施した」場合だけを対象とする。

## B-37との関係

再掲抑制では、単一の主sourceだけではなく `action_kind + evidence_fingerprint` を正本比較キーとする。

これにより、複数Evidence Refを持つ候補でも、同じ根拠集合のまま繰り返し再掲することを防げる。

新しいEvidence Refが追加された場合はfingerprintが変わり、新しい候補として扱える。

## 非採用

- Praise専用の永続テーブルをMVPで追加する
- HOME共通完了のためだけに各ドメインstatusへ `handled` を乱立させる
- 「完了」を人物評価や成果評価として保存する
- 元データを履歴なしで上書きする
- `source_system` を省略して異なる取得元の同一IDを衝突させる
- 複数根拠の候補で任意の1件だけを選び再掲抑制キーにする
- labelをfingerprintへ含める

## Acceptance

- HOMEの完了操作をカード種別別に監査できる
- task / delegation / praise / bottleneckの実施履歴を共通形式で追跡できる
- 主参照先とEvidence Ref集合を両方保持できる
- 複数根拠でも決定的な `evidence_fingerprint` を生成できる
- 元データの意味を壊さない
- Praise実施で人物状態を書き換えない
- Bottleneckは実解消時だけresolvedになる
- 同一操作の二重実行を防げる
- B-37の再掲抑制と整合する
