/**
 * GhostSpec Codebase Scanner
 * Walks a directory tree, filters TypeScript/JavaScript files,
 * and runs the AST parser over each one.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseFile, FileAnalysis } from './ast-parser';

export interface ScanResult {
  rootDir: string;
  files: FileAnalysis[];
  totalFunctions: number;
  totalWarnings: number;
  highRiskFiles: FileAnalysis[];
  scanDurationMs: number;
}

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.kiro']);
const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Recursively collects source file paths under a directory,
 * skipping ignored directories and unsupported extensions.
 */
function collectFiles(dir: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        results.push(...collectFiles(path.join(dir, entry.name)));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  return results;
}

/**
 * Scans an entire codebase directory and returns aggregated analysis results.
 */
export function scanCodebase(rootDir: string): ScanResult {
  const startTime = Date.now();
  const filePaths = collectFiles(rootDir);
  const files: FileAnalysis[] = [];

  for (const filePath of filePaths) {
    try {
      files.push(parseFile(filePath));
    } catch (err) {
      // Non-fatal: skip files that fail to parse
      console.warn(`⚠  Skipped ${filePath}: ${(err as Error).message}`);
    }
  }

  const totalFunctions = files.reduce((sum, f) => sum + f.functions.length, 0);
  const totalWarnings = files.reduce((sum, f) => sum + f.ghostWarnings.length, 0);
  const highRiskFiles = files.filter(f => f.riskScore >= 60).sort((a, b) => b.riskScore - a.riskScore);

  return {
    rootDir,
    files,
    totalFunctions,
    totalWarnings,
    highRiskFiles,
    scanDurationMs: Date.now() - startTime,
  };
}
