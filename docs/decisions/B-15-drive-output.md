# B-15 Google Drive Decision Pack 出力仕様

Status: Accepted v1.1
Decision ID: B-15

## 結論

Google Drive への出力は **個人検証用の補助Harness** として残し、COMES Core の責務には含めない。

正本は Supabase PostgreSQL 上の `decision_packs.payload`（Decision Pack JSON）であり、Drive上のMarkdownはその派生物とする。

Drive出力は、日次AI分析の必須経路ではない。人間確認・外部参照・検証用途の補助手段として扱う。

---

## 出力フロー

```text
COMES Core
→ Decision Pack JSON
→ Markdown Renderer
→ Google Drive Adapter
→ Drive保存
```

Drive保存に失敗しても、Decision Pack JSON がDBへ正常保存されていれば Core 処理自体は成功扱いとする。

---

## 保存先

個人検証版では専用フォルダを使用する。

```text
OTOMO COMES/
  Decision Packs/
```

フォルダIDは環境変数で管理し、フォルダ名検索に依存しない。

例:

- `GOOGLE_DRIVE_DECISION_PACK_FOLDER_ID`

---

## ファイル形式

Markdownを採用する。

理由:

- 人間がそのまま読める
- 外部AIや補助ツールへ必要時に渡しやすい
- JSON正本と表示用を分離できる
- Google Docs固有フォーマットへ依存しない

拡張子:

```text
.md
```

---

## ファイル名

```text
OTOMO_COMES_DecisionPack_YYYY-MM-DD.md
```

例:

```text
OTOMO_COMES_DecisionPack_2026-09-12.md
```

目的:

- 日付単位で対象Packを特定しやすくする
- 人間が確認しやすくする
- 前日分との混同を防ぐ

---

## 同日再生成

同日分を再生成した場合、Drive側では**同じ日付ファイルを更新**する。

DB側では `decision_packs.revision` を増やして履歴保持するが、Drive側は常に最新revisionのみを表示する。

Markdown冒頭に以下を含める。

```text
Date: YYYY-MM-DD
Revision: N
Generated At: ISO8601
Generation Status: success | partial | failed
Schema Version: v1
```

---

## Markdown表示順

1. 今日の要約
2. KPI
3. 異常・変化
4. 停滞・ボトルネック
5. プレイングマネージャー本人の負荷
6. 委譲候補
7. 要フォロー候補
8. 褒める候補
9. 仕組み化候補
10. AIに判断してほしいこと
11. Source Status

---

## 欠損表現

`0` と欠損を混同しない。

Markdownでは以下のように表示する。

- `known` → 値を表示
- `unknown` → `不明`
- `source_missing` → `データ未取得`
- `needs_confirmation` → `要確認`
- `not_applicable` → `対象外`

---

## セキュリティ

- Drive Adapter は専用フォルダだけを対象にする
- Decision Pack以外のファイルへ書き込まない
- 1on1原文全文をDecision Packへ無制限に転記しない
- API Token / Refresh TokenをMarkdownへ含めない
- Drive出力内容をGitHub Actionsログへ全文表示しない

---

## AI分析との境界

日次AI分析の正規フローはB-24 / B-25を正本とする。

```text
Decision Pack
→ COMESでAI用プロンプト生成
→ 外部AI
→ B-24準拠JSON
→ COMESへ取込
```

Drive出力はこの経路の必須依存ではない。

必要時に人間が内容確認・共有・検証するための補助Harnessとして残す。

将来の公開版では以下のように置換・省略可能とする。

```text
Decision Pack JSON
→ AI Analysis Adapter
→ LLM API
→ COMES UI
```

Drive依存をCoreへ持ち込まない。

---

## Acceptance

- Decision Pack JSONが正本である
- Drive出力は補助Harness / 派生物である
- 日次AI分析の必須経路にしない
- 日付単位で一意に特定できる
- 同日再生成でDriveファイルが増殖しない
- DB上のrevision履歴は保持される
- 人間が外部で確認・共有しやすい
- Drive障害がCore成功を無効化しない
