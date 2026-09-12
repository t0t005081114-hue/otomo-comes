# B-40 HOME単一カード表示・重複排除契約

Status: Accepted
Decision ID: B-40

## 結論

OTOMO COMES MVPでは、同一の実行対象・候補をHOME上段4カードへ重複表示しない。

1つの対象は、HOME上では原則として1つの主カードにだけ表示する。

AI Proposal由来の対象は、B-24の `action_type` と対象ドメインをもとに主カードを決定する。

## 主カード割当

基本ルール:

- `priority_task` / 通常Task / manager keeps → `自分が動く`
- `delegate` / Delegation Candidate → `手放す`
- `praise` / Praise Candidate → `褒める`
- `bottleneck` / Bottleneck → `詰まりを取る`
- `follow_up` / `one_on_one` / `systemization` は、その内容がTask化された後の主目的に従って1カードへ割り当てる

同じaccepted AI ProposalからTaskが作成されても、HOMEではTaskとして `自分が動く` に重複表示せず、元の `action_type` に対応する主カードを優先する。

Task画面では通常どおりTaskとして存在してよい。

## 同一対象の識別

可能な場合はCOMES内部IDを優先する。

- `work_item_id`
- `origin_ai_proposal_id`
- `delegation_candidate_id`
- `bottleneck_id`
- その他安定した内部ID

内部IDで直接追えない候補は、Evidence Refの `source_type + source_system + source_id` を補助キーとして扱う。

`label` の文字列一致だけで重複判定しない。

## 表示優先順位

複数カテゴリに該当し得る場合でも、次の原則で1件に集約する。

1. 明示されたAI `action_type` がある場合はそれを優先
2. COMESの専用候補ドメインがある場合はそのドメインを優先
3. それ以外はTaskとして `自分が動く`

例:

- `praise` Proposal採用 → Task作成済みでもHOMEは `褒める` のみ
- `delegate` Proposal採用 → Task作成済みでもHOMEは `手放す` のみ
- `bottleneck` Proposal採用 → Task作成済みでもHOMEは `詰まりを取る` のみ
- `priority_task` Proposal採用 → `自分が動く`

## HOME操作との関係

B-35 / B-36 / B-39の操作は、HOME上で採用された主カードの意味に従う。

- `完了` は主カード種別の意味で処理する
- `保留` は主カード上の表示だけを当日deferする
- 同一対象の別カード表示が存在しないため、片方だけ完了・片方だけ残存する状態を作らない

## 非採用

- 同じaccepted AI ProposalをTaskと候補の両方としてHOMEへ二重表示する
- 同じEvidence Refを複数カードへ機械的に複製する
- 表示文言の一致だけで重複排除する
- Task画面から元Taskを削除して重複を防ぐ

## Acceptance

- 同一対象がHOME上段で1件だけ表示される
- accepted AI Proposal由来Taskが主カードと `自分が動く` に二重表示されない
- `action_type` に応じた主カード割当が一貫する
- HOMEの完了 / 保留操作が対象ごとに1箇所へ集約される
- Task画面ではTask自体を保持できる
