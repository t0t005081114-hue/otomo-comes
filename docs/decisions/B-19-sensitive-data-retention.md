# B-19 機微情報・ログ・保持方針

Status: Accepted
Decision ID: B-19

## 結論

OTOMO COMES の個人MVPおよび将来公開版では、1on1原文・Manager Observation・要約・ログを同じ扱いにせず、**機微度と責務に応じて保持先・閲覧範囲・保持期間を分離する**。

本決定では以下を採用する。

- 1on1原文は COMES DB に保存しない
- 1on1原文の正本は Google Drive 側に置く
- COMES DB には参照情報と構造化要約のみ保持する
- Manager Observation は COMES 自身の入力データとして COMES DB を正本とする
- 1on1要約・Manager Observation の保持期間は組織設定で変更可能とする
- MVPの初期保持期間は **1年**
- アプリログ / GitHub Actionsログへ原文・観察内容・機密データを出力しない

---

## 1. 1on1原文

### 正本

Google Drive を正本とする。

COMES DB には原文本文を保存しない。

保持するのは最低限以下。

- `source_file_id`
- `source_file_name`
- `source_modified_at`
- `held_at`
- `manager_person_id`
- `subject_person_id`
- `source_type`
- `raw_text_ref`
- 必要に応じた構造化要約

### 理由

- 1on1原文は機微性が高い
- 同じ本文をDriveとCOMES DBへ二重保存しない
- 原文へのアクセス制御をGoogle Workspace側にも委ねられる
- 個人MVPで不要な機微情報コピーを増やさない

### 禁止

- 1on1全文を `one_on_one_logs` の本文列として保存
- GitHub Repositoryへ保存
- GitHub Actions artifactへ原文保存
- デバッグログへの全文出力

---

## 2. 1on1要約

COMESがマネジメント判断に必要とする要約・構造化情報はDBへ保持可能とする。

例:

- 問題・懸念
- うまくいっている点
- 負荷に関する本人発言
- 自信がついた業務
- 不安な業務
- 委譲希望
- 支援依頼
- 前回からの変化
- 継続論点
- 次回確認事項

ただし、要約も機微情報として扱う。

### 表現原則

事実と推測を分ける。

例:

良い:

`本人が「今週は案件数が多く負荷が高い」と発言`

悪い:

`モチベーション低下`

明示的根拠がない心理状態を断定しない。

---

## 3. Manager Observation

Manager Observation は COMES DB を正本とする。

理由:

- COMESの正式入力データである
- Drive等の外部サービス由来ではない
- Decision Pack生成に直接利用する
- 観測事実とマネージャー所感を分離して保持する

保持項目は B-02 の `manager_observations` を使用する。

特に以下を分離する。

- `observed_fact`: 観測した事実
- `manager_impression`: マネージャーの所感

`manager_impression` を事実としてAIへ渡してはならない。

---

## 4. 保持期間

### 組織設定

公開版では組織単位で保持期間を設定可能とする。

対象:

- 1on1要約
- Manager Observation
- 1on1構造化Insight

### MVP初期値

**1年**

MVPでは設定UIが未実装の場合でも、論理設定値として1年を採用する。

例:

```text
sensitive_management_retention_days = 365
```

### 保持期間経過後

MVPでは以下を基本方針とする。

- 削除対象を識別可能にする
- 自動削除の実装はMVP必須にしない
- 公開版までに定期削除ジョブまたは管理操作を実装する

保持期限切れデータを無期限に残す設計を恒久仕様にはしない。

---

## 5. Decision Packへの掲載

Decision Packへ1on1原文を直接埋め込まない。

Decision Packには、判断に必要な最小限の要約・evidence referenceのみを渡す。

例:

```json
{
  "type": "one_on_one_summary",
  "summary": "本人が直近の案件負荷について懸念を表明",
  "source_ref": "one_on_one_log:<id>",
  "data_status": "known"
}
```

原文が必要な場合のみ、権限を持つ利用者が元ソースを参照する。

---

## 6. ログ出力方針

アプリログ・GitHub Actionsログへ以下を出力しない。

- 1on1原文
- Manager Observation本文
- 1on1要約本文
- Google OAuth token
- CRM Service Token
- API response全文
- 顧客・社員の不要な個人情報

許可するログ例:

```text
request_id
source_type
record_count
status
error_code
duration_ms
person_resolution_status
pack_date
revision
```

必要に応じてIDを出す場合も、業務内容本文は出さない。

---

## 7. エラー処理

エラー本文へ原文や秘密情報を連結しない。

禁止例:

```text
Failed to parse transcript: <全文>
```

許可例:

```text
Failed to parse transcript file_id=abc123 error_code=PARSE_FAILED
```

外部SDKの例外にtokenや本文が含まれる可能性がある場合は、ログへ出す前にサニタイズする。

---

## 8. 閲覧権限との関係

B-18の権限方針を適用する。

- 直属マネージャー: 原文参照 + 要約
- 上位マネージャー: 要約のみ
- 別系統マネージャー: 閲覧不可
- 本人: MVPでは原則非表示
- owner: ownerロールだけを理由に全原文へアクセス不可

原文参照はGoogle Drive権限も満たしている必要がある。

COMES上の権限があっても、外部Drive権限を迂回して原文を取得する仕組みは作らない。

---

## 9. Google連携アカウントとの分離

COMESのログインIdentityとGoogle Workspace接続は別管理する。

例:

```text
個人Googleアカウント
→ COMES Login / Supabase Auth

会社Google Workspaceアカウント
→ External Connection
→ Drive / Meet source
```

Google Workspace接続解除時も、COMES利用者Identityは失わない。

---

## 10. 公開版で追加検討するもの

MVPでは過剰実装しないが、公開前に以下を再評価する。

- retention削除ジョブ
- 組織別保持期間UI
- export / delete request
- 監査ログ
- 原文アクセス履歴
- 接続解除時のデータ処理
- データ処理規約 / 利用規約
- 暗号化要件

---

## Acceptance

B-19は以下を満たしたため解決とする。

- 1on1原文をCOMES DBへ保存しない
- Driveを原文正本とする
- COMES DBには参照情報と要約のみ保存する
- Manager ObservationはCOMES DBを正本とする
- 保持期間を組織設定可能とする
- MVP初期保持期間を1年とする
- 原文・観察内容・tokenをログへ出さない
- B-18の閲覧権限と整合する
