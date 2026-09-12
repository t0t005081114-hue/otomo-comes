---
description: 機微データ・ログ・secret・認可の禁止事項。実装コードやCI設定を触るとき必ず守る。
paths:
  - "src/**"
  - "supabase/**"
  - ".github/**"
  - "scripts/**"
  - "tests/**"
---

# Security rules

正本: B-19 / B-18 / B-08 / B-14 / B-03。詳細は `docs/DEVELOPMENT_STANDARDS.md` §4。

## ログ・エラーへ出さない（絶対）

- 1on1原文、1on1要約本文
- Manager Observation本文（`observed_fact` / `manager_impression`）
- Google OAuth access token / refresh token
- CRM Service Token / Authorization header
- 外部APIレスポンス全文
- 顧客・社員の不要な個人情報

出してよいのは識別子と集計値だけ。

```
request_id / run_id / source_type / source_system / record_count / status
error_code / duration_ms / retry_count / person_resolution_status / pack_date / revision
```

エラー文へ原文・secretを連結しない。外部SDK例外はログ前にサニタイズする。

```
NG: `Failed to parse transcript: ${rawText}`
OK: `Failed to parse transcript file_id=${fileId} error_code=PARSE_FAILED`
```

GitHub Actionsログ / artifactへも同じ制約が適用される（B-14 / B-19）。

## 1on1原文

- COMES DBへ本文を保存しない。正本はGoogle Drive（B-19）。
- リポジトリ・Actions artifactへ保存しない。
- 保持するのは `source_file_id` / `source_file_name` / `source_modified_at` / `held_at` / 人物参照 / `raw_text_ref` と、人間確認済みの構造化要約のみ。
- Decision Packへ原文を埋め込まない。要約とevidence referenceだけを渡す（B-19 §5）。

## Secret

- API key / service account key / token をcommitしない。
- `.env` はGit管理外。コミットするのは値なしの `.env.example` のみ。
- refresh tokenはSecret Store（GitHub Actions Secrets等）へ。
- Actions内で対話的OAuth認可を行わない（B-08）。

## 認可（B-18）

- 判定は `organization membership × role × reporting relationship × data sensitivity` の組み合わせ。
- 「`owner` だから全部見られる」にしない。owner権限だけを理由に1on1原文へアクセスさせない。
- **権限判定をUI表示制御だけに依存させない。** API / Application層で必ず判定する。
- 1on1原文と要約で閲覧権限を分ける（直属manager: 原文+要約 / 上位manager: 要約のみ / 別系統: 不可 / 本人: MVPでは非表示）。
- COMES上の権限でGoogle Drive権限を迂回しない。
- 名前の一致で人物・権限関係を判定しない。
- organization越境を禁止する。

## 表現

機微情報の要約でも、事実と推測を分ける（B-19 §2）。

```
OK: 本人が「今週は案件数が多く負荷が高い」と発言
NG: モチベーション低下
```

感情・性格・モチベーション・能力のスコア化・断定は禁止（B-17 / B-13）。

## エスカレーション

保持期間・削除・暗号化・export/delete requestの新しい判断が必要になったら、実装せず人間へ質問する。
