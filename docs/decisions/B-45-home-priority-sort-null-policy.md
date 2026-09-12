# B-45 HOME優先度ソートの未設定ポリシー

Status: Accepted
Decision ID: B-45

## 結論

HOME上段4カードの既定並び替え `優先度` は、明示的に存在するpriorityだけを利用する。

priorityを持たない候補へ、COMESが推測でhigh / medium / lowを付与しない。

## 並び順

`優先度` 選択時:

1. high
2. medium
3. low
4. priority未設定

同一priority内のtie-break:

1. 明示期限がある場合は期限の近い順
2. 期限超過は同一priority内で先に表示
3. それでも同じなら安定した内部ID / HOME item keyの昇順

## priority未設定

Delegation Candidate / Praise Candidate / Bottleneck等でpriorityが存在しない場合:

- priority未設定として扱う
- risk_level、停滞日数、KPI値、人物属性等から勝手にpriorityへ変換しない
- AIがaccepted Proposalとして明示したpriorityがある場合のみ、そのpriorityを利用してよい

## カード内Top 3

Top 3選定も同じsort ruleを使う。

未設定itemしか存在しないカードでは、期限があれば期限順、期限も無ければ安定した内部順でTop 3を決める。

同一入力で表示順が日ごとにランダムに揺れないことを優先する。

## 非採用

- risk_level = highを自動的にpriority = highへ変換する
- 停滞日数だけでpriorityを推測する
- Praise候補に人物評価的なpriorityを付ける
- priority未設定候補を非表示にする

## Acceptance

- `優先度` ソートが推測値に依存しない
- high / medium / low / 未設定の順序が固定される
- priority未設定候補も表示できる
- Top 3選定が決定的である
- 人物・候補のスコアリングを新規導入しない
