# OTOMO COMES Phase Workflow

Status: Product-specific shim. 共通Phase Workflowの正本ではない。

OTOMO COMESのPhase運用はOTOMO CORE `..\otomo-core\harness\PHASE_WORKFLOW.md` を正本とする。
本書ではCOMES固有差分だけを定義する。

## COMES-specific additions

Phase開始時に、CORE共通確認に加えて以下を必ず確認する。

- `docs/open-issues-v0.2.md` のB-04 / B-09依存有無
- 対象Decision IDとAcceptance ID (`AT-xx` / `FA-xx`)
- `harness/PRODUCT_RULES.md`
- `harness/VALIDATION.md`
- 対象Phase記録 `docs/phases/phase-NN-<slug>.md`

## Stop conditions

次に該当した場合は推測で進めずHuman Decision Requiredへ戻す。

- B-04 / B-09に依存する実装へ到達した
- Accepted Decision / formal spec / Acceptanceの変更が必要
- COMES固有の認証・権限・保持・削除に新しい判断が必要
- Phase scopeの拡張が必要
- 正本間の矛盾が優先順位でも解消できない

## Phase record

各Phaseでは `docs/phases/phase-NN-<slug>.md` に少なくとも以下を残す。

- scope / out of scope
- Source of Truth / Decision ID / Acceptance ID
- files changed
- Validation result
- Review Assurance Level / Risk Drivers
- L1 Review ScopeまたはL0 Exemption
- unresolved issues / Human Decision Required
- commit / branch anchor

Review Level、Independent Review、FAIL Loop、Completion Reportの共通要件はOTOMO COREを再掲せず、その正本に従う。
