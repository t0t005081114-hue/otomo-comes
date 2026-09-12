# B-39 HOME「保留」の全カード共通契約

Status: Accepted
Decision ID: B-39

## 結論

OTOMO COMES MVPのHOME上段4カードにおける `保留` は、カード種別に関係なく **「今日のHOME表示だけから一時的に外す」** 操作として統一する。

対象:
- 自分が動く
- 手放す
- 褒める
- 詰まりを取る

`保留` は元データの業務状態・候補状態・期限・根拠を書き換えない。

翌日になれば、その日の条件に基づいて再度HOME表示判定を行う。

## B-34との関係

B-34はTaskに対するHOME保留を定義した。

B-39はその意味契約をHOME上段4カード全体へ拡張し、B-34のTask専用保存モデルを一般化する。

B-34の以下の原則は引き続き有効:
- `waiting` とHOME保留を混同しない
- 期限を自動変更しない
- `due_bucket` を自動変更しない
- 保留は当日限り

## 動作

基準日を `D` とする。

ユーザーがHOME上段の任意項目を `保留` した場合:

- その項目を `D` のHOME通常表示から除外する
- 元レコードのstatusは変更しない
- 元レコードの期限・優先度・Evidence Refは変更しない
- Task画面 / Decision Pack / Team画面 / 履歴等から元データを消さない
- `D + 1` 以降は通常の表示判定へ戻す

## カード別の非変更原則

### 自分が動く
- `work_items.status` を変更しない
- `waiting` へ変更しない
- `due_date / due_at / due_bucket` を変更しない

### 手放す
- `delegation_candidates.status` を変更しない
- accepted / rejected等の判断状態へ自動遷移しない

### 褒める
- 人物状態・KPI・評価値を変更しない
- Praise実施済みReceiptを作らない

### 詰まりを取る
- `bottlenecks.status` をresolvedへ変更しない
- `resolved_at` を設定しない

## 保存モデル

HOME保留は元ドメインと分離した共通の日次defer状態として保持する。

### home_item_deferrals

最低限:

- `id` uuid PK
- `organization_id` uuid FK
- `manager_person_id` uuid FK -> people.id
- `home_card_type` enum(self_action, delegation, praise, bottleneck)
- `source_type` text
- `source_system` text
- `source_id` text
- `defer_date` date
- `created_by_user_id` uuid FK -> profiles.user_id
- `created_at` timestamptz

Unique候補:

```text
(organization_id, manager_person_id, home_card_type, source_type, source_system, source_id, defer_date)
```

元データがCOMES内部レコードの場合も、HOME表示側の安定した参照キーへ正規化して保存する。

## B-36 / B-37との境界

`保留` は実施済み行動ではないため、`management_action_receipts` を作成しない。

B-37の再掲抑制は「実際に完了・実施した」Receiptを対象とする。

B-39のdeferは当日だけの表示抑制であり、翌日以降の恒久再掲抑制には使わない。

## 期限超過との関係

Taskが期限超過していても、当日 `保留` を選んだ場合はその日のHOMEから外してよい。

翌日はB-33に従って再判定し、未完了かつ期限超過なら再び `今日やること` の表示対象となる。

## 非採用

- カード種別ごとに異なる意味の `保留` を持つ
- Task以外では `保留` を非表示にする
- HOME保留で元ドメインstatusを書き換える
- HOME保留を無期限の非表示設定として扱う
- HOME保留を実施済みReceiptとして記録する

## Acceptance

- HOME上段4カードで `保留` の意味が統一される
- 元ドメイン状態を変更しない
- 保留は当日だけ有効
- 翌日は通常判定へ戻る
- Taskの `waiting` と混同しない
- B-33の期限超過表示と矛盾しない
- B-36/B-37の実施済み履歴・再掲抑制と責務分離される
