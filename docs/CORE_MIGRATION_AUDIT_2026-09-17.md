# OTOMO COMES CORE Migration Audit

Date: 2026-09-17
Scope: Harness ownership reorganization only. Runtime behavior / Product specification / Accepted Decision are unchanged.

## Classification

### Move to OTOMO CORE ownership
- Role Separation
- generic Phase lifecycle
- Risk Classification / Review Assurance Level L0-L2
- Independent Review / Clean-room / Verification Evidence
- generic FAIL loop / Completion Report
- generic Scope Discipline / Durable History
- Failure schema / Knowledge Promotion

### Keep in OTOMO COMES
- Product Source of Truth order and Decision priority
- B-04 / B-09 Gates
- CRM GET-only boundary
- COMES architecture boundaries
- organization / UUID / DB invariants
- sensitive-data / retention rules
- AI four-stage validation and Human-in-the-loop invariants
- HOME / Task contracts and Decision-specific rules
- Product validation commands and Acceptance traceability
- Product-specific failures and Phase records

### Keep as Product shim
- `docs/PHASE_WORKFLOW.md`: CORE workflow pointer + COMES-specific additions only
- `docs/DEVELOPMENT_STANDARDS.md`: CORE standards pointer + PRODUCT_RULES / VALIDATION pointer only

## Review Assurance
Candidate Level: L1 Targeted Independent Review.

Risk Drivers:
- no runtime code, DB schema, auth, data-retention policy, or Product requirement changes
- modifies AI/Harness behavior and future review routing
- replaces the former every-Phase Codex requirement with CORE risk-based review semantics

Targeted Review should verify:
1. no COMES-specific invariant was lost while shrinking local Harness documents
2. Source of Truth ordering still resolves Product conflicts correctly
3. B-04 / B-09 and sensitive-data boundaries remain discoverable
4. CORE L0/L1/L2 semantics are referenced rather than locally redefined inconsistently
5. existing `.claude/rules` remain subordinate to Product Source of Truth

## Residual risks
- `.claude/rules/*.md` still contain duplicated Product-specific details by design for scoped enforcement; future drift against `harness/PRODUCT_RULES.md` remains possible
- sibling `otomo-core` checkout availability is an environment dependency; Product files remain sufficient to locate COMES-specific rules, but shared workflow text lives only in CORE
- existing historical Phase records retain old wording such as mandatory Codex review; they are historical evidence and are not rewritten by this migration
