# B-43 手動・取込Taskの期限バケットFallback

Status: Accepted
Decision ID: B-43

## 結論

`work_items.due_bucket` がnullでも、Task画面の3分類へ必ず投影できるよう、手動作成・imported Taskには期限情報から表示用bucketを算出するFallbackを持つ。

B-32が互換性のため `due_bucket` nullableを許容する方針は維持する。

## 対象

主に:
- `origin_type = manual`
- `origin_type = imported`
- 既存データで `due_bucket is null` のTask

AI Proposal由来TaskはB-24/B-33に従い `due_bucket` 必須のため通常このFallbackを使わない。

## 表示用bucket算出

基準日 `D` は `organization.timezone` のローカル日付とする。

優先順位:

1. `due_date` がある場合、その日付を使う。
2. `due_date` がなく `due_at` がある場合、`organization.timezone` へ変換したローカル日付を使う。
3. どちらも無い場合は `not_urgent` とする。

期限日を `X` とする。

- `X <= D` → 表示上 `today`
- `D + 1 <= X <= D + 7` → `within_week`
- `X > D + 7` → `not_urgent`
- 期限なし → `not_urgent`

`X < D` の場合は `期限切れ` シグナルを付ける。

## 保存値との関係

Fallbackは表示投影であり、`due_bucket is null` を自動更新しない。

ユーザーがTask編集画面で明示的にbucketまたは期限を変更した場合のみ、その入力を正本へ保存する。

既存 `due_date / due_at` をFallbackのために書き換えない。

## due_bucketが既にある場合

保存済み `due_bucket` が存在する場合は原則その値を使用する。

ただしB-33に従い、未完了かつ期限日が過去の場合はHOME/Task表示上 `today` へ昇格し `期限切れ` を表示する。保存値は変更しない。

## 非採用

- due_bucket nullのTaskを画面から除外する
- 期限なしTaskを分類不能にする
- `due_at` をUTC日付のまま分類する
- Fallback計算結果を無条件にDBへ書き戻す

## Acceptance

- due_bucket nullの手動/imported Taskも3レーンのいずれかへ表示できる
- organization timezoneを基準にする
- 期限超過はtoday表示 + 期限切れになる
- Fallbackだけで保存済みTaskを改変しない
- B-33のローリング7日表示と整合する
