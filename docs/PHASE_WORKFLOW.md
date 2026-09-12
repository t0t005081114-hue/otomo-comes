# OTOMO COMES Phase Workflow

Status: Harness v0.1（製品仕様の正本ではない）

実装は必ずPhase単位で行い、同じ手順を反復する。
目的は「仕様逸脱せず、毎Phaseで再現可能に検証できること」。

---

## 1. 標準ループ

| # | Step | 完了条件 |
|---|---|---|
| 1 | Phase開始 | scope / out of scopeを宣言した |
| 2 | 正本確認 | 対象の仕様・Decision・Acceptanceを実際に読んだ |
| 3 | Blocking確認 | `docs/open-issues-v0.2.md` を確認し、B-04 / B-09依存の有無を判定した |
| 4 | 実装計画 | 変更予定ファイルとDecision ID / Acceptance IDを対応づけた |
| 5 | 実装 | scope内のみ変更した |
| 6 | lint | `npm run lint` PASS |
| 7 | typecheck | `npm run typecheck` PASS |
| 8 | test | `npm run test`（DB境界を触った場合 `npm run test:integration` も）PASS |
| 9 | build | `npm run build` PASS |
| 10 | self-review | §4のチェックリストを自分で通した |
| 11 | Codex独立レビュー | Codexへ差分とscope・正本を渡してレビューを受けた |
| 12 | remediation | 指摘へ対応、または対応しない理由を記録した |
| 13 | 再検証 | 6〜9を再実行した |
| 14 | PASS確認 | 対象Acceptanceが全てPASS / 未達が明示された |
| 15 | commit | 1Phase = 論理的に1commit |
| 16 | phase tag | `phase-NN` タグを付けた |

### 停止条件

Step 2〜4のいずれかで以下に該当したら、その場でループを抜けて人間へ質問する。

- 正本が矛盾し、優先順位規則で解決できない
- 必要な決定がどのDecisionにも存在しない
- B-04 / B-09に依存する
- Accepted Decisionの変更が必要

推測で埋めて先に進まない。

---

## 2. Phase記録

各Phaseで `docs/phases/phase-NN-<slug>.md` を作る。テンプレートは
`docs/phases/_TEMPLATE.md`。

必須項目:

- **scope** … このPhaseでやること
- **out of scope** … やらないこと（次Phase以降・Blocking待ちを明示）
- **source of truth** … 参照したDecision ID / 仕様セクション
- **acceptance criteria** … 対象AT-xx / FA-xx と判定方法
- **files changed** … 変更ファイルと責務
- **validation result** … 各コマンドの実行結果（PASS / FAIL / NOT RUN + 理由）
- **unresolved issues** … 残課題・人間判断待ち

`NOT RUN` を空欄や省略で済ませない。

---

## 3. Acceptanceとの対応

- Phase記録にAcceptance ID（`AT-01`〜`AT-25`、`FA-01`〜`FA-16`）を必ず書く。
- 対応するtest caseにもAcceptance IDをコメント／テスト名で残す（`docs/DEVELOPMENT_STANDARDS.md` §6）。
- BLOCKINGのAcceptanceがFAILのままPhaseをPASSにしない。
- Acceptanceに書かれていない振る舞いを「実装したから正しい」としない。

---

## 4. Self-review チェックリスト

実装後、Codexへ出す前に自分で確認する。

### 仕様
- [ ] 変更の全てに根拠Decisionがある
- [ ] 後発Decisionを旧記述で上書きしていない
- [ ] Accepted Decisionファイル・仕様・Acceptanceを書き換えていない
- [ ] Phase scope外の変更が混ざっていない

### B-04 / B-09
- [ ] CRM項目mapping / 集計条件を推測実装していない
- [ ] Meet / Driveのファイル名規則・人物特定を推測実装していない
- [ ] 欠損を0で補完していない

### アーキテクチャ
- [ ] `src/core/**` にvendor importがない
- [ ] 外部連携がAdapterに隔離されている
- [ ] CRMアクセスがGET onlyである

### データ / AI
- [ ] 1on1原文本文をDBへ保存していない
- [ ] AI入力の4段検証（Schema / Identity / Evidence Referential / Semantic）を通さず保存していない
- [ ] pending / held / rejected ProposalがHOME実行対象になっていない
- [ ] 感情・性格・モチベーション・スコアの推測がない

### Security
- [ ] token / 原文 / observation本文 / sensitive dataをログへ出していない
- [ ] 権限判定がUI表示だけに依存していない
- [ ] organization境界を越えるクエリがない
- [ ] secret / `.env` をcommit対象にしていない

### DB
- [ ] migrationが原子的で、適用済みmigrationを改変していない
- [ ] destructive changeを明示した
- [ ] `date` / `timestamptz` を区別した
- [ ] UUID参照整合がある

### 検証
- [ ] lint / typecheck / test / build を実行し結果を記録した
- [ ] 新しいbusiness ruleにunit testがある
- [ ] Acceptance IDとtestが対応している

---

## 5. Codex独立レビューへ渡すもの

1. Phase番号とscope / out of scope
2. 差分（`git diff`）
3. 参照した正本のDecision ID / Acceptance ID
4. validation結果
5. self-reviewで未解決な点

レビュー観点として明示的に依頼する。

- 仕様逸脱・推測実装
- Decision優先順位の誤り
- B-04 / B-09のGate破り
- 層境界違反・vendor漏れ
- 機微データのログ・保存違反
- Acceptance未カバー
- 過剰実装 / scope逸脱

Codexの指摘は「実装バグ」と「仕様変更提案」に分類する。
仕様変更提案は実装せず、人間判断へ回す。

---

## 6. commit / tag

- 1Phase = 論理的に1commit（検証PASS後にcommit）
- message: `feat(phase-NN): <scope>` / `chore(phase-NN): <scope>` など
- Phase記録の更新を同じcommitに含める
- PASS確認後に `git tag phase-NN`
- 検証FAILのままcommitしない。やむを得ない場合はFAIL内容をcommit messageとPhase記録の両方に書く

---

## 7. Phase分割の原則

- 1Phaseで「正本の1責務」だけを扱う
- DB migrationとUIを同一Phaseへ混ぜない
- Adapter実装とCore実装を混ぜない
- B-04 / B-09依存部分は独立Phaseへ切り出し、解決まで着手しない
- 1Phaseの差分が大きくなりすぎたら分割する（Harness hookが警告する）
