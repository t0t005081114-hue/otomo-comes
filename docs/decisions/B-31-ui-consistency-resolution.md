# B-31 UI / AI契約 整合性解消

Status: Accepted / partial pending
Decision ID: B-31

## 1. 目的

B-17〜B-30の決定を横断確認した結果見つかった、旧仕様の残骸・重複定義・実装時に解釈が割れる箇所を整理する。

本Decisionは新機能追加ではなく、既存決定の優先順位と整合性を明確にするためのものとする。

## 2. B-17の扱い

B-17はAI上司の判断原則に責務を限定する。

正本:
- 判断原則: B-17 v0.2
- AI返却JSON契約: B-24
- AI / COMES責任分界と個人MVPフロー: B-25

B-17旧版の自然文固定出力・Google Drive経由の固定フローは廃止する。

## 3. B-21 Home下段旧仕様の扱い

B-21 §1.2 に残る旧案

- 確認事項リスト
- 今日のスケジュール
- チーム状態

は廃止する。

Home下段の正本はB-26 / B-28とし、正式構成は以下とする。

1. 当日のスケジュール
2. 今月の進捗 + AIコメント
3. チーム状態

B-21のその他のタスク / チーム / Decision Pack / Interaction Patternは、より新しい個別Decisionで上書きされていない限り有効とする。

## 4. HOMEのDecision Pack操作

HOME上ではDecision Packはステータス表示のみとする。

HOMEクイック操作から `確認済み` は削除する。

Decision Packの確認・revision固定はDecision Pack画面でのみ行う。

HOMEのクイック操作:
- 完了
- タスクを見る
- 保留

## 5. 日次AI分析の基準

当日のHOMEは、翌朝時点でCOMESへ取込済みの最新AI分析結果を基準として固定する。

個人MVPでは外部AIへの投入とJSON貼り戻しが手動のため、毎朝必ず新規AI結果が存在する前提にはしない。

AI結果が一度も存在しない場合は未生成 / 未取込として表示し、AI判断を補完しない。

## 6. KPI名称

HOME上の「チームKPI」は表示上の名称とする。

個人MVPのデータモデルではB-05の `owner_type = organization` を利用し、Team専用KPIモデルは追加しない。

## 7. HOME並び替え

MVPの共通並び替えは以下のみとする。

- 優先度
- 期限

`影響度` は採用しない。

理由:
- B-24に独立したimpactフィールドがない
- priorityとの意味重複を避ける
- 不要なAI推測・ルール追加を避ける

## 8. 当日スケジュール0件時

HOMEのスケジュールは当日分を基本表示する。

当日予定が0件の場合のみ、翌日以降で最も近い予定を1件だけ表示する。

未来予定には必ず日付を付け、当日予定と混同させない。

## 9. 未解決: Evidence Ref / source_refs 契約

B-12 Decision Packの `evidence_refs.source_type` とB-24 AI Analysis Resultの `source_refs.source_type` は現在、意味レベルが一致していない。

B-12は取得元寄りの値（例: `crm`, `manual`）を許容する一方、B-24は情報種類寄りの値（例: `work_item`, `daily_work_log`, `bottleneck`）を要求し、システム名を禁止している。

この変換契約はまだ確定していないため、本Decisionでは解決扱いにしない。

実装前に、B-12からB-24へ根拠参照をどう受け渡すかを別途確定する。

## 10. 優先順位

同一論点で文書が競合する場合は、原則として次を優先する。

1. 後発のAccepted Decision
2. より具体的な責務専用Decision
3. 汎用 / Draft文書

B-21の旧Home下段よりB-26 / B-28 / B-31を優先する。

## Acceptance

- B-17の責務が判断原則へ限定された
- B-21旧Home下段が廃止扱いになった
- HOMEのDecision Pack確認済み操作が削除された
- 翌朝AI基準の扱いが明文化された
- チームKPIとorganization KPIの関係が明文化された
- 影響度ソートがMVPから削除された
- 当日予定0件時の未来予定1件表示が明文化された
- Evidence Ref / source_refs 契約だけを未解決として残した
