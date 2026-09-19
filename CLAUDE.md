# CLAUDE.md

OTOMO COMESでClaude Codeが守るAI開発入口。
本ファイルは製品仕様の正本ではない。

## 1. OTOMO CORE integration

OTOMO COMESはOTOMO CORE-managed Productとして運用する。
共通の開発標準・Phase Workflow・Independent Review・Failure schemaは、ローカルの重複文書ではなくOTOMO COREを正本として参照する。

標準ローカル構成では `otomo-core` をsibling checkoutとして置く。

- 共通開発標準: `..\otomo-core\harness\DEVELOPMENT_STANDARDS.md`
- 共通Phase Workflow: `..\otomo-core\harness\PHASE_WORKFLOW.md`
- Responsibility Boundary: `..\otomo-core\architecture\RESPONSIBILITY_BOUNDARIES.md`
- Failure schema: `..\otomo-core\learning\FAILURE_SCHEMA.md`
- Knowledge Promotion: `..\otomo-core\learning\KNOWLEDGE_PROMOTION.md`

Product固有ルールは `harness/PRODUCT_RULES.md`、Product固有Validationは `harness/VALIDATION.md` を参照する。

## 2. Source of Truth

Product設計・実装前に次を実物で確認する。

1. 後発のAccepted Decision (`docs/decisions/B-*.md`)
2. 責務専用Decision
3. `docs/otomo-comes-spec-v0.2.md`
4. `docs/acceptance-tests-v0.2.md` / `docs/acceptance-tests-final-audit-addendum-v0.1.md`
5. `docs/open-issues-v0.2.md`
6. `docs/final-audit-report-v0.1.md`
7. `harness/PRODUCT_RULES.md`
8. OTOMO CORE共通Rule
9. `docs/DECISIONS_AND_FAILURES.md` / 対象Phase記録

HOME / Task周辺の競合はB-41 §8の優先順位に従う。
正本とHarnessが矛盾する場合は正本を優先し、推測で修正せずHumanへ返す。

## 3. 実装前の停止条件

以下に該当したら実装前または到達時点で停止し、Human Decision Requiredとして返す。

- 正本間の矛盾が優先順位でも解消できない
- 必要なDecisionが存在しない
- B-04 / B-09依存実装に到達した
- Accepted Decisionや既存Acceptanceの変更が必要
- destructive migration / data deletion / retentionの新判断が必要
- 認証・権限・機微情報の新判断が必要
- Phase scope拡張が必要

質問時は「何が未決定か / 根拠文書 / 選択肢 / 推奨」をセットで示す。

## 4. COMES固有Gate

- B-04未解決のままCRM → Daily Work Logの項目mapping / 集計条件を推測実装しない
- B-09未解決のままMeet / Driveのファイル識別・人物特定・複数ファイル識別を推測実装しない
- 欠損metricを0で補完しない
- CRMへ書き込まない（GET only）
- 1on1原文をCOMES DBへ保存しない
- AI Proposalを人間の採用前に実行対象へ昇格させない
- 感情・性格・モチベーション・人物スコアを推測しない

詳細は `harness/PRODUCT_RULES.md`。

## 5. Phase / Review

Phase運用はOTOMO CORE `harness/PHASE_WORKFLOW.md` を正本とする。
COMES固有のPhase差分は `docs/PHASE_WORKFLOW.md` に残す。

実装後はOTOMO COREのRisk-based Independent Reviewに従い、ClaudeはReview Assurance Level候補とRisk Driversを申告する。
Claudeは自分の変更のReview Levelを単独で引き下げない。

## 6. Validation

Product固有Validationは `harness/VALIDATION.md` を正本とする。
最低限 `lint / typecheck / unit test / build` を通し、変更領域に応じてintegration / e2eを追加する。

## 7. 記録

- Product固有Decision / Failure / Phase evidenceはCOMES repositoryへ残す
- 共通Ruleの本文をCOMESへ複製しない
- `.claude/rules/*.md` はCOMES固有不変条件の実行時補助であり、共通Ruleの正本ではない
- `docs/DECISIONS_AND_FAILURES.md` は追記型で運用する
