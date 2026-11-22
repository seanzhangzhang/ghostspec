# GhostSpec — Kiro Spec

## Overview
GhostSpec scans TypeScript/JavaScript codebases, generates living specifications from AST analysis, identifies high-risk logic regressions, and suggests safe refactoring paths before bugs reach production.

## Requirements

### Functional Requirements

1. **AST Parsing**
   - Parse `.ts`, `.tsx`, `.js`, `.jsx` files using the TypeScript compiler API
   - Extract function signatures, parameters, return types, async status, and export status
   - Calculate cyclomatic complexity per function
   - Detect external module calls within each function

2. **Ghost Warning Detection**
   - Detect silent catch blocks (empty error handlers)
   - Flag magic numbers (non-0/1 numeric literals)
   - Identify deep property access chains missing optional chaining
   - Report each warning with file, line number, type, message, and severity

3. **Risk Scoring**
   - Assign a 0–100 risk score to each function based on complexity, async safety, external calls, and warning count
   - Aggregate file-level risk scores from function scores
   - Flag files with risk score ≥ 60 as high-risk

4. **Spec Generation**
   - Generate a structured JSON spec file for each analyzed source file
   - Each spec includes: function signature, inferred behavior, preconditions, postconditions, risk score, risk reasons, and test case suggestions
   - Each spec includes file-level refactor suggestions ranked by priority

5. **Reporting**
   - Print a scan summary to stdout (files scanned, function count, warning count, duration)
   - Generate a markdown report listing high-risk files, function specs, and refactor suggestions
   - Exit with code 1 when critical-severity warnings are present (CI/CD gate)

6. **CLI**
   - `ghostspec scan <dir>` — scan a directory
   - `--report` — write markdown report
   - `--specs` — write per-file spec JSON files
   - `--json` — print raw scan JSON
   - `--output <dir>` — configure output directory (default: `.ghostspec`)

### Non-Functional Requirements

- Scan a 500-file codebase in under 10 seconds on modern hardware
- Generated specs must be human-readable and ≤ 200 lines per file
- No runtime dependencies beyond the TypeScript compiler and Node.js built-ins (except CLI helpers)

## Design

```
src/
  analyzer/
    ast-parser.ts         ← Parse a single file into FileAnalysis
    codebase-scanner.ts   ← Walk a directory tree, aggregate FileAnalysis[]
  spec/
    spec-generator.ts     ← Convert FileAnalysis → SpecFile JSON
  reporter/
    report-generator.ts   ← Console summary + markdown report
  cli/
    index.ts              ← Commander CLI entry point
  index.ts                ← Public library API
```

## Acceptance Criteria

- [ ] `ghostspec scan examples/` prints a summary with at least one high-risk file for `haunted-legacy.ts`
- [ ] `ghostspec scan examples/ --specs` writes `haunted-legacy.spec.json` with correct function entries
- [ ] `ghostspec scan examples/ --report` writes `ghostspec-report.md` with a risk table
- [ ] All Jest tests pass with 0 failures
- [ ] CI exits with code 1 when critical warnings are present
