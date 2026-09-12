# B-03 会社CRM Read API 契約

Status: Accepted
Decision ID: B-03

## 結論

OTOMO COMES 個人検証版では、会社CRMとの接続を **COMES専用の読み取り専用HTTP API** に限定する。

COMES は会社CRMのDBへ直接接続しない。会社CRM側がCOMES向けに正規化したレスポンスを返し、COMES側はその契約だけに依存する。

```text
Company CRM
  ↓  COMES Read API (GET only)
COMES CRM Adapter
  ↓
COMES canonical input
  ↓
COMES Core
```

会社CRMの内部テーブル名・列名・ステータス設計はCOMES Coreへ漏らさない。

---

## 1. API version

初期契約は `v1` とする。

Base path:

```text
/api/integrations/comes/v1
```

破壊的変更が必要になった場合は既存v1を書き換えず、v2を追加する。

---

## 2. 認証方式

個人MVPでは、**専用Service TokenによるBearer認証** を採用する。

```http
Authorization: Bearer <COMES_CRM_READ_TOKEN>
```

原則:

- COMES専用tokenを発行する
- 読み取り専用権限のみ持つ
- 通常ユーザーのログインtokenを流用しない
- GitHub repositoryへtokenをcommitしない
- GitHub ActionsではRepository / Environment Secretとして保持する
- token自体をアプリログ・Actionsログへ出力しない

将来、公開版や複数組織対応で必要になれば、OAuth client credentials / signed JWT等へ置換できるよう、認証処理はCRM Adapterへ隔離する。

---

## 3. Endpoint set

MVPで必要な最小Endpointは以下とする。

### 3.1 Health / contract check

```http
GET /api/integrations/comes/v1/health
```

Purpose:

- 認証疎通確認
- API version確認
- CRM側の生成時刻確認

Example:

```json
{
  "status": "ok",
  "api_version": "v1",
  "generated_at": "2026-09-12T18:59:30+09:00"
}
```

---

### 3.2 People

```http
GET /api/integrations/comes/v1/people
```

COMESがCRM人物IDを `person_external_identities` へ対応付けるための最小人物マスタ。

Response:

```json
{
  "api_version": "v1",
  "generated_at": "2026-09-12T18:59:30+09:00",
  "people": [
    {
      "crm_person_id": "crm-user-123",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "active": true
    }
  ]
}
```

Rules:

- `crm_person_id` はCRM内で安定した一意IDを使用する
- COMESの `people.id` をCRM側へ持ち込まない
- emailが存在しない場合は `null`
- 名前だけで自動名寄せしない

---

### 3.3 Daily management data

```http
GET /api/integrations/comes/v1/daily-management?date=YYYY-MM-DD
```

MVPの日次取り込みの中心Endpoint。

`date` は必須。CRM業務上の対象日を `Asia/Tokyo` の日付で指定する。

必要に応じて人物を絞る場合のみ任意queryを許可する。

```http
GET /api/integrations/comes/v1/daily-management?date=2026-09-12&crm_person_id=crm-user-123
```

人物指定なしの場合は、COMES連携対象の全人物を返す。

---

## 4. Daily management response contract

Top level:

```json
{
  "api_version": "v1",
  "date": "2026-09-12",
  "timezone": "Asia/Tokyo",
  "generated_at": "2026-09-12T19:00:03+09:00",
  "source_status": "complete",
  "people": []
}
```

`source_status`:

- `complete`: 対象日の取得処理が正常終了し、CRM側で必要データが揃っている
- `partial`: 一部項目・一部人物で欠損がある
- `missing`: 対象日データそのものが取得できない

HTTP 200でも `partial` はあり得る。

### Person daily record

```json
{
  "crm_person_id": "crm-user-123",
  "metrics": {
    "handled_count": {
      "value": 42,
      "status": "known"
    },
    "completed_count": {
      "value": 35,
      "status": "known"
    },
    "carryover_count": {
      "value": null,
      "status": "source_missing"
    },
    "self_handled_count": {
      "value": null,
      "status": "not_applicable"
    },
    "delegated_count": {
      "value": 8,
      "status": "known"
    },
    "returned_count": {
      "value": 2,
      "status": "known"
    },
    "trouble_count": {
      "value": 1,
      "status": "known"
    },
    "stagnant_count": {
      "value": 3,
      "status": "known"
    }
  },
  "kpis": [],
  "highlights": [],
  "work_items": []
}
```

B-04で会社CRMの実項目を確認し、各標準metricへ実際にmappingできるかを確定する。

この契約でフィールドが存在しても、CRMに元データが存在しない項目を0で埋めてはならない。

---

## 5. Data status

各metric / KPI / optional valueは、値と状態を分離する。

許可値:

- `known`
- `unknown`
- `source_missing`
- `needs_confirmation`
- `not_applicable`

Rules:

- `0` は実測値ゼロの場合のみ使用する
- 元データが無い場合は `null + source_missing`
- 意味的に対象外の場合は `null + not_applicable`
- CRM上に値はあるが確定不能の場合は `null + needs_confirmation`
- 不明理由を区別できない場合のみ `unknown`

COMES AdapterはこれをB-02の `data_status` に変換する。

---

## 6. KPI contract

KPIはCRMの内部列名ではなく、COMES向けkeyで返す。

Example:

```json
{
  "kpi_key": "appointment_count",
  "label": "アポ数",
  "value": 12,
  "unit": "count",
  "period_type": "daily",
  "status": "known",
  "source_ref": "optional-opaque-reference"
}
```

MVPでは最低限:

- `kpi_key`
- `label`
- `value`
- `unit`
- `period_type`
- `status`

を返せること。

目標値をCRM側で正本管理している場合は `target_value` を追加してよいが、どのKPIをCRM由来とするかはB-04 / B-05で確定する。

---

## 7. Highlight contract

件数では失われる重要案件・例外を返す。

```json
{
  "category": "stagnation",
  "summary": "決済登録待ちのまま更新なし",
  "crm_work_id": "case-456",
  "source_ref": "opaque-reference"
}
```

`category`:

- `important`
- `trouble`
- `stagnation`
- `exception`

COMES側で人物評価の文章へ変換しない。CRMは観測事実のみ返す。

---

## 8. Work item contract

停滞・ボトルネック分析に必要な案件のみ返せる構造を持つ。

全案件の完全同期をMVPの必須条件にはしない。

```json
{
  "crm_work_id": "case-456",
  "title": "案件456",
  "assignee_crm_person_id": "crm-user-123",
  "status": "waiting",
  "priority": "high",
  "last_activity_at": "2026-09-11T15:00:00+09:00",
  "due_at": null,
  "waiting_reason": "customer_wait",
  "risk_level": "medium",
  "source_ref": "opaque-reference"
}
```

CRM内部ステータスは、CRM API層で以下のCOMES契約へ正規化する。

`status`:

- `todo`
- `in_progress`
- `waiting`
- `completed`
- `cancelled`

`waiting_reason` は可能な場合のみ返す。不明を推測しない。

---

## 9. Null / missing policy

以下を厳守する。

### Field absent

契約バージョン上、そのfieldをサポートしていない場合のみfield自体を省略してよい。

### `null`

fieldはサポートしているが値がないことを示す。

### `0`

実測値がゼロである。

COMESは `null` を0へ変換しない。

---

## 10. HTTP error contract

### 200

正常取得。`source_status=partial` を含み得る。

### 400

query parameter不正。

Example:

```json
{
  "error": {
    "code": "INVALID_DATE",
    "message": "date must be YYYY-MM-DD"
  }
}
```

### 401

token不正 / 無し。

### 403

tokenは有効だがCOMES連携権限なし。

### 404

対象resourceなし。日次データなしを404にするのではなく、原則200 + `source_status=missing` を優先する。

### 429

rate limit。

### 500 / 503

CRM側エラー / 一時利用不可。

エラー本文にDB接続文字列、stack trace、token、個人情報を含めない。

---

## 11. Retry classification

COMES側Adapterはエラーを以下に分類する。

### Retryしない

- 400
- 401
- 403

設定・契約問題として失敗扱いにする。

### Retryしてよい

- 429
- 500
- 502
- 503
- 504
- network timeout

Retry回数・backoffの具体値はB-14 Batch仕様で確定する。

---

## 12. Idempotency / cache

Read APIのためrequest自体は副作用を持たない。

同一 `date` への複数GETでCRMデータが更新されていれば最新内容を返してよい。

COMES側は `generated_at` と取得時刻を保存し、Decision Pack再生成時のsource provenanceを追跡する。

---

## 13. Logging / audit

CRM側は可能な範囲で以下を監査ログとして保持する。

- request timestamp
- endpoint
- requested date
- requested crm_person_id（指定時）
- HTTP status
- token識別子またはclient識別子

保存してはならない:

- raw token
- Authorization header全文

COMES側も本文全量を通常ログへ出さない。

---

## 14. Explicit non-goals

B-03では以下を行わない。

- COMES → CRM書き戻し
- CRM DB直接接続
- webhookによるリアルタイム同期
- 全案件の常時ミラーリング
- CRM内部schemaのCOMESへの複製
- LLMによるCRMレスポンス解釈

---

## 15. B-04との境界

B-03は **通信契約と正規化レスポンス形式** を決める。

B-04では、会社CRMの現在の実データを確認して、次を確定する。

- どのCRM項目から `handled_count` 等を計算するか
- 取得不能な標準metric
- company-specific KPI一覧
- work item / highlightとして返す対象
- CRM側で集計するかCOMES側で集計するか

B-04で取得不能と判明した項目を、B-03を満たすためだけに推測・捏造してはならない。

---

## Acceptance

B-03は以下を満たしたため、API契約として解決とする。

- GETのみ・読み取り専用
- 認証方式を定義
- 日付 / 人物指定方法を定義
- v1レスポンス境界を定義
- 欠損と0を区別
- KPI / highlight / work itemの拡張可能形式を定義
- retry可能 / 不可能エラーを区別
- CRM内部DB構造をCOMES Coreから隔離
- 将来認証方式を差し替えてもCoreを変更しない

なお、**API実装そのものと実データmappingの成立確認はB-04以降の作業** とする。
