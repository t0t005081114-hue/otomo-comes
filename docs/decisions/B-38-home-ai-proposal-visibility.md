# B-38 HOMEとAI Proposalの表示境界

Status: Accepted
Decision ID: B-38

## 結論

OTOMO COMES MVPでは、HOME上段の実行カードへ `pending` / `held` のAI Proposalを直接表示しない。

HOMEは、人間判断を通過した実行対象と、COMES側で現在候補として確立している事実ベース候補を表示する。

## HOMEへ表示してよいもの

### 自分が動く

- accepted済みAI Proposalから生成されたTask
- 手動Task
- imported Task
- その他、既存仕様でHOME対象となる確定済みTask

### 手放す

- COMESのDelegation Candidate
- accepted済みAI Proposal由来でTask化された委譲アクション

### 褒める

- Decision Pack / COMESで現在候補として扱われるPraise Candidate
- accepted済みAI Proposal由来の称賛アクション

### 詰まりを取る

- openなBottleneck
- accepted済みAI Proposal由来のボトルネック解消Task

## HOMEへ直接表示しないもの

- `ai_proposals.status = pending`
- `ai_proposals.status = held`
- `ai_proposals.status = rejected`

`pending` はまだ人間が採否判断していないため、HOME上の「完了 / 保留」対象にしない。

`held` はAI Proposal画面で人間が明示的に保留した提案であり、HOME上の当日実行対象にはしない。

`rejected` は通常の実行対象へ再表示しない。

## AI Proposalの判断場所

AI Proposalの採用 / 保留 / 見送りはDecision Pack / AI Proposal画面で行う。

HOMEへ新たに `採用` 操作を追加しない。

HOMEのクイック操作は既存どおり最小限に保つ。

## AIのHOMEへの影響

AI Proposalを直接出さなくても、AIは以下を通じてHOMEへ影響する。

- `management_focus_type`
- `management_focus_summary`
- `kpi_allocation_comment`
- accepted済みProposalから生成されたTask
- AIが提案した優先順位・推奨アクションのうち、人間が採用したもの

## Human-in-the-loop原則

AI Proposalは、人間の採用前に実行対象へ昇格しない。

これにより:

- 未採用AI提案をHOMEで誤って完了扱いしない
- AI提案の採否責任が人間に残る
- HOMEとAI Proposal画面の責務を分離できる
- HOMEの操作体系を増やさずに済む

## B-34 / B-35 / B-36との関係

- B-34 `保留` はHOME上の実行対象に対する当日deferであり、AI Proposalの `held` とは別概念。
- B-35 `完了` はHOMEへ表示された確定済み実行対象に対してのみ適用する。
- B-36 Management Action Receiptは、実際にHOME上でマネジメント行動を実施した記録であり、pending AI Proposalの存在だけでは作成しない。

## 非採用

- pending AI ProposalをHOMEへ直接表示する
- HOMEにAI Proposalの `採用` ボタンを追加する
- HOMEの `保留` とAI Proposalの `held` を同一状態として扱う
- 人間判断前のAI提案をTaskへ自動変換する

## Acceptance

- pending / held AI ProposalがHOME実行カードへ直接出ない
- AI Proposalの採否は専用画面で人間が行う
- accepted済み提案だけがTask等を介してHOME実行対象になれる
- HOMEのクイック操作体系を増やさない
- Human-in-the-loop境界が維持される
