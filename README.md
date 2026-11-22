# 👻 GhostSpec

[![Demo](https://img.youtube.com/vi/qOvW1PYCDdQ/hqdefault.jpg)](https://youtu.be/qOvW1PYCDdQ)

> An AI-powered spec-driven debugging assistant built with [Kiro](https://kiro.dev) that hunts down and exorcises haunted legacy code before it breaks production.

[![GitHub](https://img.shields.io/github/license/seanzhangzhang/ghostspec)](LICENSE)
[![CI](https://github.com/seanzhangzhang/ghostspec/actions/workflows/ci.yml/badge.svg)](https://github.com/seanzhangzhang/ghostspec/actions/workflows/ci.yml)

---

## The Problem

Legacy codebases feel haunted. Silent catches that swallow errors whole. Magic numbers nobody remembers. Deep property chains that explode at 2am.

GhostSpec shines a light on all of it — before deployment.

---

## What It Does

GhostSpec scans TypeScript and JavaScript codebases using the TypeScript compiler's AST API to:

- **Generate living specs** — structured JSON files documenting each function's signature, inferred behavior, preconditions, postconditions, and test suggestions
- **Detect ghost warnings** — silent catches, magic numbers, missing null checks, and deep property access chains
- **Score risk** — each function and file gets a 0–100 risk score based on complexity, async safety, and warning density
- **Suggest safe refactors** — ranked, actionable recommendations to reduce risk before the next deploy
- **Gate CI/CD** — exits with code 1 when critical issues are present (blocks broken PRs)

---

## Quickstart

```bash
# Install dependencies
npm install

# Build
npm run build

# Scan a directory
node dist/cli/index.js scan ./src

# Scan with a markdown report
node dist/cli/index.js scan ./src --report

# Scan and show raw JSON
node dist/cli/index.js scan ./src --json
```

**Example output:**
```
👻 GhostSpec — scanning /your/project/src ...

╔════════════════════════════════════════════════════╗
║           👻  GhostSpec Scan Complete  👻           ║
╚════════════════════════════════════════════════════╝

  📁 Root:          /your/project/src
  📄 Files scanned: 12
  🔧 Functions:     47
  ⚠️  Warnings:      23
  ⏱  Duration:      312ms

  🔥 High-Risk Files:
    🟠 HIGH  payments/processor.ts  (score: 74/100)
       👻 [L42] Silent catch in 'chargeCard' swallows errors
       ⚠️  [L18] Deep property access lacks optional chaining
```

---

## CLI Reference

```
ghostspec scan <directory> [options]

Options:
  --report             Write ghostspec-report.md
  --specs              Write per-file spec JSON files
  --json               Print full scan result as JSON
  -h, --help           Show help
```

---

## Demo

Watch the 2-minute CLI demo on YouTube:

[![Watch the demo](https://img.youtube.com/vi/qOvW1PYCDdQ/hqdefault.jpg)](https://youtu.be/qOvW1PYCDdQ)

---

## Ghost Warnings

| Type | Severity | Description |
|------|----------|-------------|
| `silent-catch` | 🟠 High | Empty catch block — errors vanish |
| `missing-null-check` | 🟡 Medium | Deep `.a.b.c` access without `?.` |
| `magic-number` | 🟢 Low | Numeric literal with no named constant |

---

## Risk Scoring

| Factor | Points |
|--------|--------|
| Cyclomatic complexity | up to 30 pts |
| Async without error handling | +20 pts |
| Critical warning | +20 pts |
| High warning | +10 pts |
| Medium warning | +5 pts |
| Low warning | +2 pts |

| Score | Label |
|-------|-------|
| 80–100 | 🔴 CRITICAL |
| 60–79 | 🟠 HIGH |
| 40–59 | 🟡 MEDIUM |
| 0–39 | 🟢 LOW |

---

## Project Structure

```
ghostspec/
├── src/
│   ├── analyzer/      # AST parsing and codebase scanning
│   ├── spec/          # Spec generation from analysis
│   ├── reporter/      # Console and markdown reporting
│   └── cli/           # CLI entry point
├── examples/
│   └── haunted-legacy.ts   # Demo file with ghost patterns
├── tests/
└── .kiro/
    ├── specs/ghostspec.md    # Kiro living spec
    └── steering/ghostspec.md # Kiro steering rules
```

---

## License

MIT
