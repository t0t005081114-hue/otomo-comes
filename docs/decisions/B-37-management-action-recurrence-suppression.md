# B-37 Management Action 再掲抑制契約

Status: Accepted v1.2
Decision ID: B-37

## 結論

HOMEで実施済みとなった委譲・称賛等のマネジメント行動は、同一根拠のまま翌日以降に繰り返し候補化しない。

B-36 v1.4 `management_action_receipts` に実施済みReceiptが存在する場合、同一人物・同一Evidence Ref集合・同一行動種別の候補は再掲対象から除外する。

ただし、新しい事実・新しい根拠が発生した場合は、新しい候補として再表示してよい。

## 対象

主に以下を対象とする。

- `delegation_handled`
- `praise_delivered`

Taskは `work_items.status = completed`、Bottleneckは `bottlenecks.status = resolved` により元ドメイン側でも状態が変わるため、通常はその状態で再掲対象外となる。

## 同一根拠の判定

人物対象がある候補の正本比較キー:

```text
action_kind + subject_person_id + evidence_fingerprint
```

人物対象が無い候補:

```text
action_kind + source_type + source_system + source_id + evidence_fingerprint
```

`evidence_fingerprint` はB-36 v1.4に従い、候補の全Evidence Refから `source_type / source_system / source_id` を抽出し、重複除去・sort・SHA-256で決定的に生成する。

`label` は表示文言でありfingerprintへ含めない。

同じEvidence Ref集合でも `subject_person_id` が異なる場合は別候補として扱う。

## 新しい候補として再掲できる条件

以下のいずれかを満たす場合は、過去Receiptがあっても新しい候補として扱ってよい。

- 対象人物が異なる
- 新しいEvidence Refが追加された
- 既存Evidence Refが別の新しいsource_idへ更新された
- 前回実施後の新しいKPI結果、1on1、Manager Observation、Work Event等を根拠にしている
- 前回Receiptとは異なる `action_kind` のマネジメント行動が必要になった

新しいEvidence Refが追加されればfingerprintが変わる。

単に日付が変わっただけでは新しい候補とはみなさない。

## Decision Pack生成時の扱い

候補生成後、Decision Packへ載せる前に、対象人物とEvidence Ref集合から比較キーを生成し、過去の `management_action_receipts` と照合する。

- 同一比較キーで実施済み → 抑制
- subject_person_idが異なる → 別候補
- fingerprintが異なる → 掲載可能
- 根拠不足で安定したfingerprintを生成できない → 推測で抑制せず、必要に応じて `needs_confirmation`

ReceiptそのものをEvidence Refへ混在させて元事実を置換しない。

## Praiseの例

前日:
- subject: person_A
- 根拠A: `work_event / crm / event_123`
- 根拠B: `manager_observation / manual / obs_456`
- `praise_delivered` Receiptを保存

翌日:
- person_A + 同じA+B → 抑制
- person_B + 同じA+B → 抑制しない

その後:
- person_A + 新しい根拠C `work_event / crm / event_789` → fingerprint変更 → 新しい称賛候補として表示可能

## Delegationの例

前日:
- subject: person_A
- 根拠: `delegation_candidate / comes / dc_001`
- 委譲対応を実施

翌日:
- person_A + 同じ根拠集合・同じ `delegation_handled` → 抑制

その後:
- 新しい業務実績・新しい候補 `dc_002` が根拠に追加 → fingerprint変更 → 再掲可能

## 非採用

- 日付が変わるたびに同一根拠を再掲する
- Receiptが1件あれば対象人物の将来候補をすべて永久抑制する
- 同じEvidence Refだからという理由だけで異なる人物候補を抑制する
- labelの文字列一致で同一根拠と判定する
- 複数根拠のうち任意の1件だけで同一性を判定する
- Evidence Ref配列の順序差だけで別候補扱いにする
- 新しい事実があるのに過去Receiptだけを理由に候補を永久非表示にする

## Acceptance

- 実施済みの同一人物・同一根拠集合・同一行動を翌日以降に繰り返し表示しない
- 同じ根拠集合でも異なる人物候補は相互抑制しない
- 複数Evidence Refを持つ候補でも安定比較できる
- 新しいEvidence Refがあれば新候補として再表示できる
- 日付変更だけでは新候補扱いにしない
- 人物単位で永久抑制しない
- Evidence Ref順序に依存しない
