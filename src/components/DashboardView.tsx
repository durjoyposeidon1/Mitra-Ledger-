import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Package,
  Plus,
  Printer,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import type { Language, Sale, ShopBootstrapData } from '../shared/types';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatTaka,
  isWithinTimeframe,
  t,
  type TimeframeKey,
} from '../lib/format';

interface DashboardViewProps {
  data: ShopBootstrapData;
  lang: Language;
  onNavigate: (tab: string) => void;
  onQuickAction: (action: 'add-product' | 'stock-adjust' | 'new-sale' | 'cash-entry') => void;
  onViewMemo: (sale: Sale) => void;
}

const TIMEFRAMES: Array<{ key: TimeframeKey; bn: string; en: string }> = [
  { key: 'today', bn: 'আজ', en: 'Today' },
  { key: '7d', bn: '৭ দিন', en: '7 Days' },
  { key: '14d', bn: '১৪ দিন', en: '14 Days' },
  { key: '1m', bn: '১ মাস', en: '1 Month' },
  { key: '3m', bn: '৩ মাস', en: '3 Months' },
  { key: '6m', bn: '৬ মাস', en: '6 Months' },
  { key: '1y', bn: '১ বছর', en: '1 Year' },
  { key: 'lifetime', bn: 'লাইফটাইম', en: 'Lifetime' },
];

const DONUT_COLORS = ['#059669', '#2563eb', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

export function DashboardView({
  data,
  lang,
  onNavigate,
  onQuickAction,
  onViewMemo,
}: DashboardViewProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('today');
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);

  const metrics = useMemo(() => {
    const filteredSales = data.sales.filter((s) => isWithinTimeframe(s.date, timeframe));
    const filteredPurchases = data.purchases.filter((p) => isWithinTimeframe(p.date, timeframe));
    const filteredExpenses = data.expenses.filter((e) => isWithinTimeframe(e.date, timeframe));

    const totalSales = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const grossProfit = filteredSales.reduce((sum, s) => {
      const itemProfit = s.items.reduce(
        (acc, item) => acc + (item.unitPrice - item.purchasePrice) * item.qty,
        0
      );
      return sum + itemProfit - s.discount;
    }, 0);
    const netProfit = grossProfit - totalExpenses;

    const customerDue = data.customers.reduce((sum, c) => sum + c.due, 0);
    const supplierDue = data.suppliers.reduce((sum, s) => sum + s.due, 0);
    const stockValue = data.products.reduce((sum, p) => sum + p.purchasePrice * p.stock, 0);

    let cashInHand = data.shop.openingCash || 0;
    let bankBalance = data.shop.openingBank || 0;
    let mobileBalance = data.shop.openingMobile || 0;

    for (const txn of data.cashbook) {
      const delta = txn.direction === 'in' ? txn.amount : -txn.amount;
      if (txn.account === 'Cash') cashInHand += delta;
      else if (txn.account === 'Bank') bankBalance += delta;
      else mobileBalance += delta;
    }

    const lowStockProducts = data.products.filter((p) => p.stock <= p.minStock);

    // Category sales breakdown
    const catMap = new Map<string, number>();
    const prodCategory = new Map(data.products.map((p) => [p.id, p.category]));
    for (const sale of data.sales) {
      for (const item of sale.items) {
        const cat = prodCategory.get(item.productId) || 'General';
        catMap.set(cat, (catMap.get(cat) || 0) + item.subtotal);
      }
    }
    const categoryEntries = Array.from(catMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
    const categoryTotal = categoryEntries.reduce((s, c) => s + c.amount, 0);

    // Last 7 days / monthly sales bar chart
    const dailySeries: Array<{ label: string; sales: number; profit: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const daySales = data.sales.filter((s) => {
        const sd = new Date(s.date);
        return (
          sd.getFullYear() === day.getFullYear() &&
          sd.getMonth() === day.getMonth() &&
          sd.getDate() === day.getDate()
        );
      });
      const total = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      const prof = daySales.reduce((sum, s) => {
        const ip = s.items.reduce((a, it) => a + (it.unitPrice - it.purchasePrice) * it.qty, 0);
        return sum + ip - s.discount;
      }, 0);
      dailySeries.push({
        label: day.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
          day: 'numeric',
          month: 'short',
        }),
        sales: total,
        profit: prof,
      });
    }

    return {
      salesCount: filteredSales.length,
      purchasesCount: filteredPurchases.length,
      expensesCount: filteredExpenses.length,
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      customerDue,
      supplierDue,
      stockValue,
      cashInHand,
      bankBalance,
      mobileBalance,
      lowStockProducts,
      categoryEntries,
      categoryTotal,
      dailySeries,
    };
  }, [data, timeframe, lang]);

  const maxChartVal = Math.max(1000, ...metrics.dailySeries.map((d) => d.sales));
  const tfLabel = TIMEFRAMES.find((f) => f.key === timeframe);

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {t(lang, `স্বাগতম, ${data.shop.name}`, `Welcome, ${data.shop.name}`)}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatDate(new Date().toISOString(), lang)} · {data.shop.category} · {data.shop.code}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onQuickAction('add-product')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600" />
            {t(lang, 'নতুন পণ্য যোগ', 'Add Product')}
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('stock-adjust')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-sky-600" />
            {t(lang, 'স্টক ±', 'Stock ±')}
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('new-sale')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {t(lang, 'বিক্রি করুন', 'New Sale / Memo')}
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('cash-entry')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Wallet className="h-3.5 w-3.5 text-rose-600" />
            {t(lang, 'জমা খরচ ±', 'Cash In / Out')}
          </button>
        </div>
      </div>

      {/* Timeframe Segmented Filter */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 w-fit">
        {TIMEFRAMES.map((tf) => {
          const active = timeframe === tf.key;
          return (
            <button
              key={tf.key}
              type="button"
              onClick={() => setTimeframe(tf.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? tf.bn : tf.en}
            </button>
          );
        })}
      </div>

      {/* Primary KPI Grid (4 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Sales */}
        <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {timeframe === 'today'
                ? t(lang, 'আজকের বিক্রি', "Today's Sales")
                : t(lang, `${tfLabel?.bn} বিক্রি`, `${tfLabel?.en} Sales`)}
            </span>
            <ShoppingCart className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 font-mono-num text-2xl font-bold text-sky-700">
            {formatTaka(metrics.totalSales, lang)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {formatNumber(metrics.salesCount, lang)} {t(lang, 'টি মেমো', 'memos')}
          </p>
        </div>

        {/* Purchase */}
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {timeframe === 'today'
                ? t(lang, 'আজকের ক্রয়', "Today's Purchase")
                : t(lang, `${tfLabel?.bn} ক্রয়`, `${tfLabel?.en} Purchase`)}
            </span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-mono-num text-2xl font-bold text-emerald-700">
            {formatTaka(metrics.totalPurchases, lang)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {formatNumber(metrics.purchasesCount, lang)} {t(lang, 'টি এন্ট্রি', 'entries')}
          </p>
        </div>

        {/* Expense */}
        <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {timeframe === 'today'
                ? t(lang, 'আজকের খরচ', "Today's Expense")
                : t(lang, `${tfLabel?.bn} খরচ`, `${tfLabel?.en} Expense`)}
            </span>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 font-mono-num text-2xl font-bold text-rose-700">
            {formatTaka(metrics.totalExpenses, lang)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {formatNumber(metrics.expensesCount, lang)} {t(lang, 'টি খরচ এন্ট্রি', 'expense items')}
          </p>
        </div>

        {/* Estimated Profit */}
        <div className="rounded-xl border border-teal-200/80 bg-teal-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {t(lang, 'আনুমানিক লাভ (বিক্রি)', 'Estimated Gross Profit')}
            </span>
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2 font-mono-num text-2xl font-bold text-teal-700">
            {formatTaka(metrics.grossProfit, lang)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {t(lang, 'নিট লাভ (খরচ বাদে)', 'Net after expense')}: {formatTaka(metrics.netProfit, lang)}
          </p>
        </div>
      </div>

      {/* Secondary Financial Balances Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => onNavigate('customers')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t(lang, 'বাকি পাওনা (কাস্টমার)', 'Customer Receivable')}
            </span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-1.5 font-mono-num text-lg font-bold text-slate-900">
            {formatTaka(metrics.customerDue, lang)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {data.customers.filter((c) => c.due > 0).length} {t(lang, 'জন কাস্টমার বাকি', 'customers due')}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('suppliers')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t(lang, 'সাপ্লায়ার বাকি', 'Supplier Payable')}
            </span>
            <Building2 className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-1.5 font-mono-num text-lg font-bold text-slate-900">
            {formatTaka(metrics.supplierDue, lang)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {data.suppliers.filter((s) => s.due > 0).length} {t(lang, 'জন সাপ্লায়ার', 'suppliers')}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('cashbook')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t(lang, 'হাতে নগদ (Cash in Hand)', 'Cash in Hand')}
            </span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1.5 font-mono-num text-lg font-bold text-emerald-700">
            {formatTaka(metrics.cashInHand, lang)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{t(lang, 'ক্যাশবুক ব্যালেন্স', 'Cashbook balance')}</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('cashbook')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t(lang, 'ব্যাংক ও মোবাইল ব্যাংকিং', 'Bank & Mobile Wallet')}
            </span>
            <Smartphone className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-1.5 font-mono-num text-lg font-bold text-slate-900">
            {formatTaka(metrics.bankBalance + metrics.mobileBalance, lang)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
            Bank {formatTaka(metrics.bankBalance, lang)} · bKash/Nagad {formatTaka(metrics.mobileBalance, lang)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('products')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t(lang, 'মোট স্টক মূল্য', 'Stock Valuation')}
            </span>
            <Package className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-1.5 font-mono-num text-lg font-bold text-slate-900">
            {formatTaka(metrics.stockValue, lang)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
            {formatNumber(data.products.length, lang)} {t(lang, 'টি পণ্য', 'SKUs in stock')}
          </p>
        </button>
      </div>

      {/* Charts Row: Sales Bar Chart + Category Donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 7-Day / Monthly Sales Trend Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {t(lang, 'মাসিক ও দৈনিক বিক্রির গ্রাফ', 'Sales & Profit Trend')}
              </h2>
              <p className="text-xs text-slate-500">
                {t(lang, 'গত ৭ দিনের বিক্রি ও আনুমানিক লাভ', 'Last 7 days sales revenue & gross profit')}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                {t(lang, 'বিক্রি', 'Sales')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-500" />
                {t(lang, 'লাভ', 'Profit')}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex h-56 items-end justify-between gap-3 px-2">
              {metrics.dailySeries.map((bar, idx) => {
                const salesH = Math.max(4, Math.round((bar.sales / maxChartVal) * 180));
                const profitH = Math.max(2, Math.round((Math.max(0, bar.profit) / maxChartVal) * 180));
                const isHovered = hoveredBarIdx === idx;
                return (
                  <div
                    key={bar.label}
                    onMouseEnter={() => setHoveredBarIdx(idx)}
                    onMouseLeave={() => setHoveredBarIdx(null)}
                    className="relative flex flex-1 flex-col items-center justify-end gap-2"
                  >
                    {isHovered && (
                      <div className="absolute -top-12 z-10 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-md">
                        <div className="font-semibold">{bar.label}</div>
                        <div className="tabular-nums">
                          {t(lang, 'বিক্রি', 'Sales')}: {formatTaka(bar.sales, lang)}
                        </div>
                        <div className="tabular-nums text-emerald-300">
                          {t(lang, 'লাভ', 'Profit')}: {formatTaka(bar.profit, lang)}
                        </div>
                      </div>
                    )}
                    <div className="flex w-full items-end justify-center gap-1">
                      <div
                        style={{ height: `${salesH}px` }}
                        className="w-5 max-w-[45%] rounded-t bg-emerald-600 transition-opacity hover:opacity-85"
                      />
                      <div
                        style={{ height: `${profitH}px` }}
                        className="w-4 max-w-[35%] rounded-t bg-sky-500 transition-opacity hover:opacity-85"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Sales Donut Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              {t(lang, 'ক্যাটাগরি অনুযায়ী বিক্রি', 'Sales by Category')}
            </h2>
            <p className="text-xs text-slate-500">
              {t(lang, 'সর্বমোট বিক্রির ক্যাটাগরি বিভাজন', 'Revenue distribution across product categories')}
            </p>
          </div>

          {metrics.categoryEntries.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-slate-400">
              {t(lang, 'এখনো কোনো বিক্রির তথ্য নেই', 'No sales data recorded yet')}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
              <div className="relative h-44 w-44 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  {(() => {
                    let offset = 0;
                    const radius = 44;
                    const circumference = 2 * Math.PI * radius;
                    return metrics.categoryEntries.slice(0, 6).map((entry, idx) => {
                      const pct = metrics.categoryTotal > 0 ? entry.amount / metrics.categoryTotal : 0;
                      const strokeLen = pct * circumference;
                      const el = (
                        <circle
                          key={entry.category}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                          strokeWidth="16"
                          strokeDasharray={`${strokeLen} ${circumference}`}
                          strokeDashoffset={-offset}
                        />
                      );
                      offset += strokeLen;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-500">{t(lang, 'মোট বিক্রি', 'Total')}</span>
                  <span className="font-mono-num text-sm font-bold text-slate-900">
                    {formatTaka(metrics.categoryTotal, lang)}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                {metrics.categoryEntries.slice(0, 6).map((entry, idx) => {
                  const pct =
                    metrics.categoryTotal > 0
                      ? Math.round((entry.amount / metrics.categoryTotal) * 100)
                      : 0;
                  return (
                    <div key={entry.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                        />
                        <span className="truncate font-medium text-slate-700">{entry.category}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 tabular-nums">
                        <span className="font-semibold text-slate-900">{formatTaka(entry.amount, lang)}</span>
                        <span className="text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Low Stock Alert & Recent Sales List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Low Stock Alert */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="text-base font-semibold text-slate-900">
                {t(lang, 'স্টক অ্যালার্ট (কম স্টক)', 'Low Stock Alerts')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap shrink-0"
            >
              {t(lang, 'সব পণ্য দেখুন', 'Manage Stock')}
            </button>
          </div>

          {metrics.lowStockProducts.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              {t(lang, 'সব পণ্যের স্টক পর্যাপ্ত আছে', 'All products are well stocked.')}
            </div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {metrics.lowStockProducts.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0 pr-3">
                    <div className="truncate font-medium text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500 font-mono-num">
                      {p.code} · {t(lang, 'ন্যূনতম', 'Min')}: {p.minStock} {p.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono-num text-xs font-bold text-rose-600">
                      {p.stock} {p.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('purchase')}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      {t(lang, 'ক্রয় করুন', 'Restock')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales List */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              {t(lang, 'সাম্প্রতিক বিক্রির তালিকা', 'Recent Sales & Memos')}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap shrink-0"
            >
              {t(lang, 'সব মেমো দেখুন', 'View All Sales')}
            </button>
          </div>

          {data.sales.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              {t(lang, 'এখনো কোনো বিক্রি হয়নি', 'No sales memos created yet.')}
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 font-medium">{t(lang, 'মেমো নং', 'Memo')}</th>
                    <th className="py-2.5 font-medium">{t(lang, 'কাস্টমার', 'Customer')}</th>
                    <th className="py-2.5 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                    <th className="py-2.5 text-right font-medium">{t(lang, 'মোট বিল', 'Total')}</th>
                    <th className="py-2.5 text-right font-medium">{t(lang, 'বাকি', 'Due')}</th>
                    <th className="py-2.5 text-right font-medium">{t(lang, 'মেমো', 'Receipt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.sales.slice(0, 6).map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-mono-num font-semibold text-slate-900">{sale.memoNo}</td>
                      <td className="py-2.5">
                        <div className="font-medium text-slate-800">{sale.customerName}</div>
                        <div className="text-[11px] text-slate-400">{sale.paymentMethod}</div>
                      </td>
                      <td className="py-2.5 tabular-nums text-slate-500">
                        {formatDateTime(sale.date, lang)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num font-semibold text-slate-900">
                        {formatTaka(sale.totalAmount, lang)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num font-semibold">
                        {sale.dueAmount > 0 ? (
                          <span className="text-rose-600">{formatTaka(sale.dueAmount, lang)}</span>
                        ) : (
                          <span className="text-emerald-600">{t(lang, 'পরিশোধিত', 'Paid')}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onViewMemo(sale)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Printer className="h-3 w-3" />
                          {t(lang, 'প্রিন্ট', 'Memo')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
