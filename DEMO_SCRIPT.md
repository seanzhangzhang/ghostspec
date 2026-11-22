# GhostSpec Demo Script

## Opening (0:00–0:15)
> "Hi everyone! Today I'm showing you GhostSpec — an AI-powered spec-driven debugging assistant that hunts down haunted legacy code before it breaks production."

## Section 1: The Problem (0:15–0:45)
> "We've all seen this — legacy codebases full of silent catches, magic numbers, and deep property chains that explode at 2AM."

```bash
# Show the haunted example file
cat examples/haunted-legacy.ts
```

> "This file has intentional ghosts: silent catches, magic numbers, missing null checks, and async without error handling."

## Section 2: Run GhostSpec (0:45–1:30)
```bash
# Run the scan with report and specs
node dist/cli/index.js scan examples/ --report --specs
```

> "GhostSpec scanned it in milliseconds. Let's see what it found..."

> "Notice it detected:
> - A silent catch in fetchUserData
> - 19 total ghost warnings
> - processPayment flagged as high-risk with cyclomatic complexity 10"

## Section 3: The Report (1:30–2:15)
```bash
# Show the markdown report
cat .ghostspec/ghostspec-report.md | head -80
```

> "The report shows:
> - Function signatures
> - Inferred behavior and risk scores
> - Preconditions and postconditions
> - Suggested test cases
> - Prioritized refactor suggestions"

## Section 4: Dogfooding (2:15–2:45)
```bash
# Run GhostSpec on its own codebase
node dist/cli/index.js scan src/ --report
```

> "GhostSpec scans its own codebase to ensure it's healthy. This is how we catch issues before they hit production."

## Section 5: CI/CD Integration (2:45–3:15)
> "GhostSpec exits with code 1 when critical warnings exist — blocking broken PRs from merging."

```bash
# Show the CI workflow
cat .github/workflows/ci.yml
```

> "Add it to your pipeline and never deploy haunted code again."

## Closing (3:15–3:30)
> "GhostSpec turns debugging into spec-driven development. Try it at github.com/seanzhangzhang/ghostspec"

