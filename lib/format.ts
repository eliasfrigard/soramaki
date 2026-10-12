const formatters = {
  whole: new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
  cents: new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }),
};

export function formatEuro(amount: number): string {
  return (Number.isInteger(amount) ? formatters.whole : formatters.cents).format(amount);
}

const dateFormatter = new Intl.DateTimeFormat('fi-FI', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'Europe/Helsinki',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
