# OTOMO COMES 未決定事項・Blocking判定 v0.2

Status: Accepted v1.1

本書は `docs/otomo-comes-spec-v0.2.md`、`docs/acceptance-tests-v0.2.md`、`docs/acceptance-tests-final-audit-addendum-v0.1.md` と最新Accepted Decision群を前提とする。

## 判定区分

- **BLOCKING-NOW**: 対応対象Adapterの本実装前に解決必須
- **BLOCKING-BEFORE-MVP**: MVP完了前に解決必須
- **ADVISORY**: 後続でよい

---

## 現在のBLOCKING-NOW

### B-04 CRM → Daily Work Log実データmapping

**Status: OPEN / requires real data**

確認するもの:
- 会社CRMの実際の項目
- `handled_count`
- `completed_count`
- `carryover_count`
- `self_handled_count`
- `delegated_count`
- `returned_count`
- `trouble_count`
- `stagnant_count`
- company-specific KPI
- highlight / work item抽出条件

決めること:
- CRM側集計かCOMES側集計か
- 取得不能項目を対象外 / 手入力 / 別計算のどれにするか

禁止:
- 実データ未確認のまま列や集計条件を推測する
- 欠損を0で補完する

B-03の通信契約はAccepted済み。

---

### B-09 Meet / Drive実ファイル識別検証

**Status: OPEN / requires real data**

実環境で確認するもの:
- Meet文字起こしファイルの実際のファイル名
- 会議メモ / transcript等の接尾辞
- Drive保存先
- 同一会議で複数ファイルが生成された場合の識別方法
- `source_file_id / source_file_name / source_modified_at / held_at` の取得可否

禁止:
- `1on1_対象者名_YYYY-MM-DD` だけを前提に完全一致ロジックを固定する
- 曖昧な人物や日時を推測確定する

1on1構造化方式そのものはB-10 v1.2でAccepted済み。

---

## 解決済み主要Decision

以下はAccepted済みで、設計Blockingとして扱わない。

- B-01 技術スタック
- B-02 DB基礎スキーマ
- B-03 CRM Read API
- B-05 KPIモデル
- B-06 停滞時刻基準
- B-07 委譲評価入力
- B-08 Google認証
- B-10 1on1構造化 v1.2
- B-11 Manager Observation入力
- B-12 Decision Pack Schema
- B-13 data status / confidence
- B-14 Batch
- B-15 Drive補助Harness
- B-17 AI判断原則
- B-18 認証・権限
- B-19 機微情報・保持
- B-21 UI詳細
- B-22 MVP成功条件
- B-23 Decision Pack Editing
- B-24 AI Analysis Result Decision v0.5 / JSON Schema v0.4
- B-25 AI責任分界
- B-26〜B-31 HOME / UI整合
- B-32 DBスキーマ整合拡張 v1.3
- B-33 Task期限バケット・ローリング7日 v1.1
- B-34 HOME Task保留
- B-35 HOME完了操作の種別別意味
- B-36 Management Action Receipt v1.4
- B-37 Management Action再掲抑制 v1.2
- B-38 HOME / AI Proposal表示境界
- B-39 HOME保留の全カード共通化 v1.1
- B-40 HOME単一カード表示 v1.1
- B-41 HOME操作状態DB保存拡張 v1.5
- B-42 HOMEドメイン完了 / Backing Task同期
- B-43 Manual / Imported Task期限Fallback
- B-44 HOME期限ソートnullポリシー
- B-45 HOME優先度ソート未設定ポリシー
- B-46 HOME「タスクを見る」表示条件
- B-47 AI Action担当者契約

最終監査で追加されたB-33〜B-47は `docs/acceptance-tests-final-audit-addendum-v0.1.md` のBLOCKINGテスト対象とする。

---

## ADVISORY

### Obsidian同期の実装詳細

Coreの正本ではないため初期実装をブロックしない。

必要になった段階で:
- 保存タイミング
- 保存フォルダ
- 人物別リンク
- Markdown形式

を確定する。

---

## 実装Gate

Core / UI / AI契約の実装は開始可能。

ただし以下は対象Adapter実装前に停止して確認する。

- CRM Adapter → B-04完了必須
- Meet / Drive取込Adapter → B-09完了必須

**現時点で、人間判断が必要な未解決の設計Blockingは存在しない。**

B-04 / B-09は設計未決ではなく、実環境・実データを見ないと確定できないためOPENとして残す。

B-04 / B-09以外を「未決定」を理由に新規設計へ広げない。
