# OTOMO COMES 最終監査 受け入れテスト追加 v0.1

Status: Accepted

本書は `docs/acceptance-tests-v0.2.md` の追加BLOCKINGテストである。

B-33以降の最終監査で確定した仕様を対象とし、v0.2の既存テストを置換しない。

## 判定ルール

- **BLOCKING**: FAILならMVP完了扱いにしない
- PASS / FAIL / NOT TESTEDで記録
- 後発Accepted Decisionを正本とする

---

## FA-01 Task期限バケット

**BLOCKING**

- AI Analysis Resultの `date` を基準日Dとする
- `today` は `due_date = D`
- `within_week` は `D+1` 〜 `D+7`
- `not_urgent` は期限なし、または `D+7` より後
- 相対日付整合はApplication Semantic Validationで検証する
- 不整合をサイレント補正しない

---

## FA-02 期限超過表示

**BLOCKING**

- 未完了かつ `due_date < D` のTaskは表示上 `今日やること` へ昇格する
- `期限切れ` シグナルを表示する
- 保存済み `due_bucket / due_date` を自動変更しない

---

## FA-03 Manual / Imported Task Fallback

**BLOCKING**

`due_bucket is null` でも3レーンへ投影できる。

- due_date優先
- due_date無し・due_at有りならorganization timezoneのローカル日付を利用
- 今日以前 → today
- 翌日〜7日後 → within_week
- 8日後以降 / 期限なし → not_urgent
- FallbackだけでDBへbucketを書き戻さない

---

## FA-04 HOME保留

**BLOCKING**

4カード共通で `保留 = 当日HOMEからだけ外す` が成立する。

- self_action
- delegation
- praise
- bottleneck

保留時:
- 元ドメインstatusを変更しない
- Taskをwaitingへ変更しない
- 期限・priority・Evidence Refを変更しない
- Receiptを作らない
- 翌日は通常判定へ戻す
- `home_item_deferrals` で当日状態を保持できる

---

## FA-05 HOME完了の意味分離

**BLOCKING**

- 自分が動く → task completed
- 手放す → delegation handled
- 褒める → praise delivered
- 詰まりを取る → bottleneck resolved

異なるドメイン状態を一律 `work_items.status = completed` へ潰さない。

Praise完了で人物/KPI状態を変更しない。

Bottleneckは実解消時だけresolvedにする。

---

## FA-06 Management Action Receipt

**BLOCKING**

`management_action_receipts` が最低限以下を保持できる。

- organization / manager
- action_kind
- primary source_type / source_system / source_id
- evidence_refs
- evidence_fingerprint
- performed_by / performed_at
- request_id nullable

Receiptは追記型である。

同一requestの二重実行で重複Receiptを作らない。

---

## FA-07 Evidence Fingerprint

**BLOCKING**

fingerprint生成はB-36 v1.3準拠。

- source_type / source_system / source_idだけを使用
- `source_type|source_system|source_id` に正規化
- 重複行除去
- Unicode code point順でsort
- `\n` join、末尾改行なし
- UTF-8 bytesへSHA-256
- lowercase hex 64文字
- labelを含めない

Evidence Ref配列順やlabel変更だけでfingerprintが変わらない。

---

## FA-08 再掲抑制

**BLOCKING**

- `action_kind + evidence_fingerprint` が同一で実施済みなら再掲しない
- 日付変更だけでは新候補扱いにしない
- 新しいEvidence Ref追加でfingerprintが変われば新候補として再掲可能
- fingerprint生成不能時は推測抑制しない

---

## FA-09 AI Proposal / HOME境界

**BLOCKING**

HOME上段へ直接表示しない:
- pending AI Proposal
- held AI Proposal
- rejected AI Proposal

accepted済みProposalだけがTask等を介してHOME実行対象になれる。

AI Proposal採否は専用画面で行い、HOMEへ `採用` 操作を追加しない。

---

## FA-10 HOME単一カード表示

**BLOCKING**

同一対象をHOME上段へ重複表示しない。

AI action_type主カード:
- priority_task / follow_up / one_on_one / systemization → 自分が動く
- delegate → 手放す
- praise → 褒める
- bottleneck → 詰まりを取る

accepted AI ProposalからTaskが存在しても、HOMEでは主カード1件だけ表示する。

Task画面ではTaskを保持する。

---

## FA-11 HOME完了 / Backing Task同期

**BLOCKING**

HOMEでドメイン行動を完了した場合、同じaccepted AI ProposalのBacking Taskがあれば同一transactionでcompletedにする。

同一transaction:
- 必要なdomain update
- Management Action Receipt作成
- Backing Task完了

逆方向は自動同期しない。

Task画面でBacking Taskをcompletedにしただけでは、delegation handled / praise delivered / bottleneck resolvedを自動確定しない。

---

## FA-12 HOME期限ソート

**BLOCKING**

`期限` sort:
1. 期限超過
2. 明示期限ありを近い順
3. 期限なし

期限なし候補へ停滞日数・生成日等から擬似期限を作らない。

organization timezoneを使用する。

---

## FA-13 HOME優先度ソート

**BLOCKING**

`優先度` sort:
1. high
2. medium
3. low
4. 未設定

priority未設定候補へrisk / KPI / 人物属性等から推測priorityを付けない。

同条件では期限、安定ID等で決定的に並べる。

---

## FA-14 DB Persistence Addendum

**BLOCKING**

B-41 v1.1を満たす。

- `home_item_deferrals`
- `management_action_receipts`
- `evidence_refs`
- `evidence_fingerprint`
- B-33期限表示との整合
- B-40単一カード投影との整合

B-34のTask専用deferralテーブルを別物として二重実装しない。

---

## Final Implementation Gate

設計・Core/UI/AI契約として未解決を許容するのは、実データ確認が必要な以下のみ。

- B-04 CRM → Daily Work Log実データmapping
- B-09 Meet / Drive実ファイル識別検証

B-04/B-09の実データがない状態でAdapter固有mappingを推測実装してはならない。
