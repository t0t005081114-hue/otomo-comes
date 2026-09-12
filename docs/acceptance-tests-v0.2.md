# OTOMO COMES MVP 受け入れテスト v0.2

Status: Accepted

本書は `docs/otomo-comes-spec-v0.2.md` を正本としてMVP成立を判定する。

## 判定ルール

- **BLOCKING**: FAILならMVP完了扱いにしない
- **ADVISORY**: 改善推奨
- PASS / FAIL / NOT TESTEDで記録
- 根拠のない人物評価・感情推定・AI断定はBLOCKING

---

## AT-01 Product Boundary

**BLOCKING**

- COMES CoreはDecision Pack生成まで成立する
- 個人MVPでLLM APIを必須にしない
- 外部AI経路を変更してもCoreの主要データモデルを変更しない
- AI提案の最終採否は人間が行う

---

## AT-02 CRM Read Boundary

**BLOCKING**

- CRM → COMESはGET only
- COMESからCRMを書き換えられない
- CRM DBへ直接接続しない
- 欠損を0へ変換しない
- B-04未確定mappingを推測実装しない

B-04完了後、実データで `handled_count` 等のmappingを検証する。

---

## AT-03 KPI

**BLOCKING**

- person / organization KPIを扱える
- 目標値・実績・周期・閾値・連続未達条件を保持できる
- KPIごとに閾値変更可能
- HOMEの「チームKPI」はorganization KPIで成立する

---

## AT-04 Stagnation

**BLOCKING**

- 営業日基準で1営業日更新なしを要確認候補、2営業日更新なしを停滞候補として扱える
- 外部待ちを担当者本人の遅延と扱わない
- 原因不明を推測しない

---

## AT-05 Delegation

**BLOCKING**

- 答えの明確さ / 再現性 / 失敗時リスク / 習熟度を根拠に使える
- COMESは候補 + 根拠を出し、最終委譲判断を確定しない
- 高リスク業務を安易に完全委譲しない

---

## AT-06 Person Resolution

**BLOCKING**

優先順位:
1. 外部ID
2. メール
3. alias
4. 名前

複数候補時は自動確定しない。

---

## AT-07 1on1 File Detection

**BLOCKING**

B-09で実ファイル確認後に以下を検証する。

- 対象ファイルを正しく識別できる
- file_id / file_name / modified_time / held_at / raw_text_refを保持できる
- 原文本文をCOMES DBへ保存しない
- B-09未確定命名規則を推測固定しない

---

## AT-08 1on1 Structuring Harness

**BLOCKING**

- 人間が対象1on1ファイルを明示指定する
- ChatGPTは指定ファイルだけをDriveから参照する
- Drive全体検索や関連ファイル自動探索を行わない
- ChatGPTは固定フォーマットで構造化候補を返す
- 人間確認後のみ `one_on_one_insights` に保存される
- `origin_type / confirmed_by / confirmed_at` を追跡できる
- 感情・性格・モチベーションを根拠なく断定しない

---

## AT-09 Manager Observation

**BLOCKING**

- 観測事実と所感を別フィールドで保持
- 毎日入力を必須にしない
- 所感を客観的事実としてAIへ渡さない

---

## AT-10 Decision Pack Schema

**BLOCKING**

- B-12準拠JSONが正本
- Markdownは派生物
- 候補0件でも配列自体を保持
- source statusとdata statusを保持

---

## AT-11 Decision Pack Editing / Audit

**BLOCKING**

- Source Factは直接編集不可
- 追加 / 除外 / 補足 / 優先度変更が可能
- 誰が・いつ・何を変えたか追跡できる
- adjustmentがEvidence Refへ混在しない

---

## AT-12 Evidence Contract

**BLOCKING**

Evidence Refは以下を区別する。

- `source_type`: 情報種類
- `source_system`: 取得元
- `source_id`: 取得元内ID
- `label`: 表示名

AIが同じ根拠を引用する場合、これらを勝手に変更しない。

---

## AT-13 AI Result Schema

**BLOCKING**

B-24 v0.3準拠。

Top-level最低限:
- schema_version
- date
- decision_pack_id
- generated_at
- management_focus_type
- management_focus_summary
- kpi_allocation_comment
- actions

不正JSON、必須欠落、enum不正、unknown propertyは保存しない。

---

## AT-14 Referential Validation

**BLOCKING**

全AI actionの `source_refs` は以下のどちらかへ解決できること。

1. 対象Decision Pack内のEvidence Ref
2. `source_system = comes` の実在COMESレコード

解決不能なsource_idを含むAI結果は保存しない。

---

## AT-15 AI Proposal Lifecycle

**BLOCKING**

- accepted / held / rejectedを保存できる
- acceptedは追加確認モーダルなしで即タスク化
- heldはActive表示に残る
- rejectedは通常表示から外れるが履歴保持

---

## AT-16 AI Task Conversion

**BLOCKING**

採用actionから最低限以下をタスクへ保持できる。

- title / description
- assignee / related people
- due bucket / due date
- priority
- recommended action
- expected outcome
- success criteria
- estimated minutes
- source refs
- AI-origin metadata

AI内容とhuman notesは分離する。

---

## AT-17 Personal MVP AI Flow

**BLOCKING**

次の手動Harnessが成立する。

```text
Decision Pack
→ COMESでPrompt生成
→ 外部AIへ投入
→ B-24準拠JSON
→ COMESへ貼付
→ Schema validation
→ Referential Validation
→ AI提案表示
```

Scheduled Taskを必須条件にしない。

---

## AT-18 HOME

**BLOCKING before user-facing MVP completion**

上段:
- 自分が動く
- 手放す
- 褒める
- 詰まりを取る

各Top 3 + ほかN件。

並び替え:
- 優先度
- 期限

下段:
- 当日のスケジュール
- 今月の進捗 + AIコメント
- チーム状態

当日予定0件なら次の予定を1件だけ未来表示する。

---

## AT-19 HOME AI State

**BLOCKING**

- 今日のモードと短いAIコメントを1行表示
- 今月進捗用に `kpi_allocation_comment` を別表示できる
- 翌朝時点で取込済みの最新AI結果を当日の基準として固定
- AI結果が無い場合は補完せず未生成 / 未取込表示

---

## AT-20 Schedule

**BLOCKING before user-facing MVP completion**

- Schedule Eventを共通形式で保存
- COMES手入力予定は編集可
- 外部予定は原則read-only
- 1日 / 3日 / 1週間 / 1ヶ月表示が可能

---

## AT-21 Security / Sensitive Data

**BLOCKING**

- 1on1原文をDBへ保存しない
- 1on1原文・Observation本文・tokenを通常ログへ出さない
- COMESログインIdentityとGoogle Workspace接続Identityを分離
- ownerロールだけを理由に全1on1原文へアクセスさせない

---

## AT-22 Drive Decision Pack Output

**ADVISORY**

- Drive出力は補助Harness
- DB JSONが正本
- Scheduled Task依存なし
- Drive失敗でCore成功を無効化しない

---

## AT-23 Obsidian Boundary

**BLOCKING**

- COMES DBが現在状態の正本
- Obsidianは長期記憶 / ナレッジ
- Obsidian利用不能でもCoreが成立

---

## AT-24 Mobile

**BLOCKING before user-facing MVP completion**

- PC縮小版ではなく縦スクロール
- 意味順を維持
- 横スワイプ依存を必須にしない

---

## AT-25 MVP Validation

**BLOCKING for validation completion**

実運用後に最低限以下を評価できる。

- 追加作業時間
- Decision Pack有用性
- 不要情報率
- 委譲候補妥当性
- ボトルネック検知妥当性
- AI提案有用性
- 実際に手放せた仕事
- 本人負荷変化

---

## Implementation Gate

実装開始時点で未解決を許容するのは、実データ確認が必要な以下2件のみ。

- B-04 CRM → Daily Work Log mapping
- B-09 Meet / Drive実ファイル検証

ただし、それぞれのAdapter本実装に入る前には必ず解決する。
