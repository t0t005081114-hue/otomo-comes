# OTOMO COMES 実装知見・失敗記録

Status: Harness v0.1（運用ファイル / 製品仕様の正本ではない）

実装中に分かったことを時系列で**追記**する。

---

## 本書の責務

記録する:

- 実装中に見つかった仕様・Decision間の矛盾（と、どう扱ったか）
- 試したが失敗した方法（と、なぜ失敗したか）
- 検討したが採用しなかった設計（と、却下理由）
- migration failure（原因・復旧手順・再発防止）
- retry分類の実測（どのエラーがretry可 / 不可だったか）
- security incident相当（機微データの誤出力・誤保存・secret混入。**値そのものは書かない**）
- testで見つかった再発防止事項

記録しない:

- Accepted Decisionの内容の複製（正本は `docs/decisions/`）
- 仕様そのものの定義（正本は `docs/otomo-comes-spec-v0.2.md`）
- secret / token / 1on1原文 / observation本文 / 個人情報
- typo修正・整形のみの変更

---

## 運用ルール

- **追記のみ。** 既存エントリを削除・書き換えしない。
- 認識が変わった場合は、古い記述を消さず、新しい日付のエントリで「現在はこうなっている」と書く。
- 日付は絶対日付（YYYY-MM-DD）。不明な日付を推測で書かない。
- コード・DB schema・migration・Git履歴で確認できることは事実として書く。確認できないものは `未確認`、推測は `（推測）` と明記する。
- 仕様矛盾を見つけた場合、本書への記録だけで終わらせない。解決にDecisionが必要なら人間へエスカレーションする（`CLAUDE.md` §7）。

---

## エントリ形式

```markdown
## YYYY-MM-DD <短いタイトル>

- 種別: 仕様矛盾 / 失敗 / 不採用設計 / migration failure / retry / security / test
- Phase: phase-NN
- 関連: B-xx, AT-xx, FA-xx
- 何が起きたか:
- 原因 / 判断:
- 結果（どう扱ったか）:
- 再発防止 / 次にやること:
- 人間判断が必要か: Yes / No
```

---

## 記録

### 2026-09-13 Harness v0.1 確立

- 種別: 不採用設計
- Phase: harness
- 関連: B-01, B-41
- 何が起きたか: 本実装前のHarness（`CLAUDE.md` / `docs/PHASE_WORKFLOW.md` / `docs/DEVELOPMENT_STANDARDS.md` / `.claude/`）を整備した。
- 原因 / 判断: Phase実装が仕様逸脱せず反復可能になる状態を先に作るため。
- 結果: 本体機能・migration・Adapterは未着手。検証コマンド（`npm run lint` / `typecheck` / `test` / `build`）はPhase 1のscaffoldで作成する前提のHarness規約として定義した。
- 採用しなかったもの:
  - `.claude/agents/` の追加 … レビュー対象コードが存在せず、Codex独立レビューと役割が重複するため保留。
  - アプリscaffold（package.json / tsconfig等）の同時作成 … 本実装の開始になるため除外。
- 再発防止 / 次にやること: Phase 1で検証コマンドを実体化する。未整備を理由に検証を省略しない。
- 人間判断が必要か: No

### 2026-09-13 機微データログ検知hookのfalse positive条件

- 種別: 失敗
- Phase: harness
- 関連: B-19
- 何が起きたか: `.claude/hooks/harness-guard.mjs` の「機微データをログへ出す」検知は
  テキストヒューリスティックのため、**そのパターン自体を記述したファイル**（hookのテストや
  負例fixture）を書こうとしたときにブロックされた。
- 原因 / 判断: ログsink（`console.log` 等）の後ろに `observed_fact` / `access_token` 等の
  識別子が現れるかを見ているため、説明文・テストケース名でも一致してしまう。
- 結果: 検知対象を「repo内のソースファイル」に限定し、以下を除外した。
  - `.md` / `.mdx` / `.txt`（禁止パターンを引用できる必要がある）
  - `.claude/**`（hook自身がパターン定義を持つ）
  - repo外のパス
  検知を弱めるのではなく、**適用範囲を明示**する方向で解決した。
- 再発防止 / 次にやること: ログ禁止ルールのtestを書くときは、禁止文字列を実行時に組み立てるか
  （例: 文字列分割して連結）、fixtureを `.md` に置く。hookの判定を緩めて回避しない。
- 人間判断が必要か: No

### 2026-09-13 破壊的コマンド検知はshell segment単位で判定する

- 種別: 失敗
- Phase: harness
- 関連: B-19
- 何が起きたか: hookがコマンド文字列全体に対して `rm -rf` / `.env` 等を検索していたため、
  `git add -A && echo "=== no .env staged? ==="` のような**説明文を含む複合コマンド**を
  誤ってブロックした。
- 原因 / 判断: 危険なパターンが「実行される位置」にあるのか「文字列として言及されただけ」かを
  区別していなかった。
- 結果: コマンドを shell演算子（`&&` / `||` / `;` / `|` / 改行）で分割し、segment単位で判定。
  先頭が `echo` / `printf` / `grep` / `sed` 等のtext-onlyコマンドのsegmentは破壊的判定から除外した。
  ただし**secretリテラルはコマンド全体を対象に維持**（echoでもshell履歴・ログへ残るため）。
- 再発防止 / 次にやること: hookの動作確認はBashへ直接payloadを書かず、テストスクリプトから
  実行する（payload文字列自体がhookに引っかかる）。
- 検証: BLOCK 39件 / PASS 27件 を実測（66/66 PASS）。`post` 警告3種（migration / large write /
  Phase記録未更新）もsession単位で1回だけ発火することを確認。
- 人間判断が必要か: No

### 2026-09-13 Next.js 16.3+ が AGENTS.md / CLAUDE.md を自動書き換えする

- 種別: 失敗
- Phase: phase-00
- 関連: B-01
- 何が起きたか: `next build` / `next dev` 実行時、Next.js 16.3.5が
  `<!-- BEGIN:nextjs-agent-rules -->`〜`<!-- END:nextjs-agent-rules -->` の管理ブロックを
  リポジトリ直下の `AGENTS.md`（存在しなければ作成、存在すれば追記）へ自動で書き込んだ。
  本リポジトリの `AGENTS.md` はCodex独立レビューの入口ルールという固有の意味を持つ既存ファイルであり、
  意図しない内容が混入した。
- 原因 / 判断: Next.js 16.3の新機能（AI coding agent向けdocs導線の自動生成）。デフォルトで有効。
  `next.config.ts` の `agentRules: false` で無効化できる（Next.js公式ドキュメント
  `node_modules/next/dist/docs/01-app/02-guides/ai-agents.md` に記載）。
- 結果: `AGENTS.md` を `git checkout --` で元に戻し、`next.config.ts` へ `agentRules: false` を設定した。
  再度 `npm run build` を実行し、`AGENTS.md` が変更されないことを確認済み。
- 再発防止 / 次にやること: Next.jsをバージョンアップする際、`agentRules: false` が
  設定のまま維持されているか確認する。将来的に `AGENTS.md` を自動生成に任せたい場合は
  人間判断で方針を変える（本リポジトリのAGENTS.mdはHarness文書のため上書き運用に向かない）。
- 人間判断が必要か: No

### 2026-09-13 Codex独立レビュー1回目 FAIL と remediation

- 種別: 失敗
- Phase: phase-00
- 関連: B-01
- 何が起きたか: commit `aceba0b`（phase-00）に対するCodex独立レビューが FAIL 判定。
  Blocking 1件（`npm ci` がlockfile不整合で失敗）、Advisory 4件
  （Node/npmバージョン契約の不在、`eslint.config.mjs` がPhase記録の説明
  「core-web-vitals + typescript」と異なりdefault presetのみを使用、
  `next-env.d.ts` がtrackedでdev/build切替のたびdirtyになる、
  `test:integration` の `passWithNoTests: true` が後続Phaseで解除必須）の指摘を受けた。
- 原因 / 判断（Blocking: lockfile不整合）: `npm ci` が
  `Missing: @emnapi/runtime@... from lock file` で失敗すると報告された。
  調査の結果、`package-lock.json` には `@img/sharp-wasm32` /
  `@tailwindcss/oxide-wasm32-wasi` / `@unrs/resolver-binding-wasm32-wasi` などの
  wasm32向けoptional依存が `@emnapi/runtime` への依存を宣言しているにもかかわらず、
  `@emnapi/runtime` 自体のlockfileエントリが存在しないことを確認した（事実）。
  これは `@napi-rs/wasm-runtime` 系パッケージが `@emnapi/runtime` をfloating range
  （例: `^1.7.1`）のpeer依存として要求し、lockfile生成時のプラットフォーム・npmバージョンに
  よって解決結果が変わることに起因する既知のnpm/napi-rsエコシステムの問題（推測。
  Codexレビュー実行環境のnpmバージョンをこちらから直接確認する手段がないため、
  「どのnpmバージョンが具体的にこの不整合を再現するか」は未確認）。
  手元環境（Windows / npm 11.6.2）では、`node_modules` と `package-lock.json` を削除した
  完全クリーン状態からの `npm install` / `npm ci`（`--os=linux --cpu=x64 --libc=glibc` に
  よるクロスプラットフォーム強制、オフライン実行を含む）を複数回試したが、いずれも
  再現しなかった（事実）。
- 結果: 以下を実施した。
  1. `package.json` に `engines.node` (`>=24 <25`) / `engines.npm` (`>=11 <12`) を追加。
  2. リポジトリ直下に `.node-version`（`24.13.0`）を追加。
  3. `.github/workflows/ci.yml` を `actions/setup-node` の `node-version-file: ".node-version"`
     参照に変更し、`npm ci` 実行前に `npm install -g npm@11.6.2` を追加してCIのnpmバージョンを
     手元環境と一致させた。
  4. `node_modules` / `package-lock.json` を完全に削除したクリーン状態から `npm install` で
     `package-lock.json` を再生成した（手作業でのlockfile部分編集はしていない）。
  5. 再生成後のクリーン `npm ci` → `lint` → `typecheck` → `test` → `test:integration` → `build`
     が全てPASSすることを確認した（本Phase記録のValidation result参照）。
- 再発防止 / 次にやること: `engines` / `.node-version` / CIのnpmバージョン固定により、
  今後のnpmバージョン差異に起因する再発を防ぐ。将来npmをアップグレードする場合は
  `engines.npm` と `.node-version` とCIの `npm install -g npm@x` を同時に更新し、
  更新後に必ずクリーン `npm ci` で再検証する。もし将来的に同種の
  「Missing: X from lock file」がCIでのみ再現する場合、Codexレビュー実行環境の
  npm/OSバージョンを人間に確認する必要がある（このHarnessからは直接確認できない）。
- 人間判断が必要か: No

### 2026-09-13 eslint.config.mjs の実設定とPhase記録の不一致を訂正

- 種別: 失敗
- Phase: phase-00
- 関連: B-01, DEVELOPMENT_STANDARDS §2
- 何が起きたか: `docs/phases/phase-00-development-foundation.md` の Files changed には
  「`eslint-config-next` のnative flat config（`core-web-vitals` + `typescript`）を直接使用」
  と記載していたが、実際の `eslint.config.mjs` は `eslint-config-next` のdefault export
  （`import nextConfig from "eslint-config-next"`）のみを展開しており、
  `core-web-vitals`（`@next/eslint-plugin-next` の `core-web-vitals` ruleset）と
  `typescript`（`typescript-eslint` recommended、`@typescript-eslint/no-explicit-any` を
  含む）が実際には適用されていなかった（事実。`node_modules/eslint-config-next/dist/index.js`
  と `core-web-vitals.js` / `typescript.js` を比較して確認）。
- 原因 / 判断: Phase 0実装時の記録と実装の取り違え（推測。当時の判断根拠は未確認）。
- 結果: `eslint.config.mjs` を `eslint-config-next/core-web-vitals` と
  `eslint-config-next/typescript` を明示import・展開する構成に修正し、記録どおりの実設定に
  一致させた。独自ruleの追加はしていない。`npm run lint` がクリーンな状態でPASSすることを
  確認した。
- 再発防止 / 次にやること: Phase記録の「Files changed」に書く設定内容は、実装後に該当
  ファイルを読み直して事実と一致するか確認してから記録する。
- 人間判断が必要か: No

### 2026-09-13 next-env.d.ts のtracked運用を修正

- 種別: 失敗
- Phase: phase-00
- 関連: DEVELOPMENT_STANDARDS §1
- 何が起きたか: `next-env.d.ts` がgit管理下にあり、`next dev` / `next build` /
  `next typegen` を実行するたびに内容（`.next/types/routes.d.ts` 等への参照）が
  更新されworking treeがdirtyになっていた（事実）。
- 原因 / 判断: Next.js 16の型付きroutes機能により `next-env.d.ts` は
  `.next/types/**` を参照する形に自動生成される。このファイルはNext.js公式ドキュメント
  （`node_modules/next/dist/docs/.../typescript.md` 相当）でも「編集しない」ことが
  前提とされており、`.next/` 自体が既に `.gitignore` 対象であることと矛盾していた
  （tracked対象がbuild成果物依存になっていた）。
- 結果: `git rm --cached next-env.d.ts` でuntrackし、`.gitignore` に `next-env.d.ts` を
  追加した。`npm run typecheck` は `next typegen && tsc --noEmit` に変更し、`tsc` 実行前に
  `next-env.d.ts` と `.next/types/**` を明示的に再生成するようにした（`next typegen` は
  フルbuildを行わない軽量コマンド）。`node_modules` / `.next` / `next-env.d.ts` を
  すべて削除したクリーン状態から `next typegen` を単体実行し、`next-env.d.ts` と
  `.next/types/{routes,root-params,cache-life}.d.ts` が正しく再生成されることを確認した。
- 再発防止 / 次にやること: `next-env.d.ts` を今後も編集しない。`typecheck` の前提
  （`next typegen` が先に走ること）が壊れていないか、`package.json` の `scripts.typecheck`
  変更時に確認する。
- 人間判断が必要か: No

### 2026-09-13 test:integration の passWithNoTests は実装TODOとして明示

- 種別: 不採用設計（今回は解除しない判断）
- Phase: phase-00
- 関連: DEVELOPMENT_STANDARDS §6
- 何が起きたか: `vitest.config.ts` の `integration` projectは `passWithNoTests: true` の
  ままであり、`tests/integration/` にテストファイルが0件のため `npm run test:integration`
  は「0件PASS」として成功する。Codexレビューはこれを「Phase 0では許容だが後続Phaseで
  解除必須」とAdvisory指摘した。
- 原因 / 判断: DB業務スキーマ・migrationが未実装のPhase 0時点では、integration testで
  検証する対象自体が存在しない。今回のremediationでは仕様変更・scope拡張を伴う
  対応（テスト実体の追加やCI構成変更）はせず、TODOとして明示するに留めた。
- 結果: 実装TODOとして本エントリと `docs/phases/phase-00-development-foundation.md` の
  Unresolved issuesへ記録した。
  - 最初のDB Phase（`organization_id` / migration等の業務スキーマを導入するPhase）までに、
    `test:integration` の空PASS（`passWithNoTests: true` かつテスト0件の状態）を禁止する。
    DEVELOPMENT_STANDARDS §6の「必ずintegration testを書くDB境界」が実装されるタイミングで
    `passWithNoTests` を外すか、最低1件の実integration testを追加する。
  - 最初の主要導線Phase（HOME / Task等、DEVELOPMENT_STANDARDS §6の e2e対象が実装される
    Phase）までに、Playwright e2e実行を `.github/workflows/ci.yml` のCIジョブへ追加する。
    現時点では対象画面が存在せず `npm run test:e2e` は `Error: No tests found` となるため、
    CIには追加していない。
- 再発防止 / 次にやること: 上記2点を該当Phase開始時のscope確認（`docs/PHASE_WORKFLOW.md`）で
  必ずチェックする。
- 人間判断が必要か: No
