# B-14 19:00 Batch実行仕様決定

Status: Accepted
Decision ID: B-14

## 結論

OTOMO COMES 個人MVPの日次処理は、**Asia/Tokyo 19:00基準**でGitHub Actionsから起動する。

GitHub Actionsは実行トリガーであり、ビジネスロジックを保持しない。

## 実行時刻

基準時刻:

- `Asia/Tokyo 19:00`

GitHub Actions cronではUTC換算で設定する。

- JST 19:00 = UTC 10:00

ただしcronの表現自体をドメイン仕様にせず、`organization.timezone` を正本とする。

## 休日実行

MVPでは毎日実行する。

理由:

- 休日判定ロジックを過剰実装しない
- 休日でも観察ログ等が存在する可能性がある
- データが無い日は空 / partial Packとして扱える

将来、organization business calendarを追加可能とする。

## 処理順

1. CRM取得
2. Google Drive / 1on1取得
3. Manager Observation取得
4. 人物名寄せ
5. Daily Work Log生成 / 更新
6. KPI評価
7. 停滞 / ボトルネック候補抽出
8. 委譲候補抽出
9. 要フォロー / 褒める / 仕組み化候補抽出
10. Decision Pack JSON生成
11. DB保存
12. 検証用Harnessへ出力

Harness出力失敗はCOMES CoreのDecision Pack生成成功と分離して扱う。

## Retry

Retry対象:

- HTTP 429
- HTTP 5xx
- timeout
- 一時的ネットワークエラー

Retry対象外:

- 400
- 401
- 403
- Schema validation failure
- 恒久的設定不足

Retryは指数バックオフを基本とし、無制限に再試行しない。

MVPでは最大3回を初期値とする。

## 冪等性

同一日・同一managerで再実行可能にする。

Decision Packはrevision管理する。

- 同一内容の再実行: 重複revisionを作らないことを優先
- 入力データに変化あり: 新revisionを作成
- 最新revisionのみ `is_current = true`

日次集計もunique keyに基づきupsert可能にする。

## 19時以降のデータ更新

MVPでは19:00時点を初回スナップショットとする。

19時以降にCRM等が更新された場合:

- 自動で無限追従しない
- 手動再実行または明示的なre-runで再生成可能
- 再生成時は新revisionとして履歴を保持

将来、締め時刻 / finalizationルールを追加可能とする。

## 部分失敗

一部Source取得に失敗しても、取得済みSourceでDecision Pack生成可能な場合は `generation_status = partial` とする。

例:

- CRM成功
- Observation成功
- Drive失敗

→ Packは生成するが、`source_status.one_on_one = source_missing / failed` を明示する。

## 失敗ログ

ログへ出してよい:

- run id
- source名
- status
- retry回数
- record count
- duration
- error code

ログへ出さない:

- API Token
- 1on1原文
- Manager Observation本文
- 顧客情報を含むレスポンス全文

## Acceptance

B-14は以下を満たすため解決とする。

- Asia/Tokyo 19:00を基準化
- UTC換算を定義
- 休日実行方針を定義
- Retry対象 / 非対象を分離
- 最大Retryを定義
- 同日再実行の冪等性を定義
- 19時以降更新の扱いを定義
- partial generationを許容
- Harness失敗とCore成功を分離
