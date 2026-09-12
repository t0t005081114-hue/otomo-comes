# B-37 Management Action 再掲抑制契約

Status: Accepted
Decision ID: B-37

## 結論

HOMEで実施済みとなった委譲・称賛等のマネジメント行動は、同一根拠のまま翌日以降に繰り返し候補化しない。

B-36 `management_action_receipts` に実施済みReceiptが存在する場合、同一Evidence Refに基づく同一種別の候補は再掲対象から除外する。

ただし、新しい事実・新しい根拠が発生した場合は、新しい候補として再表示してよい。

## 対象

主に以下を対象とする。

- `delegation_handled`
- `praise_delivered`

Taskは `work_items.status = completed`、Bottleneckは `bottlenecks.status = resolved` により元ドメイン側でも状態が変わるため、通常はその状態で再掲対象外となる。

## 同一根拠の判定

Evidence Refの同一性は、原則として以下で判定する。

- `source_type`
- `source_system`
- `source_id`

`label` は表示文言であり、同一性判定キーには使用しない。

同一 `source_type + source_system + source_id` を根拠とし、かつ同一 `action_kind` の実施済みReceiptがある場合、その候補は再掲しない。

## 新しい候補として再掲できる条件

以下のいずれかを満たす場合は、過去Receiptがあっても新しい候補として扱ってよい。

- 新しい `source_id` の事実・イベントが発生した
- 同一対象でも新しい業務イベント等のEvidence Refが追加された
- 前回実施後の新しいKPI結果、1on1、Manager Observation、Work Event等を根拠にしている
- 前回Receiptとは異なるマネジメント行動が必要になった

単に日付が変わっただけでは新しい候補とはみなさない。

## Decision Pack生成時の扱い

候補生成後、Decision Packへ載せる前に、過去の `management_action_receipts` とEvidence Refを照合する。

- 同一根拠・同一行動種別で実施済み → 抑制
- 新しい根拠あり → 掲載可能
- 根拠が曖昧で同一性を判断できない → 推測で抑制せず、必要に応じて `needs_confirmation` とする

ReceiptそのものをEvidence Refへ混在させて元事実を置換しない。

## Praiseの例

前日:
- 根拠: `work_event / crm / event_123`
- 内容: 「早期相談できた」
- `praise_delivered` Receiptを保存

翌日:
- 同じ `event_123` だけを根拠に再度「褒める」候補化 → 抑制

その後:
- 新しい根拠 `event_456` で「改善提案を実施」 → 新しい称賛候補として表示可能

## Delegationの例

前日:
- 根拠: `delegation_candidate / comes / dc_001`
- 委譲対応を実施

翌日:
- 同じ `dc_001` のみを根拠に再掲 → 抑制

その後:
- 新しい業務実績・新しい候補 `dc_002` が生成 → 再掲可能

## 非採用

- 日付が変わるたびに同一根拠を再掲する
- Receiptが1件あれば対象人物の将来候補をすべて永久抑制する
- `label` の文字列一致だけで同一根拠と判定する
- 新しい事実があるのに過去Receiptだけを理由に候補を永久非表示にする

## Acceptance

- 実施済みの同一根拠・同一行動を翌日以降に繰り返し表示しない
- 新しい事実・新しいEvidence Refがあれば新候補として再表示できる
- 日付変更だけでは新候補扱いにしない
- 人物単位で永久抑制しない
- Evidence Refの同一性は `source_type + source_system + source_id` を基本とする
