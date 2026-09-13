# Phase 00 — development-foundation

Status: blocked (Codex再レビュー待ち。Review 1 FAIL → Remediation 1 → Review 2 FAIL →
Remediation 2 実施済み。phase-00 tagは未付与)
Date: 2026-09-13
Remediation date: 2026-09-13
Remediation 2 date: 2026-09-13

## レビュー経過の要約（事実を上書きしない）

- Review 1（commit `aceba0b`）: FAIL。`npm ci` がlockfile不整合で失敗。
- Remediation 1: `engines` / `.node-version` / CIのnpmバージョン固定等を実施。
  手元環境では原因を再現できず、根本原因には未到達のまま「再検証PASS」として記録した
  （下記「Remediation内容と再検証結果」原文のまま）。
- Review 2（commit `8997759`）: **FAIL**。clean checkout / Node 24.13.0 / npm 11.6.2でも
  `npm ci` が失敗することを指摘（Remediation 1では解消できていなかった）。
- Remediation 2（本セクション以降に追記）: 実際の依存グラフ上の欠落
  （`@napi-rs/wasm-runtime` のpeer dependency `@emnapi/core` / `@emnapi/runtime` が
  lockfileのどこにも解決先を持たない）を特定し解消。詳細は
  `docs/DECISIONS_AND_FAILURES.md` 2026-09-13付「Codex再レビュー2回目FAIL: `npm ci`
  clean install失敗の実際の原因を特定・解消（Remediation 2）」参照。

**重要**: 下記「Codex独立レビュー1回目」「Remediation内容と再検証結果」節は
Remediation 1時点の記録であり、当時「クリーン状態からの再検証で全てPASSした」と
記録していたが、Codex再レビュー2回目（clean checkout環境）では実際にはFAILしていた。
この既存記録は削除・書き換えず、事実として残す。最新の状態は本ファイル末尾の
「Remediation 2内容と再検証結果」を正とする。

## Scope

- Next.js 16 / React 19 / TypeScript 5 / Tailwind CSS v4 の最小scaffold（App Router）
- `docs/DEVELOPMENT_STANDARDS.md` §1 のディレクトリ構成（`src/{app,application,core,adapters,schemas,shared}`, `tests/{unit,integration,e2e}`）
- `npm run lint / typecheck / test / build` が実際に動く状態（`test:integration` / `test:e2e` も可能な範囲で）
- Vitest（unit）基盤とpure TypeScriptの最小テスト
- Playwright（e2e）起動可能な設定（ブラウザ導入不可の場合は理由を明示しPASS扱いしない）
- ESLint + TypeScript strict構成
- Supabase開発ディレクトリ準備（CLI初期化 / `supabase/migrations/` 置き場 / generated types導線のみ。業務テーブルは作らない）
- `.env.example`（値なし、最小限のplaceholderのみ）
- 最小GitHub Actions CI（install / lint / typecheck / test / build）
- Phase記録ファイル作成

## Out of scope

- DB業務スキーマ本実装（B-02 / B-32 / B-41）
- Auth実装（Supabase Auth自体の組込みはPhase 0では行わない。B-18のロール/権限判定も含む）
- Organization / Person / Task / HOME / Decision Pack / AI Result import / 1on1 / Manager Observation / Schedule の業務画面・ロジック
- CRM Adapter / Drive Adapter / AI Adapter の実装
- **B-04**（CRM → Daily Work Log実データmapping）: OPEN/BLOCKING-NOW（`docs/open-issues-v0.2.md`）。Phase 0はCRM Adapterに触れないため非依存。
- **B-09**（Meet / Drive実ファイル識別）: OPEN/BLOCKING-NOW。Phase 0はDrive/Meet取込に触れないため非依存。
- Vercel本番deploy、Supabase本番project作成、CI上でのmigration自動適用
- Prettier等、必要性が明確でない追加ツール

## Source of truth

| 参照 | 内容 |
|---|---|
| B-01 | 技術スタック（Next.js 16 / React 19 / TS 5 / Tailwind v4 / Supabase / Vitest / Playwright / GitHub Actions）、ディレクトリ構成、`src/core` vendor import禁止 |
| B-18 §1 | 認証Identity分離（Phase 0では未実装、方針のみ踏まえてSupabase Auth導入方向を阻害しない構成にする） |
| B-19 §6 | ログ出力方針・secret非commit方針（`.env.example`のみコミット） |
| DEVELOPMENT_STANDARDS §1 | Architecture層構成・ディレクトリ |
| DEVELOPMENT_STANDARDS §2 | TypeScript strict / any禁止 / 境界Zod検証（Phase 0では境界コード自体は未実装、方針のみ） |
| DEVELOPMENT_STANDARDS §3 | migration原子性・置き場所（Phase 0はディレクトリ準備のみ） |
| DEVELOPMENT_STANDARDS §4 | Secret / `.env`運用 |
| DEVELOPMENT_STANDARDS §6 | Testing区分（unit/integration/e2e）とツール |
| spec v0.2 §3 | Architecture Boundary（Input Adapters → COMES Core → Decision Pack → AI Boundary → AI Analysis Result → COMES UI/Task） |
| open-issues-v0.2 | B-04 / B-09 BLOCKING-NOW判定、それ以外に設計Blockingなし |
| PHASE_WORKFLOW §1〜§2 | 標準ループ・Phase記録項目 |
| CLAUDE.md §3, §5 | 禁止事項、検証コマンド必須化 |

## Acceptance criteria

Phase 0に直接対応するAcceptance IDは存在しない（業務機能を実装しないため）。
基盤Phaseとして以下を **indirect coverage** として記録する。

| ID | 内容 | 判定方法 | 結果 |
|---|---|---|---|
| AT-01 (indirect) | COMES Coreの成立に必要な層境界（`src/core` vendor非依存）を構造的に維持する土台を作る | `src/core` にvendor importが無いこと（現状コード無し）、層ディレクトリが存在すること | PASS（indirect / コード未実装のため自明） |
| — | 直接対応Acceptanceなし | 基盤Phaseのため該当なし | N/A |

## Files changed

| ファイル | 責務 |
|---|---|
| `package.json` / `package-lock.json` | B-01技術スタック依存関係、`lint/typecheck/test/test:integration/test:e2e/build` script定義（PHASE_WORKFLOW §1, CLAUDE.md §5）。**\[remediation\]** `engines.node` (`>=24 <25`) / `engines.npm` (`>=11 <12`) を追加、`typecheck` scriptを `next typegen && tsc --noEmit` に変更、`node_modules`/`package-lock.json`を完全削除したクリーン状態から`package-lock.json`を再生成。**\[remediation 2\]** `devDependencies` に `@emnapi/core@^1.11.3` / `@emnapi/runtime@^1.11.3` を追加（`@napi-rs/wasm-runtime` の未解決peer dependencyをtop-levelで解決するため。`npm install --save-dev` で追加、`package-lock.json`は手編集していない）。`test:integration` scriptを `vitest run --project integration --passWithNoTests` に変更 |
| `tsconfig.json` | TypeScript strict構成（DEVELOPMENT_STANDARDS §2）。`npm run build` 実行時にNext.jsが `jsx: react-jsx` 等を自動追記（フレームワーク必須の変更） |
| `next.config.ts` | Next.js最小設定。`agentRules: false` でNext.js 16.3+の`AGENTS.md`自動書き換えを無効化（下記Unresolved issues参照） |
| `eslint.config.mjs` | ESLint flat config。**\[remediation\]** default export（`eslint-config-next`）のみを展開していた実装ミスを修正し、記録どおり `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` を明示importして展開する構成に変更（`docs/DECISIONS_AND_FAILURES.md` 参照） |
| `.node-version` | **\[remediation・新規\]** Node `24.13.0` をローカル/CI共通の契約として固定 |
| `.gitignore` | **\[remediation\]** `next-env.d.ts` を追加（下記参照） |
| `postcss.config.mjs` | Tailwind CSS v4のPostCSSプラグイン設定 |
| `src/app/layout.tsx` / `page.tsx` / `globals.css` | 動作確認用の最小Next.js App Router画面（業務画面ではない） |
| `src/{core,application,adapters,schemas,shared}/README.md` | DEVELOPMENT_STANDARDS §1のディレクトリ構成・層責務の明文化（コード未実装） |
| `vitest.config.ts` | Vitest `unit` / `integration` project分割（DEVELOPMENT_STANDARDS §6）。**\[remediation 2\]** root/project双方にあった `passWithNoTests: true` を削除。0件PASSの許容は `test:integration` scriptの `--passWithNoTests` CLIフラグへ限定し、`npm run test`（unit）は0件ならFAILする状態に変更 |
| `tests/unit/example.test.ts` | pure TypeScriptの動作確認用smoke test |
| `tests/integration/README.md` / `tests/e2e/README.md` | テスト区分の置き場所を明示（テスト本体は業務スキーマ/画面実装後） |
| `playwright.config.ts` | Playwright起動可能な最小設定（B-01） |
| `supabase/config.toml` / `.gitignore` / `migrations/.gitkeep` / `README.md` | `supabase init` によるローカル開発ディレクトリ準備のみ（業務テーブルなし。B-01, DEVELOPMENT_STANDARDS §3） |
| `.env.example` | 値なしのplaceholder環境変数（B-19 §6, DEVELOPMENT_STANDARDS §4） |
| `.github/workflows/ci.yml` | push/PRで install→lint→typecheck→test→build のみ実行する最小CI（B-01 §7, CLAUDE.md §3の禁止範囲を超えない）。**\[remediation\]** `actions/setup-node` を `node-version-file: ".node-version"` 参照に変更し、`npm ci` 直前に `npm install -g npm@11.6.2` を追加してnpmバージョンをローカルと一致させた |
| `docs/phases/phase-00-development-foundation.md` | 本Phase記録（PHASE_WORKFLOW §2）。**\[remediation\]** Codexレビュー1回目の結果とremediation内容を追記 |
| `docs/DECISIONS_AND_FAILURES.md` | Next.js 16.3+のAGENTS.md自動書き換え挙動と対処の追記（既存記述は削除せず追記のみ）。**\[remediation\]** lockfile不整合・ESLint設定不一致・next-env.d.ts運用・passWithNoTests TODOのエントリを追記 |
| `README.md` | Harness scaffold完了に伴う導線記述の更新（「Phase 1」→「Phase 0」、documentation.mdルールに基づく整合確認） |
| `next-env.d.ts` | **\[remediation\]** `git rm --cached` でuntrack（`.gitignore`に追加）。`next typegen` により`typecheck`実行時に自動再生成される運用へ変更 |

## Validation result（初回・remediation前）

| コマンド | 結果 | 備考 |
|---|---|---|
| `npm run lint` | PASS | ESLint 9.39.5 + `eslint-config-next` flat config。エラー・警告なし |
| `npm run typecheck` | PASS | `tsc --noEmit`。エラーなし |
| `npm run test` | PASS | Vitest `unit` project、1 test file / 1 test |
| `npm run test:integration` | PASS | Vitest `integration` project。対象テスト0件（`passWithNoTests: true`）。DB業務スキーマ未実装のため該当なし |
| `npm run build` | PASS | `next build`（Turbopack）。2ルート（`/`, `/_not-found`）を静的生成 |
| `npm run test:e2e` | FAIL（想定内） | `playwright test` → `Error: No tests found`。HOME/Task等の対象画面が未実装のためe2eテストが存在しない。Playwright設定自体（`playwright.config.ts`）はCLIから認識可能であることを確認済み。ブラウザバイナリは未インストール（`npx playwright install --dry-run` で確認、時間・帯域を要するためPhase 0では未実行）。**勝手にPASS扱いにしない。** |

## Codex独立レビュー1回目（commit `aceba0b`）

- 判定: FAIL
- Blocking: 1件 — `npm ci` がlockfile不整合（`Missing: @emnapi/runtime@... from lock file`）で失敗
- Advisory: 4件 — Node/npmバージョン契約の不在、`eslint.config.mjs` の実設定とPhase記録の不一致、`next-env.d.ts` がtrackedでdirty化、`test:integration` の `passWithNoTests: true` を後続Phaseで解除必須と明示すること
- Human decision required: None

## Remediation内容と再検証結果

対応内容の詳細と原因分析は `docs/DECISIONS_AND_FAILURES.md`（2026-09-13付の4エントリ）参照。要約:

1. `node_modules` / `package-lock.json` を完全削除したクリーン状態から `package-lock.json` を再生成し、`package.json` に `engines.node` / `engines.npm` を追加、`.node-version` を新規作成、`.github/workflows/ci.yml` にnpmバージョン固定ステップを追加（Blocking対応）。
2. `eslint.config.mjs` を `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` の明示import構成に修正（Advisory対応）。
3. `next-env.d.ts` をuntrack + `.gitignore` 追加、`typecheck` scriptを `next typegen && tsc --noEmit` に変更（Advisory対応）。
4. `passWithNoTests` は今回解除せず、解除条件をTODOとして `docs/DECISIONS_AND_FAILURES.md` と本ファイルのUnresolved issuesに明記（Advisory対応）。

### Validation result（remediation後・クリーン状態からの再検証）

`node_modules` / `.next` / `next-env.d.ts` を削除した完全クリーン状態から以下を順に実行し、全てPASSを確認した。

| コマンド | 結果 | 備考 |
|---|---|---|
| `npm ci` | PASS | クリーン状態（`node_modules`・`package-lock.json`削除後に再生成したlockfile）から成功。`Missing: @emnapi/runtime` は再発せず |
| `npm run lint` | PASS | `eslint-config-next/core-web-vitals` + `/typescript` 構成。エラー・警告なし |
| `npm run typecheck` | PASS | `next typegen`（`next-env.d.ts` / `.next/types/**` を再生成）→ `tsc --noEmit`。エラーなし |
| `npm run test` | PASS | Vitest `unit` project、1 test file / 1 test |
| `npm run test:integration` | PASS | Vitest `integration` project。対象テスト0件（`passWithNoTests: true`）。未解除の理由は本ファイルUnresolved issues参照 |
| `npm run build` | PASS | `next build`（Turbopack）。2ルート（`/`, `/_not-found`）を静的生成。`AGENTS.md` / `tsconfig.json` の意図しない書き換えが無いことを `git status` で確認済み |
| `npm run test:e2e -- --list` | FAIL（想定内、remediation前と同一状態） | `Error: No tests found`。HOME/Task等の対象画面が未実装のため変化なし。CIへの追加は次のUnresolved issuesの条件を満たすまで行わない |

## Codex独立レビュー2回目（commit `8997759`）

- 判定: **FAIL**
- Blocking: 1件 — clean checkout / Node 24.13.0 / npm 11.6.2 でも `npm ci` が失敗する。
  Remediation 1（`engines` / `.node-version` / CIのnpmバージョン固定）では解消できて
  いなかった。Codexが特定した事実: `package-lock.json` の `@napi-rs/wasm-runtime@1.2.4`
  が `@emnapi/core` / `@emnapi/runtime` を peerDependencies として要求しているが、
  top-levelに正しく解決されていない。
- Advisory: 1件 — `passWithNoTests: true` がintegration projectだけでなくroot（グローバル）
  へ効いており、unit testが0件でもPASSできる状態になっている。
- Human decision required: None

## Remediation 2内容と再検証結果

原因調査・対応内容の詳細は `docs/DECISIONS_AND_FAILURES.md` 2026-09-13付
「Codex再レビュー2回目FAIL: `npm ci` clean install失敗の実際の原因を特定・解消
（Remediation 2）」および「test:integration の passWithNoTests をintegration project
限定へ変更（Remediation 2）」参照。要約:

1. **原因特定**: `npm explain` / `npm ls --all` / `package-lock.json` の実データを確認し、
   `@napi-rs/wasm-runtime@1.2.4` の必須peerDependencies（`@emnapi/core` /
   `@emnapi/runtime`、`peerDependenciesMeta`でoptional指定なし）を満たすlockfile上の
   解決先が、top-levelにも `@napi-rs/wasm-runtime` 自身のnode_modules配下にも
   一つも存在しないことを事実として確認した（唯一存在する1.10.0系は
   `@unrs/resolver-binding-wasm32-wasi` 自身のprivate nested依存であり、peer解決
   スコープからは不可視）。
2. **修正**: `package.json` の `devDependencies` に `@emnapi/core@^1.11.3` /
   `@emnapi/runtime@^1.11.3` を `npm install --save-dev` で明示追加し（peer要求
   `^1.7.1 || ^2.0.0-alpha.4` と `@tailwindcss/oxide-wasm32-wasi` 自身の要求
   `^1.11.1` の両方を満たすバージョンを選定）、`package-lock.json` を通常の
   npmコマンドで更新した（手編集なし）。
3. **Vitest Advisory対応**: `vitest.config.ts` からroot/project双方の
   `passWithNoTests` を削除し、`package.json` の `test:integration` script側にのみ
   `--passWithNoTests` CLIフラグを付与する方式に変更。`npm run test`（unit）が
   0件時に `exit code 1` でFAILすることを実測確認した（一時的にテストファイルを
   退避 → 確認 → 復元）。

### Validation result（Remediation 2後・完全クリーン状態からの再検証）

`node_modules` / `.next` を削除した完全クリーン状態から以下を順に実行し、全てPASSを確認した。

| コマンド | 結果 | 備考 |
|---|---|---|
| `npm ci` | PASS (exit 0) | `added 396 packages` で成功。`Missing: @emnapi/*` エラーなし |
| `npm ls @napi-rs/wasm-runtime @emnapi/core @emnapi/runtime --all` | 確認済み | `@emnapi/core@1.11.3` / `@emnapi/runtime@1.11.3` がtop-levelで解決され、`@napi-rs/wasm-runtime` からdedupe参照される。UNMET / invalid は0件。`@napi-rs/wasm-runtime` と `@img/sharp-wasm32` は `extraneous` のまま（修正前から同一状態。下記Unresolved issues参照） |
| `npm run lint` | PASS (exit 0) | エラー・警告なし |
| `npm run typecheck` | PASS (exit 0) | `next typegen && tsc --noEmit`。エラーなし |
| `npm run test` | PASS (exit 0) | Vitest `unit` project、1 test file / 1 test。0件時は `exit 1` でFAILすることを実測確認済み |
| `npm run test:integration` | PASS (exit 0) | Vitest `integration` project。対象テスト0件、`--passWithNoTests` CLIフラグにより意図的にPASS |
| `npm run build` | PASS (exit 0) | `next build`（Turbopack）。2ルート（`/`, `/_not-found`）を静的生成 |
| `git status --short` | `package.json` / `package-lock.json` / `vitest.config.ts` のみ変更 | 意図しないファイル変更なし |

## Self-review

`docs/PHASE_WORKFLOW.md` §4 の結果。未達項目のみ記載（他は該当なし/PASS）。

- 仕様: 全変更がB-01 / DEVELOPMENT_STANDARDS §1・§4・§6に根拠あり。業務仕様・新概念の追加なし。
- B-04/B-09 Gate: 該当コード・mapping・識別ロジックなし（非該当）。
- アーキテクチャ: `src/core` にコード自体が存在せず、vendor importなし（確認済み）。Adapter未実装のため外部連携もなし。
- データ/AI: 該当コードなし（Phase 0 scope外）。
- Security: `.env` はGit管理外、`.env.example` は値なし。secretをcommit対象に含めていないことを `git add -n .` で確認済み。ログ出力コード自体が存在しない。
- DB: `supabase/migrations/` は空。業務テーブル・migration本体なし。
- 検証: lint/typecheck/test/build を実行し記録した（Validation result参照）。新しいbusiness ruleは無いためunit testはsmoke testのみ。

未達 / 留意事項:
- 検証commandに直接対応するAcceptance IDは存在しない（Phase 0 scopeのため、Acceptance criteriaにindirectとして記載）。
- `npm run test:e2e` はテスト対象画面が無いため `Error: No tests found` でFAIL終了する。設定自体の起動確認はできているが、コマンドとしてはPASSではない（正直に記録し、PASS扱いにしていない）。

## Codex review

- 1回目（commit `aceba0b`）: FAIL。指摘内容は上記「Codex独立レビュー1回目」参照。
- 対応: 上記「Remediation内容と再検証結果」参照。仕様変更・scope拡張は行っていない。
- 仕様変更提案（人間判断へ）: なし。
- 2回目（commit `8997759`）: **FAIL**。Remediation 1では`npm ci`のclean install失敗が
  未解消であることが判明。指摘内容は上記「Codex独立レビュー2回目」参照。
- Remediation 2対応: 上記「Remediation 2内容と再検証結果」参照。依存関係グラフの
  欠落を実データで特定し解消。仕様変更・scope拡張は行っていない。
- 仕様変更提案（人間判断へ）: なし。
- 3回目: 未実施（Remediation 2後に再レビュー予定。`phase-00` tagは再レビューPASSまで
  付与しない）。

## Unresolved issues

- `npm run test:e2e` は対象画面が存在しないため実行不能（`Error: No tests found`）。Playwrightブラウザバイナリも未インストール。HOME/Task等の画面実装Phaseで解消する。
- Next.js 16.3+ が `AGENTS.md` / `CLAUDE.md` へ管理ブロックを自動書き込みする挙動を確認し、`next.config.ts` の `agentRules: false` で無効化した（`docs/DECISIONS_AND_FAILURES.md` に記録済み）。Next.jsアップグレード時にこの設定が保持されているか都度確認する必要がある。
- `eslint-config-next@16.3.5` がESLint 10（`@eslint/eslintrc`のFlatCompat経由）で circular JSON エラーを起こしたため、native flat config importに切り替え、ESLintはpeer要件を満たす**9.39.5**（EOLバージョン）を採用した。ESLint 10対応の`eslint-config-next`がリリースされ次第アップグレードを検討する。
- Supabase CLIはnpx経由（`npx supabase@2.117.0`）で実行し、グローバルインストールしていない。今後migration作成等で呼び出し方法を固定するか検討の余地がある。
- **\[remediation・新規\]** `test:integration` の `passWithNoTests: true` は今回解除していない。以下のタイミングで解除条件を満たすか確認すること（`docs/DECISIONS_AND_FAILURES.md` 2026-09-13「test:integration の passWithNoTests は実装TODOとして明示」参照）。
  - 最初のDB Phase（業務スキーマ/migration導入）までに、integration testの空PASSを許容しない状態にする。
  - 最初の主要導線Phase（HOME/Task等）までに、Playwright e2e実行を `.github/workflows/ci.yml` のCIジョブへ追加する。
  - **\[remediation 2・追記\]** 上記2条件はそのままTODOとして維持する。今回の対応は
    「unit testが0件でもPASSしてしまう」Advisoryの解消（`passWithNoTests`をintegration
    project限定のCLIフラグへ変更）のみで、integration testの空PASS自体の解除条件は
    変わらない。
- **\[remediation・新規、remediation 2で解消\]** `package-lock.json` の `Missing: @emnapi/runtime@... from lock file` によるCodexレビュー環境での `npm ci` 失敗は、手元環境（Windows / npm 11.6.2）では複数手法で再現できなかった（`docs/DECISIONS_AND_FAILURES.md` 参照）。`engines` / `.node-version` / CIのnpmバージョン固定で対応したが、Codex再レビュー2回目で同一の失敗（`npm ci`のclean install失敗）が再発した。
  **\[remediation 2・解消\]** 実際の原因（`@napi-rs/wasm-runtime`のpeerDependency
  `@emnapi/core` / `@emnapi/runtime` がlockfile上どこにも解決先を持たないという、
  プラットフォーム非依存の構造的欠落）を特定し、root devDependencyとしての明示追加で
  解消した。詳細は `docs/DECISIONS_AND_FAILURES.md` 2026-09-13付「Codex再レビュー2回目
  FAIL: `npm ci` clean install失敗の実際の原因を特定・解消（Remediation 2）」参照。
- **\[remediation 2・新規・未解消\]** `@napi-rs/wasm-runtime` と `@img/sharp-wasm32` は
  Remediation 2後も `npm ls --all` 上で `extraneous` のまま残る。cpu:wasm32の
  optional fallbackパッケージ群が実機ではskipされる一方、npmのoptionalDependency
  解決がその依存自体は取得してしまうという既知の挙動であり、`npm ci` / `npm ls` の
  終了コードには影響しない（Phase 0の検証コマンドは全てPASSしている）。`overrides`
  等での強制排除はPhase 0のscope外・無関係パッケージへの副作用リスクがあるため
  見送った。次にwasm32関連の依存が更新される際、この状態が変化していないか
  確認すること。

## Human decision required

None（Step 1〜4の時点でBlockingなし。実装中に発生した場合はここへ追記し、実装を停止する）
