#!/usr/bin/env node
/**
 * GhostSpec CLI
 * Entry point for the ghostspec command.
 *
 * Usage:
 *   ghostspec scan <dir>              Scan a codebase and print a summary
 *   ghostspec scan <dir> --report     Also write a markdown report
 *   ghostspec scan <dir> --specs      Also write per-file spec JSON files
 */

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { scanCodebase } from '../analyzer/codebase-scanner';
import { generateSpec, writeSpecs } from '../spec/spec-generator';
import { printScanSummary, writeMarkdownReport } from '../reporter/report-generator';

const program = new Command();

program
  .name('ghostspec')
  .description('👻 AI-powered spec-driven debugging assistant for haunted legacy code')
  .version('1.0.0');

program
  .command('scan <directory>')
  .description('Scan a codebase directory for high-risk code and generate specs')
  .option('-o, --output <dir>', 'Output directory for specs and reports', '.ghostspec')
  .option('--report', 'Write a markdown summary report', false)
  .option('--specs', 'Write per-file spec JSON files', false)
  .option('--json', 'Print the full scan result as JSON', false)
  .action((directory: string, options: { output: string; report: boolean; specs: boolean; json: boolean }) => {
    const absDir = path.resolve(directory);

    if (!fs.existsSync(absDir)) {
      console.error(`❌ Directory not found: ${absDir}`);
      process.exit(1);
    }

    console.log(`\n👻 GhostSpec — scanning ${absDir} ...\n`);

    const result = scanCodebase(absDir);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    printScanSummary(result);

    const outputDir = path.resolve(options.output);
    const specs = result.files.map(f => generateSpec(f));

    if (options.specs) {
      const written = writeSpecs(result, path.join(outputDir, 'specs'));
      console.log(`📝 Wrote ${written.length} spec files to ${path.join(outputDir, 'specs')}`);
    }

    if (options.report) {
      const reportPath = writeMarkdownReport(result, specs, outputDir);
      console.log(`📊 Report written to ${reportPath}`);
    }

    // Always exit with code 1 if critical issues exist so CI pipelines can gate
    const hasCritical = result.files.some(f =>
      f.ghostWarnings.some(w => w.severity === 'critical')
    );
    process.exit(hasCritical ? 1 : 0);
  });

program.parse(process.argv);
