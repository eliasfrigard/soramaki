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

const dateTimeFormatter = new Intl.DateTimeFormat('fi-FI', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Helsinki',
});

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

const categoryLabels = new Map([
  ['Purchase', 'Hankinta'],
  ['Construction', 'Rakentaminen'],
  ['Maintenance', 'Kunnossapito'],
  ['Cleaning', 'Siivous'],
]);

export function formatCategoryName(name: string): string {
  return categoryLabels.get(name) ?? name;
}
