// apps/studio/src/components/billing/currency-formatter.ts

export const CURRENCY_EXPONENTS: Record<string, number> = {
  CNY: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  HKD: 2,
  SGD: 2,
  CAD: 2,
  AUD: 2,
  JPY: 0,
  KRW: 0,
  VND: 0,
  KWD: 3,
  BHD: 3,
};

export function getCurrencyExponent(currency: string): number {
  return CURRENCY_EXPONENTS[currency.toUpperCase()] ?? 2;
}

export function formatRegionalPrice(
  amountMinor: number,
  currency: string,
  locale?: string,
): string {
  const exp = getCurrencyExponent(currency);
  const majorAmount = amountMinor / Math.pow(10, exp);
  const effectiveLocale =
    locale || (typeof navigator !== 'undefined' ? navigator.language : 'zh-CN');

  try {
    return new Intl.NumberFormat(effectiveLocale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: exp === 0 ? 0 : 2,
      maximumFractionDigits: exp,
    }).format(majorAmount);
  } catch {
    return `${currency.toUpperCase()} ${majorAmount.toFixed(exp)}`;
  }
}
