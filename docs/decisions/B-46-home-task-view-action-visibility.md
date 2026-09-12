# B-46 HOME「タスクを見る」の表示条件

Status: Accepted
Decision ID: B-46

## 結論

HOME上段のクイック操作 `タスクを見る` は、対象に実在するTaskが紐づいている場合だけ表示する。

Taskを持たないDelegation Candidate / Praise Candidate / Bottleneck等に対して、表示のためだけにTaskを自動生成しない。

## 表示条件

`タスクを見る` を表示してよい条件:

- HOME item自身が `work_items` である
- accepted AI Proposal由来で `ai_proposals.task_work_item_id` が存在する
- その他、明示的なrelated work item IDが存在し、そのTaskを開ける

Task参照が無い場合:

- `タスクを見る` は表示しない
- `完了` / `保留` の意味は維持する
- item本体またはカード押下でB-21のCentered Modal / 詳細確認へ進める

新しい `詳細を見る` ボタンを必須追加しない。

## 理由

HOMEは軽い操作だけを置く。

Taskが存在しない候補へ `タスクを見る` を表示すると、空遷移・自動Task生成・意味のないTask化のいずれかが必要になる。

候補とTaskの責務を混同しない。

## accepted AI Proposal

accepted AI ProposalはB-24によりTask化されるため、Task参照が存在する。

B-40によりHOME上は `褒める / 手放す / 詰まりを取る` 等の主カードだけに表示されても、`タスクを見る` からBacking Taskを開いてよい。

## 非採用

- 4カードすべてで `タスクを見る` を常時表示する
- `タスクを見る` のためだけに候補を自動Task化する
- Taskが無いのに空のTask画面へ遷移する
- HOMEへ新しい共通操作を増やす

## Acceptance

- Task参照があるitemだけ `タスクを見る` を表示する
- Task無し候補でもHOMEの完了/保留が成立する
- CandidateとTaskを強制的に同一化しない
- HOMEの操作数を増やさない
