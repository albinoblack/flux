import { format } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatShortDate(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

export function formatMonthLabel(ano: number, mes: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[mes - 1]} ${ano}`;
}

export function bucketProgressColor(percent: number): string {
  if (percent > 1) return 'bg-rose-500';
  if (percent >= 0.8) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value * 100));
}
