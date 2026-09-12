#!/usr/bin/env node
/**
 * OTOMO COMES development harness guard.
 *
 * Usage (from .claude/settings.json):
 *   node .claude/hooks/harness-guard.mjs pre    -> PreToolUse  (exit 2 = block, stderr shown to model)
 *   node .claude/hooks/harness-guard.mjs post   -> PostToolUse (exit 2 = warning shown to model)
 *
 * Contract: Claude Code passes the hook payload as JSON on stdin.
 *   PreToolUse  : { tool_name, tool_input, ... }
 *   PostToolUse : { tool_name, tool_input, tool_response, ... }
 *
 * Exit codes
 *   0 : pass
 *   2 : pre  -> block the tool call; post -> surface warning to the model
 *   1 : internal guard problem (shown to the user only, tool continues)
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";

const MODE = process.argv[2] === "post" ? "post" : "pre";
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/* ------------------------------------------------------------------ input */

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let payload = {};
try {
  const raw = readStdin().trim();
  payload = raw ? JSON.parse(raw) : {};
} catch {
  // Never block on an unparsable payload — that would wedge the session.
  process.exit(0);
}

const toolName = payload.tool_name ?? "";
const toolInput = payload.tool_input ?? payload.inputs ?? {};

/* ------------------------------------------------------------- helpers */

const block = (title, lines) => {
  process.stderr.write(
    `HARNESS BLOCK: ${title}\n` +
      lines.map((l) => `  - ${l}`).join("\n") +
      `\n\n禁止理由は CLAUDE.md §3 / .claude/rules/ を参照。` +
      `\n迂回せず、人間へ確認すること（CLAUDE.md §7）。\n`,
  );
  process.exit(2);
};

const warn = (title, lines) => {
  process.stderr.write(
    `HARNESS WARNING: ${title}\n` + lines.map((l) => `  - ${l}`).join("\n") + `\n`,
  );
  process.exit(2);
};

/** True when the edited path lies inside the repository. */
let pathInRepo = true;

/** Normalize a possibly-absolute path to a repo-relative posix path. */
function relPath(p) {
  if (!p || typeof p !== "string") return "";
  let abs = p;
  try {
    abs = resolve(p);
  } catch {
    /* keep as-is */
  }
  const root = resolve(PROJECT_DIR);
  const normAbs = abs.split(sep).join("/").toLowerCase();
  const normRoot = root.split(sep).join("/").toLowerCase();
  pathInRepo = normAbs.startsWith(normRoot);
  const r = pathInRepo ? abs.slice(root.length) : p;
  return r.split(sep).join("/").replace(/^\/+/, "");
}

function editedPath() {
  return relPath(toolInput.file_path ?? toolInput.notebook_path ?? "");
}

/** Text this tool call would introduce into a file. */
function introducedText() {
  const parts = [];
  if (typeof toolInput.content === "string") parts.push(toolInput.content);
  if (typeof toolInput.new_string === "string") parts.push(toolInput.new_string);
  if (typeof toolInput.new_source === "string") parts.push(toolInput.new_source);
  if (Array.isArray(toolInput.edits)) {
    for (const e of toolInput.edits) {
      if (e && typeof e.new_string === "string") parts.push(e.new_string);
    }
  }
  return parts.join("\n");
}

// Warning de-duplication. Flags live under .git/ so they are never committed,
// and are scoped to the session (falling back to the day) so a warning is not
// silenced forever after the first time it fires.
const flagDir = join(PROJECT_DIR, ".git");
const flagScope = String(
  payload.session_id ?? new Date().toISOString().slice(0, 10),
).replace(/[^A-Za-z0-9_-]/g, "");

function onceFlag(name) {
  const f = join(flagDir, `.otomo-harness-${name}-${flagScope}`);
  if (existsSync(f)) return false;
  try {
    if (!existsSync(flagDir)) mkdirSync(flagDir, { recursive: true });
    writeFileSync(f, new Date().toISOString());
  } catch {
    /* best effort — a failed flag write only means the warning may repeat */
  }
  return true;
}

function git(args) {
  try {
    return execFileSync("git", ["-C", PROJECT_DIR, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

/* ------------------------------------------------------- protected docs */

// Accepted source-of-truth documents. Existing ones must not be rewritten.
const PROTECTED_EXACT = new Set([
  "docs/otomo-comes-spec-v0.2.md",
  "docs/otomo-comes-spec-v0.1.md",
  "docs/acceptance-tests-v0.2.md",
  "docs/acceptance-tests-v0.1.md",
  "docs/acceptance-tests-final-audit-addendum-v0.1.md",
  "docs/final-audit-report-v0.1.md",
  "docs/open-issues-v0.2.md",
  "docs/open-issues-v0.1.md",
]);

function isProtectedDoc(p) {
  return PROTECTED_EXACT.has(p) || /^docs\/decisions\/.+\.md$/.test(p);
}

/* ------------------------------------------------------------- patterns */

// Secret-looking literals. Deliberately narrow: assignment of a real-looking value.
const SECRET_PATTERNS = [
  [/-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/, "private key block"],
  [/\bsk-[A-Za-z0-9_-]{16,}/, "OpenAI-style API key"],
  [/\bsk-ant-[A-Za-z0-9_-]{16,}/, "Anthropic API key"],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, "GitHub token"],
  [/\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, "JWT (Supabase anon/service key形式)"],
  [/\bya29\.[A-Za-z0-9_-]{20,}/, "Google OAuth access token"],
  [/\b1\/\/[A-Za-z0-9_-]{30,}/, "Google OAuth refresh token"],
  [
    /\b(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY|SUPABASE_KEY|CRM_SERVICE_TOKEN|GOOGLE_CLIENT_SECRET|GOOGLE_REFRESH_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY)\s*[:=]\s*["']?(?!["']?\s*$)(?!(?:\$|\{\{|process\.env|<|your[-_]|xxx|dummy|changeme|REPLACE|TODO|例))[A-Za-z0-9_\-./+]{12,}/i,
    "secret値の直書き",
  ],
];

// Identifiers that must never reach a log/error sink.
const SENSITIVE_IDENTIFIERS =
  "raw_text|rawText|raw_content|rawContent|transcript|transcriptText|transcript_text|full_text|fullText|observed_fact|observedFact|manager_impression|managerImpression|access_token|accessToken|refresh_token|refreshToken|id_token|idToken|service_role|serviceRole|service_token|serviceToken|authorization|one_on_one_text|oneOnOneText|insight_body|summary_body";

// Backtick, interpolated so it cannot terminate the template literal below.
const BT = String.fromCharCode(96);

// console.*/logger.* call whose arguments mention a sensitive identifier.
// The char class accepts both `fn(` and the tagged-template form.
const LOG_SINK = new RegExp(
  String.raw`\b(?:console\.(?:log|info|warn|error|debug|trace|dir)|logger\.(?:log|info|warn|error|debug|trace)|log\.(?:info|warn|error|debug|trace)|process\.(?:stdout|stderr)\.write|core\.(?:info|warning|error)|echo\s)\s*[(${BT}][^;]{0,400}?\b(?:${SENSITIVE_IDENTIFIERS})\b`,
  "s",
);

// Error messages that interpolate raw content.
const ERROR_SINK = new RegExp(
  String.raw`new\s+(?:\w*Error)\s*\(\s*[^)]{0,300}?\$\{\s*(?:\w+\.)*(?:${SENSITIVE_IDENTIFIERS})\b`,
  "s",
);

const DESTRUCTIVE_BASH = [
  [/\brm\s+(-[A-Za-z]*\s+)*-[A-Za-z]*[rR][A-Za-z]*f|\brm\s+(-[A-Za-z]*\s+)*-[A-Za-z]*f[A-Za-z]*[rR]/, "rm -rf"],
  [/\bgit\s+push\s+[^\n]*(--force\b(?!-with-lease)|(?<!\w)-f\b)/, "git push --force"],
  [/\bgit\s+reset\s+--hard\b/, "git reset --hard（未commit変更を破棄する）"],
  [/\bgit\s+clean\s+-[A-Za-z]*[dfx]/, "git clean -fd（未追跡ファイルを破棄する）"],
  [/\bgit\s+checkout\s+(--\s+\.|\.\s*$)/, "git checkout -- .（作業ツリーを破棄する）"],
  [/\bgit\s+checkout\s+--force\b/, "git checkout --force"],
  [/\bgit\s+(commit|merge|rebase|cherry-pick)\s+[^\n]*--no-verify\b/, "--no-verify（hookのbypass）"],
  [/\bgit\s+branch\s+-D\b/, "git branch -D（未マージブランチの強制削除）"],
  [/\bgit\s+(filter-branch|filter-repo)\b/, "履歴改変"],
  [/\bgit\s+push\s+[^\n]*--delete\b|\bgit\s+push\s+\S+\s+:\S/, "remote branchの削除"],
  [/\bgit\s+stash\s+(drop|clear)\b/, "git stash drop/clear"],
  [/\bdrop\s+(table|schema|database)\b/i, "DROP TABLE / SCHEMA / DATABASE"],
  [/\btruncate\s+(table\s+)?\w/i, "TRUNCATE"],
  [/\bdelete\s+from\b(?![^\n;]*\bwhere\b)/i, "WHERE無しのDELETE"],
  [/\bupdate\s+\w+\s+set\b(?![^\n;]*\bwhere\b)/i, "WHERE無しのUPDATE"],
  [/\bsupabase\s+db\s+reset\b/, "supabase db reset（ローカルDBを破棄する）"],
  [/\bsupabase\s+(projects\s+delete|db\s+remote\s+commit)\b/, "Supabase projectへの破壊的操作"],
];

/* ---------------------------------------------------------------- checks */

/**
 * Split a shell command into the individual commands the shell would run.
 * Checking each segment rather than the whole string avoids matching a
 * dangerous-looking pattern that only appears inside a message (e.g.
 * `echo "never run rm -rf"`), which is how the shell reads it too.
 */
function commandSegments(cmd) {
  return cmd
    .split(/\n|&&|\|\||[;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Commands that only emit text — their arguments are not operations. */
const TEXT_ONLY = /^(echo|printf|:|true|false|grep|rg|sed|awk|head|tail|wc|cat|sort|uniq|cut|tr)\b/;

function checkBash(cmd) {
  if (!cmd) return;

  for (const seg of commandSegments(cmd)) {
    if (TEXT_ONLY.test(seg)) continue;

    for (const [re, label] of DESTRUCTIVE_BASH) {
      if (re.test(seg)) {
        block(`破壊的コマンドを実行しようとしている（${label}）`, [
          `command: ${seg.slice(0, 300)}`,
          "未commit変更・履歴・DBを失う操作をHarnessは自動実行しない。",
          "必要なら、何を失うかを人間へ説明して承認を得ること。",
        ]);
      }
    }

    // `git add` of an env file.
    if (/^git\s+add\b/.test(seg) && /(?:^|[\s"'/=])\.env(?!\.example)\b/.test(seg)) {
      block(".env をstageしようとしている", [
        `command: ${seg.slice(0, 200)}`,
        ".env はGit管理外（B-08 / B-19）。コミットしてよいのは値なしの .env.example のみ。",
      ]);
    }
  }

  // Secret literals are checked against the whole command: a key must not reach
  // the shell history or a log even inside an echo.
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(cmd)) {
      block(`secretをコマンドラインへ書こうとしている（${label}）`, [
        "値をリポジトリ・ログ・履歴へ残さない。",
        "環境変数 / Secret Storeを使う（B-01 / B-08 / B-19）。",
      ]);
    }
  }
}

function checkFileWrite(path, text) {
  if (!path) return;

  // 1. Accepted source-of-truth documents
  if (isProtectedDoc(path)) {
    const abs = join(PROJECT_DIR, path);
    const isEdit = toolName === "Edit" || toolName === "NotebookEdit" || toolName === "MultiEdit";
    if (isEdit || existsSync(abs)) {
      block(`Accepted正本ドキュメントの書き換えは禁止: ${path}`, [
        "既存Decision / 仕様 / Acceptanceは実装都合で編集・再解釈しない（CLAUDE.md §3）。",
        "変更が必要なら、現在の記述・過去の意思決定・変更理由を人間へ提示する（.claude/rules/documentation.md）。",
        "新しい決定が必要な場合は docs/decisions/B-<次番号>-<slug>.md の新規作成を提案する。",
      ]);
    }
  }

  // 2. .env / secret files
  if (/(^|\/)\.env(\.|$)/.test(path) && !/\.env\.example$/.test(path)) {
    block(`.env ファイルをリポジトリ内へ作成・編集しようとしている: ${path}`, [
      ".env はGit管理外。値なしの .env.example のみコミット可（B-08 / B-19）。",
    ]);
  }

  if (!text) return;

  // 3. Secret literals
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(text)) {
      block(`secretらしい値をファイルへ書こうとしている（${label}）: ${path}`, [
        "API key / token / private key をリポジトリへ置かない（B-01 / B-08 / B-19）。",
        "環境変数参照（process.env.X）またはSecret Storeを使う。",
        "サンプルを書く場合はプレースホルダ（<your-key>）にする。",
      ]);
    }
  }

  // 4. Sensitive data reaching a log / error sink.
  //    Scoped to source files inside the repo. Exempt:
  //      - docs (.md/.mdx/.txt) — they must be able to quote the bad pattern
  //      - .claude/** — this guard defines the patterns it searches for
  //      - paths outside the repo (scratch files are not COMES source)
  const isDoc = /\.(md|mdx|txt)$/.test(path);
  const isHarness = path.startsWith(".claude/");
  if (!isDoc && !isHarness && pathInRepo) {
    if (LOG_SINK.test(text)) {
      block(`機微データをログへ出力しようとしている: ${path}`, [
        "1on1原文 / observation本文 / token / Authorization をログへ出さない（B-19 / B-14 / B-03）。",
        "出してよいのは識別子と集計値のみ（request_id / source_type / error_code / record_count 等）。",
        "詳細は .claude/rules/security.md。",
      ]);
    }
    if (ERROR_SINK.test(text)) {
      block(`エラーメッセージへ機微データを連結しようとしている: ${path}`, [
        "NG: `Failed to parse transcript: ${rawText}`",
        "OK: `Failed to parse transcript file_id=${fileId} error_code=PARSE_FAILED`（B-19 §7）",
      ]);
    }
  }
}

/* ------------------------------------------------------------- warnings */

function postWarnings(path, text) {
  if (!path) return;

  // migration changed
  if (/^supabase\/migrations\/.+\.sql$/.test(path) || /^supabase\/.*\.sql$/.test(path)) {
    if (onceFlag("migration-warned")) {
      warn(`migrationを変更した: ${path}`, [
        "1 migration = 1論理変更。原子的に適用できる形か確認する。",
        "適用済みmigrationを書き換えていないか確認する（訂正は新規migrationで）。",
        "destructive change（DROP / 型変更 / NOT NULL追加 / UNIQUE追加 / データ移行）ならファイル先頭に明示し、人間承認を得る。",
        "正本順序: B-41 v1.5 > B-46〜B-33 > B-32 v1.3 > B-02（.claude/rules/database.md）。",
        "結果を docs/phases/ と、失敗時は docs/DECISIONS_AND_FAILURES.md へ記録する。",
      ]);
    }
    return;
  }

  // large single write
  const lines = text ? text.split("\n").length : 0;
  if (lines >= 400 && onceFlag("large-write-warned")) {
    warn(`1ファイルへの大きな書き込み（${lines}行）: ${path}`, [
      "Phaseが大きすぎる可能性がある。責務ごとに分割できないか確認する。",
      "PHASE_WORKFLOW §7: DB migrationとUI、Adapter実装とCore実装を同一Phaseへ混ぜない。",
    ]);
  }

  // implementation touched without phase record / acceptance mapping
  if (/^src\//.test(path)) {
    const status = git(["status", "--porcelain"]);
    if (status) {
      const changed = status
        .split("\n")
        .map((l) => l.slice(3).trim())
        .filter(Boolean);
      const hasPhaseRecord = changed.some(
        (f) => /^docs\/phases\/phase-/.test(f) || /^docs\/phases\/.*\.md$/.test(f),
      );
      const hasTests = changed.some((f) => /^tests\//.test(f) || /\.(test|spec)\.tsx?$/.test(f));
      const missing = [];
      if (!hasPhaseRecord) missing.push("docs/phases/phase-NN-*.md（scope / acceptance / validation result）が未更新");
      if (!hasTests) missing.push("対応するtest（Acceptance IDを紐づけたもの）が未追加");
      if (missing.length && onceFlag("acceptance-warned")) {
        warn("実装を変更したがPhase記録 / Acceptance対応が追いついていない", [
          ...missing,
          "Acceptance ID（AT-xx / FA-xx）とtestの対応はPhase完了条件（PHASE_WORKFLOW §3）。",
        ]);
      }
    }
  }
}

/* ------------------------------------------------------------------ main */

try {
  if (MODE === "pre") {
    if (toolName === "Bash" || toolName === "PowerShell") {
      checkBash(String(toolInput.command ?? ""));
    } else if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(toolName)) {
      checkFileWrite(editedPath(), introducedText());
    }
  } else {
    if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(toolName)) {
      postWarnings(editedPath(), introducedText());
    }
  }
} catch (err) {
  process.stderr.write(`harness-guard internal error: ${err?.message ?? err}\n`);
  process.exit(1);
}

process.exit(0);
