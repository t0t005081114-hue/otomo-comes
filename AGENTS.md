# AGENTS.md

OTOMO COMESでCodexが独立レビューを行う際のProduct入口。
本ファイルは製品仕様の正本ではない。

## 1. Review foundation

独立レビューの共通原則、Review Assurance Level (L0 / L1 / L2)、Risk Classification、Review Scope、Clean-room Verification、Verification EvidenceはOTOMO COREを正本とする。

標準ローカル構成では以下を参照する。

- `..\otomo-core\harness\DEVELOPMENT_STANDARDS.md`
- `..\otomo-core\harness\PHASE_WORKFLOW.md`
- `..\otomo-core\architecture\RESPONSIBILITY_BOUNDARIES.md`

Codexは実装担当のReview Handoffを出発点として使えるが、Scopeの上限として信用しない。必要ならScopeを広げ、Forced L2 driverを発見した場合はL2へescalateする。

## 2. COMES Source of Truth

レビュー判断では次を実物確認する。

1. 後発のAccepted Decision (`docs/decisions/B-*.md`)
2. 責務専用Decision
3. `docs/otomo-comes-spec-v0.2.md`
4. `docs/acceptance-tests-v0.2.md`
5. `docs/acceptance-tests-final-audit-addendum-v0.1.md`
6. `docs/open-issues-v0.2.md`
7. `docs/final-audit-report-v0.1.md`
8. `harness/PRODUCT_RULES.md`
9. `harness/VALIDATION.md`
10. 対象Phase記録と関連Failure

HOME / Task周辺の競合はB-41 §8に従う。
決められない仕様論点はCodexが補完せずHuman Decision Requiredとして返す。

## 3. COMES-specific review focus

Review Scope内で該当する場合、特に次を監査する。

- B-04 / B-09 Gate違反がないか
- `src/core/**` にvendor dependencyが侵入していないか
- 外部連携がAdapter境界を越えていないか
- CRMがGET onlyか
- organization境界 / UUID参照整合が守られているか
- 1on1原文、Observation本文、token、secret等の保存・ログ境界が守られているか
- AI importの4段Validationが省略されていないか
- pending / held / rejected Proposalが実行対象へ昇格していないか
- 感情・性格・モチベーション・能力スコアの推測がないか
- Acceptance IDとtest/evidenceが対応しているか
- scope外実装 / 過剰設計がないか

詳細なProduct invariantは `harness/PRODUCT_RULES.md` を参照する。

## 4. Finding classification

Findingは少なくとも以下を区別する。

- Implementation defect: 既存正本を変えずに修正できる実装ミス
- Specification / Product decision: 新Decisionまたは仕様変更が必要。Human Decision Required

Blocking / Advisoryの定義とPASS / FAILはOTOMO COREに従う。

## 5. B-04 / B-09 Gate

B-04 / B-09がOPENの間は、以下を推測で確定しない。

- CRM → Daily Work Logの実データmapping / 集計条件
- Meet / Drive実ファイル識別、人物特定、複数ファイル識別
- 欠損metricの0補完や取得不能項目の推測補完

該当実装を発見した場合はBlocking候補として扱う。

## 6. Review result

Review resultはOTOMO COREがLevelごとに要求するEvidenceを満たすこと。
加えてCOMESでは最低限、対象Decision / Acceptance coverage、Human Decision Required、B-04/B-09 Gate該当有無を明示する。

L1ではAcceptance-critical path / risk-critical diff / responsibility boundaryを中心にTargeted Reviewする。
L2では対象logical changeの影響範囲全体をFull Independent Reviewする。
L0は独立レビュー免除であり、Codexレビュー結果を作る必要はない。

## 7. 禁止

- 未決定仕様を自分で確定しない
- Accepted Decision / formal spec / Acceptanceをレビュー都合で変更しない
- 実装を正しいと仮定して正本確認を省略しない
- review scope外の大規模リファクタを仕様のように要求しない
- B-04 / B-09を推測で埋めない
