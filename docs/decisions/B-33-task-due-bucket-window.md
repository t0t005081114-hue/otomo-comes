# B-33 Task期限バケットの期間境界

Status: Accepted v1.1
Decision ID: B-33

## 結論

OTOMO COMES MVPの `due_bucket` は、AI Analysis ResultのTop-level `date` を基準日として、**ローリング7日**で判定する。

カレンダー週（月曜〜日曜等）には依存しない。

Task画面では、未完了の期限超過タスクを**表示上「今日やること」へ繰り上げ**、`期限切れ` シグナルを付ける。元の `due_date` は変更しない。

## 期間境界

基準日を `D` とする。

- `today`: `due_date = D`
- `within_week`: `D + 1日` 以上 `D + 7日` 以下
- `not_urgent`: `due_date` なし、または `D + 7日` より後

例: `date = 2026-09-13`

- `today`: 2026-09-13
- `within_week`: 2026-09-14 〜 2026-09-20
- `not_urgent`: 2026-09-21以降、または具体期限なし

## Validation

JSON Schemaでは相対日付範囲を表現せず、COMES Application境界のSemantic Validationで検証する。

- `today` なのに `due_date != date` → import failure
- `within_week` なのに `due_date` が `date + 1` 〜 `date + 7` の範囲外 → import failure
- `not_urgent` なのに `due_date` が `date` 〜 `date + 7` の範囲内 → import failure

COMESは不整合な `due_bucket / due_date` を自動補正しない。外部AIへ再生成・修正を求める。

## 基準日の意味

期間判定には、取込日時や現在日時ではなく、B-24 AI Analysis ResultのTop-level `date` を使用する。

これにより、前夜に翌日分のAI結果を生成する運用でも期間境界が安定する。

## 期限超過タスクの表示

Task画面のレーンは保存済み `due_bucket` をそのまま表示するのではなく、**現在日付に対する表示分類**として計算する。

未完了タスクで `due_date < current_date` の場合:

- 表示レーン: `今日やること`
- シグナル: `期限切れ`
- 元の `due_date`: 変更しない
- 保存済み `due_bucket`: 自動書き換えしない

完了済み / cancelled タスクはこの繰り上げ対象にしない。

原則:
- 期限切れを隠さない
- 過去期限を今日の日付へ自動変更しない
- 履歴再現性のため元期限を保持する
- 表示上の緊急性と保存上の元データを分離する

## 非採用

- カレンダー週単位の「今週中」
- 曜日によって長さが変わる `within_week`
- import時刻を基準にした期間判定
- 不整合値のサイレント補正
- 期限超過時に元の `due_date` を当日へ自動変更する
- 期限超過タスクを元レーンへ残して見落としやすくする

## Acceptance

- `within_week` が常に基準日の翌日から7日後までである
- 曜日に依存しない
- `today / within_week / not_urgent` と `due_date` の整合を機械検証できる
- 基準日はAI Analysis Resultの `date` である
- 未完了の期限超過タスクは表示上 `今日やること` に現れる
- 期限超過タスクには `期限切れ` シグナルが付く
- 期限超過しても元の `due_date` と保存済み `due_bucket` は自動変更されない
