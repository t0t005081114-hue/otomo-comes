---
description: 正本ドキュメントの扱い・Decision追加手順・記録先の使い分け。docs配下を触るとき必ず守る。
paths:
  - "docs/**"
  - "README.md"
---

# Documentation rules

## 書き換えてはいけないファイル（人間判断が必要）

- `docs/decisions/**` の**既存**ファイル
- `docs/otomo-comes-spec-v0.2.md`
- `docs/acceptance-tests-v0.2.md`
- `docs/acceptance-tests-final-audit-addendum-v0.1.md`
- `docs/final-audit-report-v0.1.md`
- `docs/open-issues-v0.2.md`
- `docs/*-v0.1.md`（履歴として保存されている旧文書）

これらはAccepted。実装都合で編集・再解釈・「整合化」しない。
変更が必要だと判断したら**編集せず**、以下を人間へ提示する。

1. 現在の記述（ファイル・セクション）
2. 過去の意思決定（どのDecisionで決まったか）
3. 今回変更が必要だと考える理由
4. 変更しない場合に何が実装できないか

## 新しいDecisionが必要になったとき

- 既存ファイルを書き換えず、`docs/decisions/B-<次の番号>-<slug>.md` として**新規作成**を提案する。
- 既存Decisionの体裁（`Status` / `Decision ID` / 結論 / 理由 / 非採用 / Acceptance）に合わせる。
- 後発Decisionが既存と競合する場合は、競合箇所と優先順位を新Decision内に明記する。
- **Accepted にするのは人間。** Claudeが勝手に `Status: Accepted` を確定しない。
- Acceptanceへの影響があれば、それも人間判断として提示する。

## 記録先の使い分け

| 内容 | 置き場所 |
|---|---|
| 確定した仕様・設計判断 | `docs/decisions/`（人間承認後） |
| Phaseのscope / 検証結果 / 残課題 | `docs/phases/phase-NN-*.md` |
| 実装中の矛盾・失敗・不採用設計・migration failure・再発防止 | `docs/DECISIONS_AND_FAILURES.md` |
| 実装の書き方の標準 | `docs/DEVELOPMENT_STANDARDS.md` |
| Phaseの回し方 | `docs/PHASE_WORKFLOW.md` |

- Accepted Decisionの内容を `DECISIONS_AND_FAILURES.md` へ複製しない。
- 同じルールを複数のHarness文書へ重複記述しない。参照で繋ぐ。

## 追記の作法

- 既存ノートの削除・全面書き換えをしない。追記する。
- 矛盾を見つけたら古い記述を消さず、日付見出しで「現在はこうなっている」と追記する。
- 日付は絶対日付（YYYY-MM-DD）。不明な日付を推測で書かない。
- 確認できた事実と推測を分ける。推測には `（推測）`、未確認には `未確認` と明記する。
- 情報量の少ない段階で過剰なフォルダ・ファイルを作らない。

## 絶対に書かないもの

API key / password / service account private key / OAuth secret / cookie /
access token / refresh token / 個人情報 / 本番環境の秘密情報 / 1on1原文 / observation本文。

必要な場合は「環境変数に置く」など**方法だけ**を書く。

## README

`README.md` は正本への導線と現在の監査ステータスを示す。
Harnessを追加・変更したら導線の整合を確認する（内容の正本化はしない）。
