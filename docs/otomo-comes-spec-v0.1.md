# OTOMO COMES 正式仕様書 v0.1

Status: Draft / source of truth for MVP definition

## 1. Product Definition

OTOMO COMES は、**AI上司が正しく判断できる状態を作るマネジメントOS**である。

主対象は、プレイヤー業務とチームマネジメントを兼務するプレイングマネージャー。

目的は次の2つ。

1. プレイヤー業務の優先順位と委譲を整理し、本人の業務負荷を下げる。
2. チームマネジメントに必要な事実・変化・背景を整理し、適切な判断を可能にする。

COMES 自体は、人事評価や最終的なマネジメント判断を行う主体ではない。

---

## 2. Responsibility Boundary

### COMES

- データ取得・正規化
- KPI比較
- 異常・変化の検知
- 停滞・ボトルネック候補の抽出
- 委譲候補の抽出
- 要フォロー候補の抽出
- 褒める候補の抽出
- 仕組み化候補の抽出
- Decision Pack の生成

### AI上司

- 翌日の優先順位判断
- 委譲判断
- 介入 / 非介入判断
- ボトルネック解消案
- 褒める内容・タイミングの提案
- 1on1で確認すべき事項の提案
- 仕組み化の提案

### 人間

- 最終判断
- 実行
- 人事評価
- 重要な人物判断
- KPI / 目標 / 運用ルールの変更

---

## 3. Architecture Boundary

```text
Input Layer
  ↓
COMES Core
  ↓
Decision Pack
  ↓
AI Analysis Adapter
```

### Input Layer

初期対象:

- 会社CRM
- Google Meet / Google Drive
- Manager Observation
- 手動入力

将来は Slack / Chatwork / LINE / 他社CRM 等を追加可能とする。

特定サービスのデータ構造を COMES Core に直接持ち込まない。

### COMES Core

主要概念:

- Person
- Role
- Goal
- KPI
- Work / Task
- Workload
- Delegation
- Progress
- Bottleneck
- OneOnOneLog
- ManagerObservation
- GrowthSignal
- DecisionPack

COMES Core と個人検証用ハーネスは分離する。

---

## 4. Daily Work Log

Daily Work Log は、**業務量・成果・分配・品質・停滞を表す客観ログ**とする。

標準項目:

- 対応件数
- 完了件数
- 持ち越し件数
- 自分対応件数
- 委譲件数
- 差し戻し件数
- トラブル件数
- 停滞件数
- 会社固有KPI
- 重要案件

会社ごとの業務項目は可変とし、COMES は共通フレームのみ固定する。

### 会社CRM連携

個人検証版では現在開発中の会社CRMを主要データソースとする。

- CRM → COMES の一方向
- 読み取り専用
- COMES から CRM を書き換えない
- COMES 専用 Read API を境界にする
- 生データ全量ではなく必要情報を取得する

---

## 5. KPI / Stagnation

### KPI

判定原則: **目標との差 × 継続性**

初期例:

- 100%以上: 順調
- 80〜99%: 要確認
- 60〜79%: 注意
- 60%未満: 重要

閾値は KPI ごとに変更可能とする。

KPI は以下を保持する。

- KPI名
- 対象
- 目標値
- 実績値
- 評価周期（日 / 週 / 月等）
- 警告閾値
- 連続未達条件

### 停滞

判定原則: **経過時間 × 停止理由**

基本状態:

- 正常進行
- 要確認
- 停滞
- 外部待ち

停止理由候補:

- 本人作業中
- 他者待ち
- 上司承認待ち
- 顧客待ち
- 情報不足
- 優先順位不明
- 属人化
- 差し戻し
- 負荷集中
- 原因不明

外部待ちは担当者本人の停滞として扱わない。

---

## 6. Delegation

委譲候補は以下の4軸で評価する。

1. 答えが見えているか
2. 再現性があるか
3. 失敗時リスクが許容できるか
4. 担当候補者が習熟しているか

結果分類:

- 完全委譲候補
- レビュー付き委譲
- 本人対応

基本思想:

```text
未知
↓
マネージャーが解く
↓
答えを作る
↓
手順化
↓
委譲
↓
自走
```

高リスク業務は、答えが見えていてもレビュー必須にできる。

---

## 7. 1on1 Log

Google Meet を基本入力とする。

Meet タイトル規則:

```text
1on1_対象者名_YYYY-MM-DD
```

COMES は Drive 上でこの識別子を含む対象ファイルを取得する。

### 原文層

- file_id
- 対象者
- 実施日
- 原文
- modified_time
- 取得日時

### 構造化層

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

本人の感情・モチベーションを根拠なく断定しない。

---

## 8. Manager Observation

毎日入力を要求しない。気づいた時だけ残す。

入力は音声優先、テキストも許可する。

保持項目:

- 対象者
- 観察日時
- 関連案件 / タスク
- 観測事実
- 上司の所感
- 種別
- 次に確認したいこと

種別:

- 成長
- 要フォロー
- 委譲候補
- 褒める候補
- ボトルネック候補

観測事実と所感を分離する。

---

## 9. Person Resolution

人物は名前ではなく `person_id` を正本とする。

保持例:

- person_id
- name
- aliases
- crm_user_id
- email
- その他外部ID

名寄せ優先順位:

```text
外部システムID
↓
メール
↓
登録済みalias
↓
名前
```

曖昧な場合は自動確定しない。

---

## 10. Obsidian

Obsidian は COMES の正本ではない。

### COMES DB

現在状態を保持する。

- KPI
- Work / Task
- 担当
- 状態
- 委譲候補
- 停滞
- Decision Pack

### Obsidian

長期記憶・参照用。

- 1on1履歴
- Manager Observation
- 過去の判断
- 仕組み化ノート
- 手順書
- 重要案件履歴
- 成長記録

原則:

**現在状態 = COMES DB / 過去の文脈 = Obsidian**

---

## 11. Decision Pack

Decision Pack は COMES の中心出力。

内部正本は Markdown ではなく構造化データとする。

最低限の論理構造:

```json
{
  "date": "YYYY-MM-DD",
  "manager_id": "...",
  "kpi_alerts": [],
  "bottlenecks": [],
  "delegation_candidates": [],
  "follow_up_candidates": [],
  "praise_candidates": [],
  "systemization_candidates": [],
  "management_questions": []
}
```

人間向け表示順:

1. 今日の要約
2. KPI
3. 異常・変化
4. 停滞・ボトルネック
5. プレイングマネージャー本人の負荷
6. 委譲候補
7. 要フォロー候補
8. 褒める候補
9. 仕組み化候補
10. AIに判断してほしいこと

COMES は「結論」ではなく「候補 + 根拠」を出す。

---

## 12. Personal MVP Harness

個人検証版では LLM API を使用しない。

### 19:00

```text
GitHub Actions
↓
CRM取得
Meet取得
Observation取得
↓
COMES Core
↓
Decision Pack JSON
↓
人間向け出力
↓
Google Drive
```

### 19:15

```text
ChatGPT Scheduled Task
↓
当日の Decision Pack を取得
↓
AI上司ルールで分析
↓
翌日のマネジメント提案
```

この経路は検証用ハーネスであり、COMES Core の正式責務には含めない。

---

## 13. Public Product Boundary

OTOMO LAB 公開版では AI Analysis Adapter を追加する。

```text
COMES Core
↓
Decision Pack
↓
AI Analysis Adapter
↓
LLM API
↓
COMES UI
```

特定LLMベンダーに依存しない。

個人検証版の Drive / ChatGPT Scheduled Task は公開版の必須構成にしない。

---

## 14. UI Information Architecture

MVP 左メニュー:

- ホーム
- タスク
- チーム
- 目標・KPI
- 1on1・観察
- ボトルネック
- 判断パック
- 設定

ホームは「情報を増やす画面」ではなく「今日見るべきものを減らす画面」とする。

PC は俯瞰・分析を重視する。

スマホは PC の縮小版にせず、重要度順に縦スクロールするマネジメントフィードとする。

---

## 15. Retention

Decision Pack:

- 日次: 90日保持
- 週次サマリー: 長期保存
- 月次サマリー: 長期保存

長期では KPI 傾向、委譲、負荷、ボトルネック再発、自走化、仕組み化を見る。

---

## 16. Out of Scope for MVP

- COMES 内 LLM API
- リアルタイムAI分析
- AIによる人事評価確定
- モチベーション点数化
- 自動叱責
- 自動催促
- 日報強制
- CRMへの書き戻し
- 全チャット解析

---

## 17. MVP Success Definition

**プレイングマネージャーが追加作業をほとんど増やさず、毎日「明日見るべきこと」が明確になること。**

検証対象:

- 手入力時間
- Decision Pack の有用性
- 不要情報の割合
- 委譲候補の妥当性
- ボトルネック検知の妥当性
- AI上司回答の有用性
- 実際に手放せた業務数
- プレイングマネージャー本人の負荷変化
