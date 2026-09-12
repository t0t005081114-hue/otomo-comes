# B-33 Task期限バケットの期間境界

Status: Accepted
Decision ID: B-33

## 結論

OTOMO COMES MVPの `due_bucket` は、AI Analysis ResultのTop-level `date` を基準日として、**ローリング7日**で判定する。

カレンダー週（月曜〜日曜等）には依存しない。

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

## 非採用

- カレンダー週単位の「今週中」
- 曜日によって長さが変わる `within_week`
- import時刻を基準にした期間判定
- 不整合値のサイレント補正

## Acceptance

- `within_week` が常に基準日の翌日から7日後までである
- 曜日に依存しない
- `today / within_week / not_urgent` と `due_date` の整合を機械検証できる
- 基準日はAI Analysis Resultの `date` である
