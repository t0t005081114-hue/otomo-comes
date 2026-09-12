---
description: test区分・Acceptance対応・必須テスト対象。testを書く/変えるとき必ず守る。
paths:
  - "tests/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---

# Testing rules

正本: B-01（ツール）、`docs/acceptance-tests-v0.2.md`、
`docs/acceptance-tests-final-audit-addendum-v0.1.md`（判定）。
詳細は `docs/DEVELOPMENT_STANDARDS.md` §6。

## 区分

| 区分 | 対象 | 場所 | ツール |
|---|---|---|---|
| unit | business rule / 純粋ロジック | `tests/unit/` | Vitest |
| integration | DB境界・制約・transaction | `tests/integration/` | Vitest |
| e2e | 主要導線 | `tests/e2e/` | Playwright |

e2eはAcceptanceで必要な範囲のみ。網羅目的で増やさない。

## Acceptanceとの対応

test名またはコメントにAcceptance ID（`AT-01`〜`AT-25` / `FA-01`〜`FA-16`）と根拠Decision IDを書く。

```ts
// FA-01 / B-33: within_week は基準日+1〜+7
it("FA-01 rejects within_week when due_date is outside D+1..D+7", ...)
```

- Phase記録のAcceptance表とtestが1対1で辿れること。
- BLOCKING AcceptanceをNOT TESTEDのままPhaseをPASSにしない。
- **実装に合わせてAcceptanceを書き換えない。** Acceptance自体の修正が必要なら人間判断へ。

## unit testが必須なbusiness rule

- KPI達成率 / 乖離率 / 連続未達（B-05）
- 営業日ベース停滞判定・外部待ち除外（B-06）
- 委譲評価4軸（B-07）
- rolling 7日の `due_bucket` 境界とSemantic Validation（B-33 / FA-01）
- 期限超過の表示昇格と保存値非改変（B-33 / FA-02）
- 手動・imported TaskのbucketFallback（B-43 / FA-03）
- evidence fingerprintの決定性: 配列順序・重複・`label` 変更で変わらない（B-36 / FA-07）
- 再掲抑制の比較キーと `subject_person_id` 分離（B-37 / FA-08）
- HOME主カード割当（B-40 / FA-10）
- HOME期限ソート・優先度ソートのnull policy（B-44 / B-45 / FA-12 / FA-13）
- `タスクを見る` の表示条件（Task参照がない候補では出さない）（B-46 / FA-15）
- HOME保留が元ドメイン状態・期限を変更しないこと（B-34 / B-39 / FA-04）
- HOME完了のカード別意味（4カードを一律completedにしない）（B-35 / FA-05）
- AI import 4段validation（B-24 / AT-13 / AT-14）
- assignee == manager（B-47 / FA-16）

## integration testが必須なDB境界

- `organization_id` 越境が起きない
- `home_item_deferrals` の `UNIQUE NULLS NOT DISTINCT`（B-41 / FA-14）
- `management_action_receipts` の冪等性（B-36 / FA-06）
- HOME完了のReceipt + domain更新 + Backing Task完了が同一transaction（B-42 / FA-11）
- UUID参照整合 / FK制約

## 禁止

- 本番データをテストに使う（B-01: 本番とテストデータを分離）
- 機微データ・実在個人情報をfixtureへ入れる（B-19）
- 1on1原文をfixtureへ置く
- 実CRM / 実Google環境へ接続してunit testを通す（Adapterはtest doubleで検証。実データ依存部分はB-04 / B-09解決後）
- 落ちているtestをskip / コメントアウトして「PASS」と報告する
