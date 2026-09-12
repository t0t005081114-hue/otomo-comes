# B-13 Decision Pack欠損・信頼度表現決定

Status: Accepted
Decision ID: B-13

## 結論

OTOMO COMESでは、**値そのもの**と**その値の状態**を分離して保持する。

`0`、`null`、`不明`、`対象外`を混同しない。

## data_status

共通列挙値:

- `known`
- `unknown`
- `source_missing`
- `needs_confirmation`
- `not_applicable`

### known

値または事実が確定している。

### unknown

情報源は存在するが、値・状態を確定できない。

### source_missing

必要な元データそのものが取得できない。

### needs_confirmation

候補や関連付けはあるが、人間確認が必要。

### not_applicable

その項目は対象外。

## 値の表現

数値項目は、`value = 0` と `value = null` を明確に区別する。

例:

```json
{
  "value": 0,
  "data_status": "known"
}
```

は「0件が確定」。

```json
{
  "value": null,
  "data_status": "source_missing"
}
```

は「取得元にデータがない」。

## confidence score

MVPでは0〜100等の**数値信頼度スコアは導入しない**。

理由:

- 根拠のない擬似精度を生む
- ルールベースMVPでは意味が曖昧
- AI上司が数値を過信する可能性がある

代わりに `data_status`、`needs_confirmation`、`evidence_refs` を組み合わせて判断可能性を示す。

## Provenance

候補情報には可能な限り `evidence_refs` を持たせる。

最低限:

- `source_type`
- `source_id`
- `source_label` nullable

必要に応じて:

- `captured_at`
- `field`
- `event_id`

を追加可能。

## AI上司へのルール

Decision Pack利用側は以下を守る。

- `known` 以外を確定事実として扱わない
- `needs_confirmation` は確認事項として出す
- `source_missing` を本人の失敗として解釈しない
- `unknown` を推測で補完しない
- `not_applicable` を警告対象にしない

## Acceptance

B-13は以下を満たすため解決とする。

- 欠損状態の共通列挙値を確定
- 0と欠損を分離
- 数値confidence scoreをMVPから除外
- 根拠参照を採用
- AI上司側の解釈ルールを定義
