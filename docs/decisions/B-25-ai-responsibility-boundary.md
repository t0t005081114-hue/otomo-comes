# B-25 AI責任分界

Status: Accepted
Decision ID: B-25

## 1. 目的

OTOMO COMESにおける、COMES CoreとAIの責任分界を明確にする。

個人MVPではAIは外部サービス上に存在するが、将来LLM APIをCOMES内へ組み込む場合も、責任境界は変更しない。

## 2. 基本原則

COMESは「事実と実行の基盤」、AIは「判断・分類・提案の脳みそ」とする。

COMES側に会社固有の意味判断ロジックを過剰に埋め込まない。

特に、代理店、上位店、重要顧客、ベンダー、他部署責任者など、企業ごとに意味が異なる外部コミュニケーションの分類は、COMES Coreの共通ルールにはしない。

## 3. COMES側の責任

COMESは以下を担当する。

- CRM、Daily Work Log、1on1、Manager Observation等から事実を収集する
- 事実を正規化・構造化する
- KPI差分、停滞、ボトルネック候補、委譲候補など、ルールベースで判定可能なものを抽出する
- Decision Packを生成する
- Decision Pack上で人間が追加・除外・補足・優先度変更できるようにする
- AIへ渡した根拠を保持する
- AI返却JSONをSchema検証する
- AI提案を保存・表示する
- 採用されたAI提案をタスクへ変換する
- タスクの期限、担当、優先度、推奨アクション、見積時間等を保持する
- 人間による編集履歴・revision・audit logを保持する
- 事実そのものは勝手に書き換えない
- AIの意味判断をCOMES側で再解釈しない

## 4. AI側の責任

AIは以下を担当する。

- Decision Packの文脈を読む
- 事実をもとに意味づけする
- 優先順位を判断する
- action_typeを決める
- management_focus_type / management_focus_summaryを決める
- 推奨アクションを具体化する
- 実行可能なタスク候補まで分解する
- expected_outcome / success_criteriaを設定する
- 必要に応じてestimated_minutesを提案する
- 必要に応じてfollow_up_required / follow_up_dateを提案する
- 外部コミュニケーション等の文脈分類を行う
- 会社固有の意味づけを行う

## 5. 外部コミュニケーションの扱い

`external_communication` は概念として保持可能だが、MVPではCOMES Core側で自動判定ルールを持たない。

対象例:

- 代理店とのやり取り
- 上位店との会議
- 重要顧客対応
- ベンダー対応
- 他部署責任者との調整

AIは、Decision Pack内に相手先・会議・連絡予定・案件文脈などの明示的根拠がある場合に限り、外部コミュニケーションとして分類してよい。

推測だけで分類してはならない。

## 6. 根拠必須原則

AIは分類・優先順位・提案を行う際、必ず `source_refs` を返す。

根拠が不足している場合は、断定せず、必要に応じて候補・要確認として扱う。

COMES側は `source_refs` を保存し、AI提案から元データへ辿れるようにする。

## 7. 個人MVPでの実装

個人MVPではLLM APIを使わない。

フロー:

1. COMESがDecision Packを作る
2. 人間が必要に応じて補正する
3. COMESが固定テンプレートでAI用プロンプトを生成する
4. 外部AIへコピーして投入する
5. AIがB-24の固定JSON Schemaで返す
6. COMESへJSONを貼り付ける
7. COMESがSchema検証する
8. AI提案を表示する
9. 人間が採用 / 保留 / 見送りを判断する
10. 採用分を即タスク化する

COMES側でAI返却内容を自然言語解析し直さない。

## 8. 将来LLM APIを組み込む場合

将来は以下に置き換える。

```text
COMES Core
  ↓
Decision Pack
  ↓
AI Analysis Adapter
  ↓
LLM API
  ↓
B-24準拠JSON
  ↓
COMES
```

変わるのは「外部AIへコピーして貼り戻す」部分のみであり、COMES CoreとAIの責任分界は維持する。

## 9. 非採用

以下はMVPでは採用しない。

- 代理店をCOMES共通概念としてハードコードする
- 企業固有の外部関係者ルールをCOMES Coreへ直接埋め込む
- AI出力をCOMES側でLLM再解釈する
- 根拠なしで人物・会社・案件の意味を推測する

## 10. 結論

OTOMO COMESでは、

- COMES = 事実・構造化・保存・検証・実行
- AI = 判断・分類・意味づけ・提案

という責任分界を正式採用する。

個人MVPでも将来のLLM API内蔵後でも、この境界を維持する。
