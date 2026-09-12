# B-11 Manager Observation入力経路決定

Status: Accepted
Decision ID: B-11

## 結論

OTOMO COMES MVPでは、Manager Observationの入力経路を**COMES Webフォーム**に統一し、スマートフォンではOS標準の音声文字入力を利用可能とする。

専用の音声認識APIや録音ファイル保存はMVPでは導入しない。

## 入力方式

対応:

- PC: テキスト入力
- Mobile: テキスト入力
- Mobile: OS標準の音声文字入力

非対応:

- 音声ファイルアップロード
- 独自Speech-to-Text API
- 常時録音
- 自動会話解析

## 必須項目

- `subject_person_id`
- `observed_fact`
- `observation_type`
- `observed_at`

## 任意項目

- `manager_impression`
- `work_item_id`
- `next_check`

## observation_type

- growth
- follow_up
- delegation
- praise
- bottleneck

## UX原則

入力負荷を下げるため、スマホでは以下を優先する。

1. 対象者選択
2. 種別選択
3. 観測事実入力
4. 必要なら所感 / 次回確認を追加
5. 保存

観測事実と所感は別フィールドとする。

## 音声入力の位置づけ

音声は「入力手段」であり、COMES Coreの仕様ではない。

OS標準の音声文字入力でテキスト化された結果を通常のフォーム入力として扱う。

これにより将来、専用音声Adapterを追加してもCoreを変更しない。

## Acceptance

B-11は以下を満たすため解決とする。

- COMES Webフォームを正規入力経路とした
- Mobileで音声入力可能
- 独自音声APIをMVP必須条件から除外
- 観測事実と所感を分離
- 入力工数を最小化
