# GhostSpec — Kiro Steering

## Project Purpose
GhostSpec is a spec-driven debugging assistant. It uses static AST analysis to surface high-risk code before it hits production. All AI-assisted code generation in this project must stay aligned with the spec in `.kiro/specs/ghostspec.md`.

## Code Conventions
- Language: TypeScript, strict mode, no `any` except at explicit legacy boundaries
- Target: Node.js 18+, CommonJS output
- Formatting: 2-space indent, single quotes, semicolons
- File names: kebab-case
- Exports: named exports only (no default exports)

## Architecture Constraints
- The `analyzer` layer must have zero knowledge of output format — it returns plain objects only
- The `spec` layer depends on `analyzer` but not on `reporter`
- The `reporter` layer depends on both — it is the only layer allowed to write files or print to stdout
- The `cli` layer is the only entry point; it orchestrates the other three layers

## Risk Scoring Rules
- Complexity contribution is capped at 30 points to prevent complexity alone from dominating
- Async functions without error handling add 20 points (most common production ghost)
- Each critical warning adds 20 points; high adds 10; medium adds 5; low adds 2
- Maximum score is capped at 100

## What GhostSpec Does NOT Do
- It does not modify source files automatically
- It does not run code or execute test suites
- It does not make network requests during analysis
- It does not store any user code or data externally
