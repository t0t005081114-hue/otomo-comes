# supabase/

Supabase開発ディレクトリ（`supabase init` で生成）。Phase 0時点では接続準備のみ。

- `config.toml`: ローカル開発設定。`project_id = "otomo-comes"`。
- `migrations/`: 本番のmigration正本置き場（DEVELOPMENT_STANDARDS §3）。Phase 0では空。
  業務スキーマ本実装（B-02 / B-32 / B-41）は後続Phaseで行う。
- generated types: `supabase gen types typescript --local > src/shared/database.types.ts` を
  想定（B-01）。本番project未作成のためPhase 0では未実行。

禁止（Phase 0 scope）:
- 本番Supabase project作成
- 本番DBへの接続 / 変更
- Service Role secretの保存
- 業務テーブルmigrationの追加
