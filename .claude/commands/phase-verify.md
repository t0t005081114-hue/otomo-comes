---
description: Phaseの検証とself-reviewを実行し、Codexレビューへ渡す材料をまとめる
argument-hint: <phase番号>
allowed-tools: Read, Glob, Grep, Bash(npm run:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Write, Edit
---

Phase `$1` の検証を行う。`docs/PHASE_WORKFLOW.md` のStep 6〜11。

## 1. 検証コマンド

順に実行し、**結果をごまかさず**記録する。

```
npm run lint
npm run typecheck
npm run test
npm run build
```

DB境界を触ったPhaseでは `npm run test:integration`、主要導線を触ったPhaseでは `npm run test:e2e` も実行する。

- 各コマンドを PASS / FAIL / NOT RUN で記録する。FAILは出力を添える。
- コマンド自体が未整備なら NOT RUN とし、**整備が必要な旨を明示する**。未整備を理由にPhaseをPASSにしない。
- 落ちているtestをskipやコメントアウトで通さない。

## 2. Self-review

`docs/PHASE_WORKFLOW.md` §4 のチェックリストを上から実行する。
特に以下を `git diff` で実地に確認する。

- `src/core/**` にvendor import（next / supabase / google / openai / http client）がないか
- CRMアクセスがGET onlyか
- 1on1原文本文をDBへ保存していないか
- AI importの4段validation（Schema / Identity / Evidence Referential / Semantic）を飛ばしていないか
- pending / held / rejected ProposalがHOME実行対象になっていないか
- token / 原文 / observation本文がログ・エラー文へ出ていないか
- migrationが原子的で、適用済みmigrationを改変していないか
- Phase scope外の変更が混ざっていないか
- B-04 / B-09を推測実装していないか

未達項目だけを挙げる（全部OKならそう書く）。

## 3. Phase記録の更新

`docs/phases/phase-$1-*.md` の files changed / validation result / self-review / unresolved issues を更新する。

## 4. Codexへ渡す材料

以下をまとめて出力する（`docs/PHASE_WORKFLOW.md` §5）。

1. Phase番号とscope / out of scope
2. `git diff` の対象範囲
3. 参照した正本のDecision ID / Acceptance ID
4. validation結果
5. self-reviewで未解決な点
6. 依頼するレビュー観点（仕様逸脱 / Decision優先順位 / B-04・B-09 Gate / 層境界 / 機微データ / Acceptance未カバー / 過剰実装）

## 5. 報告

- validation結果の表
- self-reviewの未達項目
- 対象AcceptanceのPASS / FAIL / NOT TESTED
- **commitしてよいか**の判断（FAILが残る場合はcommitせず停止）
- 人間判断が必要な点（なければ None）
