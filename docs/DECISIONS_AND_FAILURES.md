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
