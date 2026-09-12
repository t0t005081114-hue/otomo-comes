# B-34 HOMEタスク「保留」の意味契約

Status: Accepted
Decision ID: B-34

## 結論

OTOMO COMES MVPのHOMEクイック操作 `保留` は、**タスク本体の業務状態を `waiting` へ変更する操作ではなく、その日のHOME上で一時的に優先表示から外すUI上のdefer操作**とする。

`waiting` は業務そのものが外部待ち・承認待ち等で進行停止している事実状態として維持し、HOMEの一時保留と混同しない。

## 動作

ユーザーがHOME上でタスクを `保留` した場合:

- `work_items.status` は変更しない
- `due_date` / `due_at` は変更しない
- `due_bucket` は変更しない
- その日のHOME上では優先表示から外す
- 翌日になれば通常のHOME表示判定へ戻す
- 期限超過している場合はB-33に従い、翌日の表示判定で再び `今日やること` の対象になり得る

## 保存モデル

MVPでは、タスク本体の状態と分離した軽量な日次defer状態を持つ。

推奨論理モデル:

```text
home_task_deferrals
- id uuid PK
- organization_id uuid FK
- manager_person_id uuid FK
- work_item_id uuid FK
- defer_date date
- created_at timestamptz
```

Unique:

```text
(organization_id, manager_person_id, work_item_id, defer_date)
```

実装上、同等の意味を保てる別構造でもよいが、`work_items.status = waiting` で代用してはならない。

## 表示ルール

基準日を `D` とする。

- `defer_date = D` のタスクは、その日のHOME上段の通常候補から除外する
- Task画面や履歴からタスク自体を消さない
- `D + 1` 以降は、その日の条件に基づき再び表示判定する
- 保留中であっても、タスク自体が完了・キャンセルされた場合はその状態を正本とする

## 非採用

- HOME保留で `work_items.status = waiting` に変更する
- HOME保留で期限を自動延期する
- HOME保留で `due_bucket` を自動変更する
- 一度保留したタスクを無期限にHOMEから隠す

## Acceptance

- HOMEの `保留` と業務状態 `waiting` が分離されている
- 保留してもタスク本体の期限・状態を改変しない
- 保留は当日限りである
- 翌日は通常の表示判定へ戻る
- B-33の期限超過表示ルールと矛盾しない
