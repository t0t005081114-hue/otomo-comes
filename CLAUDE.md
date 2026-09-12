# CLAUDE.md

OTOMO COMES リポジトリでClaude Codeが守る最上位の開発ルール。

本ファイルはHarnessの入口であり、**製品仕様の正本ではない**。
仕様・Decisionと矛盾する記述を本ファイルに見つけた場合は、正本を優先し、本ファイルの修正を人間へ提案する。

---

## 1. 正本 (Source of Truth)

### 読む順序

| 目的 | 正本 |
|---|---|
| 製品定義 / MVP範囲 | `docs/otomo-comes-spec-v0.2.md` |
| 受け入れ判定（基本） | `docs/acceptance-tests-v0.2.md` |
| 受け入れ判定（最終監査追加） | `docs/acceptance-tests-final-audit-addendum-v0.1.md` |
| 未決定 / Blocking | `docs/open-issues-v0.2.md` |
| 監査結果 / 実装Gate | `docs/final-audit-report-v0.1.md` |
| 個別責務の確定事項 | `docs/decisions/B-*.md` |

### 競合時の優先順位（絶対）

1. 後発のAccepted Decision
2. 責務専用Decision
3. `docs/otomo-comes-spec-v0.2.md`
4. 旧 `v0.1` 文書 / Draft

HOME / Task周辺でさらに競合する場合はB-41 §8の順序に従う。

### Harness側の文書（正本ではない）

- `docs/PHASE_WORKFLOW.md` … Phaseの回し方
- `docs/DEVELOPMENT_STANDARDS.md` … 実装標準
- `docs/DECISIONS_AND_FAILURES.md` … 実装中に分かったこと・失敗の記録
- `.claude/rules/*.md` … 対象ファイルを触るときだけ自動で読み込まれる実装ルール

---

## 2. 実装前に必ず行うこと

1. 対象Phaseのscopeを確認する（`docs/PHASE_WORKFLOW.md`）。
2. 対象範囲の**仕様・Decision・Acceptanceの該当箇所を実際に読む**。記憶や要約で代替しない。
3. 未決定・Blockingが残っていないか `docs/open-issues-v0.2.md` で確認する。
4. 該当Decision IDとAcceptance IDを実装計画に明記する。
5. 根拠Decisionが見つからない仕様を実装しようとしている場合は、**書き始める前に停止して人間へ質問する**。

---

## 3. 禁止事項

以下は例外なく禁止する。破りそうになった時点で作業を止め、人間へ質問する。

### 仕様判断
- 仕様を推測で補完する。
- Accepted Decisionを上書き・再解釈・「改善」する。
- `docs/decisions/**` の既存ファイル、`docs/otomo-comes-spec-v0.2.md`、`docs/acceptance-tests-*.md`、`docs/final-audit-report-v0.1.md` を書き換える。
- 新仕様・新概念・新テーブル・新画面をDecisionなしで追加する。
- リファクタ目的でPhase scope外へ変更を広げる。

### B-04 / B-09 Gate
- **B-04（CRM → Daily Work Log実データmapping）未解決のまま、CRM Adapterの項目mapping / 集計条件を実装する。**
- **B-09（Meet / Drive実ファイル識別）未解決のまま、ファイル名規則・人物特定・複数ファイル識別を実装する。**
- 欠損metricを0で補完する。取得不能項目を推測で埋める。

B-03（通信契約）、B-08（認証方式）、B-10（1on1構造化方式）はAccepted済みなので、mapping/識別に依存しない部分は実装してよい。

### アーキテクチャ
- `src/core/**` へ Supabase / Google / CRM / OpenAI / Next.js 等のvendor importを持ち込む。
- 外部連携をAdapter層の外に書く。
- CRMへ書き込む（GET only。書き戻し・webhook・DB直接接続すべて禁止）。

### データ / AI
- 1on1原文本文をCOMES DBへ保存する（正本はGoogle Drive）。
- AI Proposalを人間の採用前に実行対象・Taskへ昇格させる。
- `pending` / `held` / `rejected` のAI ProposalをHOME実行カードへ出す。
- 感情・性格・モチベーション・人物スコアを推測・数値化する。
- AI出力をLLMで再解釈・自動修復する。検証失敗値をサイレント補正する。

### 運用
- migrationを非原子的に適用する / 適用済みmigrationを書き換える。
- token / 1on1原文 / observation本文 / sensitive dataをログ・エラー文・Actions artifactへ出す。
- secretをcommitする。
- 検証（lint / typecheck / test / build）未通過でPhase完了を宣言する。

---

## 4. Phase運用

実装は必ずPhase単位で行う。詳細は `docs/PHASE_WORKFLOW.md`。

```
Phase開始 → 正本確認 → Blocking確認 → 計画 → 実装
→ lint → typecheck → test → build → self-review
→ Codex独立レビュー → remediation → 再検証 → PASS
→ commit → phase tag
```

各Phaseで `docs/phases/phase-NN-<slug>.md` に以下を残す。

- scope / out of scope
- source of truth（Decision ID・Acceptance ID）
- acceptance criteria
- files changed
- validation result
- unresolved issues

`/phase-start`、`/phase-verify` を使ってよい。

---

## 5. 検証コマンド

Phase完了前に全て通すこと。1つでも失敗していれば未完了。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

DB境界を触ったPhaseでは `npm run test:integration`、主要導線を触ったPhaseでは `npm run test:e2e` も必須。

これらはHarness規約であり、B-01で採用したツール（TypeScript / Vitest / Playwright / Next.js）前提。Phase 1のscaffoldで実際に作成する。**未整備であることを理由に検証を省略しない**。整備されていなければ、それを整備するまでPhase完了にしない。

---

## 6. 責務分離

| 主体 | 責務 |
|---|---|
| Claude Code | 正本に基づく実装、self-review、検証実行、記録 |
| Codex | 独立レビュー（仕様逸脱・境界違反・検証漏れの指摘） |
| 人間 | 仕様判断、Decision承認、B-04/B-09解決、PASS判定、リリース |

Claudeは自分のレビューでCodexレビューを代替しない。
Codexの指摘を人間承認なしに仕様変更として取り込まない。

---

## 7. 人間判断へのエスカレーション条件

以下に該当したら**実装を止めて質問する**。推測で進めない。

1. 正本間に矛盾があり、優先順位規則（§1）でも決まらない。
2. 実装に必要な事項がどのDecisionにも無い。
3. B-04 / B-09に依存する実装に到達した。
4. Accepted Decisionの変更が必要だと判断した。
5. 既存Acceptanceを満たせない、またはAcceptance自体の修正が必要。
6. destructive migration / データ削除 / 保持期間に関わる判断が必要。
7. 認証・権限・機微情報の扱いを新たに決める必要がある。
8. Phase scopeを広げる必要がある。

質問は「何が / どの文書の / どう決まっていないか」「選択肢」「推奨」をセットで出す。

---

## 8. 記録

`docs/DECISIONS_AND_FAILURES.md` へ追記する（Accepted Decisionの複製はしない）。

- 実装中に見つかった仕様矛盾
- 試したが失敗した方法
- 採用しなかった設計
- migration failure / retry分類
- security incident相当
- testで見つかった再発防止事項

既存記述の削除・全面書き換えはしない。日付見出しで追記する。
