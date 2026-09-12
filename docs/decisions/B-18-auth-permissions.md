# B-18 認証・権限モデル決定

Status: Accepted
Decision ID: B-18

## 結論

OTOMO COMES の認証Identityと外部データ接続Identityは分離する。

個人MVPでは、COMESへのログインは個人Googleアカウントを使用し、Google Meet / Drive連携は会社Google Workspaceアカウントを別接続する。

公開版の基本ロールは `owner / manager / member` とする。

managerの閲覧範囲は reporting relationship に基づく配下ツリー全体とし、1on1の原文と要約では閲覧権限を分ける。

---

## 1. 認証Identityと外部接続Identityの分離

### COMESログイン

個人MVP:

- 個人Googleアカウント
- Supabase Auth
- COMES user / profileへ紐付け

### Google Workspace連携

- 会社Google Workspaceアカウント
- Google OAuth Connectorとして別管理
- Meet / Drive取得専用

構造:

```text
個人Googleアカウント
↓
Supabase Auth
↓
COMES user

会社Google Workspaceアカウント
↓
Google OAuth Connector
↓
Meet / Drive source
```

同一Googleアカウントであることを前提にしない。

会社Google Workspaceアカウントが変更・停止されても、COMESへのログインIdentityまで失わない設計とする。

---

## 2. 公開版の基本ロール

### owner

- 組織設定
- メンバー管理
- 接続設定
- 組織全体設定
- 管理ライン上で許可された情報の閲覧

### manager

- 自分の管理対象データの閲覧
- Manager Observation入力
- 1on1関連情報の閲覧
- Decision Pack閲覧
- KPI / bottleneck / delegation candidateの確認

### member

- 将来の本人向け画面用
- MVPでは利用しない
- 本人に見せる情報範囲は別途定義する

個人MVPでは実質 `owner` のみ利用する。

---

## 3. 閲覧範囲

閲覧権限は役職名ではなく reporting relationship を基準にする。

例:

```text
社長
└─ 部長A
   └─ 課長B
      └─ メンバーC
```

課長BはCを管理対象として閲覧可能。
部長AはBおよびCを配下ツリーとして閲覧可能。
社長はA以下を配下ツリーとして閲覧可能。

別系統のmanagerは閲覧不可。

---

## 4. 1on1閲覧権限

1on1はセンシティブ情報を含むため、原文と要約を分離する。

### 直属manager

- 1on1原文: 閲覧可
- 1on1要約: 閲覧可

### 上位manager

- 1on1原文: 原則閲覧不可
- 1on1要約: 閲覧可

### owner

ownerだから無条件に全1on1原文を閲覧できる仕様にはしない。

ownerが対象人物の管理ライン上にいる場合でも、原文ではなく要約を基本とする。

### 本人

- 1on1原文: MVPでは非表示
- 1on1要約: MVPでは非表示

将来、本人共有用情報を提供する場合は別データとして設計する。

---

## 5. Manager Observation

Manager Observationも管理ラインを基準にする。

- 直属manager: 原文閲覧可
- 上位manager: 要約・判断材料を閲覧可
- 別系統manager: 閲覧不可
- 本人: MVPでは非表示

`observed_fact` と `manager_impression` はB-02どおり分離する。

---

## 6. 権限判定原則

権限判定は以下の組み合わせで決める。

```text
organization membership
× role
× reporting relationship
× data sensitivity
```

単純な `ownerなら全部閲覧可` は採用しない。

---

## 7. Supabase RLS方針

公開版を見据え、RLSで少なくとも以下を分離できる構造にする。

- organization境界
- user/profile境界
- reporting relationship境界
- 1on1原文と要約の境界

ただしMVP初期実装で複雑なRLSを一括実装する必要はない。

アプリケーション層の権限判定とDB側RLSの責務を分け、後から矛盾しない構造を保つ。

---

## 8. 禁止事項

- 会社Google WorkspaceアカウントをCOMESログインIdentityとして必須化しない
- Google連携アカウントとAuth userを同一ID前提で設計しない
- ownerロールだけを理由に全1on1原文へアクセス可能にしない
- 名前だけで権限関係を判定しない
- member本人にManager Observationを自動開示しない

---

## 9. Acceptance

B-18は以下を満たしたため解決とする。

- COMESログインIdentityとGoogle Workspace連携Identityを分離した
- 個人MVPのログイン方式が確定した
- 公開版ロール `owner / manager / member` を確定した
- managerの閲覧範囲を配下ツリー全体とした
- 1on1原文と要約の閲覧権限を分離した
- owner無条件全閲覧を禁止した
- 将来RLSへ拡張可能な境界を維持した
