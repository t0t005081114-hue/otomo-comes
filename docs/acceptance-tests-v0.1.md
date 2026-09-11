# OTOMO COMES MVP 受け入れテスト v0.1

Status: Draft

この文書は `docs/otomo-comes-spec-v0.1.md` を正本として、MVPが仕様どおり成立しているかを判定するための受け入れ条件を定義する。

## 判定ルール

- **BLOCKING**: 失敗した場合、MVPを完了扱いにしない。
- **ADVISORY**: 改善推奨。MVP完了を妨げない。
- 各テストは PASS / FAIL / NOT TESTED のいずれかで記録する。
- 人物評価・感情推定・AI判断について、根拠のない断定を行った場合は BLOCKING とする。

---

## AT-01 Product Boundary

**重要度: BLOCKING**

### 条件

1. COMES Core が以下を担当する。
   - データ正規化
   - KPI比較
   - 異常・変化検知
   - 委譲 / ボトルネック / 要フォロー / 褒める / 仕組み化候補の生成
   - Decision Pack生成
2. 個人検証版で LLM API を必須にしていない。
3. ChatGPT Scheduled Task / Google Drive は検証用ハーネスとして Core と分離されている。
4. 将来の AI Analysis Adapter を差し替え可能な境界がある。

### PASS基準

COMES Core 単体で Decision Pack まで生成でき、外部AI分析経路を変更しても Core のデータモデル・判定処理を変更する必要がない。

---

## AT-02 Daily Work Log Ingestion

**重要度: BLOCKING**

### Given

会社CRMが日次実績を返す。

### When

COMES が対象日のデータを取得する。

### Then

最低限以下が共通形式へ正規化される。

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

### 追加条件

- CRMは読み取り専用である。
- COMESからCRMデータの更新ができない。
- 入力欠損を勝手に推測して補完しない。

---

## AT-03 KPI Evaluation

**重要度: BLOCKING**

### 条件

1. KPIごとに目標値・評価周期・警告閾値・連続未達条件を設定できる。
2. 実績と目標との差を計算できる。
3. 連続未達を判定できる。
4. KPIごとに閾値を変更できる。

### 例

目標 10、実績 8 の場合、達成率 80% として正しく計算される。

固定閾値を全KPIに強制しない。

---

## AT-04 Stagnation Classification

**重要度: BLOCKING**

### 条件

案件の停滞を経過時間だけでなく停止理由と組み合わせて扱える。

最低限以下を区別する。

- 正常進行
- 要確認
- 停滞
- 外部待ち

### 必須ケース

顧客回答待ちで3日停止している案件を、担当者本人の遅延として扱わない。

原因不明の場合は「原因不明 / 要確認」とし、原因を推測しない。

---

## AT-05 Delegation Candidate

**重要度: BLOCKING**

### 条件

委譲候補の根拠として最低限以下を扱う。

- 答えの明確さ
- 再現性
- 失敗時リスク
- 担当候補者の習熟度

### 出力分類

- 完全委譲候補
- レビュー付き委譲
- 本人対応

### 必須ケース

1. 手順あり・低リスク・担当候補に安定実績あり → 完全委譲候補になり得る。
2. 前例のない重大トラブル → 安易に完全委譲候補にしない。
3. 高リスク業務 → 必要に応じレビュー付き判定を可能にする。

COMESは「委譲すべき」と最終決定せず、「候補 + 根拠」を出す。

---

## AT-06 Person Resolution

**重要度: BLOCKING**

### 条件

人物を `person_id` で管理し、外部ID・メール・alias・名前を紐付けられる。

### 優先順位

1. 外部システムID
2. メール
3. 登録済みalias
4. 名前

### 必須ケース

- `山田 太郎` / `山田` / `山田さん` を登録済みaliasに基づき同一人物へ紐付けられる。
- 同姓同名など複数候補がある場合は自動確定しない。

---

## AT-07 1on1 Drive Detection

**重要度: BLOCKING**

### Given

Driveに `1on1_山田太郎_2026-09-12` を含むMeet由来ファイルが存在する。

### Then

COMES は以下を取得・保持できる。

- file_id
- 対象者
- 実施日
- 原文
- modified_time
- 取得日時

### 追加条件

- 対象人物が登録済みPersonに紐付く。
- `modified_time` が変われば更新対象として検知できる。
- 1on1規則に一致しないMeetを勝手に1on1として取り込まない。

---

## AT-08 1on1 Interpretation Safety

**重要度: BLOCKING**

1on1から以下を「本人発言 / 観測された変化」として扱える。

- 困っていること
- うまくいっていること
- 自信がついてきた仕事
- 不安な仕事
- 負荷に関する発言
- 任せてほしい仕事
- 支援してほしいこと
- 継続課題
- 次回確認事項

### 禁止

発言根拠なしに「モチベーション低下」「やる気がない」等を確定しない。

---

## AT-09 Manager Observation

**重要度: BLOCKING**

Manager Observation が最低限以下を保持できる。

- 対象者
- 観察日時
- 関連案件 / タスク
- 観測事実
- 上司の所感
- 種別
- 次に確認したいこと

### 必須

観測事実と上司の所感が別フィールドとして保持される。

毎日の入力を必須にしない。

---

## AT-10 Decision Pack Schema

**重要度: BLOCKING**

Decision Pack の正本が構造化データである。

最低限以下を保持する。

- date
- manager_id
- kpi_alerts
- bottlenecks
- delegation_candidates
- follow_up_candidates
- praise_candidates
- systemization_candidates
- management_questions

Markdownのみを正本としてはならない。

---

## AT-11 Decision Pack Human View

**重要度: BLOCKING**

人間向け表示が以下の順序を基本とする。

1. 今日の要約
2. KPI
3. 異常・変化
4. 停滞・ボトルネック
5. マネージャー本人の負荷
6. 委譲候補
7. 要フォロー候補
8. 褒める候補
9. 仕組み化候補
10. AIに判断してほしいこと

COMESの断定ではなく、事実・候補・根拠が確認できる。

---

## AT-12 Praise Candidate

**重要度: BLOCKING**

褒める候補は結果のみではなくプロセスも扱える。

例:

- 前回FBの反映
- 自発的改善
- 早期相談
- 仕組み化
- 自走化

「誰を / 何の行動について / どの根拠で候補化したか」が追跡できる。

---

## AT-13 Bottleneck First

**重要度: BLOCKING**

COMESは「誰が悪いか」より「どこで仕事が止まっているか」を優先して表現する。

外部待ち・承認待ち・情報不足等を担当者の能力不足として扱わない。

---

## AT-14 Personal MVP Schedule

**重要度: BLOCKING**

個人検証版で以下の順序を成立させられる。

1. 19:00以降に当日データを取得する。
2. COMES Core が当日 Decision Pack を生成する。
3. 人間向け形式を外部参照先へ出力できる。
4. 19:15のAI分析経路が当日分のみを対象にできる。

### Safety

当日分が存在しない場合、前日のパックを当日分として使用しない。

---

## AT-15 No LLM API Dependency in Personal MVP

**重要度: BLOCKING**

個人検証版の Decision Pack 生成までに LLM API の契約・APIキー・トークン課金を必須としない。

将来の公開版 AI Analysis Adapter は別境界として追加可能である。

---

## AT-16 Obsidian Boundary

**重要度: BLOCKING**

- 現在状態の正本は COMES DB。
- Obsidian は長期記憶・ナレッジ層。
- Obsidian が利用不能でも、COMES Core の現在状態と Decision Pack 生成が壊れない。

---

## AT-17 Desktop / Mobile UX

**重要度: ADVISORY for first backend MVP / BLOCKING before user-facing MVP completion**

### PC

俯瞰・分析を重視する。

### Mobile

PC画面の単純縮小ではなく、重要度順の縦スクロール型UIにする。

最低限ホームで以下へ到達できる。

- 今日の異常
- 要確認
- 委譲候補
- 要フォロー
- 褒める候補
- 判断パック

---

## AT-18 Retention

**重要度: ADVISORY for first functional slice / BLOCKING before MVP completion**

- 日次 Decision Pack を90日保持できる。
- 週次・月次サマリーを別レイヤーとして保持可能である。
- 保存期間変更が Core ロジックに直書きされていない。

---

## AT-19 Additional Workload

**重要度: BLOCKING for MVP validation**

MVP検証時に、プレイングマネージャーの追加作業時間を測定できる。

少なくとも以下を記録する。

- Daily Work Log の手入力時間
- Manager Observation 入力時間
- Decision Pack確認時間
- 手動修正回数

Daily Work Log がCRM連携で取得できる場合、同じ内容の二重入力を要求しない。

---

## AT-20 MVP Success Review

**重要度: BLOCKING for validation completion**

一定期間の実運用後、以下をレビューできる。

- Decision Pack は役に立ったか
- 不要情報は何か
- 委譲候補は妥当だったか
- ボトルネック検知は妥当だったか
- AI上司の回答は行動に使えたか
- 実際に手放せた仕事は増えたか
- 本人負荷は減ったか

数値化できない項目は、評価方法を事前定義した上で定性レビューを許可する。
