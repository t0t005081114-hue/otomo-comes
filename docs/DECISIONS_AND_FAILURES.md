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

### 2026-09-13 Codex再レビュー2回目FAIL: `npm ci` clean install失敗の実際の原因を特定・解消（Remediation 2）

- 種別: 失敗 → 解消
- Phase: phase-00
- 関連: B-01
- 何が起きたか: Codex再レビュー2回目が「clean checkout / Node 24.13.0 / npm 11.6.2でも
  `npm ci` が失敗する」でFAIL判定。Remediation 1（上記2026-09-13付エントリ）は手元環境で
  再現しなかったため `engines` / `.node-version` / CIのnpmバージョン固定のみで対応したが、
  根本原因には到達していなかった。
- 原因（事実。`npm explain` / `npm ls --all` / `package-lock.json` の実データで確認）:
  - `@napi-rs/wasm-runtime@1.2.4`（`package-lock.json` に記録された唯一のバージョン）は
    `peerDependencies` として `@emnapi/core: "^1.7.1 || ^2.0.0-alpha.4"` と
    `@emnapi/runtime` を要求しているが、`peerDependenciesMeta` で optional 指定されて
    いない（`node_modules/@napi-rs/wasm-runtime` のpackage.json相当をlockfileから確認）。
  - `package-lock.json` 全体を検索した結果、top-level（`node_modules/@emnapi/core`
    `node_modules/@emnapi/runtime`）にも、`@napi-rs/wasm-runtime` 自身のnode_modules配下
    にも、この peer 要求を満たすエントリが**一つも存在しなかった**（事実）。
  - 唯一存在する `@emnapi/core` / `@emnapi/runtime`（1.10.0）は
    `node_modules/@unrs/resolver-binding-wasm32-wasi/node_modules/` 配下のprivateな
    nested依存であり、`@unrs/resolver-binding-wasm32-wasi` 自身の `dependencies`
    （非bundled・非peer）としての解決結果にすぎず、`@napi-rs/wasm-runtime` のpeer解決
    スコープ（兄弟階層・祖先階層）からは不可視（事実。npmのnode_modules解決規則上、
    兄弟パッケージの内部nested依存は見えない）。
  - `@napi-rs/wasm-runtime` を要求する2系統（`@tailwindcss/oxide-wasm32-wasi` /
    `@unrs/resolver-binding-wasm32-wasi`）はいずれも `cpu: ["wasm32"]` のoptional
    dependencyで、実機（x64等）では本来インストール対象外だが、`@napi-rs/wasm-runtime`
    自体は（cpu制約なしの通常依存として）top-levelにインストールされてしまい、
    `npm ls` 上は `extraneous`（要求元が実質skipされているためidealTreeには不要と
    判定される）と表示される、というnpmのoptionalDependency解決の既知の挙動が
    併発していた（事実。手元のクリーン `npm ci` でも同じ`extraneous`状態を確認済み）。
  - すなわち「lockfileに@emnapi/core / @emnapi/runtimeの解決先が構造的に存在しない」こと
    自体がプラットフォーム非依存の事実であり、手元（Windows / npm 11.6.2）で
    たまたま `npm ci` が exit 0 になっていたのは、npmが未解決peer dependencyを
    デフォルトでは警告に留め、致命的エラーにしていなかったため（推測。Codexレビュー
    実行環境のnpm minor versionやプラットフォームの違いにより「Missing: X from lock
    file」という`npm ci`特有の厳格な整合性エラーに発展したかどうかは、実行環境へ
    直接アクセスできないため未確認）。
- 結果: `package.json` の `devDependencies` に `@emnapi/core@^1.11.3` /
  `@emnapi/runtime@^1.11.3` を明示追加し（`npm install --save-dev` で追加。
  `package-lock.json` の手編集はしていない）、`@napi-rs/wasm-runtime` のpeer要求
  （`^1.7.1 || ^2.0.0-alpha.4`）と `@tailwindcss/oxide-wasm32-wasi` 自身の
  依存要求（`^1.11.1`）の両方を満たすtop-levelエントリをlockfileへ確定させた。
  `node_modules` / `.next` を完全削除したクリーン状態から `npm ci` → `npm ls
  @napi-rs/wasm-runtime @emnapi/core @emnapi/runtime --all` → `lint` →
  `typecheck` → `test` → `test:integration` → `build` を実行し、全てPASS
  （exit 0）することを確認した。`npm ls --all` で `@emnapi/core` /
  `@emnapi/runtime` 関連の `UNMET` / `invalid` は0件であることを確認した。
- 未解消の副次事項（今回は対応しない）: `@napi-rs/wasm-runtime` / `@img/sharp-wasm32` /
  `@tybys/wasm-util` の3件は、今回の修正後も `npm ls` 上で `extraneous` のまま残る
  （事実。今回の修正前から同じ状態だったことを修正前のクリーン`npm ci`で確認済み）。
  **訂正2026-09-18（Pre-Codex Audit）**: 本エントリは従来 `@napi-rs/wasm-runtime` と
  `@img/sharp-wasm32` の2件のみを記載しており、`@tybys/wasm-util` の記載漏れが
  あった。npm 11.6.2実測では3件（上記3パッケージ）、npm 11.19.1実測でも同じ3件が
  `extraneous` と表示されることを確認した。npm minor versionにより表示される
  extraneous一覧が変わりうる点に留意する。
  これは要求元（cpu:wasm32のoptional fallbackパッケージ群）が実機ではskipされる
  一方、npmのoptionalDependency解決が該当パッケージ自体は取得してしまうという
  npm/napi-rsエコシステム側の既知の挙動であり、`npm ci` / `npm ls` の終了コードには
  影響しない（事実）。`overrides` 等で強制的に除外することも検討したが、
  これらはwasm32環境（一部のCI/コンテナ環境）で実際に使われる可能性がある正規の
  optional fallbackパッケージであり、Phase 0のscopeを超えてPhase 0に無関係な
  package群の挙動を変更するリスクの方が大きいと判断し、見送った（判断）。
- 再発防止 / 次にやること: peerDependenciesを要求するoptional wasm系パッケージが
  今後 `package-lock.json` に追加・更新された場合、`npm ls <pkg> --all` で
  `UNMET PEER DEPENDENCY` の有無をPhase完了前に確認する。npmバージョンや
  プラットフォームによって挙動が変わりうる（未確認・推測を含む）ため、
  「手元で `npm ci` が通る」ことだけでCodexレビューのPASSを予測しない。
- 人間判断が必要か: No
- **追記（2026-09-18 Pre-Codex Audit、既存記録は削除・修正しない）**: 上記
  「clean checkout / Node 24.13.0 / npm 11.6.2でも `npm ci` が失敗する」という
  Review 2の条件について、今回のPre-Codex Auditではnpm 11.6.2環境を用意できず
  再現していない（未確認）。一方、Remediation 2適用前のcommit `8997759` に対し、
  本機のnpm 11.19.1で `git worktree add` により分離checkoutし `node_modules` なしの
  状態から `npm ci` を実行したところ、`Missing: @emnapi/runtime@1.11.3 from lock
  file` / `Missing: @emnapi/core@1.11.3 from lock file`（EUSAGE、exit code 1）で
  失敗することを実際に再現した。過去記録（npm 11.6.2という条件）を誤りと断定する
  ものではなく、後続監査で異なるnpmバージョンにおいて同種の再現条件が確認された
  という事実として追記する。

### 2026-09-13 test:integration の passWithNoTests をintegration project限定へ変更（Remediation 2）

- 種別: 失敗 → 解消
- Phase: phase-00
- 関連: DEVELOPMENT_STANDARDS §6
- 何が起きたか: Codex再レビュー2回目のAdvisoryで、`vitest.config.ts` の
  `passWithNoTests: true` がroot（グローバル）に設定されており、`--project unit` /
  `--project integration` のどちらで実行してもテスト0件でPASS可能な状態になっている
  ことを指摘された。Phase 0時点で `tests/unit/example.test.ts` が1件存在するため、
  unit側が0件PASSを許容する必要はない（事実。上記2026-09-13付
  「test:integration の passWithNoTests は実装TODOとして明示」エントリで
  「今回は解除しない」と判断した内容を、Codex指摘を受けて再検討した）。
- 対応で分かったこと（事実。実測で確認）: `vitest.config.ts` の
  `test.projects[].test.passWithNoTests` への個別指定を試したが（この個別指定は
  ローカルでの試行にとどまりcommitはしていない）、`vitest run --project
  integration` 実行時の「No test files found」判定には反映されず、`exit code 1`の
  ままだった（Vitest 5.0.0のprojects機能では、この「テスト0件」判定がroot解決後の
  グローバル設定を見るため。未確認: Vitestの内部実装上の理由までは検証していない）。
  そのため、root（トップレベル）1箇所にのみあった `passWithNoTests: true` を
  `vitest.config.ts` から完全に削除し、`package.json` の `test:integration`
  scriptにのみ `--passWithNoTests` CLIフラグを付与する方式に変更した。
  `npm run test`（unit）は素の `vitest run --project unit`
  のままのため、unit側のテストが0件になれば `exit code 1` でFAILする
  （実測: `tests/unit/example.test.ts` を一時退避し `npm run test` が
  `exit code 1` になることを確認後、ファイルを復元し再度PASSすることを確認した）。
- 結果: `vitest.config.ts` からroot（トップレベル）1箇所にあった
  `passWithNoTests` 指定を削除し（**訂正2026-09-18**: 従来「root/project双方」
  にあったと記載していたが不正確。git上この設定が存在したのはroot 1箇所のみで、
  project個別指定は未commitのローカル実験だった）、`package.json` の
  `scripts.test:integration` を
  `"vitest run --project integration --passWithNoTests"` に変更した。
  `npm run test` は0件時FAIL、`npm run test:integration` は0件時PASSという
  Codex Advisory通りの区別を実現した。
- 再発防止 / 次にやること: 最初のDB Phase（業務スキーマ導入）で
  `test:integration` に実テストが追加された後は、`--passWithNoTests` フラグ自体を
  scriptから削除し、integration testも0件ならFAILする状態へ揃える
  （このTODOは上記「test:integration の passWithNoTests は実装TODOとして明示」の
  条件と同一で、削除はしない）。
- 人間判断が必要か: No
