import type { Language } from '../shared/types';

export type TimeframeKey =
  | 'today'
  | '7d'
  | '14d'
  | '1m'
  | '3m'
  | '6m'
  | '1y'
  | 'lifetime';

export function formatTaka(amount: number, lang: Language = 'bn'): string {
  const num = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-BD', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
  }).format(Math.abs(num));
  const prefix = num < 0 ? '-' : '';
  return `${prefix}৳${formatted}`;
}

export function formatNumber(value: number, lang: Language = 'bn'): string {
  const num = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US').format(num);
}

export function formatDate(iso: string, lang: Language = 'bn'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string, lang: Language = 'bn'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isSameDay(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function isWithinTimeframe(iso: string, timeframe: TimeframeKey): boolean {
  if (timeframe === 'lifetime') return true;
  const d = new Date(iso);
  const now = new Date();
  if (timeframe === 'today') {
    return isSameDay(iso, now);
  }
  const daysMap: Record<Exclude<TimeframeKey, 'today' | 'lifetime'>, number> = {
    '7d': 7,
    '14d': 14,
    '1m': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365,
  };
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (daysMap[timeframe] - 1));
  return d >= cutoff;
}

export function t(lang: Language, bn: string, en: string): string {
  return lang === 'bn' ? bn : en;
}
