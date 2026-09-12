# B-05 KPI設定モデル決定

Status: Accepted
Decision ID: B-05

## 結論

OTOMO COMES MVPのKPIモデルは、**個人KPIと組織KPIの両方を扱う**。Team専用モデルやKPIツリーはMVPでは持たない。

KPIは「評価」ではなく、マネージャーが見るべき差分・継続未達を検出するための事実として扱う。

## 対象

- `owner_type = person`
- `owner_type = organization`

TeamはMVP対象外。必要性が確認された段階で追加する。

## 値の型

- `count`
- `rate`
- `amount`
- `duration`
- `score`

## 評価方向

KPIごとに以下を持つ。

- `higher_is_better`
- `lower_is_better`

例:

- アポ数: higher_is_better
- 差し戻し率: lower_is_better
- 平均処理時間: lower_is_better

B-02の `kpi_definitions` には `evaluation_direction` を追加する。

## 評価周期

- `daily`
- `weekly`
- `monthly`

MVPでは四半期・年次は扱わない。

## 閾値

KPI定義は以下を持つ。

- `target_value`
- `warning_threshold`
- `critical_threshold`
- `consecutive_miss_limit`

閾値は絶対値ではなく、原則として目標に対する達成率または乖離率で評価する。

初期デフォルト例:

- 100%以上: on_track
- 80〜99%: check
- 60〜79%: warning
- 60%未満: critical

ただし `lower_is_better` KPIでは方向を反転して評価する。

## 連続未達

連続未達はKPIごとの `consecutive_miss_limit` で管理する。

MVPデフォルトは2評価期間連続。

例:

- daily KPI: 2営業日連続
- weekly KPI: 2週連続
- monthly KPI: 2か月連続

## スナップショット

`kpi_results` には評価時点の `target_value_snapshot` を保存する。

理由:

- 後から目標値が変わっても過去評価を改変しない
- Decision Packの根拠を再現できる

## KPIツリー

MVPでは上位KPI / 下位KPIの依存関係を実装しない。

必要なら `parent_kpi_definition_id` を将来追加する。

## COMESの責務

COMESは次を行う。

- 目標との差分計算
- 達成率 / 乖離率計算
- 連続未達判定
- Decision Packへの警告候補出力

COMESは次を行わない。

- KPIだけで人物を評価する
- モチベーションや能力を断定する
- KPI未達だけを根拠に介入を自動決定する

## Acceptance

B-05は以下を満たすため解決とする。

- 個人 / 組織KPIの対象が定義済み
- 値型が定義済み
- 評価方向が定義済み
- 評価周期が定義済み
- 閾値が定義済み
- 連続未達条件が定義済み
- KPIツリーをMVPから除外済み
