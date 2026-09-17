# OTOMO COMES Validation

Status: Product-specific validation contract.
共通のValidation原則・Review AssuranceはOTOMO COREを参照し、本書ではCOMES固有コマンドと追加条件のみを定義する。

## 1. Standard validation

Phase完了前の標準コマンド:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

1つでもFAILしている場合はPhase完了にしない。

## 2. Conditional validation

変更領域に応じて追加する。

- DB boundary / migration / repository integrationを触る: `npm run test:integration`
- HOME / Task / Decision Pack / AI import等の主要導線を触る: `npm run test:e2e`
- dependency / lockfile / toolchainを触る: clean install (`npm ci`) を再現可能な状態で確認する

現在 `test:integration` はPhase 00 foundationの都合で `--passWithNoTests` を許容している。最初の実integration test導入Phaseでこの許容を削除する。

## 3. Acceptance traceability

- 対象Acceptance ID (`AT-xx` / `FA-xx`) をPhase記録に明示する
- business ruleをtestで確認する場合、test名またはコメントへAcceptance IDを対応付ける
- BLOCKING Acceptanceが未検証 / FAILのままPhaseをPASSにしない
- 実装に合わせてAcceptanceを書き換えない

## 4. Data / security test constraints

- 本番データをtestへ使わない
- 機微データ・実在個人情報をfixtureへ入れない
- external CRM / Google実環境へ接続してunit testを成立させない
- B-04 / B-09未解決領域の実データ依存testを推測実装しない

## 5. Evidence

Validation結果はOTOMO CORE `harness/PHASE_WORKFLOW.md` / `harness/DEVELOPMENT_STANDARDS.md` が要求するLevel別Evidenceへ含める。
最低限、実行command・結果・未実行項目の理由・Acceptance確認をGitHubから追跡可能にする。
