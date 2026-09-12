# B-23 Decision Pack Editing

Status: Accepted
Decision ID: B-23

## 1. 目的

Decision Packは、COMESが収集・整理した判断材料をAI上司へ渡す前に、人間が確認・補正できる画面とする。

ただし、元データ由来の事実を人間が上書きしてしまうと、CRM・KPI・1on1・観測事項などのSource of Truthとの整合性が崩れるため、編集範囲を明確に分離する。

## 2. 基本方針

Decision Packは編集可能とする。

ただし、COMESが元データから生成した「事実」は固定し、直接書き換え不可とする。

編集可能なのは、AIへ渡す判断材料としての人間による補正レイヤーのみとする。

原則:

```text
Source Facts（固定）
  ↓
Generated Decision Pack
  ↓
Human Adjustment Layer
  ├─ 追加
  ├─ 除外
  ├─ 補足
  └─ 優先度変更
  ↓
Final Decision Pack for AI
```

## 3. 固定する事実

以下のようなSource由来の値はDecision Pack上で直接編集しない。

例:
- KPI実績値
- タスク件数
- 期限
- 停滞判定の根拠となる時刻・日数
- CRMから取得した案件状態
- 1on1実施日
- Manager Observationの記録内容
- person_id / source_id / external_id
- source status

誤りがある場合は、Decision Pack上で値を書き換えるのではなく、元データ側の修正または補足情報として扱う。

## 4. 編集可能な操作

### 4.1 追加

COMESが自動抽出できなかった判断材料を人間が追加できる。

例:
- 今日だけ重要な事情
- 口頭で把握している補足
- AIに考慮してほしい制約
- AIに聞きたい論点

### 4.2 除外

AIへ渡す必要がない項目を、今回のDecision Packから除外できる。

除外は元データ削除ではなく、AI入力対象から外す操作とする。

### 4.3 補足

固定された事実に対して、人間が文脈・背景・注意点を追記できる。

例:

```text
事実: KPI進捗 72%
補足: 大型案件の計上が翌週予定のため、単日値だけでは判断しない
```

### 4.4 優先度変更

COMESが生成した候補の重要度を人間が変更できる。

例:
- high → medium
- medium → high
- 今回はAIへ強く見てほしい
- 今回は参考情報扱い

ただし、優先度変更は事実そのものを書き換える操作ではない。

## 5. Revision / Audit

自動生成された原版と、人間が編集した版を区別して保持する。

最低限、次を追跡可能にする。

- generated revision
- edited revision
- edited_by
- edited_at
- 追加した項目
- 除外した項目
- 補足した項目
- 優先度変更

同日再生成時も既存の確定履歴を破壊せず、新しいrevisionとして扱う。

## 6. UI原則

Decision Pack画面では、事実と人間補正を視覚的に区別する。

例:
- Source Fact: 編集不可表示
- Human Note: 編集可能
- Excluded: AIへ送らないことを明示
- Priority Override: 元優先度と変更後を確認可能

「編集できるから何でも書き換えられる」UIにはしない。

## 7. AIへ渡す最終データ

AIへ渡す最終Decision Packは、固定されたSource FactsとHuman Adjustment Layerを合成した結果とする。

AIには、可能な限り次を区別して渡す。

- observed fact
- system-derived candidate
- human-added context
- human priority override
- excluded from AI input

これによりAIが、人間補足を客観的事実と誤認しにくくする。

## 8. Acceptance

- 元データ由来の事実をDecision Pack上で直接変更できない
- 人間は追加・除外・補足・優先度変更を行える
- 除外はSource削除ではない
- 自動生成版と編集版をrevisionとして区別できる
- 誰がいつ何を変更したか追跡できる
- AIへ渡すデータで事実と人間補足を区別できる
- 元データ修正とDecision Pack補正を混同しない
