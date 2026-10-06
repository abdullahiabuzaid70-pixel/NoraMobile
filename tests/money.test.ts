import { describe, expect, it } from 'vitest';
import {
  add, allocate, compare, format, fromBackendValue, fromMajorFloat, fromUserInput,
  isNegative, isZero, money, sub, symbolOf,
} from '../src/domain/money';

describe('Money', () => {
  it('constructs in minor units without float drift', () => {
    expect(money(100_50, 'NGN').amountMinor).toBe(10050);
    expect(fromMajorFloat(0.1 + 0.2, 'NGN').amountMinor).toBe(30); // classic float trap
    expect(fromMajorFloat(1999.99, 'NGN').amountMinor).toBe(199999);
  });

  it('formats with symbol, grouping, and correct decimals', () => {
    expect(format(money(1234567, 'NGN'))).toBe('₦12,345.67');
    expect(format(money(100_00, 'GHS'))).toBe('₵100.00');
    expect(format(money(-500, 'USD'))).toBe('-$5.00');
    expect(format(money(0, 'NGN'))).toBe('₦0.00');
    expect(symbolOf('KES')).toBe('KSh ');
  });

  it('rejects invalid user input', () => {
    expect(fromUserInput('', 'NGN')).toBeNull();
    expect(fromUserInput('abc', 'NGN')).toBeNull();
    expect(fromUserInput('-5', 'NGN')).toBeNull();
    expect(fromUserInput('1,500.50', 'NGN')?.amountMinor).toBe(150050);
    expect(fromUserInput('5', 'NGN')?.amountMinor).toBe(500);
  });

  it('adds and subtracts in integers', () => {
    expect(add(money(100, 'NGN'), money(50, 'NGN')).amountMinor).toBe(150);
    expect(sub(money(100, 'NGN'), money(150, 'NGN')).amountMinor).toBe(-50);
    expect(() => add(money(100, 'NGN'), money(100, 'GHS'))).toThrow();
  });

  it('allocates deterministically with remainder to the first part', () => {
    const { part, rest } = allocate(money(100, 'NGN'), 0.33);
    expect(part.amountMinor).toBe(33);
    expect(rest.amountMinor).toBe(67);
    expect(part.amountMinor + rest.amountMinor).toBe(100);
  });

  it('compares and inspects safely', () => {
    expect(compare(money(100, 'NGN'), money(200, 'NGN'))).toBeLessThan(0);
    expect(isZero(money(0, 'NGN'))).toBe(true);
    expect(isNegative(money(-1, 'NGN'))).toBe(true);
  });

  it('absorbs backend floats and junk without crashing', () => {
    expect(fromBackendValue(undefined, 'NGN').amountMinor).toBe(0);
    expect(fromBackendValue('2500', 'NGN').amountMinor).toBe(250000);
    expect(fromBackendValue(19.99, 'USD').amountMinor).toBe(1999);
  });
});
