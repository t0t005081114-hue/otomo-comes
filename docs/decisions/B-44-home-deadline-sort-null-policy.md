# B-44 HOME期限ソートのnull期限ポリシー

Status: Accepted
Decision ID: B-44

## 結論

HOME上段4カードの共通並び替え `期限` は、明示的な期限情報だけを使う。

期限を持たない候補へ擬似的な締切を推測付与しない。

## 期限ソートキー

各HOME itemについて、表示用期限を次の順で解決する。

1. `due_date` があればその日付
2. `due_date` がなく `due_at` があれば、`organization.timezone` に変換したローカル日時
3. どちらも無ければ期限なし

Delegation Candidate / Praise Candidate / Bottleneck等で明示期限が無い場合、停滞日数・生成日・1on1日等を期限として代用しない。

## 並び順

`期限` 選択時:

1. 期限超過の未完了item
2. 明示期限ありitemを期限の近い順
3. 期限なしitem

同一区分内のtie-break:

1. `priority` が利用可能なら high → medium → low
2. それでも同じなら安定した内部ID / HOME item keyの昇順

期限なしitem同士で、生成時刻等を使って「期限が近い」と見せない。

## priorityが無い候補

priorityを持たない候補は、同一区分内でpriorityを推測生成しない。

既存の候補抽出順または安定した内部IDをtie-breakに使う。

## 期限超過

B-33/B-43と同様、期限超過は表示上強制的に最上位群へ置き、`期限切れ` シグナルを付ける。

保存済み期限・bucketは変更しない。

## 非採用

- 停滞日数を期限へ読み替える
- Praiseの発生日を締切へ読み替える
- Delegation Candidate生成日を締切へ読み替える
- 期限なしitemをランダム順にする

## Acceptance

- 共通 `期限` ソートが4カードで同じ意味になる
- 期限なし候補へ架空の期限を作らない
- 期限超過が先頭群に出る
- 期限なしitemは期限ありitemの後ろに安定表示される
- 同条件で表示順が不安定に揺れない
