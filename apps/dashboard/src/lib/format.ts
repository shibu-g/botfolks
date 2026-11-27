const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number) {
  return moneyFormatter.format(amount);
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

// Dodo bills some customers in their local currency (adaptive pricing), so invoice
// amounts can't assume USD like the plan/pack prices we set ourselves.
export function formatCurrency(amount: number, currency: string) {
  let f = currencyFormatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 });
    currencyFormatters.set(currency, f);
  }
  return f.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDate(value: string | number | Date) {
  return dateFormatter.format(new Date(value));
}
