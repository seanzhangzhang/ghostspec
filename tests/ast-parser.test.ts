import * as path from 'path';
import { parseFile } from '../src/analyzer/ast-parser';

const EXAMPLE_FILE = path.resolve(__dirname, '../examples/haunted-legacy.ts');

describe('parseFile', () => {
  let result: ReturnType<typeof parseFile>;

  beforeAll(() => {
    result = parseFile(EXAMPLE_FILE);
  });

  test('detects the correct number of exported functions', () => {
    const exported = result.functions.filter(f => f.isExported);
    expect(exported.length).toBe(3); // fetchUserData, processPayment, sendNotification
  });

  test('flags fetchUserData as async', () => {
    const fn = result.functions.find(f => f.name === 'fetchUserData');
    expect(fn).toBeDefined();
    expect(fn!.isAsync).toBe(true);
  });

  test('detects at least one silent catch warning', () => {
    const silentCatches = result.ghostWarnings.filter(w => w.type === 'silent-catch');
    expect(silentCatches.length).toBeGreaterThanOrEqual(1);
  });

  test('detects magic numbers', () => {
    const magicNumbers = result.ghostWarnings.filter(w => w.type === 'magic-number');
    expect(magicNumbers.length).toBeGreaterThan(0);
  });

  test('detects missing null checks on deep property access', () => {
    const nullChecks = result.ghostWarnings.filter(w => w.type === 'missing-null-check');
    expect(nullChecks.length).toBeGreaterThan(0);
  });

  test('processPayment has high cyclomatic complexity', () => {
    const fn = result.functions.find(f => f.name === 'processPayment');
    expect(fn).toBeDefined();
    expect(fn!.complexity).toBeGreaterThan(5);
  });

  test('overall file risk score is above zero', () => {
    expect(result.riskScore).toBeGreaterThan(0);
  });
});
