# OTOMO COMES Development Standards

Status: Product-specific shim. 共通Development Standardsの正本ではない。

OTOMO COMESの共通開発標準はOTOMO CORE `..\otomo-core\harness\DEVELOPMENT_STANDARDS.md` を正本とする。
本書ではCOMES固有ルールを重複記載せず、Product固有Harnessへの導線だけを持つ。

## Product-specific rules

COMES固有のArchitecture / Database / Security / AI Boundary / B-04・B-09 Gate / Testing obligationsは次を参照する。

- `harness/PRODUCT_RULES.md`
- `harness/VALIDATION.md`
- Accepted Decision (`docs/decisions/B-*.md`)
- formal spec / Acceptance

## Claude scoped rules

`.claude/rules/*.md` は対象ファイル編集時の補助層として維持する。
これらはAccepted Decision・formal spec・`harness/PRODUCT_RULES.md` より上位の正本ではない。
共通OTOMOルールを新たに複製しない。

## Conflict handling

Product仕様・Accepted DecisionとHarnessが矛盾する場合はProduct正本を優先する。
共通CORE Ruleの変更が必要に見える場合、COMES側で独自に分岐させずHuman Decision Requiredとして提案する。
