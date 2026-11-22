import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import type { Language, ShopBootstrapData } from '../shared/types';
import { formatDate, formatDateTime, formatTaka, isSameDay, t } from '../lib/format';

type ReportType =
  | 'daily_sales'
  | 'monthly_sales'
  | 'profit_loss'
  | 'purchase'
  | 'expense'
  | 'stock'
  | 'customer_due'
  | 'supplier_due'
  | 'cashbook';

interface ReportsViewProps {
  data: ShopBootstrapData;
  lang: Language;
}

const REPORT_TABS: Array<{ key: ReportType; bn: string; en: string }> = [
  { key: 'daily_sales', bn: 'দৈনিক বিক্রি', en: 'Daily Sales' },
  { key: 'monthly_sales', bn: 'মাসিক বিক্রি', en: 'Monthly Sales' },
  { key: 'profit_loss', bn: 'লাভ ও ক্ষতি (P&L)', en: 'Profit & Loss' },
  { key: 'purchase', bn: 'ক্রয় রিপোর্ট', en: 'Purchase Report' },
  { key: 'expense', bn: 'খরচ রিপোর্ট', en: 'Expense Report' },
  { key: 'stock', bn: 'স্টক রিপোর্ট', en: 'Stock Report' },
  { key: 'customer_due', bn: 'কাস্টমার বাকি', en: 'Customer Due' },
  { key: 'supplier_due', bn: 'সাপ্লায়ার বাকি', en: 'Supplier Due' },
  { key: 'cashbook', bn: 'ক্যাশবুক রিপোর্ট', en: 'Cashbook Report' },
];

export function ReportsView({ data, lang }: ReportsViewProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('daily_sales');

  const computed = useMemo(() => {
    const now = new Date();
    const todaySales = data.sales.filter((s) => isSameDay(s.date, now));
    const monthlySales = data.sales.filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalRevenue = data.sales.reduce((s, x) => s + x.totalAmount, 0);
    const totalCOGS = data.sales.reduce(
      (s, x) => s + x.items.reduce((a, it) => a + it.purchasePrice * it.qty, 0),
      0
    );
    const totalDiscounts = data.sales.reduce((s, x) => s + x.discount, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const totalStockCost = data.products.reduce((s, p) => s + p.purchasePrice * p.stock, 0);
    const totalStockRetail = data.products.reduce((s, p) => s + p.salePrice * p.stock, 0);

    return {
      todaySales,
      monthlySales,
      totalRevenue,
      totalCOGS,
      totalDiscounts,
      grossProfit,
      totalExpenses,
      netProfit,
      totalStockCost,
      totalStockRetail,
    };
  }, [data]);

  const handleDownloadCsv = () => {
    let headers: string[] = [];
    let rows: Array<Array<string | number>> = [];

    if (activeReport === 'daily_sales' || activeReport === 'monthly_sales') {
      const list = activeReport === 'daily_sales' ? computed.todaySales : computed.monthlySales;
      headers = ['Memo No', 'Date', 'Customer', 'Method', 'Total', 'Paid', 'Due'];
      rows = list.map((s) => [
        s.memoNo,
        s.date,
        s.customerName,
        s.paymentMethod,
        s.totalAmount,
        s.paidAmount,
        s.dueAmount,
      ]);
    } else if (activeReport === 'stock') {
      headers = ['Code', 'Name', 'Category', 'Purchase Price', 'Sale Price', 'Stock', 'Stock Value'];
      rows = data.products.map((p) => [
        p.code,
        p.name,
        p.category,
        p.purchasePrice,
        p.salePrice,
        p.stock,
        p.stock * p.purchasePrice,
      ]);
    } else if (activeReport === 'customer_due') {
      headers = ['Name', 'Phone', 'Total Purchase', 'Total Paid', 'Due'];
      rows = data.customers.map((c) => [c.name, c.phone, c.totalPurchase, c.totalPaid, c.due]);
    } else if (activeReport === 'supplier_due') {
      headers = ['Name', 'Company', 'Phone', 'Total Purchase', 'Total Paid', 'Due'];
      rows = data.suppliers.map((s) => [s.name, s.company, s.phone, s.totalPurchase, s.totalPaid, s.due]);
    } else if (activeReport === 'purchase') {
      headers = ['Invoice No', 'Date', 'Supplier', 'Total', 'Paid', 'Due'];
      rows = data.purchases.map((p) => [p.invoiceNo, p.date, p.supplierName, p.totalAmount, p.paidAmount, p.dueAmount]);
    } else if (activeReport === 'expense') {
      headers = ['Date', 'Category', 'Description', 'Method', 'Amount'];
      rows = data.expenses.map((e) => [e.date, e.category, e.description, e.paymentMethod, e.amount]);
    } else if (activeReport === 'cashbook') {
      headers = ['Date', 'Description', 'Account', 'Direction', 'Amount'];
      rows = data.cashbook.map((c) => [c.date, c.description, c.account, c.direction, c.amount]);
    } else {
      headers = ['Metric', 'Amount'];
      rows = [
        ['Total Sales Revenue', computed.totalRevenue],
        ['Cost of Goods Sold', computed.totalCOGS],
        ['Gross Profit', computed.grossProfit],
        ['Total Expenses', computed.totalExpenses],
        ['Net Profit', computed.netProfit],
      ];
    }

    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.shop.code}_${activeReport}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            {t(lang, 'ব্যবসায়িক রিপোর্টস (Business Reports)', 'Business Reports')}
          </h1>
          <p className="text-xs text-slate-500">
            {t(
              lang,
              'দৈনিক ও মাসিক বিক্রি, লাভ-ক্ষতি, স্টক, বাকি ও ক্যাশবুক রিপোর্ট PDF/প্রিন্ট বা CSV ডাউনলোড করুন',
              'Export or print Daily Sales, Monthly Sales, P&L, Stock, Due, and Cashbook reports'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            {t(lang, 'CSV ডাউনলোড', 'Export CSV')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            {t(lang, 'PDF / প্রিন্ট করুন', 'Print / Save PDF')}
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="no-print flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveReport(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeReport === tab.key
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? tab.bn : tab.en}
          </button>
        ))}
      </div>

      {/* Printable Report Sheet */}
      <div className="print-sheet rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
          <div>
            <div className="font-display text-lg font-bold text-slate-900">{data.shop.name}</div>
            <div className="text-xs text-slate-500">
              {data.shop.address} · {data.shop.ownerPhone}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm font-bold text-slate-900">
              {(() => {
                const found = REPORT_TABS.find((r) => r.key === activeReport);
                return lang === 'bn' ? found?.bn : found?.en;
              })()}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {t(lang, 'তারিখ', 'Generated')}: {formatDate(new Date().toISOString(), lang)}
            </div>
          </div>
        </div>

        {/* Report Body */}
        {(activeReport === 'daily_sales' || activeReport === 'monthly_sales') && (() => {
          const list = activeReport === 'daily_sales' ? computed.todaySales : computed.monthlySales;
          const sumTotal = list.reduce((s, x) => s + x.totalAmount, 0);
          const sumPaid = list.reduce((s, x) => s + x.paidAmount, 0);
          const sumDue = list.reduce((s, x) => s + x.dueAmount, 0);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-slate-500">{t(lang, 'মোট বিক্রি', 'Total Sales')}</div>
                  <div className="mt-1 font-mono-num text-lg font-bold text-slate-900">
                    {formatTaka(sumTotal, lang)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-slate-500">{t(lang, 'নগদ/ডিজিটাল জমা', 'Collected')}</div>
                  <div className="mt-1 font-mono-num text-lg font-bold text-emerald-700">
                    {formatTaka(sumPaid, lang)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-slate-500">{t(lang, 'বাকি', 'Due')}</div>
                  <div className="mt-1 font-mono-num text-lg font-bold text-rose-600">
                    {formatTaka(sumDue, lang)}
                  </div>
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">{t(lang, 'মেমো', 'Memo')}</th>
                    <th className="py-2 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                    <th className="py-2 font-medium">{t(lang, 'কাস্টমার', 'Customer')}</th>
                    <th className="py-2 font-medium">{t(lang, 'মাধ্যম', 'Method')}</th>
                    <th className="py-2 text-right font-medium">{t(lang, 'মোট', 'Total')}</th>
                    <th className="py-2 text-right font-medium">{t(lang, 'জমা', 'Paid')}</th>
                    <th className="py-2 text-right font-medium">{t(lang, 'বাকি', 'Due')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 font-mono-num font-semibold">{s.memoNo}</td>
                      <td className="py-2.5 tabular-nums text-slate-500">{formatDateTime(s.date, lang)}</td>
                      <td className="py-2.5">{s.customerName}</td>
                      <td className="py-2.5">{s.paymentMethod}</td>
                      <td className="py-2.5 text-right font-mono-num">{formatTaka(s.totalAmount, lang)}</td>
                      <td className="py-2.5 text-right font-mono-num text-emerald-700">
                        {formatTaka(s.paidAmount, lang)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-rose-600">
                        {formatTaka(s.dueAmount, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {activeReport === 'profit_loss' && (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="py-3 font-medium text-slate-700">{t(lang, 'মোট বিক্রয় আয় (Sales Revenue)', 'Total Sales Revenue')}</td>
                <td className="py-3 text-right font-mono-num font-bold text-slate-900">
                  {formatTaka(computed.totalRevenue, lang)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-700">{t(lang, 'বিক্রিত পণ্যের ক্রয়মূল্য (COGS)', 'Cost of Goods Sold (COGS)')}</td>
                <td className="py-3 text-right font-mono-num text-rose-600">
                  -{formatTaka(computed.totalCOGS, lang)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td className="py-3 pl-2 text-slate-900">{t(lang, 'মোট গ্রস লাভ (Gross Profit)', 'Gross Profit')}</td>
                <td className="py-3 pr-2 text-right font-mono-num text-emerald-700">
                  {formatTaka(computed.grossProfit, lang)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-700">{t(lang, 'মোট দোকানের খরচ (Operating Expenses)', 'Total Operating Expenses')}</td>
                <td className="py-3 text-right font-mono-num text-rose-600">
                  -{formatTaka(computed.totalExpenses, lang)}
                </td>
              </tr>
              <tr className="bg-emerald-50 font-bold">
                <td className="py-3.5 pl-2 text-slate-900">{t(lang, 'নিট লাভ / ক্ষতি (Net Profit)', 'Net Profit / Loss')}</td>
                <td
                  className={`py-3.5 pr-2 text-right font-mono-num text-base ${
                    computed.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatTaka(computed.netProfit, lang)}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {activeReport === 'purchase' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">{t(lang, 'ইনভয়েস', 'Invoice')}</th>
                <th className="py-2 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                <th className="py-2 font-medium">{t(lang, 'সাপ্লায়ার', 'Supplier')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'মোট ক্রয়', 'Total')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'পরিশোধ', 'Paid')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'বাকি', 'Due')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.purchases.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 font-mono-num font-semibold">{p.invoiceNo}</td>
                  <td className="py-2.5 tabular-nums text-slate-500">{formatDateTime(p.date, lang)}</td>
                  <td className="py-2.5">{p.supplierName}</td>
                  <td className="py-2.5 text-right font-mono-num">{formatTaka(p.totalAmount, lang)}</td>
                  <td className="py-2.5 text-right font-mono-num text-emerald-700">{formatTaka(p.paidAmount, lang)}</td>
                  <td className="py-2.5 text-right font-mono-num text-rose-600">{formatTaka(p.dueAmount, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeReport === 'expense' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                <th className="py-2 font-medium">{t(lang, 'খাত', 'Category')}</th>
                <th className="py-2 font-medium">{t(lang, 'বিবরণ', 'Description')}</th>
                <th className="py-2 font-medium">{t(lang, 'মাধ্যম', 'Method')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'টাকা', 'Amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.expenses.map((e) => (
                <tr key={e.id}>
                  <td className="py-2.5 tabular-nums text-slate-500">{formatDateTime(e.date, lang)}</td>
                  <td className="py-2.5 font-semibold">{e.category}</td>
                  <td className="py-2.5">{e.description}</td>
                  <td className="py-2.5">{e.paymentMethod}</td>
                  <td className="py-2.5 text-right font-mono-num font-bold text-rose-600">
                    {formatTaka(e.amount, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeReport === 'stock' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-slate-500">{t(lang, 'মোট স্টক মূল্য (ক্রয়মূল্যে)', 'Stock Value (Cost)')}</div>
                <div className="mt-1 font-mono-num text-lg font-bold text-slate-900">
                  {formatTaka(computed.totalStockCost, lang)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-slate-500">{t(lang, 'সম্ভাব্য বিক্রয় মূল্য', 'Potential Retail Value')}</div>
                <div className="mt-1 font-mono-num text-lg font-bold text-emerald-700">
                  {formatTaka(computed.totalStockRetail, lang)}
                </div>
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">{t(lang, 'কোড', 'Code')}</th>
                  <th className="py-2 font-medium">{t(lang, 'পণ্যের নাম', 'Product')}</th>
                  <th className="py-2 font-medium">{t(lang, 'ক্যাটাগরি', 'Category')}</th>
                  <th className="py-2 text-right font-medium">{t(lang, 'স্টক', 'Stock')}</th>
                  <th className="py-2 text-right font-medium">{t(lang, 'ক্রয়দর', 'Cost')}</th>
                  <th className="py-2 text-right font-medium">{t(lang, 'স্টক মূল্য', 'Valuation')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-mono-num">{p.code}</td>
                    <td className="py-2.5 font-medium">{p.name}</td>
                    <td className="py-2.5 text-slate-500">{p.category}</td>
                    <td className="py-2.5 text-right font-mono-num font-semibold">
                      {p.stock} {p.unit}
                    </td>
                    <td className="py-2.5 text-right font-mono-num">{formatTaka(p.purchasePrice, lang)}</td>
                    <td className="py-2.5 text-right font-mono-num font-bold text-slate-900">
                      {formatTaka(p.stock * p.purchasePrice, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'customer_due' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">{t(lang, 'কাস্টমার', 'Customer')}</th>
                <th className="py-2 font-medium">{t(lang, 'মোবাইল', 'Phone')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'মোট কেনাকাটা', 'Purchase')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'জমা', 'Paid')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'বাকি পাওনা', 'Due')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.customers.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 font-semibold">{c.name}</td>
                  <td className="py-2.5 font-mono-num">{c.phone}</td>
                  <td className="py-2.5 text-right font-mono-num">{formatTaka(c.totalPurchase, lang)}</td>
                  <td className="py-2.5 text-right font-mono-num text-emerald-700">{formatTaka(c.totalPaid, lang)}</td>
                  <td className="py-2.5 text-right font-mono-num font-bold text-rose-600">
                    {formatTaka(c.due, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeReport === 'supplier_due' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">{t(lang, 'সাপ্লায়ার', 'Supplier')}</th>
                <th className="py-2 font-medium">{t(lang, 'মোবাইল', 'Phone')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'মোট ক্রয়', 'Purchase')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'পরিশোধ', 'Paid')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'সাপ্লায়ার বাকি', 'Payable Due')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 font-semibold">{s.name}</td>
                  <td className="py-2.5 font-mono-num">{s.phone}</td>
                  <td className="py-2.5 text-right font-mono-num">{formatTaka(s.totalPurchase, lang)}</td>
                  <td className="py-2.5 text-right font-mono-num text-emerald-700">{formatTaka(s.totalPaid, lang)}</td>
                  <td className="py-2.5 text-right font-mono-num font-bold text-rose-600">
                    {formatTaka(s.due, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeReport === 'cashbook' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                <th className="py-2 font-medium">{t(lang, 'বিবরণ', 'Description')}</th>
                <th className="py-2 font-medium">{t(lang, 'অ্যাকাউন্ট', 'Account')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'জমা (In)', 'In')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'খরচ (Out)', 'Out')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.cashbook.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 tabular-nums text-slate-500">{formatDateTime(c.date, lang)}</td>
                  <td className="py-2.5">{c.description}</td>
                  <td className="py-2.5">{c.account}</td>
                  <td className="py-2.5 text-right font-mono-num text-emerald-700">
                    {c.direction === 'in' ? formatTaka(c.amount, lang) : '—'}
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-rose-600">
                    {c.direction === 'out' ? formatTaka(c.amount, lang) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
