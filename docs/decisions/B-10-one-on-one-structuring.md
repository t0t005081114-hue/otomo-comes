# B-10 1on1構造化方式決定

Status: Accepted
Decision ID: B-10

## 結論

個人検証版では、1on1は **原文取得を自動化し、意味理解を伴う構造化はCOMES Coreで自動実行しない**。

MVPの基本フロー:

```text
Google Meet / Drive
↓
原文・メタデータ取得
↓
人物・日時・ファイルIDを紐付け
↓
COMES DBへ1on1 Logとして保存
↓
Decision Packには「参照可能な1on1情報」として渡す
↓
ChatGPT AI上司が必要時に読んで判断
```

これにより、個人検証版でLLM APIを使わずに成立させる。

---

## 1. COMESが自動で行うこと

- Drive上の対象ファイル検出
- ファイルID取得
- ファイル名取得
- 更新日時取得
- 対象者候補の名寄せ
- 実施日の取得
- 原文取得または原文参照の保存
- 同一ファイル更新時の再取得判定
- 未解決人物を `needs_confirmation` として保持

COMESは、原文だけから「本人のモチベーションが低い」等の人物判断を自動確定しない。

---

## 2. COMESがMVPで自動化しないこと

以下はLLM APIなしでは誤判定リスクが高いため、Coreの必須処理にしない。

- 発言意図の意味分類
- 感情推定
- モチベーション判定
- 成長・不安・不満の自動断定
- 複数発言をまたいだ要約
- 次回質問の自動生成

ルールベースで高精度に抽出できる事実が将来確認できた場合のみ追加検討する。

---

## 3. `one_on_one_insights` の扱い

B-02で定義した `one_on_one_insights` は残す。

ただし個人MVPでは、以下のいずれかから生成する。

1. マネージャーの手動登録
2. ChatGPT AI上司の分析結果を人間が確認して保存
3. 将来のAI Analysis Adapter

ChatGPT側の分析結果を、確認なしで自動的にCOMES DBへ書き戻さない。

---

## 4. Decision Packへの渡し方

毎日のDecision Packへ全1on1原文を無条件に入れない。

基本は以下を渡す。

- 最新1on1実施日
- 対象者
- 参照先ID
- 構造化済みinsightがあればその内容
- 継続課題があればその内容
- `needs_confirmation` 状態

AI上司が判断に必要な場合のみ、最新原文または必要な履歴を参照できる設計とする。

理由:

- 判断パック肥大化防止
- 機微情報の露出最小化
- 不要な文脈によるAI判断ノイズの抑制

---

## 5. 原文の保存方針

原文そのものをSupabaseへ複製するか、Google Drive参照のみとするかはB-19「機微情報・ログの取り扱い」で最終確定する。

B-10では、1on1 Logが以下を保持できることだけを要求する。

- `source_file_id`
- `source_file_name`
- `source_modified_at`
- `raw_text_ref` または同等の参照

---

## 6. 将来の公開版

公開版では `OneOnOneAnalysisAdapter` を追加可能とする。

```text
OneOnOneLog
↓
OneOnOneAnalysisAdapter
↓
LLM API
↓
構造化候補
↓
COMES
```

AIが生成した情報には出自を保持し、人間入力や観測事実と区別する。

将来の構造化候補:

- concern
- success
- confidence
- anxiety
- workload
- delegation_request
- support_request
- change
- ongoing_issue
- next_check

---

## 7. 禁止事項

MVPでは以下を行わない。

- 文字起こしから人物評価を自動確定
- 感情スコア / モチベーションスコアの生成
- ChatGPT分析結果の無確認DB書き戻し
- 毎日のDecision Packへ全原文を常時埋め込む
- 名寄せが曖昧な1on1を推測で人物へ紐付ける

---

## Acceptance

B-10は以下を満たしたため解決とする。

- API課金なしで個人MVPが成立する
- 原文取得と意味構造化が分離されている
- COMES Coreが人物状態を勝手に断定しない
- 1on1履歴をDecision Packから参照可能
- 将来AI Analysis Adapterへ移行可能
- 機微情報を必要以上にDecision Packへ複製しない