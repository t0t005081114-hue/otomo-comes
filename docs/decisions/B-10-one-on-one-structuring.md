# B-10 1on1構造化方式決定

Status: Accepted v1.2
Decision ID: B-10

## 結論

個人MVPでは、1on1原文はGoogle Driveを正本とし、**ChatGPTがDrive上の1on1原文を直接参照して構造化候補を生成し、人間が確認後に `one_on_one_insights` へ保存する**方式を採用する。

ChatGPTがDriveを参照する際は、**対象1on1ファイルを人間が明示指定した場合に限って読む**。Drive全体検索や関連ファイルの自動探索は行わない。

COMES Core自身は、原文の意味理解・要約・人物判断を自動実行しない。

MVPの基本フロー:

```text
Google Meet / Drive
↓
COMESがファイル・人物・日時メタデータを取得
↓
人間が対象1on1ファイルを明示指定
↓
ChatGPTがその対象ファイルだけをDriveから参照
↓
固定フォーマットで構造化候補を生成
↓
人間が確認
↓
確認済みの内容だけCOMESの one_on_one_insights に保存
↓
Decision Packは構造化済みinsightを参照
```

これにより、個人MVPではLLM APIを使わず、毎日のDecision Packへ原文全文を埋め込まずに1on1文脈を利用できる。

---

## 1. COMESが自動で行うこと

- Drive上の対象ファイル検出
- ファイルID取得
- ファイル名取得
- 更新日時取得
- 対象者候補の名寄せ
- 実施日の取得
- 原文参照情報の保存
- 同一ファイル更新時の再取得判定
- 未解決人物を `needs_confirmation` として保持
- 人間が確認した構造化情報を `one_on_one_insights` に保存

COMESは、原文だけから「本人のモチベーションが低い」等の人物判断を自動確定しない。

---

## 2. ChatGPTが個人MVPで行うこと

ChatGPTは、人間が明示指定した対象の1on1原文だけをGoogle Driveから直接参照し、構造化候補を生成する。

構造化対象:

- 困っていること
- うまくいっていること
- 自信がついてきた仕事
- 不安な仕事
- 負荷に関する本人発言
- 任せてほしい仕事
- 支援してほしいこと
- 前回からの変化
- 継続課題
- 次回確認事項

原則:

- 原文にない事実を補完しない
- 感情・性格・モチベーションを断定しない
- 不明な項目は空欄または要確認とする
- 発言事実とAI要約を区別する
- 人事評価を生成しない
- 明示指定されていないDriveファイルを自動探索しない
- 関連しそうな別ファイルを推測で追加参照しない

---

## 3. `one_on_one_insights` の扱い

B-02で定義した `one_on_one_insights` を、個人MVPでの構造化情報の保存先とする。

保存元:

1. ChatGPTがDrive原文から生成した構造化候補を人間が確認して保存
2. 必要に応じてマネージャーが手動登録
3. 将来はAI Analysis Adapter / OneOnOneAnalysisAdapterから候補生成

重要:

- ChatGPTの分析結果を確認なしでCOMES DBへ自動書き戻ししない
- 人間が確認した内容だけ正式な構造化情報として保存する
- AI生成由来であることを追跡可能にする

---

## 4. Decision Packへの渡し方

毎日のDecision Packへ1on1原文全文は入れない。

基本は以下を渡す。

- 最新1on1実施日
- 対象者
- 参照先ID
- 確認済みの構造化insight
- 継続課題
- 次回確認事項
- `needs_confirmation` 状態

日次AI分析は、原則としてこの構造化済み情報を利用する。

日次AI分析のたびに1on1原文を再読することは前提にしない。

理由:

- Decision Pack肥大化防止
- 機微情報の露出最小化
- 日次分析の再現性向上
- 毎回の原文再読による判断揺れを減らす

---

## 5. 原文の保存方針

B-19を正本とする。

- 1on1原文の正本はGoogle Drive
- COMES DBへ原文本文は保存しない
- COMES DBには参照情報と確認済み構造化情報のみ保持する

1on1 Logは最低限以下を保持する。

- `source_file_id`
- `source_file_name`
- `source_modified_at`
- `raw_text_ref` または同等のDrive参照

---

## 6. Drive参照Harnessの範囲

個人MVPのChatGPT + Drive連携は補助Harnessとして扱う。

原則:

- ユーザーが接続を許可したGoogle Workspaceのみ参照する
- 1on1構造化時は対象ファイルを明示指定する
- 明示指定された対象ファイル以外へ探索を広げない
- Drive全体の自動検索を前提にしない
- COMES Coreの認証・権限モデルとは分離する

---

## 7. 将来の公開版

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
人間確認
↓
COMES
```

個人MVPの「ChatGPT + Drive直接参照」は検証用Harnessであり、公開版の必須構成にはしない。

構造化項目の意味契約は公開版でも維持する。

---

## 8. 禁止事項

MVPでは以下を行わない。

- 文字起こしから人物評価を自動確定
- 感情スコア / モチベーションスコアの生成
- ChatGPT分析結果の無確認DB書き戻し
- 毎日のDecision Packへ全原文を常時埋め込む
- 名寄せが曖昧な1on1を推測で人物へ紐付ける
- 日次AI分析の都度、全1on1原文を自動再読する
- Drive全体や関連ファイルを自動探索する

---

## Acceptance

- API課金なしで個人MVPが成立する
- Drive原文をChatGPTが直接参照して構造化候補を作れる設計である
- 対象1on1ファイルを明示指定した場合だけChatGPTが参照する
- 構造化候補は人間確認後のみ `one_on_one_insights` に保存される
- COMES Coreが人物状態を勝手に断定しない
- 日次Decision Packは原文ではなく構造化済み情報を基本参照する
- 1on1原文をCOMES DBへ複製しない
- 将来AI Analysis Adapter / OneOnOneAnalysisAdapterへ移行可能
- 機微情報を必要以上にDecision Packへ複製しない
