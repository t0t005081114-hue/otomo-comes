# B-06 停滞判定の時刻基準決定

Status: Accepted
Decision ID: B-06

## 結論

OTOMO COMES MVPの停滞判定は、**営業日ベースの経過時間**を基本とし、案件の停止理由を必ず併記する。

単純に「更新がない=本人の停滞」とは扱わない。

## 初期閾値

MVPデフォルト:

- 1営業日相当の更新なし: `needs_check`
- 2営業日相当の更新なし: `stalled`

ただし停止理由が `external_wait` に該当する場合は、担当者本人の停滞評価に含めない。

## 営業日換算

- 土日を除外する
- 会社休日 / 祝日の厳密な休日カレンダー連携はMVPでは行わない
- 将来、organization単位のbusiness calendarを追加可能とする

## 休日の扱い

MVPでは土日を経過時間から除外する。

例:

- 金曜17:00最終更新
- 月曜19:00時点

この場合、単純72時間超ではなく「1営業日程度」として扱う。

## 案件種別ごとの閾値

MVPでは案件種別ごとの個別閾値は持たない。

まず共通デフォルトで検証し、誤検知が多い場合のみ設定拡張する。

## 停止理由

最低限、以下を扱う。

- self_work
- other_person_wait
- manager_approval_wait
- customer_wait
- information_missing
- priority_unclear
- person_dependency
- rework
- workload_concentration
- unknown

`other_person_wait` / `manager_approval_wait` / `customer_wait` は外部待ち系として扱う。

## 不明時

停止理由が判定できない場合は `unknown` とし、自動推測しない。

Decision Packでは「停滞」と断定せず、`needs_confirmation=true` を付ける。

## 再開判定

以下のいずれかを確認した場合、停滞候補は解消方向へ更新する。

- 対象案件に新しい業務イベントが発生
- ステータスが更新
- 外部待ち理由が解消
- 完了 / キャンセル

## Acceptance

B-06は以下を満たすため解決とする。

- 初期閾値が定義済み
- 実時間ではなく営業日ベースを採用
- 土日除外を定義
- 案件種別別閾値をMVPから除外
- 外部待ちと本人停滞を分離
- 不明理由を自動推測しない
