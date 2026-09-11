# OTOMO COMES 未決定事項・Blocking判定 v0.1

Status: Draft

この文書は、正式仕様書 `docs/otomo-comes-spec-v0.1.md` と受け入れテスト `docs/acceptance-tests-v0.1.md` を前提に、実装開始前またはMVP完了前に決める必要がある事項を整理する。

## 判定区分

- **BLOCKING-NOW**: 次の実装フェーズへ進む前に決定必須
- **BLOCKING-BEFORE-MVP**: 初期実装は進められるが、MVP完了前に決定必須
- **ADVISORY**: 後続フェーズで決めてよい

---

## B-01 実装技術スタック

**判定: BLOCKING-NOW**

未決定:

- Webフレームワーク
- DB
- ORM / DBアクセス方式
- 認証方式
- デプロイ先

判断条件:

- PC / Mobile Webを同一コードベースで提供できる
- GitHub Actionsと連携しやすい
- 将来マルチテナントへ拡張できる
- AI Analysis Adapterを後付けできる

既存OTOMO資産との整合性は考慮するが、流用を理由に不適切な技術を固定しない。

---

## B-02 COMES DB の正本スキーマ

**判定: BLOCKING-NOW**

最低限、以下の永続化単位を確定する必要がある。

- Person
- Role / Reporting Relation
- Goal
- KPI Definition
- KPI Result
- Work / Task
- Daily Work Log
- OneOnOneLog
- ManagerObservation
- Bottleneck
- DelegationCandidate
- DecisionPack

特に「現在状態」と「履歴イベント」を混同しない設計が必要。

---

## B-03 会社CRM Read API 契約

**判定: BLOCKING-NOW**

決定必須:

- Endpoint
- 認証方式
- 日付・対象者の指定方法
- レスポンススキーマ
- 欠損値の扱い
- エラー時の扱い
- 取得対象KPI

原則:

- GETのみ
- 書き込み不可
- COMES専用境界
- CRM内部テーブル構造をCOMESへ漏らさない

---

## B-04 Daily Work Log と CRM項目のマッピング

**判定: BLOCKING-NOW**

共通項目のうち、現行会社CRMから実際に取得できる項目を確認する。

確認対象:

- 対応件数
- 完了件数
- 持ち越し
- 自分対応
- 委譲
- 差し戻し
- トラブル
- 停滞
- KPI
- 重要案件

取得できない項目は、MVPで手入力するのか、計算するのか、対象外にするのかを決める。

推測で実装しない。

---

## B-05 KPI設定モデル

**判定: BLOCKING-NOW**

決定必須:

- KPIの対象: 個人 / チーム / 両方
- 値の型: 件数 / 率 / 金額等
- 評価周期
- 閾値
- 連続未達条件
- 上位KPI / 下位KPIの関係をMVPで持つか

MVPでは複雑なKPIツリーを過剰実装しない。

---

## B-06 停滞判定の時刻基準

**判定: BLOCKING-NOW**

決定必須:

- 24h / 48h等の初期閾値
- 営業日換算か実時間か
- 休日を経過時間に含むか
- 案件種別ごとの閾値変更をMVPで許可するか

停止理由不明の場合は自動推測しない。

---

## B-07 委譲評価の入力項目

**判定: BLOCKING-BEFORE-MVP**

委譲4軸をどのように入力・計算するか決める。

- 答えの明確さ
- 再現性
- 失敗時リスク
- 習熟度

候補:

- 手動設定
- 過去実績からルール計算
- 両方

MVPではAI推測を前提にしない。

---

## B-08 Google Drive / Meet 認証方式

**判定: BLOCKING-NOW**

決定必須:

- Google OAuth / Service Account等の採用方式
- 対象Drive範囲
- 必要最小権限
- トークン保管方法
- ローカル / GitHub Actionsでの実行方法

1on1以外の機密ファイルを不必要に取得できる権限設計は避ける。

---

## B-09 Meetファイル識別の実データ検証

**判定: BLOCKING-NOW**

仕様上のタイトル:

`1on1_対象者名_YYYY-MM-DD`

確認必須:

- Meet文字起こしファイルの実際の命名形式
- 会議メモと文字起こしで付く接尾辞
- Drive上の保存先
- 同一会議で複数ファイルが生成された場合の扱い

実ファイル確認前に完全一致ロジックを固定しない。

---

## B-10 1on1構造化方式

**判定: BLOCKING-BEFORE-MVP**

個人検証版はLLM APIを使用しないため、以下を決める。

- 原文のみ自動取得し、構造化は手動 / 後処理にする
- ルールベースで一部抽出する
- ChatGPT側分析時に原文を判断材料として使う

MVPの自動化範囲を明記する。

---

## B-11 Manager Observation 入力経路

**判定: BLOCKING-NOW**

決定必須:

- COMES Webフォーム
- 音声入力
- スマホOSの音声文字入力
- その他

音声認識APIを個人MVPの必須条件にしない。

最優先は入力工数の低さ。

---

## B-12 Decision Pack v1 JSON Schema

**判定: BLOCKING-NOW**

現在の論理項目から、型・必須 / 任意・ID参照を正式化する。

最低限:

- schema_version
- date
- manager_id
- generated_at
- source_status
- kpi_alerts
- bottlenecks
- delegation_candidates
- follow_up_candidates
- praise_candidates
- systemization_candidates
- management_questions

Markdown表示仕様とJSON正本を分離する。

---

## B-13 Decision Packの欠損・信頼度表現

**判定: BLOCKING-NOW**

AI上司へ「情報がない」ことを正しく渡す必要がある。

候補:

- unknown
- not_applicable
- source_missing
- needs_confirmation

`0` と `不明` を混同しない。

候補情報には根拠元を追跡できることが望ましい。

---

## B-14 19:00 Batch 実行仕様

**判定: BLOCKING-NOW**

決定必須:

- タイムゾーン: Asia/Tokyo
- GitHub Actions cronのUTC換算
- 休日実行
- 失敗時Retry
- 同日再実行時の冪等性
- 19時以降にCRMデータが更新された場合の扱い

同一日の再実行でDecision Packが無制限に重複生成されないこと。

---

## B-15 Google DriveへのDecision Pack出力

**判定: BLOCKING-BEFORE-MVP**

個人検証ハーネスとして決める。

- 保存先
- ファイル名
- Markdown / Google Docs / text等
- 同日再生成時の更新方法
- ChatGPTから特定しやすい命名規則

これはCore仕様ではなくAdapter仕様とする。

---

## B-16 19:15 ChatGPT Scheduled Task 接続検証

**判定: BLOCKING-BEFORE-MVP**

実アカウント環境で以下を検証する。

- 当日のDriveファイルを取得できるか
- 実行時に接続先を参照できるか
- 当日分が無い場合に前日分を誤利用しないか
- AI上司指示をスケジュールタスク内で安定適用できるか

成立しない場合もCOMES Core仕様は変更せず、手動呼び出し等の代替Harnessへ切り替える。

---

## B-17 AI上司 Prompt / Skill 契約

**判定: BLOCKING-BEFORE-MVP**

AI上司の基本原則を固定する。

最低限:

- プレイヤー数字だけで評価しない
- 仕組み化を重視
- 既知業務は委譲を検討
- 未知 / 高リスク業務は本人対応を検討
- 人ではなくボトルネックを見る
- プロセスを褒める
- 事実と推測を分ける
- 不足情報を断定しない
- 翌日見るべきことを絞る

出力フォーマットも固定する。

---

## B-18 認証・権限

**判定: BLOCKING-BEFORE-MVP**

個人MVPでも最低限、本人以外から1on1や観察ログへアクセスされない設計が必要。

公開版を見据え、後からテナント境界を追加不能になるデータ構造は避ける。

---

## B-19 機微情報・ログの取り扱い

**判定: BLOCKING-BEFORE-MVP**

1on1、Manager Observationは機微な業務情報を含み得る。

決定必須:

- アプリログに原文を出さない
- GitHub ActionsのログにMeet本文を出さない
- エラー出力時の秘匿
- 保持 / 削除方法
- Drive / Obsidianへの保存範囲

---

## B-20 Obsidian同期方式

**判定: ADVISORY**

ObsidianはMVP Coreの正本ではないため、初期実装をブロックしない。

後続で決める。

- 出力タイミング
- 保存フォルダ
- 人物別リンク
- 1on1 / Observation / KnowledgeのMarkdown形式

---

## B-21 UI詳細仕様

**判定: BLOCKING-BEFORE-MVP**

情報設計は確定済み。

- ホーム
- タスク
- チーム
- 目標・KPI
- 1on1・観察
- ボトルネック
- 判断パック
- 設定

今後、各画面について以下を定義する。

- 表示項目
- 操作
- 空状態
- エラー状態
- Mobile並び順

PCを単純縮小したMobile UIは禁止。

---

## B-22 MVP検証期間・成功閾値

**判定: BLOCKING-BEFORE-MVP**

実運用評価のため、事前に決める。

- 検証期間
- 手入力許容時間
- Decision Packの有用性評価方法
- 候補誤検知の許容範囲
- 「負担が減った」の測定方法

検証後に都合よく成功条件を変更しない。

---

# 現時点のBlocking Summary

## 実装開始前に解決する

- B-01 技術スタック
- B-02 DBスキーマ
- B-03 CRM Read API契約
- B-04 CRM → Daily Work Logマッピング
- B-05 KPI設定モデル
- B-06 停滞時刻基準
- B-08 Google認証
- B-09 Meet実ファイル検証
- B-11 Manager Observation入力経路
- B-12 Decision Pack JSON Schema
- B-13 欠損 / 信頼度表現
- B-14 19:00 Batch仕様

## MVP完了前に解決する

- B-07 委譲評価入力
- B-10 1on1構造化
- B-15 Drive出力
- B-16 ChatGPT Scheduled Task検証
- B-17 AI上司契約
- B-18 権限
- B-19 機微情報
- B-21 UI詳細
- B-22 成功閾値

## 後続でよい

- B-20 Obsidian同期詳細

---

# Next Gate

次工程へ進む条件:

1. BLOCKING-NOW を順番に確定する。
2. 確定内容を本仕様書または専用設計書へ反映する。
3. 受け入れテストの該当条件を更新する。
4. 未決定事項を暗黙の仮定で実装しない。
