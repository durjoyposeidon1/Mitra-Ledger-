import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Plus,
  Smartphone,
  Trash2,
} from 'lucide-react';
import type {
  ExpenseCategory,
  Language,
  PaymentMethod,
  ShopBootstrapData,
} from '../shared/types';
import { formatDateTime, formatTaka, isSameDay, t } from '../lib/format';
import { api } from '../lib/api';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'দোকান ভাড়া',
  'কর্মচারীর বেতন',
  'বিদ্যুৎ বিল',
  'পরিবহন',
  'চা-নাস্তা',
  'অন্যান্য খরচ',
];

interface ExpensesViewProps {
  data: ShopBootstrapData;
  lang: Language;
  onRefresh: () => Promise<void>;
}

export function ExpensesView({ data, lang, onRefresh }: ExpensesViewProps) {
  const [category, setCategory] = useState<ExpenseCategory>('দোকান ভাড়া');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => {
    const now = new Date();
    const todayTotal = data.expenses
      .filter((e) => isSameDay(e.date, now))
      .reduce((s, e) => s + e.amount, 0);
    const monthTotal = data.expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
    const allTotal = data.expenses.reduce((s, e) => s + e.amount, 0);
    return { todayTotal, monthTotal, allTotal };
  }, [data.expenses]);

  const filtered = useMemo(() => {
    if (catFilter === 'ALL') return data.expenses;
    return data.expenses.filter((e) => e.category === catFilter);
  }, [data.expenses, catFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await api.createExpense(data.shop.id, {
        category,
        description: description.trim() || category,
        amount: Number(amount),
        paymentMethod,
        date: date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString(),
      });
      setDescription('');
      setAmount('');
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteExpense(data.shop.id, id);
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-900">
          {t(lang, 'দোকানের খরচ (Expense Management)', 'Shop Expense Management')}
        </h1>
        <p className="text-xs text-slate-500">
          {t(
            lang,
            'দোকান ভাড়া, কর্মচারীর বেতন, বিদ্যুৎ বিল, পরিবহন ও প্রতিদিনের খরচ হিসাব রাখুন',
            'Record shop rent, staff salary, electricity bill, transport, and daily expenses'
          )}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="text-xs font-medium text-slate-600">{t(lang, 'আজকের খরচ', "Today's Expense")}</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-rose-700">
            {formatTaka(summary.todayTotal, lang)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-600">{t(lang, 'এই মাসের খরচ', 'This Month Expense')}</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900">
            {formatTaka(summary.monthTotal, lang)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-600">{t(lang, 'মোট রেকর্ডকৃত খরচ', 'Total Recorded Expenses')}</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900">
            {formatTaka(summary.allTotal, lang)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-xs lg:col-span-4"
        >
          <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
            {t(lang, 'নতুন খরচ যোগ করুন', 'Record New Expense')}
          </h2>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              {t(lang, 'খরচের খাত *', 'Category *')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              {t(lang, 'টাকার পরিমাণ (৳) *', 'Amount (৳) *')}
            </label>
            <input
              required
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm font-semibold"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'বিবরণ', 'Description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(lang, 'খরচের বিস্তারিত লিখুন...', 'Expense details...')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'তারিখ', 'Date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              {t(lang, 'পেমেন্ট মাধ্যম', 'Payment Method')}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'bKash', 'Nagad', 'Bank'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-lg border py-1.5 font-semibold ${
                    paymentMethod === m
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? t(lang, 'সেভ হচ্ছে...', 'Saving...') : t(lang, 'খরচ সেভ করুন', 'Save Expense')}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              {t(lang, 'খরচের তালিকা', 'Expense History')}
            </h2>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
            >
              <option value="ALL">{t(lang, 'সব খাত', 'All Categories')}</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'খাত', 'Category')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'বিবরণ', 'Description')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'মাধ্যম', 'Account')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'পরিমাণ', 'Amount')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'মুছুন', 'Delete')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-3 tabular-nums text-slate-500">{formatDateTime(exp.date, lang)}</td>
                    <td className="py-3 font-semibold text-slate-900">{exp.category}</td>
                    <td className="py-3 text-slate-600">{exp.description}</td>
                    <td className="py-3 text-slate-700">{exp.paymentMethod}</td>
                    <td className="py-3 text-right font-mono-num font-bold text-rose-600">
                      {formatTaka(exp.amount, lang)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(exp.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CashbookViewProps {
  data: ShopBootstrapData;
  lang: Language;
  onRefresh: () => Promise<void>;
}

export function CashbookView({ data, lang, onRefresh }: CashbookViewProps) {
  const [accountFilter, setAccountFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [account, setAccount] = useState<PaymentMethod>('Cash');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [partyName, setPartyName] = useState('');
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const openingTotal =
      (data.shop.openingCash || 0) + (data.shop.openingBank || 0) + (data.shop.openingMobile || 0);

    let cashBal = data.shop.openingCash || 0;
    let bankBal = data.shop.openingBank || 0;
    let mobileBal = data.shop.openingMobile || 0;

    let totalIn = 0;
    let totalOut = 0;

    let todayCashSale = 0;
    let todayCustPay = 0;
    let todayPurchasePay = 0;
    let todayExpense = 0;

    for (const txn of data.cashbook) {
      const delta = txn.direction === 'in' ? txn.amount : -txn.amount;
      if (txn.account === 'Cash') cashBal += delta;
      else if (txn.account === 'Bank') bankBal += delta;
      else mobileBal += delta;

      if (txn.direction === 'in') totalIn += txn.amount;
      else totalOut += txn.amount;

      if (isSameDay(txn.date, now)) {
        if (txn.type === 'sale_cash') todayCashSale += txn.amount;
        if (txn.type === 'customer_payment') todayCustPay += txn.amount;
        if (txn.type === 'purchase_payment' || txn.type === 'supplier_payment')
          todayPurchasePay += txn.amount;
        if (txn.type === 'expense') todayExpense += txn.amount;
      }
    }

    const closingBalance = cashBal + bankBal + mobileBal;
    const todayOpening =
      closingBalance - (todayCashSale + todayCustPay - todayPurchasePay - todayExpense);

    return {
      openingTotal,
      todayOpening,
      cashBal,
      bankBal,
      mobileBal,
      totalIn,
      totalOut,
      closingBalance,
      todayCashSale,
      todayCustPay,
      todayPurchasePay,
      todayExpense,
    };
  }, [data]);

  const filteredTxns = useMemo(() => {
    if (accountFilter === 'ALL') return data.cashbook;
    return data.cashbook.filter((c) => c.account === accountFilter);
  }, [data.cashbook, accountFilter]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) return;
    setSaving(true);
    try {
      await api.createCashbookEntry(data.shop.id, {
        direction,
        account,
        amount: Number(amount),
        description: description.trim(),
        partyName: partyName.trim() || undefined,
      });
      setAmount('');
      setDescription('');
      setPartyName('');
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-900">
          {t(lang, 'হিসাব নিকাশ / ক্যাশবুক (Cashbook)', 'Accounting & Cashbook')}
        </h1>
        <p className="text-xs text-slate-500">
          {t(
            lang,
            'দোকানের প্রতিটি টাকা আসা ও যাওয়ার স্বয়ংক্রিয় হিসাব এবং নগদ, ব্যাংক ও মোবাইল ব্যাংকিং ব্যালেন্স',
            'Automated cash inflow/outflow ledger with Cash, Bank, and Mobile Banking balances'
          )}
        </p>
      </div>

      {/* Account Balances Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>{t(lang, 'হাতে নগদ (Cash)', 'Cash Balance')}</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 font-mono-num text-xl font-bold text-emerald-700">
            {formatTaka(stats.cashBal, lang)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>{t(lang, 'ব্যাংক ব্যালেন্স', 'Bank Balance')}</span>
            <Building2 className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-1.5 font-mono-num text-xl font-bold text-slate-900">
            {formatTaka(stats.bankBal, lang)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>{t(lang, 'বিকাশ / নগদ ব্যালেন্স', 'Mobile Banking')}</span>
            <Smartphone className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-1.5 font-mono-num text-xl font-bold text-slate-900">
            {formatTaka(stats.mobileBal, lang)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>{t(lang, 'মোট টাকা এসেছে', 'Total Inflow')}</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 font-mono-num text-xl font-bold text-emerald-700">
            {formatTaka(stats.totalIn, lang)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>{t(lang, 'মোট টাকা খরচ হয়েছে', 'Total Outflow')}</span>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-1.5 font-mono-num text-xl font-bold text-rose-700">
            {formatTaka(stats.totalOut, lang)}
          </div>
        </div>
      </div>

      {/* Daily Cashbook Statement + Manual Cash In/Out */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Daily Cashbook Summary Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
            {t(lang, 'দৈনিক ক্যাশবুক সামারি (আজকের হিসাব)', "Today's Automated Cashbook Summary")}
          </h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 text-left font-medium">{t(lang, 'বিবরণ', 'Particulars')}</th>
                <th className="py-2 text-right font-medium">{t(lang, 'টাকা (৳)', 'Amount (৳)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="py-3 font-medium text-slate-700">
                  {t(lang, 'প্রারম্ভিক ব্যালেন্স (Opening Balance)', 'Opening Balance')}
                </td>
                <td className="py-3 text-right font-mono-num font-semibold text-slate-900">
                  {formatTaka(stats.todayOpening, lang)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-700">
                  + {t(lang, 'আজকের বিক্রি থেকে নগদ/ডিজিটাল প্রাপ্তি', "Today's Sales Received")}
                </td>
                <td className="py-3 text-right font-mono-num font-semibold text-emerald-700">
                  +{formatTaka(stats.todayCashSale, lang)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-700">
                  + {t(lang, 'কাস্টমার বাকি আদায় (Payment Received)', 'Customer Payment Received')}
                </td>
                <td className="py-3 text-right font-mono-num font-semibold text-emerald-700">
                  +{formatTaka(stats.todayCustPay, lang)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-700">
                  - {t(lang, 'ক্রয় ও সাপ্লায়ার পেমেন্ট', 'Purchase & Supplier Payment')}
                </td>
                <td className="py-3 text-right font-mono-num font-semibold text-rose-600">
                  -{formatTaka(stats.todayPurchasePay, lang)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-700">- {t(lang, 'দোকানের খরচ (Shop Expense)', 'Shop Expense')}</td>
                <td className="py-3 text-right font-mono-num font-semibold text-rose-600">
                  -{formatTaka(stats.todayExpense, lang)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="py-3.5 pl-2 text-slate-900">
                  {t(lang, 'সমাপনী ব্যালেন্স (Closing Balance)', 'Closing Balance')}
                </td>
                <td className="py-3.5 pr-2 text-right font-mono-num text-base text-emerald-700">
                  {formatTaka(stats.closingBalance, lang)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Manual Cash In / Out Entry */}
        <form
          onSubmit={handleAddEntry}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-xs lg:col-span-5"
        >
          <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
            {t(lang, 'জমা / উত্তোলন এন্ট্রি (Cash In / Out)', 'Manual Cash In / Out')}
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('in')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border py-2 font-semibold ${
                direction === 'in'
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              {t(lang, 'টাকা জমা (Cash In)', 'Cash In')}
            </button>
            <button
              type="button"
              onClick={() => setDirection('out')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border py-2 font-semibold ${
                direction === 'out'
                  ? 'border-rose-600 bg-rose-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              {t(lang, 'টাকা উত্তোলন (Cash Out)', 'Cash Out')}
            </button>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              {t(lang, 'অ্যাকাউন্ট', 'Account')}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'bKash', 'Nagad', 'Bank'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAccount(m)}
                  className={`rounded-lg border py-1.5 font-semibold ${
                    account === m
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              {t(lang, 'টাকার পরিমাণ (৳) *', 'Amount (৳) *')}
            </label>
            <input
              required
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm font-semibold"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              {t(lang, 'বিবরণ *', 'Description *')}
            </label>
            <input
              required
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(lang, 'যেমন: মালিকের মূলধন জমা / ব্যাংক উত্তোলন', 'e.g. Owner capital / withdrawal')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              {t(lang, 'ব্যক্তি/প্রতিষ্ঠান (ঐচ্ছিক)', 'Party Name (optional)')}
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? t(lang, 'সেভ হচ্ছে...', 'Saving...') : t(lang, 'ক্যাশবুকে যোগ করুন', 'Add to Cashbook')}
          </button>
        </form>
      </div>

      {/* Complete Transaction History */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            {t(lang, 'সম্পূর্ণ লেনদেন ইতিহাস (Transaction History)', 'Complete Transaction History')}
          </h2>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['ALL', 'Cash', 'bKash', 'Nagad', 'Bank'] as const).map((acc) => (
              <button
                key={acc}
                type="button"
                onClick={() => setAccountFilter(acc)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  accountFilter === acc ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {acc === 'ALL' ? t(lang, 'সব', 'All') : acc}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-medium">{t(lang, 'তারিখ ও সময়', 'Date & Time')}</th>
                <th className="py-2.5 font-medium">{t(lang, 'বিবরণ', 'Description')}</th>
                <th className="py-2.5 font-medium">{t(lang, 'অ্যাকাউন্ট', 'Account')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'জমা (In)', 'Cash In')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'খরচ (Out)', 'Cash Out')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxns.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50">
                  <td className="py-3 tabular-nums text-slate-500">{formatDateTime(txn.date, lang)}</td>
                  <td className="py-3">
                    <div className="font-medium text-slate-900">{txn.description}</div>
                    {txn.partyName && <div className="text-[11px] text-slate-400">{txn.partyName}</div>}
                  </td>
                  <td className="py-3 font-medium text-slate-700">{txn.account}</td>
                  <td className="py-3 text-right font-mono-num font-semibold text-emerald-700">
                    {txn.direction === 'in' ? `+${formatTaka(txn.amount, lang)}` : '—'}
                  </td>
                  <td className="py-3 text-right font-mono-num font-semibold text-rose-600">
                    {txn.direction === 'out' ? `-${formatTaka(txn.amount, lang)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
