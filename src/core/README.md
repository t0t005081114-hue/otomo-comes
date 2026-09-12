# src/core

COMES Coreのdomain logic（純粋TypeScript）。B-01 / DEVELOPMENT_STANDARDS §1。

- Next.js / `supabase-js` / Google SDK / CRM client / LLM SDK を直接importしない。
- 外部が必要な場合はここでPort interfaceを定義し、`src/adapters` が実装する。

Phase 0時点では業務ロジック未実装（CLAUDE.md Phase 0 scope）。
