# B-47 AI Action担当者契約

Status: Accepted
Decision ID: B-47

## 結論

B-24 AI Analysis Resultの `actions[]` は「そのDecision Pack対象マネージャーが次に行うマネジメント行動」を表すため、個人MVPでは各actionの `assignee_person_id` を **Decision Packの `manager_id` と一致必須**にする。

チームメンバー・委譲先・フォロー対象は `related_person_ids` / `delegate_to_person_id` で表現する。

## 理由

B-24 actionは採用後にマネージャーのTaskへ変換され、HOMEの `自分が動く / 手放す / 褒める / 詰まりを取る` へ投影される。

`assignee_person_id` が別メンバーを指せるままだと、マネージャーHOMEへ他人の実行Taskが混入し、`完了 / 保留` の意味が崩れる。

委譲先は既に `delegate_to_person_id` で分離されているため、AI管理行動の実行者と対象人物を同じfieldで表す必要はない。

## Validation

B-24取込時のIdentity Validationへ以下を追加する。

```text
action.assignee_person_id == decision_pack.manager_id
```

一致しないactionを含むAI結果はimport failureとする。

COMESはassigneeを自動修正しない。

## action type別

### priority_task
マネージャー自身が行う優先Task。

### delegate
- assignee = manager
- delegate_to_person_id = 委譲先候補/相手

### follow_up
- assignee = manager
- related_person_ids = フォロー対象

### praise
- assignee = manager
- related_person_ids = 称賛対象

### bottleneck
- assignee = manager
- related_person_ids / source_refs = 解消対象文脈

### systemization
- assignee = manager
- 実作業を別メンバーへ委譲する場合は、その後のTask/委譲フローとして扱う

### one_on_one
- assignee = manager
- related_person_ids = 1on1対象

## チームメンバー側の仕事

B-24 actionを直接「部下へ割り当てるTask」として使わない。

マネージャーがAI提案を採用・実行した結果として実際の委譲Taskが必要になった場合は、既存Task/Delegationフローで別途管理する。

## 将来公開版

複数manager環境でも、1つのAI Analysis Resultは対象Decision Packのmanager向け出力として扱う。

別managerの行動は、そのmanagerのDecision Packで生成する。

## 非採用

- B-24 actionのassigneeをAIが任意人物へ割り当てる
- delegate_to_person_idの代わりにassigneeを委譲先として使う
- import時にCOMESがassigneeをmanagerへサイレント修正する

## Acceptance

- B-24 actionのassigneeがDecision Pack managerと一致する
- 委譲先と実行者が混同されない
- HOMEへ他人担当のAI Taskが混入しない
- AI結果の不一致をimport時に検知できる
