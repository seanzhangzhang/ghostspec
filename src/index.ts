/**
 * GhostSpec — public API surface
 * Import from this file to use GhostSpec as a library.
 */

export { parseFile, FileAnalysis, FunctionSignature, GhostWarning } from './analyzer/ast-parser';
export { scanCodebase, ScanResult } from './analyzer/codebase-scanner';
export { generateSpec, writeSpecs, SpecFile, FunctionSpec, RefactorSuggestion } from './spec/spec-generator';
export { printScanSummary, buildMarkdownReport, writeMarkdownReport } from './reporter/report-generator';
