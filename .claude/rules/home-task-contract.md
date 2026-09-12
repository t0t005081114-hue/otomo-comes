---
description: 最終監査で確定したHOME/Taskの操作・表示・保存契約（B-33〜B-47）。HOME/Task/Decision Pack周辺を触るとき必ず守る。
paths:
  - "src/app/**"
  - "src/**/home/**"
  - "src/**/task/**"
  - "src/**/tasks/**"
  - "src/**/*home*"
  - "src/**/*task*"
  - "src/**/*deferral*"
  - "src/**/*receipt*"
  - "supabase/**"
---

# HOME / Task contract rules

最終監査で確定した後発Accepted Decision（B-33〜B-47）。
これらは**既存の仕様記述より優先する**（B-41 §8）。推測で実装しない。

## 期限バケット（B-33 / B-43）

基準日を `D` とする。

- `today` = `due_date = D`
- `within_week` = `D+1` 〜 `D+7`（**rolling 7 days**。カレンダー週・曜日に依存しない）
- `not_urgent` = 期限なし、または `D+7` より後

AI import時の基準日はB-24 top-levelの `date`（取込日時・現在日時ではない）。

### 期限超過（B-33）

- 未完了かつ `due_date < 現在日付` → **表示上** `今日やること` レーンへ昇格し `期限切れ` シグナルを付ける
- `due_date` / 保存済み `due_bucket` は**変更しない**
- 完了済み / cancelledは昇格対象にしない

### 手動 / imported Task（B-43）

`due_bucket is null` でも3レーンへ投影する。基準日 `D` は `organization.timezone` のローカル日付。

期限日 `X` の解決（優先順）:

1. `due_date` があればそれ
2. なければ `due_at` を `organization.timezone` のローカル日付へ変換
3. どちらも無ければ `not_urgent`

`X` から表示bucketへ:

- `X <= D` → `today`（B-33の `due_date = D` と異なり、過去日も `today` に入る）
- `D+1 <= X <= D+7` → `within_week`
- `X > D+7` → `not_urgent`
- 期限なし → `not_urgent`
- `X < D` のときは `期限切れ` シグナルを付ける

保存済み `due_bucket` がある場合は原則その値を使う（B-33の期限超過昇格のみ表示上適用）。

Fallbackは**表示投影のみ**。計算結果をDBへ書き戻さない。`due_date` / `due_at` をFallbackのために書き換えない。
`due_bucket is null` のTaskを画面から除外しない。期限なしTaskを分類不能にしない。

## HOME「保留」（B-34 / B-39）

上段4カード（自分が動く / 手放す / 褒める / 詰まりを取る）**共通**で、意味は
**「その日のHOME表示からだけ一時的に外す」**。

- 元ドメインのstatusを変更しない（`work_items.status` / `delegation_candidates.status` / `bottlenecks.status` すべて）
- `work_items.status = waiting` で代用しない（`waiting` は外部待ち等の業務事実状態）
- `due_date` / `due_at` / `due_bucket` / 優先度 / Evidence Refを変更しない
- `bottlenecks.resolved_at` を設定しない
- Praise保留でReceiptを作らない
- Task画面 / Decision Pack / Team画面 / 履歴から元データを消さない
- **当日限り。** `D+1` 以降は通常の表示判定へ戻す
- 保存先は `home_item_deferrals`。`subject_person_id` を考慮し、同じ根拠でも別人物の候補は独立して保留できる

## HOME「完了」（B-35 / B-36 / B-42）

表示ラベルは共通で `完了` でよいが、**内部動作はカードごとに違う**。4カードを一律
`work_items.status = completed` へ潰さない。

| カード | 意味 | 元ドメイン | Receipt `action_kind` |
|---|---|---|---|
| 自分が動く | タスク完了 | `work_items.status = completed` | `task_completed` |
| 手放す | 委譲対応済み | 元タスクを自動completedにしない | `delegation_handled` |
| 褒める | 称賛実施済み | 人物・KPI状態を変更しない | `praise_delivered` |
| 詰まりを取る | ボトルネック解消済み | 実解消時のみ `bottlenecks.status = resolved` + `resolved_at` | `bottleneck_resolved` |

- 確認しただけでresolvedにしない。
- 「完了」を人物評価・成果評価として保存しない。
- Receiptは追記型。元データを置換しない。
- 同一操作の二重実行を防ぐ（`request_id` が使える場合は同一requestとして扱う）。

### Backing Task同期（B-42）

HOMEでドメイン行動を完了したとき、同じaccepted AI Proposal由来のBacking Taskが存在すれば
**同一transactionで** `work_items.status = completed` にする。

同一transactionで扱うもの:
- 元ドメインの必要な状態更新
- `management_action_receipts` 作成
- Backing Task完了

**逆方向は自動同期しない。** Task単体を完了しただけで `delegation_handled` / `praise_delivered` /
`bottleneck_resolved` Receiptやドメイン状態変更を行わない（作業完了 ≠ 管理上の論点解消）。

## 再掲抑制（B-36 / B-37）

候補生成後、Decision Pack / HOME掲載前に `management_action_receipts` と照合する。

比較キー:

- 人物対象あり: `action_kind + subject_person_id + evidence_fingerprint`
- 人物対象なし: `action_kind + source_type + source_system + source_id + evidence_fingerprint`

`evidence_fingerprint` はB-36のcanonical手順（`source_type|source_system|source_id` へ正規化 →
重複除去 → Unicode code point昇順sort → `\n` 連結 → UTF-8 bytesへSHA-256 → 小文字hex64）。
`label` を含めない。配列順序で結果が変わってはいけない。

- 同一比較キーで実施済み → 抑制
- `subject_person_id` が異なる → 別候補（相互抑制しない）
- 新しいEvidence Refが追加されfingerprintが変わる → 新候補として表示可能
- **日付が変わっただけでは新候補扱いにしない**
- 人物単位で永久抑制しない
- 安定したfingerprintを作れない → 推測で抑制せず `needs_confirmation`
- ReceiptをEvidence Refへ混ぜて元事実を置換しない

## AI ProposalとHOMEの境界（B-38）

HOME上段の実行カードへ**直接出さない**:

- `ai_proposals.status = pending`
- `ai_proposals.status = held`
- `ai_proposals.status = rejected`

HOMEへ出してよいのは、accepted Proposal由来のTask / アクション、手動・imported Task、
COMESが現在候補として確立しているDelegation / Praise Candidate、openなBottleneck。

- HOMEに `採用` 操作を追加しない。採否はDecision Pack / AI Proposal画面で行う。
- HOMEの `保留` とAI Proposalの `held` を同一状態として扱わない。
- 人間判断前のAI提案をTaskへ自動変換しない。

## 単一カード表示（B-40）

同一対象はHOME上段で**1つの主カードにだけ**表示する。

| 由来 | 主カード |
|---|---|
| `priority_task` / 通常Task / manager keeps | 自分が動く |
| `follow_up` | 自分が動く |
| `one_on_one` | 自分が動く |
| `systemization` | 自分が動く |
| `delegate` / Delegation Candidate | 手放す |
| `praise` / Praise Candidate | 褒める |
| `bottleneck` / Bottleneck | 詰まりを取る |

- `follow_up` / `one_on_one` / `systemization` のためにHOMEカードを増やさない。
- accepted ProposalからTaskが作られても、HOMEでは `action_type` に対応する主カードを優先し、`自分が動く` へ二重表示しない。Task画面にはTaskとして存在してよい。
- 同一性判定は内部ID優先（`work_item_id` / `origin_ai_proposal_id` / `delegation_candidate_id` / `bottleneck_id`）。追えない場合の補助キーは `source_type + source_system + source_id`。
- **`label` の文字列一致で重複判定しない。**
- 重複を防ぐためにTask画面から元Taskを削除しない。

## ソート（B-27 / B-44 / B-45）

共通並び替えは `優先度`（既定）と `期限` のみ。**影響度ソートは持たない**（B-31 §7）。
カードごとの個別ソート状態を持たせず、1つのUIで4カードへ同時適用する。表示は上位3件 + `ほかN件`。

### 優先度ソート（B-45）

1. high → 2. medium → 3. low → 4. **priority未設定**

同一priority内のtie-break: 明示期限の近い順 → 期限超過を先 → 安定した内部ID / HOME item key昇順。

- priority未設定候補へ**推測でpriorityを付与しない**。
- `risk_level = high` をpriority = highへ自動変換しない。停滞日数・KPI値・人物属性からpriorityを推測しない。
- AIがaccepted Proposalで明示したpriorityのみ利用してよい。
- priority未設定候補を非表示にしない。

### 期限ソート（B-44）

1. 期限超過の未完了item → 2. 明示期限ありを期限の近い順 → 3. 期限なし

tie-break: priorityが使えれば high→medium→low → 安定した内部ID / HOME item key昇順。

- 期限を持たない候補へ**擬似的な締切を推測付与しない**（停滞日数・生成日・1on1日・Praise発生日を期限へ読み替えない）。
- 期限なしitem同士を生成時刻で「期限が近い」ように見せない。
- 同一入力で表示順が揺れないこと（決定的であること）。

## 「タスクを見る」（B-46）

表示するのは**実在するTask参照がある場合だけ**。

- HOME item自身が `work_items`
- accepted AI Proposal由来で `ai_proposals.task_work_item_id` が存在する
- その他、明示的なrelated work item IDが存在する

Task参照がない場合は `タスクを見る` を出さない（`完了` / `保留` の意味は維持）。
**表示のためだけに候補を自動Task化しない。** 空のTask画面へ遷移させない。
新しい共通操作（`詳細を見る` 等）をHOMEへ増やさない。

## AI action担当者（B-47）

`action.assignee_person_id` は**Decision Packの `manager_id` と一致必須**。
不一致のactionを含むAI結果はimport failure。COMESがassigneeを自動修正しない。

委譲先は `delegate_to_person_id`、フォロー・称賛・1on1の対象は `related_person_ids` で表す。
B-24 actionを部下へ直接割り当てるTaskとして使わない。

## HOMEのその他（B-30 / B-31 / B-29）

- 今日のモードは1行表示。Decision PackはHOME上ではステータス表示のみ（`確認済み` 操作を持たない）。
- 当日のHOMEは**翌朝時点で取込済みの最新AI結果**を基準として固定（`home_daily_ai_baselines`）。日中に新しいAI結果を取り込んでも当日基準を自動差し替えしない。
- AI結果が一度も無い場合は未生成 / 未取込として静かに表示し、**存在しない判断を補完しない**。
- 当日予定0件のときのみ、翌日以降で最も近い予定を1件だけ表示する（日付を明示）。
- チームKPIは表示名。データはB-05の `owner_type = organization` を使い、Team専用KPIモデルを追加しない。
- 警告を煽らない（強い赤 / 警告帯 / 点滅 / 過剰バッジを避ける）。
- Mobileは縦積み。PCの縮小版にしない。
