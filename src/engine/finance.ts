// Pure money math. Used by later acts (loans, mortgages, taxes); tested from day one.

export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

const cents = (n: number) => Math.round(n * 100) / 100;

/** Fixed payment for a fully amortizing loan. `annualRate` as a fraction (0.07 = 7%). */
export function loanPayment(principal: number, annualRate: number, months: number): number {
  if (months <= 0) throw new Error('months must be positive');
  const r = annualRate / 12;
  if (r === 0) return cents(principal / months);
  return cents((principal * r) / (1 - Math.pow(1 + r, -months)));
}

/** Full schedule. The last payment absorbs rounding so the balance ends at exactly 0. */
export function amortize(principal: number, annualRate: number, months: number): AmortizationRow[] {
  const pmt = loanPayment(principal, annualRate, months);
  const r = annualRate / 12;
  const rows: AmortizationRow[] = [];
  let bal = principal;
  for (let p = 1; p <= months; p++) {
    const interest = cents(bal * r);
    let principalPart = cents(pmt - interest);
    let payment = pmt;
    if (p === months || principalPart > bal) {
      principalPart = cents(bal);
      payment = cents(principalPart + interest);
    }
    bal = cents(bal - principalPart);
    rows.push({ period: p, payment, interest, principal: principalPart, balance: bal });
    if (bal <= 0) break;
  }
  return rows;
}

export interface TaxBracket {
  /** Income above this is taxed at `rate` (until the next bracket). */
  from: number;
  rate: number;
}

/** Progressive (marginal) tax: each bracket's rate applies only to income inside it. */
export function progressiveTax(income: number, brackets: TaxBracket[], deduction = 0): number {
  const taxable = Math.max(0, income - deduction);
  const sorted = [...brackets].sort((a, b) => a.from - b.from);
  let tax = 0;
  for (let i = 0; i < sorted.length; i++) {
    const lo = sorted[i].from;
    const hi = i + 1 < sorted.length ? sorted[i + 1].from : Infinity;
    if (taxable <= lo) break;
    tax += (Math.min(taxable, hi) - lo) * sorted[i].rate;
  }
  return cents(tax);
}

export function effectiveRate(income: number, brackets: TaxBracket[], deduction = 0): number {
  return income <= 0 ? 0 : progressiveTax(income, brackets, deduction) / income;
}

/** Future value of regular contributions with monthly compounding. */
export function futureValue(monthly: number, annualRate: number, months: number, start = 0): number {
  const r = annualRate / 12;
  let v = start;
  for (let i = 0; i < months; i++) v = v * (1 + r) + monthly;
  return cents(v);
}
