---
description: 実装Phaseを開始する（正本確認→Blocking確認→計画まで。実装はしない）
argument-hint: <phase番号> <対象の短い説明>
allowed-tools: Read, Glob, Grep, Bash(git status:*), Bash(git log:*), Bash(git diff:*), Write, Edit
---

Phase `$1` を開始する。対象: $2

`docs/PHASE_WORKFLOW.md` のStep 1〜4だけを実行する。**実装（Step 5）には入らない。**

1. `git status` と現在ブランチを確認し、未commit変更があれば破棄せず報告する。
2. scope / out of scope を宣言する。
3. 対象範囲の正本を**実際に読む**（要約・記憶で代替しない）。
   - `docs/otomo-comes-spec-v0.2.md` の該当セクション
   - 関連する `docs/decisions/B-*.md`（後発Decisionを優先）
   - `docs/acceptance-tests-v0.2.md` / `docs/acceptance-tests-final-audit-addendum-v0.1.md` の該当AT / FA
   読んだDecision IDとセクションを列挙する。
4. `docs/open-issues-v0.2.md` を確認し、このPhaseが **B-04 / B-09** に依存するか判定する。
   依存するなら、その部分をout of scopeへ移し、理由を明示する。
5. 変更予定ファイルと、それぞれが満たすDecision ID / Acceptance IDを対応づけた実装計画を出す。
6. `docs/phases/_TEMPLATE.md` を基に `docs/phases/phase-$1-<slug>.md` を作成し、
   scope / out of scope / source of truth / acceptance criteria を埋める。

最後に以下を報告する。

- 読んだ正本（Decision ID / セクション）
- scope / out of scope
- 対象Acceptance ID
- 検出したBlocking・未決定（なければ None）
- **人間判断が必要な点**（あれば実装へ進まず停止する。`CLAUDE.md` §7）
