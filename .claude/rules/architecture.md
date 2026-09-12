---
description: COMES層境界とvendor隔離。src配下を触るとき必ず守る。
paths:
  - "src/**"
  - "tests/**"
---

# Architecture rules

正本: B-01。詳細は `docs/DEVELOPMENT_STANDARDS.md` §1。

## 層の向き

```
src/app → src/application → src/core → Port(interface) → src/adapters
```

依存は必ず下向き。Adapterから `src/core` のinterfaceを実装する形にする。
`src/core` が `src/adapters` / `src/app` をimportしたら設計が逆。

## Coreへ持ち込まない（絶対）

`src/core/**` からの直接importを禁止する。

- `next`, `next/*`, `react`
- `@supabase/*`, `supabase-js`
- Google系SDK（`googleapis`, `google-auth-library` 等）
- CRM client / HTTP client（`fetch` を使った外部通信そのもの）
- LLM SDK（`openai`, `@anthropic-ai/*` 等）

必要になったらCore側にPort interfaceを定義し、実装をAdapterへ置く。

## Adapter隔離

- 外部サービス固有の型・ID・レスポンス形状をAdapterの外へ出さない。Adapter内でCOMES canonical型へ変換する。
- 会社CRMの内部テーブル名・列名・ステータス設計をCoreへ漏らさない（B-03）。
- Google OAuth / Drive file ID / Google固有レスポンス型をCoreが知らないようにする（B-08）。
- 企業固有の意味判断（代理店・上位店・重要顧客などの分類）をCoreの共通ルールにしない（B-25）。
- Drive出力・Obsidian出力は補助Harness。失敗してもCoreの成功を無効化しない（B-15）。
- GitHub Actionsはバッチのエントリポイントを呼ぶだけ。ロジックを置かない（B-14）。

## CRM

**GET only**（B-03）。書き戻し・webhook・CRM DB直接接続・常時ミラーリングはすべて禁止。

## B-04 / B-09 Gate

- CRM項目 → Daily Work Log metric / KPI / highlight / work item のmappingと集計条件は**B-04未解決のため実装しない**。
- Meet / Driveのファイル名規則・接尾辞・保存先・同一会議の複数ファイル識別・人物特定の確定ロジックは**B-09未解決のため実装しない**。
- 欠損metricを0で補完しない。

この境界に到達したら作業を止めて人間へ報告する。
