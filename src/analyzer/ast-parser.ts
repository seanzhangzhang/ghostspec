/**
 * GhostSpec AST Parser
 * Parses TypeScript/JavaScript files into abstract syntax trees
 * and extracts behavioral metadata for spec generation.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export interface FunctionSignature {
  name: string;
  params: string[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  startLine: number;
  endLine: number;
  complexity: number;
  hasErrorHandling: boolean;
  callsExternal: string[];
  riskScore: number;
}

export interface FileAnalysis {
  filePath: string;
  functions: FunctionSignature[];
  imports: string[];
  exports: string[];
  totalLines: number;
  riskScore: number;
  ghostWarnings: GhostWarning[];
}

export interface GhostWarning {
  type: 'undocumented-side-effect' | 'silent-catch' | 'magic-number' | 'dead-code' | 'fragile-condition' | 'missing-null-check';
  message: string;
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Calculates cyclomatic complexity for a function node.
 */
function calculateComplexity(node: ts.FunctionLikeDeclaration): number {
  let complexity = 1;

  function visit(child: ts.Node): void {
    switch (child.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.ConditionalExpression:
        complexity++;
        break;
      case ts.SyntaxKind.AmpersandAmpersandToken:
      case ts.SyntaxKind.BarBarToken:
      case ts.SyntaxKind.QuestionQuestionToken:
        complexity++;
        break;
    }
    ts.forEachChild(child, visit);
  }

  ts.forEachChild(node, visit);
  return complexity;
}

/**
 * Checks whether a function body contains any try/catch error handling.
 */
function hasErrorHandling(node: ts.FunctionLikeDeclaration): boolean {
  let found = false;
  function visit(child: ts.Node): void {
    if (child.kind === ts.SyntaxKind.TryStatement) found = true;
    if (!found) ts.forEachChild(child, visit);
  }
  ts.forEachChild(node, visit);
  return found;
}

/**
 * Collects names of external modules called within a function.
 */
function collectExternalCalls(node: ts.FunctionLikeDeclaration, sourceFile: ts.SourceFile): string[] {
  const calls: Set<string> = new Set();
  function visit(child: ts.Node): void {
    if (ts.isCallExpression(child)) {
      const expr = child.expression.getText(sourceFile);
      if (expr.includes('.')) {
        calls.add(expr.split('.')[0]);
      }
    }
    ts.forEachChild(child, visit);
  }
  ts.forEachChild(node, visit);
  return Array.from(calls);
}

/**
 * Scans a function's body for GhostWarning signals.
 */
function detectGhostWarnings(
  node: ts.FunctionLikeDeclaration,
  sourceFile: ts.SourceFile,
  funcName: string
): GhostWarning[] {
  const warnings: GhostWarning[] = [];

  function visit(child: ts.Node): void {
    const { line } = sourceFile.getLineAndCharacterOfPosition(child.getStart(sourceFile));
    const lineNum = line + 1;

    // Silent catch: catch block with empty body or only a comment
    if (ts.isCatchClause(child)) {
      const block = child.block;
      if (block.statements.length === 0) {
        warnings.push({
          type: 'silent-catch',
          message: `Silent catch in '${funcName}' swallows errors without logging or rethrowing`,
          line: lineNum,
          severity: 'high',
        });
      }
    }

    // Magic numbers: numeric literals that aren't 0 or 1
    if (ts.isNumericLiteral(child)) {
      const val = parseFloat(child.text);
      if (!isNaN(val) && val !== 0 && val !== 1 && val !== -1) {
        warnings.push({
          type: 'magic-number',
          message: `Magic number ${child.text} in '${funcName}' — consider a named constant`,
          line: lineNum,
          severity: 'low',
        });
      }
    }

    // Missing null check on property access chains
    if (ts.isPropertyAccessExpression(child)) {
      const text = child.getText(sourceFile);
      if (!text.includes('?.') && text.split('.').length > 2) {
        warnings.push({
          type: 'missing-null-check',
          message: `Deep property access '${text}' in '${funcName}' lacks optional chaining`,
          line: lineNum,
          severity: 'medium',
        });
      }
    }

    ts.forEachChild(child, visit);
  }

  ts.forEachChild(node, visit);
  return warnings;
}

/**
 * Computes a 0–100 risk score for a function based on complexity,
 * external calls, missing error handling, and ghost warnings.
 */
function computeRiskScore(fn: Omit<FunctionSignature, 'riskScore'>, warnings: GhostWarning[]): number {
  let score = 0;
  score += Math.min(fn.complexity * 5, 30);
  score += fn.callsExternal.length * 5;
  if (!fn.hasErrorHandling && fn.isAsync) score += 20;
  for (const w of warnings) {
    if (w.severity === 'critical') score += 20;
    else if (w.severity === 'high') score += 10;
    else if (w.severity === 'medium') score += 5;
    else score += 2;
  }
  return Math.min(score, 100);
}

/**
 * Parses a single TypeScript/JavaScript source file and returns its full analysis.
 */
export function parseFile(filePath: string): FileAnalysis {
  const source = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    path.basename(filePath),
    source,
    ts.ScriptTarget.Latest,
    true
  );

  const functions: FunctionSignature[] = [];
  const imports: string[] = [];
  const exports: string[] = [];
  const fileWarnings: GhostWarning[] = [];

  function visitNode(node: ts.Node): void {
    // Collect imports
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      imports.push(moduleSpecifier);
    }

    // Collect named exports
    if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
      exports.push(node.getText(sourceFile).split('\n')[0].trim());
    }

    // Analyze function declarations and arrow functions
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node)
    ) {
      const funcNode = node as ts.FunctionLikeDeclaration;
      const name =
        (funcNode as ts.FunctionDeclaration).name?.getText(sourceFile) ??
        (ts.isVariableDeclaration(funcNode.parent)
          ? (funcNode.parent as ts.VariableDeclaration).name.getText(sourceFile)
          : '<anonymous>');

      const params = funcNode.parameters.map(p => p.name.getText(sourceFile));
      const returnType = funcNode.type ? funcNode.type.getText(sourceFile) : 'inferred';
      const isAsync = !!(funcNode.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword));
      const isExported = !!(funcNode.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
      const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(funcNode.getStart(sourceFile));
      const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(funcNode.getEnd());
      const complexity = calculateComplexity(funcNode);
      const errorHandling = hasErrorHandling(funcNode);
      const callsExternal = collectExternalCalls(funcNode, sourceFile);
      const warnings = detectGhostWarnings(funcNode, sourceFile, name);

      fileWarnings.push(...warnings);

      const baseFunc = { name, params, returnType, isAsync, isExported, startLine: startLine + 1, endLine: endLine + 1, complexity, hasErrorHandling: errorHandling, callsExternal };
      const riskScore = computeRiskScore(baseFunc, warnings);

      functions.push({ ...baseFunc, riskScore });
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);

  const fileRiskScore = functions.length > 0
    ? Math.round(functions.reduce((sum, f) => sum + f.riskScore, 0) / functions.length)
    : 0;

  return {
    filePath,
    functions,
    imports,
    exports,
    totalLines: source.split('\n').length,
    riskScore: fileRiskScore,
    ghostWarnings: fileWarnings,
  };
}
