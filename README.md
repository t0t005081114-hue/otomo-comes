# OTOMO COMES

AI上司が正しく判断できる状態を作るマネジメントOS。

## Current source of truth

- MVP仕様: `docs/otomo-comes-spec-v0.2.md`
- 基本受け入れテスト: `docs/acceptance-tests-v0.2.md`
- 最終監査追加受け入れテスト: `docs/acceptance-tests-final-audit-addendum-v0.1.md`
- 未決定 / Blocking: `docs/open-issues-v0.2.md`
- Decision群: `docs/decisions/`

旧 `v0.1` 文書は履歴として残す。

MVP実装では以下の優先順位を使う。

1. 後発のAccepted Decision
2. 責務専用Decision
3. `docs/otomo-comes-spec-v0.2.md`
4. 旧v0.1 / Draft

最終監査で追加されたB-33〜B-47はAccepted済みであり、`docs/acceptance-tests-final-audit-addendum-v0.1.md` のBLOCKINGテスト対象とする。

## Audit status

設計 / UI / AI契約 / DB保存契約について、人間判断が必要な未解決Blockingは現在なし。

Core / UI / AI契約の実装は開始可能。

## Remaining implementation blockers

実環境・実データ確認が必要な以下2件のみ。

- B-04: 会社CRM → Daily Work Log実データmapping
- B-09: Meet / Drive実ファイル識別検証

これらは設計未決ではなく、実データを見ないと確定できないAdapter固有事項。

- CRM Adapter本実装前にB-04を解決する
- Meet / Drive取込Adapter本実装前にB-09を解決する
- B-04 / B-09を推測で実装しない

## Development harness

実装を開始する前に読む。いずれも正本ではなく、上記仕様・Decisionに従属する。

- `CLAUDE.md` … この repo の最上位開発ルール・禁止事項・エスカレーション条件
- `docs/PHASE_WORKFLOW.md` … Phaseの標準ループと記録項目
- `docs/DEVELOPMENT_STANDARDS.md` … architecture / TypeScript / DB / security / AI境界 / testing の実装標準
- `docs/DECISIONS_AND_FAILURES.md` … 実装中に判明した矛盾・失敗・不採用設計の記録
- `docs/phases/` … Phaseごとのscope・acceptance・検証結果
- `.claude/rules/` … 対象ファイルを触ったときだけ読み込まれる実装ルール
- `.claude/hooks/harness-guard.mjs` … secret混入・機微データログ出力・破壊的操作・正本書き換えのブロック

アプリ本体（業務機能 / migration / Adapter）は未実装。検証コマンド
（`npm run lint` / `typecheck` / `test` / `build`）はPhase 0のscaffoldで作成済み（`docs/phases/phase-00-development-foundation.md`）。
