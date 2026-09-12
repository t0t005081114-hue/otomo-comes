# B-08 Google Drive / Meet 認証方式決定

Status: Accepted
Decision ID: B-08

## 結論

OTOMO COMES 個人MVPでは、Google Drive / Meet関連ファイル取得に **Google OAuth 2.0（ユーザー認可 + offline access）** を採用する。

Service Accountを主方式にはしない。

## 採用理由

Meetの文字起こし・会議メモはユーザーのGoogle Workspace / Drive配下に保存されるため、個人MVPでは本人アカウントのOAuth認可が最も自然である。

Service Account方式は、対象ファイルやフォルダを別途共有する運用が必要になりやすく、個人MVPでは運用負荷が増える。

## 権限原則

- 必要最小限のDrive読み取り権限のみ要求する
- COMESからDriveファイルを削除・移動・編集しない
- 1on1以外のファイル本文を不用意に取得しない
- ファイル名・更新日時等のメタデータ検索と対象ファイル本文取得を分離する

## Token管理

- access tokenをRepositoryへ保存しない
- refresh tokenをGitHub Actions Secrets等のSecret Storeへ保存する
- ローカル `.env` はGit管理対象外
- Tokenをログへ出さない

## GitHub Actions

19:00 Batchでは保存済みrefresh tokenから短期access tokenを取得して実行する。

Actions内で対話的OAuth認可は行わない。

初回認可のみ人間が実施する。

## 対象範囲

MVPではDrive全体を業務ロジック上の探索対象にしない。

検索条件は最低限以下で絞る。

- 1on1命名規則
- 対象期間
- 必要に応じて既知の保存場所 / folder ID

実ファイルの保存場所・命名形式はB-09の実データ検証で確定する。

## Adapter境界

Google SDK / API固有コードは `adapters/google-drive` に隔離する。

COMES CoreはGoogle OAuth、Drive file ID、Google固有レスポンス型へ直接依存しない。

## Acceptance

B-08は以下を満たすため解決とする。

- OAuth方式を採用
- offline accessを前提化
- Service AccountをMVP主方式から除外
- 必要最小権限を採用
- Secret管理方針を定義
- GitHub Actionsでの非対話実行方針を定義
- B-09の実ファイル検証と責務分離済み
