# B-42 HOMEドメイン完了とBacking Task同期

Status: Accepted
Decision ID: B-42

## 結論

accepted AI ProposalからTaskが作成され、そのTaskがHOMEではB-40により `手放す / 褒める / 詰まりを取る` の主カードへ投影されている場合、HOME側でそのマネジメント行動を `完了` したときは、同じProposalに紐づくBacking Taskも同一トランザクションで完了する。

一方、Task画面でBacking Taskだけを完了したことを、元ドメインの委譲対応済み・称賛実施済み・ボトルネック解消済みへ自動昇格させない。

## 理由

HOMEの `完了` はB-35/B-36で定義された上位のマネジメント行動完了である。

その行動がaccepted AI Proposal由来TaskとしてTask画面にも存在する場合、HOMEで行動を完了した後にTaskだけ未完了で残るのは不整合となる。

逆方向は意味が異なる。

Task完了は、作業単位の完了を表すだけであり、元のマネジメント成果まで達成したとは限らない。

例:
- Bottleneck Task「原因を確認する」を完了しても、ボトルネック自体が解消したとは限らない。
- Delegation Task「委譲案を作る」を完了しても、実際に委譲対応したとは限らない。

## HOME → Task同期

HOMEでB-35の `完了` を実行し、対象に `origin_ai_proposal_id` 由来のBacking Taskが存在する場合:

### 自分が動く
- 通常どおり対象Taskを `completed`
- Receipt `task_completed`

### 手放す
- Receipt `delegation_handled`
- Backing Taskが存在すれば `work_items.status = completed`
- 元業務そのものはcompletedにしない

### 褒める
- Receipt `praise_delivered`
- Backing Taskが存在すれば `work_items.status = completed`
- 人物/KPI状態は変更しない

### 詰まりを取る
- 実際に解消済みであることを前提に `bottlenecks.status = resolved`
- Receipt `bottleneck_resolved`
- Backing Taskが存在すれば `work_items.status = completed`
- 元案件そのものを自動completedにしない

## Task → Domainは自動同期しない

Task画面でBacking Taskを `completed` にしただけでは、以下を自動実行しない。

- `delegation_handled` Receipt生成
- `praise_delivered` Receipt生成
- `bottleneck_resolved` Receipt生成
- delegation candidate / bottleneck等のドメイン状態変更

元ドメインが引き続き候補条件を満たす場合、HOMEでは翌回の表示判定対象になり得る。

## UI

Task完了後も元ドメイン候補が残る場合、これは矛盾ではなく「作業は完了したが管理上の論点は未解消」を意味する。

HOMEのドメイン完了操作が行われた時点で、Backing Taskと上位行動を同期して閉じる。

追加確認モーダルを必須にはしない。

## トランザクション

HOME完了時の以下は同一Application transactionとして扱う。

- 元ドメインの必要な状態更新
- `management_action_receipts` 作成
- Backing Task完了

途中失敗で一部だけ反映しない。

## 非採用

- Task完了を無条件にドメイン成果達成とみなす
- HOME完了後もBacking Taskを未完了のまま残す
- Praise完了で人物状態を変更する
- Bottleneckの調査Task完了だけで自動resolvedにする

## Acceptance

- HOMEのドメイン完了後に同一AI ProposalのBacking Taskが残存しない
- Task単体完了から元ドメイン成果を誤推測しない
- HOME完了のReceipt / domain update / Task完了が原子的に処理される
- B-35 / B-36 / B-40と整合する
