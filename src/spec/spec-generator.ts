/**
 * GhostSpec Spec Generator
 * Converts AST analysis results into structured Kiro-compatible spec files.
 * Each spec documents function behavior, risk signals, and suggested refactors.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileAnalysis, FunctionSignature, GhostWarning } from '../analyzer/ast-parser';
import { ScanResult } from '../analyzer/codebase-scanner';

export interface SpecFile {
  version: string;
  generatedAt: string;
  sourceFile: string;
  riskScore: number;
  functions: FunctionSpec[];
  ghostWarnings: GhostWarning[];
  refactorSuggestions: RefactorSuggestion[];
}

export interface FunctionSpec {
  name: string;
  signature: string;
  behavior: string;
  preconditions: string[];
  postconditions: string[];
  riskScore: number;
  riskReasons: string[];
  testCaseSuggestions: string[];
}

export interface RefactorSuggestion {
  targetFunction: string;
  issue: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Builds a human-readable function signature string.
 */
function buildSignature(fn: FunctionSignature): string {
  const asyncPrefix = fn.isAsync ? 'async ' : '';
  const params = fn.params.join(', ');
  const exportPrefix = fn.isExported ? 'export ' : '';
  return `${exportPrefix}${asyncPrefix}function ${fn.name}(${params}): ${fn.returnType}`;
}

/**
 * Infers a natural-language behavioral description from function metadata.
 */
function inferBehavior(fn: FunctionSignature): string {
  const parts: string[] = [];

  if (fn.isAsync) parts.push('Performs asynchronous operations');
  else parts.push('Performs synchronous operations');

  if (fn.callsExternal.length > 0) {
    parts.push(`interacts with external modules: ${fn.callsExternal.join(', ')}`);
  }

  if (fn.hasErrorHandling) parts.push('includes error handling');
  else if (fn.isAsync) parts.push('does NOT handle async errors — potential unhandled rejection');

  parts.push(`cyclomatic complexity: ${fn.complexity}`);
  return parts.join('; ') + '.';
}

/**
 * Generates preconditions based on parameter names and function characteristics.
 */
function generatePreconditions(fn: FunctionSignature): string[] {
  const preconditions: string[] = [];
  for (const param of fn.params) {
    preconditions.push(`Parameter '${param}' must be defined and valid`);
  }
  if (fn.isAsync) {
    preconditions.push('Required async dependencies must be reachable');
  }
  return preconditions.length > 0 ? preconditions : ['No explicit preconditions identified'];
}

/**
 * Generates postconditions based on return type and async behavior.
 */
function generatePostconditions(fn: FunctionSignature): string[] {
  const postconditions: string[] = [];
  if (fn.returnType !== 'void' && fn.returnType !== 'inferred') {
    postconditions.push(`Returns a value of type ${fn.returnType}`);
  }
  if (fn.isAsync) {
    postconditions.push('Resolves or rejects the returned Promise');
  }
  if (fn.hasErrorHandling) {
    postconditions.push('Errors are caught and handled internally');
  }
  return postconditions.length > 0 ? postconditions : ['Postconditions not statically determinable'];
}

/**
 * Builds risk reason strings from function metadata.
 */
function buildRiskReasons(fn: FunctionSignature): string[] {
  const reasons: string[] = [];
  if (fn.complexity > 10) reasons.push(`High cyclomatic complexity (${fn.complexity})`);
  if (fn.isAsync && !fn.hasErrorHandling) reasons.push('Async function without error handling');
  if (fn.callsExternal.length > 3) reasons.push(`Calls ${fn.callsExternal.length} external dependencies`);
  if (fn.endLine - fn.startLine > 50) reasons.push(`Long function body (${fn.endLine - fn.startLine} lines)`);
  return reasons;
}

/**
 * Generates test case suggestion strings for a function.
 */
function generateTestCases(fn: FunctionSignature): string[] {
  const cases: string[] = [
    `should return expected output for valid inputs`,
    `should handle undefined/null parameters gracefully`,
  ];
  if (fn.isAsync) {
    cases.push('should resolve successfully on happy path');
    cases.push('should reject or throw on upstream failure');
  }
  if (fn.complexity > 5) {
    cases.push('should cover each major branch (complexity > 5)');
  }
  return cases;
}

/**
 * Builds refactor suggestions from ghost warnings and function metadata.
 */
function buildRefactorSuggestions(analysis: FileAnalysis): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];

  for (const warning of analysis.ghostWarnings) {
    if (warning.type === 'silent-catch') {
      suggestions.push({
        targetFunction: 'unknown',
        issue: warning.message,
        suggestion: 'Add error logging (e.g. console.error or a logger) inside the catch block, or rethrow the error after recording it.',
        priority: 'high',
      });
    }
    if (warning.type === 'magic-number') {
      suggestions.push({
        targetFunction: 'unknown',
        issue: warning.message,
        suggestion: 'Extract the magic number into a named constant at module scope to document its intent.',
        priority: 'low',
      });
    }
    if (warning.type === 'missing-null-check') {
      suggestions.push({
        targetFunction: 'unknown',
        issue: warning.message,
        suggestion: 'Replace deep property access with optional chaining (?.) to prevent runtime TypeErrors.',
        priority: 'medium',
      });
    }
  }

  for (const fn of analysis.functions) {
    if (fn.complexity > 15) {
      suggestions.push({
        targetFunction: fn.name,
        issue: `Function '${fn.name}' has complexity ${fn.complexity}, which makes it fragile and hard to test`,
        suggestion: 'Break this function into smaller, single-responsibility helpers. Each helper should have complexity ≤ 5.',
        priority: 'high',
      });
    }
  }

  return suggestions;
}

/**
 * Converts a single FileAnalysis into a structured SpecFile object.
 */
export function generateSpec(analysis: FileAnalysis): SpecFile {
  const functionSpecs: FunctionSpec[] = analysis.functions.map(fn => ({
    name: fn.name,
    signature: buildSignature(fn),
    behavior: inferBehavior(fn),
    preconditions: generatePreconditions(fn),
    postconditions: generatePostconditions(fn),
    riskScore: fn.riskScore,
    riskReasons: buildRiskReasons(fn),
    testCaseSuggestions: generateTestCases(fn),
  }));

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sourceFile: analysis.filePath,
    riskScore: analysis.riskScore,
    functions: functionSpecs,
    ghostWarnings: analysis.ghostWarnings,
    refactorSuggestions: buildRefactorSuggestions(analysis),
  };
}

/**
 * Writes spec files for all analyzed files in a scan result to an output directory.
 */
export function writeSpecs(scanResult: ScanResult, outputDir: string): string[] {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const writtenPaths: string[] = [];

  for (const fileAnalysis of scanResult.files) {
    const spec = generateSpec(fileAnalysis);
    const relativePath = path.relative(scanResult.rootDir, fileAnalysis.filePath);
    const specFileName = relativePath.replace(/[/\\]/g, '_').replace(/\.(ts|tsx|js|jsx)$/, '.spec.json');
    const specPath = path.join(outputDir, specFileName);

    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');
    writtenPaths.push(specPath);
  }

  return writtenPaths;
}
