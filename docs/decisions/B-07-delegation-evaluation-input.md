# B-07 委譲評価入力方式決定

Status: Accepted
Decision ID: B-07

## 結論

OTOMO COMES のMVPでは、委譲評価4軸を **手動設定 + ルールベース算出の併用** で扱う。

LLMによる推測はMVPの必須要件にしない。

評価4軸:

1. 答えの明確さ (`answer_clarity`)
2. 再現性 (`repeatability`)
3. 失敗時リスク (`failure_risk`)
4. 担当候補者の習熟度 (`candidate_proficiency`)

各軸の値:

- `low`
- `medium`
- `high`
- `unknown`

---

## 1. 入力原則

### answer_clarity

原則はマネージャーが仕事種別ごとに設定する。

判断基準例:

- high: 正解・手順・期待成果が明確
- medium: 基本手順はあるが一部判断が必要
- low: 正解が未確立、探索・設計が必要
- unknown: 情報不足

### repeatability

過去の同種業務実績と手順化状況からルール計算可能とする。

判断材料例:

- 同種業務の発生回数
- 手順書 / テンプレートの有無
- 成果物のばらつき
- 差し戻し率

MVPでは必要に応じて手動上書きを許可する。

### failure_risk

原則はマネージャーが仕事種別ごとに設定する。

判断基準例:

- low: やり直し可能、顧客・売上影響が小さい
- medium: レビューで十分に抑制できる
- high: 重大顧客影響、契約・金銭・信用・法務等のリスクが大きい
- unknown: 未評価

### candidate_proficiency

可能な範囲で過去実績から算出する。

判断材料例:

- 同種業務の完了件数
- 差し戻し件数 / 率
- 期限遵守
- レビュー修正量
- 過去の委譲実績

CRMに十分な履歴がない場合は `unknown` とし、推測で埋めない。

---

## 2. 委譲分類ルール

### full_delegation

目安:

- answer_clarity = high
- repeatability = high
- failure_risk = low
- candidate_proficiency = medium 以上

### review_required

目安:

- 答えは概ね明確
- 再現可能
- リスクがmedium、または習熟度が十分でない

### manager_keeps

目安:

- answer_clarity = low
- failure_risk = high
- 重大トラブルや新規設計など、本人が持つべき条件を満たす

ただし、単一軸だけで機械的に最終判断しない。

COMESが出すのは **候補 + 根拠** であり、最終判断ではない。

---

## 3. 仕事種別設定

同じ種類の仕事に対し毎回4軸を入力する負担を避けるため、MVPでは仕事種別ごとの既定値を持てるようにする。

例:

```json
{
  "work_type_key": "meeting_schedule_adjustment",
  "answer_clarity": "high",
  "repeatability": "high",
  "failure_risk": "low"
}
```

`candidate_proficiency` は人物ごとに変わるため、仕事種別の既定値には含めない。

---

## 4. 手動上書き

ルール計算値と現場判断が異なる場合、マネージャーは上書きできる。

上書き時は以下を保存する。

- 元の値
- 上書き後の値
- 理由
- 実行者
- 実行日時

ただしMVPでは専用の複雑な承認フローは持たない。

---

## 5. AIとの境界

個人検証版では、LLM APIによる4軸判定を行わない。

ChatGPT側のAI上司はDecision Packに含まれる4軸・根拠を読んで、委譲に関する提案を行えるが、COMES DBの評価値を自動更新しない。

公開版でAI補助を追加する場合も、AI出力は候補として扱い、人間設定・実績値と区別する。

---

## 6. 不採用

MVPでは以下を採用しない。

- 自由記述だけをLLMへ渡して4軸を自動推測
- 0〜100点の委譲スコア
- 人物能力の総合点
- 性格・モチベーションからの委譲判断
- ブラックボックスな一発判定

---

## Acceptance

B-07は以下を満たしたため解決とする。

- 委譲4軸の入力元が明確
- 手動とルール計算の責務が分離されている
- 情報不足時は `unknown` を使用する
- 候補者習熟度は実績ベースで扱う
- LLM推測をMVP必須条件にしていない
- COMESが最終委譲判断を行わない