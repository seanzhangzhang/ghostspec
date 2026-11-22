/**
 * GhostSpec Report Generator
 * Formats scan and spec results into console output and markdown reports.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScanResult } from '../analyzer/codebase-scanner';
import { SpecFile } from '../spec/spec-generator';

const SEVERITY_EMOJI: Record<string, string> = {
  critical: '💀',
  high: '👻',
  medium: '⚠️ ',
  low: '💡',
};

const RISK_LABEL = (score: number): string => {
  if (score >= 80) return '🔴 CRITICAL';
  if (score >= 60) return '🟠 HIGH';
  if (score >= 40) return '🟡 MEDIUM';
  return '🟢 LOW';
};

/**
 * Prints a summary of the scan to stdout.
 */
export function printScanSummary(result: ScanResult): void {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║           👻  GhostSpec Scan Complete  👻           ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log(`  📁 Root:          ${result.rootDir}`);
  console.log(`  📄 Files scanned: ${result.files.length}`);
  console.log(`  🔧 Functions:     ${result.totalFunctions}`);
  console.log(`  ⚠️  Warnings:      ${result.totalWarnings}`);
  console.log(`  ⏱  Duration:      ${result.scanDurationMs}ms\n`);

  if (result.highRiskFiles.length === 0) {
    console.log('  ✅ No high-risk files detected. Your codebase looks clean!\n');
    return;
  }

  console.log('  🔥 High-Risk Files:\n');
  for (const file of result.highRiskFiles.slice(0, 10)) {
    const relPath = path.relative(result.rootDir, file.filePath);
    console.log(`    ${RISK_LABEL(file.riskScore)}  ${relPath}  (score: ${file.riskScore}/100)`);
    for (const warning of file.ghostWarnings.slice(0, 3)) {
      const emoji = SEVERITY_EMOJI[warning.severity] ?? '•';
      console.log(`       ${emoji} [L${warning.line}] ${warning.message}`);
    }
    if (file.ghostWarnings.length > 3) {
      console.log(`       ... and ${file.ghostWarnings.length - 3} more warnings`);
    }
  }
  console.log('');
}

/**
 * Builds a full markdown report string from a scan result and its spec files.
 */
export function buildMarkdownReport(result: ScanResult, specs: SpecFile[]): string {
  const lines: string[] = [];

  lines.push('# 👻 GhostSpec Report\n');
  lines.push(`**Generated:** ${new Date().toISOString()}  `);
  lines.push(`**Root:** \`${result.rootDir}\`  `);
  lines.push(`**Files Scanned:** ${result.files.length}  `);
  lines.push(`**Total Functions:** ${result.totalFunctions}  `);
  lines.push(`**Total Warnings:** ${result.totalWarnings}  `);
  lines.push(`**Scan Duration:** ${result.scanDurationMs}ms\n`);
  lines.push('---\n');

  lines.push('## 🔥 High-Risk Files\n');
  if (result.highRiskFiles.length === 0) {
    lines.push('No high-risk files detected.\n');
  } else {
    lines.push('| File | Risk Score | Warnings |');
    lines.push('|------|-----------|---------|');
    for (const file of result.highRiskFiles) {
      const relPath = path.relative(result.rootDir, file.filePath);
      lines.push(`| \`${relPath}\` | ${RISK_LABEL(file.riskScore)} (${file.riskScore}) | ${file.ghostWarnings.length} |`);
    }
    lines.push('');
  }

  lines.push('---\n');
  lines.push('## 📋 Function Specifications\n');

  for (const spec of specs) {
    if (spec.functions.length === 0) continue;
    const relPath = path.relative(result.rootDir, spec.sourceFile);
    lines.push(`### \`${relPath}\`\n`);

    for (const fn of spec.functions) {
      lines.push(`#### \`${fn.name}\``);
      lines.push(`\`\`\`typescript\n${fn.signature}\n\`\`\``);
      lines.push(`**Behavior:** ${fn.behavior}  `);
      lines.push(`**Risk Score:** ${RISK_LABEL(fn.riskScore)} (${fn.riskScore}/100)  `);

      if (fn.riskReasons.length > 0) {
        lines.push('\n**Risk Reasons:**');
        fn.riskReasons.forEach(r => lines.push(`- ${r}`));
      }

      lines.push('\n**Preconditions:**');
      fn.preconditions.forEach(p => lines.push(`- ${p}`));

      lines.push('\n**Postconditions:**');
      fn.postconditions.forEach(p => lines.push(`- ${p}`));

      lines.push('\n**Suggested Test Cases:**');
      fn.testCaseSuggestions.forEach(t => lines.push(`- ${t}`));
      lines.push('');
    }

    if (spec.refactorSuggestions.length > 0) {
      lines.push('**Refactor Suggestions:**\n');
      for (const s of spec.refactorSuggestions) {
        lines.push(`> **[${s.priority.toUpperCase()}]** ${s.issue}  `);
        lines.push(`> 💡 ${s.suggestion}\n`);
      }
    }
    lines.push('---\n');
  }

  return lines.join('\n');
}

/**
 * Writes the markdown report to a file and returns the path.
 */
export function writeMarkdownReport(result: ScanResult, specs: SpecFile[], outputDir: string): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const reportPath = path.join(outputDir, 'ghostspec-report.md');
  fs.writeFileSync(reportPath, buildMarkdownReport(result, specs), 'utf-8');
  return reportPath;
}
