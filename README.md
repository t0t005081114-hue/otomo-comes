# OTOMO COMES

AI上司が正しく判断できる状態を作るマネジメントOS。

## Current source of truth

- MVP仕様: `docs/otomo-comes-spec-v0.2.md`
- 受け入れテスト: `docs/acceptance-tests-v0.2.md`
- 未決定 / Blocking: `docs/open-issues-v0.2.md`
- Decision群: `docs/decisions/`

旧 `v0.1` 文書は履歴として残すが、MVP実装では `v0.2` と後発Accepted Decisionを優先する。

## Remaining implementation blockers

実データ確認が必要な以下2件のみ。

- B-04: 会社CRM → Daily Work Log実データmapping
- B-09: Meet / Drive実ファイル識別検証

Core / UI / AI契約の実装は開始可能。ただしCRM AdapterとMeet / Drive取込Adapterの本実装前に、それぞれB-04 / B-09を解決する。
