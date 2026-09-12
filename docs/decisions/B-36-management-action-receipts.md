# B-36 Management Action Receipt 契約

Status: Accepted v1.1
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
- `performed_by_user_id` uuid FK -> profiles.user_id
- `performed_at` timestamptz
- `note` text nullable
- `created_at` timestamptz

`source_type / source_system / source_id` はB-12 / B-24のEvidence Ref契約と同じ意味を使う。

- `source_type` = 何の情報か
- `source_system` = どのシステム・生成元から来たか
- `source_id` = source_system内で追跡可能な識別子

## 原則

- Receiptは追記型とし、実施履歴を後から失わない。
- 元データそのものをReceiptで置換しない。
- 元ドメインの状態変更が必要な場合のみ、各ドメインの正本状態を別途更新する。
- 「完了」というUI文言を理由に、無関係な元タスク・人物状態を一律completedへ変更しない。
- `source_type / source_system / source_id` から元の候補・タスク・ボトルネックへ追跡可能にする。
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
- 何を根拠に褒めたかをEvidence Refで追跡できる

### 詰まりを取る

対象のボトルネックが実際に解消された場合:

- `bottlenecks.status = resolved`
- `resolved_at` を記録
- `bottleneck_resolved` Receiptを記録する

単に確認しただけの場合はresolvedにしない。

## 冪等性

同一対象への連打で重複Receiptが増えないよう、Application層で同一完了操作の二重実行を防止する。

少なくとも以下の組み合わせで直近実行を識別できるようにする。

- organization
- action_kind
- source_type
- source_system
- source_id
- performed date / request id

厳密なDB unique keyは実装時のトランザクション方式に合わせて決めてよい。

## B-34 / B-39との関係

`保留` は当日の表示上のdeferであり、Management Action Receiptには記録しない。

Receiptは「実際にマネジメント行動を実施した」場合だけを対象とする。

## B-37との関係

再掲抑制では、Receiptに保存した `source_type + source_system + source_id` と `action_kind` を利用する。

同一根拠・同一行動の実施済み判定を、表示文言や人物名だけで行わない。

## 非採用

- Praise専用の永続テーブルをMVPで追加する
- HOME共通完了のためだけに各ドメインstatusへ `handled` を乱立させる
- 「完了」を人物評価や成果評価として保存する
- 元データを履歴なしで上書きする
- `source_system` を省略して異なる取得元の同一IDを衝突させる

## Acceptance

- HOMEの完了操作をカード種別別に監査できる
- task / delegation / praise / bottleneckの実施履歴を共通形式で追跡できる
- Evidence Refと同じ3要素で元根拠を追跡できる
- 元データの意味を壊さない
- Praise実施で人物状態を書き換えない
- Bottleneckは実解消時だけresolvedになる
- 同一操作の二重実行を防げる
- B-37の再掲抑制キーと整合する
