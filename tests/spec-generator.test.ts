import * as path from 'path';
import { parseFile } from '../src/analyzer/ast-parser';
import { generateSpec } from '../src/spec/spec-generator';

const EXAMPLE_FILE = path.resolve(__dirname, '../examples/haunted-legacy.ts');

describe('generateSpec', () => {
  let spec: ReturnType<typeof generateSpec>;

  beforeAll(() => {
    const analysis = parseFile(EXAMPLE_FILE);
    spec = generateSpec(analysis);
  });

  test('spec version is set', () => {
    expect(spec.version).toBe('1.0.0');
  });

  test('generatedAt is a valid ISO string', () => {
    expect(() => new Date(spec.generatedAt)).not.toThrow();
  });

  test('every function has a non-empty signature', () => {
    for (const fn of spec.functions) {
      expect(fn.signature.length).toBeGreaterThan(0);
    }
  });

  test('every function has preconditions and postconditions', () => {
    for (const fn of spec.functions) {
      expect(fn.preconditions.length).toBeGreaterThan(0);
      expect(fn.postconditions.length).toBeGreaterThan(0);
    }
  });

  test('refactor suggestions are generated for the haunted file', () => {
    expect(spec.refactorSuggestions.length).toBeGreaterThan(0);
  });

  test('every function has at least one test case suggestion', () => {
    for (const fn of spec.functions) {
      expect(fn.testCaseSuggestions.length).toBeGreaterThan(0);
    }
  });
});
