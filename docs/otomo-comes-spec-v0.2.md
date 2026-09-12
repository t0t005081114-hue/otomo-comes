# OTOMO COMES 正式仕様書 v0.2

Status: Accepted / source of truth for MVP definition

## 1. Product Definition

OTOMO COMES は、**AI上司が正しく判断できる状態を作るマネジメントOS**である。

主対象はプレイングマネージャー。

目的:
1. プレイヤー業務の優先順位・委譲を整理し、本人負荷を下げる。
2. チームマネジメントに必要な事実・変化・背景を整理し、適切な判断を可能にする。

COMESは人事評価や最終的なマネジメント判断を確定しない。

---

## 2. Responsibility Boundary

### COMES
- データ取得・正規化
- KPI比較
- 異常・変化検知
- 停滞 / ボトルネック候補抽出
- 委譲 / 要フォロー / 褒める / 仕組み化候補抽出
- Decision Pack生成
- AI出力のSchema validation / Referential Validation
- AI結果・提案・採否・タスク化の保存と表示

### AI
- Decision Packの意味理解
- 優先順位付け
- 委譲 / 介入 / 褒める / 1on1 / ボトルネック / 仕組み化の提案
- `management_focus_type`
- `management_focus_summary`
- `kpi_allocation_comment`
- B-24準拠 `actions[]`

### 人間
- 最終判断
- 実行
- AI提案の採用 / 保留 / 見送り
- 1on1構造化候補の確認
- 人事評価
- KPI / 目標 / 運用ルール変更

---

## 3. Architecture Boundary

```text
Input Adapters
  ↓
COMES Core
  ↓
Decision Pack
  ↓
AI Boundary
  ↓
AI Analysis Result
  ↓
COMES UI / Task
```

初期Input:
- 会社CRM
- Google Meet / Drive
- Manager Observation
- 手動入力
- Schedule Event（手入力 + 必要最小限の外部連携）

Coreへ特定ベンダー固有構造を持ち込まない。

---

## 4. Canonical DB

正本DBはSupabase PostgreSQL。

基礎スキーマはB-02、後発整合拡張はB-32 v1.1を正本とする。

主要概念:
- Person / Role / Reporting Relation
- Goal / KPI
- Work / Task / Work Event
- Daily Work Log
- OneOnOneLog / OneOnOneInsight
- ManagerObservation
- Bottleneck
- DelegationCandidate
- DecisionPack / DecisionPackAdjustment
- AIAnalysisResult / AIProposal
- ScheduleEvent
- HomeDailyAIBaseline

現在状態と履歴を分離する。

---

## 5. Daily Work Log / CRM

Daily Work Logは業務量・成果・分配・品質・停滞を表す客観ログ。

標準metric:
- handled_count
- completed_count
- carryover_count
- self_handled_count
- delegated_count
- returned_count
- trouble_count
- stagnant_count

CRM連携:
- CRM → COMES一方向
- GET only
- COMES専用Read API
- CRM DB直接接続禁止
- 欠損を0で補完しない

通信契約はB-03。

**実CRM項目から各metric / KPI / work itemへどうmappingするかはB-04で実データ確認後に確定する。B-04未完了部分を推測実装しない。**

---

## 6. KPI

判定原則: **目標との差 × 継続性**。

KPIは会社固有。COMESは定義枠のみ固定する。

MVPのKPI ownerは `person / organization`。HOME表示上の `チームKPI` はorganization KPIを利用する。

複雑なKPIツリーはMVP対象外。

---

## 7. Stagnation / Bottleneck

営業日基準。

- 1営業日更新なし: 要確認候補
- 2営業日更新なし: 停滞候補
- 外部待ち: 担当者本人の遅延として扱わない

原因不明を推測で確定しない。

人ではなく仕事の詰まりを優先して表現する。

---

## 8. Delegation

評価軸:
1. 答えの明確さ
2. 再現性
3. 失敗時リスク
4. 担当候補者の習熟度

COMESは候補 + 根拠を生成し、最終委譲判断はAI提案と人間判断へ残す。

段階的委譲:
- 作業のみ
- 一次判断まで
- レビュー付き
- 完全委譲

---

## 9. 1on1

### 原文
- 正本: Google Drive
- COMES DBへ本文を保存しない
- COMESはfile_id / file_name / modified_time / held_at /人物参照 / raw_text_refを保持

### 構造化
個人MVP:

```text
対象1on1ファイルを人間が明示指定
→ ChatGPTがそのDriveファイルだけを直接参照
→ 固定フォーマットで構造化候補生成
→ 人間確認
→ 確認済み内容のみ one_on_one_insights に保存
```

ChatGPTはDrive全体検索や関連ファイル自動探索を行わない。

構造化項目:
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

感情・性格・モチベーションを根拠なく断定しない。

Drive / Meet実ファイルの命名・保存先・複数生成時の扱いはB-09で実データ検証後に確定する。

---

## 10. Manager Observation

毎日入力を要求しない。

保持:
- 対象者
- 観察日時
- 関連案件 / タスク
- 観測事実
- 上司所感
- 種別
- 次に確認したいこと

観測事実と所感を分離する。

---

## 11. Decision Pack

内部正本はB-12準拠の構造化JSON。

主要論理構造:
- summary
- kpi_alerts
- anomalies
- bottlenecks
- manager_workload
- delegation_candidates
- follow_up_candidates
- praise_candidates
- systemization_candidates
- management_questions

すべての主要候補はEvidence Refで追跡可能にする。

Evidence Ref:
- `source_type` = 情報種類
- `source_system` = 取得元
- `source_id` = 取得元内識別子
- `label` = 人間向け表示名

Human Adjustment:
- Source Factは編集不可
- 追加 / 除外 / 補足 / 優先度変更のみ許可
- revision / auditを保存

状態:
- 作成中
- 確認済み
- AI投入済み
- AI結果取込済み

DBではB-32 v1.1の `workflow_status` で保持する。

---

## 12. Personal MVP AI Flow

個人MVPではCOMESからLLM APIを呼ばない。

```text
Decision Pack生成
→ 人間が確認・補正
→ COMESでAI用Prompt生成
→ 外部AIへ手動投入
→ B-24準拠JSON受領
→ COMESへ貼付
→ JSON Schema validation
→ Referential Validation
→ AI提案表示
→ 人間が採用 / 保留 / 見送り
→ 採用分を即タスク化
```

Scheduled Taskを必須経路にしない。

当日のHOMEは、翌朝時点でCOMESへ取込済みの最新AI分析結果を基準として固定する。

日付ごとの固定結果はB-32 v1.1の `home_daily_ai_baselines` で保持し、日中に新しいAI結果を取り込んでも同日の基準を自動差し替えしない。

---

## 13. AI Analysis Result

B-24 v0.3を正本とする。

Top-level必須:
- schema_version
- date
- decision_pack_id
- generated_at
- management_focus_type
- management_focus_summary
- kpi_allocation_comment
- actions

各actionは最低1件の `source_refs` を持つ。

JSON Schemaが正しくても、根拠参照が対象Decision Packまたは実在COMESレコードへ解決できなければ保存しない。

Proposal状態:
- pending
- accepted
- held
- rejected

AI結果取込直後は `pending`。人間が判断して初めて `accepted / held / rejected` のいずれかへ遷移する。

acceptedは確認モーダルなしでタスク化。

---

## 14. HOME

上段:
1. 自分が動く
2. 手放す
3. 褒める
4. 詰まりを取る

各カードはTop 3 + `ほかN件`。

共通並び替え:
- 優先度
- 期限

影響度ソートは持たない。

下段:
1. 当日のスケジュール
2. 今月の進捗 + AIコメント
3. チーム状態

当日予定0件時のみ、翌日以降で最も近い予定を1件表示する。

今日のモードは1行表示。Decision PackはHOME上ではステータス表示のみ。

HOMEクイック操作:
- 完了
- タスクを見る
- 保留

---

## 15. Task

主分類:
- 今日やること
- 1週間以内
- 急ぎじゃない

補助分類:
- 自分でやる
- 任せる
- レビュー
- 仕組み化

AI採用actionはB-32のtask origin metadataを保持してタスク化する。

AI内容と人間メモは分離する。

---

## 16. Team

評価画面ではなく判断材料画面。

主表示:
- 役割
- タスク数 / 負荷
- 直近1on1
- KPI進捗
- 直近の観測変化
- 要フォロー / 褒める / 委譲候補

人物スコア・モチベーション推定は禁止。

---

## 17. Schedule

Schedule Eventは共通モデルへ正規化する。

HOMEクリックでCalendarページへ遷移。

表示:
- 1日
- 3日
- 1週間
- 1ヶ月

COMES手入力予定は編集可、外部連携予定は原則read-only。

---

## 18. Drive Decision Pack Output

B-15は補助Harnessとして残す。

- DB上のDecision Pack JSONが正本
- Drive Markdownは派生物
- Scheduled Task必須経路ではない
- 人間確認・デバッグ・外部参照の補助用途
- Drive失敗でCore成功を無効化しない

---

## 19. Security / Retention

認証IdentityとGoogle Workspace接続Identityを分離する。

1on1原文:
- Drive正本
- DB保存禁止
- 不要なログ出力禁止

1on1要約 / Manager Observation初期保持期間: 1年。

Decision Pack日次保持: 90日。週次 / 月次サマリーは長期保持可能。

---

## 20. Obsidian

Obsidianは正本ではない。

- 現在状態 = COMES DB
- 長期記憶 / ナレッジ = Obsidian

Obsidianが利用不能でもCoreは成立する。

---

## 21. Out of Scope for MVP

- COMES内LLM API
- リアルタイムAI分析
- AIによる人事評価確定
- モチベーション点数化
- 自動叱責 / 自動催促
- 日報強制
- CRM書き戻し
- 全チャット解析
- 複雑なKPIツリー
- Drive全体をAIが自動探索する1on1解析

---

## 22. Remaining Implementation Blockers

設計判断として未解決なのではなく、実データ確認が必要なBlockingは2件のみ。

### B-04 CRM → Daily Work Log実データmapping
会社CRMの実項目・集計条件を確認し、標準metric / KPI / highlight / work itemへmappingする。

### B-09 Meet / Drive実ファイル検証
実際の文字起こしファイル名、接尾辞、保存先、同一会議複数ファイル時の扱いを確認する。

この2件は推測実装禁止。

---

## 23. MVP Success Definition

**追加作業をほとんど増やさず、毎日「今日どう動くか」と「明日見るべきこと」が明確になること。**

検証:
- 手入力時間
- Decision Pack有用性
- 不要情報率
- 委譲候補妥当性
- ボトルネック検知妥当性
- AI提案有用性
- 実際に手放せた業務数
- マネージャー本人負荷変化

---

## Source of Truth Priority

競合時:
1. 後発のAccepted Decision
2. 責務専用Decision
3. 本仕様書v0.2
4. v0.1文書 / Draft

本仕様書はv0.1をMVP正本として置き換える。
