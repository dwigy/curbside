import { describe, expect, it } from 'vitest';
import { amortize, futureValue, loanPayment, progressiveTax } from '../finance';

describe('loans', () => {
  it('computes the standard payment', () => {
    // $10,000 at 6% for 36 months = $304.22
    expect(loanPayment(10000, 0.06, 36)).toBe(304.22);
    expect(loanPayment(1200, 0, 12)).toBe(100);
  });

  it('amortizes to exactly zero and principal sums to the loan', () => {
    const rows = amortize(25000, 0.07, 60);
    expect(rows.at(-1)!.balance).toBe(0);
    const principal = rows.reduce((a, r) => a + r.principal, 0);
    expect(Math.round(principal * 100) / 100).toBe(25000);
    for (const r of rows) expect(r.balance).toBeGreaterThanOrEqual(0);
  });
});

describe('taxes', () => {
  const brackets = [
    { from: 0, rate: 0.1 },
    { from: 10000, rate: 0.2 },
    { from: 40000, rate: 0.3 },
  ];
  it('taxes marginally, not the whole income at the top rate', () => {
    expect(progressiveTax(5000, brackets)).toBe(500);
    expect(progressiveTax(10000, brackets)).toBe(1000);
    expect(progressiveTax(50000, brackets)).toBe(1000 + 6000 + 3000);
  });
  it('applies deductions first', () => {
    expect(progressiveTax(15000, brackets, 5000)).toBe(1000);
    expect(progressiveTax(3000, brackets, 5000)).toBe(0);
  });
});

describe('savings', () => {
  it('compounds monthly contributions', () => {
    expect(futureValue(100, 0, 12)).toBe(1200);
    expect(futureValue(100, 0.12, 12)).toBeCloseTo(1268.25, 1);
  });
});
