import { useMemo, useState } from 'react';
import { Banknote, FileText, Plus, Search, X } from 'lucide-react';
import type {
  Customer,
  Language,
  PaymentMethod,
  ShopBootstrapData,
  Supplier,
} from '../shared/types';
import { formatDateTime, formatTaka, t } from '../lib/format';
import { api } from '../lib/api';

interface CustomersViewProps {
  data: ShopBootstrapData;
  lang: Language;
  onRefresh: () => Promise<void>;
}

export function CustomersView({ data, lang, onRefresh }: CustomersViewProps) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState('0');
  const [saving, setSaving] = useState(false);

  // Payment Modal
  const [payCustomer, setPayCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payNote, setPayNote] = useState('');

  // Ledger Modal
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.customers;
    return data.customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [data.customers, search]);

  const totalDue = useMemo(() => data.customers.reduce((s, c) => s + c.due, 0), [data.customers]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      await api.createCustomer(data.shop.id, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        openingDue: Number(openingDue) || 0,
      });
      setName('');
      setPhone('');
      setAddress('');
      setOpeningDue('0');
      setShowAdd(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCustomer) return;
    setSaving(true);
    try {
      await api.receiveCustomerPayment(data.shop.id, payCustomer.id, {
        amount: Number(payAmount) || 0,
        paymentMethod: payMethod,
        note: payNote.trim(),
      });
      setPayCustomer(null);
      setPayAmount('');
      setPayNote('');
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const ledgerEntries = useMemo(() => {
    if (!ledgerCustomer) return [];
    const sales = data.sales
      .filter((s) => s.customerId === ledgerCustomer.id)
      .map((s) => ({
        id: s.id,
        date: s.date,
        title: `${t(lang, 'বিক্রয় মেমো', 'Sales Memo')} — ${s.memoNo}`,
        debit: s.totalAmount,
        credit: s.paidAmount,
        method: s.paymentMethod,
      }));
    const payments = data.cashbook
      .filter((c) => c.type === 'customer_payment' && c.referenceId === ledgerCustomer.id)
      .map((c) => ({
        id: c.id,
        date: c.date,
        title: c.description,
        debit: 0,
        credit: c.amount,
        method: c.account,
      }));
    return [...sales, ...payments].sort((a, b) => b.date.localeCompare(a.date));
  }, [ledgerCustomer, data.sales, data.cashbook, lang]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            {t(lang, 'কাস্টমার ম্যানেজমেন্ট ও বাকি লেজার', 'Customer Management & Ledger')}
          </h1>
          <p className="text-xs text-slate-500">
            {t(lang, 'মোট বাকি পাওনা', 'Total Receivable')}:{' '}
            <span className="font-mono-num font-bold text-rose-600">{formatTaka(totalDue, lang)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          {t(lang, 'নতুন কাস্টমার', 'Add Customer')}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, 'নাম বা ফোন নম্বর খুঁজুন...', 'Search name or phone...')}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-medium">{t(lang, 'কাস্টমার', 'Customer')}</th>
                <th className="py-2.5 font-medium">{t(lang, 'মোবাইল', 'Phone')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'মোট কেনাকাটা', 'Total Purchase')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'মোট পরিশোধ', 'Total Paid')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'বাকি টাকা', 'Due Balance')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'অ্যাকশন', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 font-semibold text-slate-900">
                    {c.name}
                    {c.address && <div className="text-[11px] font-normal text-slate-400">{c.address}</div>}
                  </td>
                  <td className="py-3 font-mono-num text-slate-600">{c.phone}</td>
                  <td className="py-3 text-right font-mono-num text-slate-800">
                    {formatTaka(c.totalPurchase, lang)}
                  </td>
                  <td className="py-3 text-right font-mono-num text-emerald-700">
                    {formatTaka(c.totalPaid, lang)}
                  </td>
                  <td className="py-3 text-right font-mono-num font-bold">
                    {c.due > 0 ? (
                      <span className="text-rose-600">{formatTaka(c.due, lang)}</span>
                    ) : (
                      <span className="text-emerald-600">৳০</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {c.due > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPayCustomer(c);
                            setPayAmount(String(c.due));
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                        >
                          <Banknote className="h-3 w-3" />
                          {t(lang, 'বাকি আদায়', 'Collect Due')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setLedgerCustomer(c)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <FileText className="h-3 w-3" />
                        {t(lang, 'লেজার', 'Ledger')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {t(lang, 'নতুন কাস্টমার যোগ করুন', 'Add New Customer')}
              </h3>
              <button type="button" onClick={() => setShowAdd(false)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-3 p-5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'নাম *', 'Name *')}</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'মোবাইল *', 'Phone *')}</label>
                <input
                  required
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'ঠিকানা', 'Address')}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'পূর্বের বাকি (Opening Due)', 'Opening Due (৳)')}
                </label>
                <input
                  type="number"
                  min={0}
                  value={openingDue}
                  onChange={(e) => setOpeningDue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  {t(lang, 'সেভ করুন', 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Due Modal */}
      {payCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {t(lang, 'কাস্টমার বাকি আদায়', 'Collect Customer Payment')}
              </h3>
              <button type="button" onClick={() => setPayCustomer(null)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleReceivePayment} className="space-y-3 p-5 text-xs">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="font-semibold text-slate-900">{payCustomer.name}</div>
                <div className="mt-0.5 text-slate-500">
                  {t(lang, 'বর্তমান বাকি', 'Current Due')}:{' '}
                  <span className="font-mono-num font-bold text-rose-600">
                    {formatTaka(payCustomer.due, lang)}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'আদায়ের পরিমাণ (৳)', 'Amount Received (৳)')}
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  max={payCustomer.due}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm font-semibold"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'জমা অ্যাকাউন্ট', 'Account')}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'bKash', 'Nagad', 'Bank'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`rounded-lg border py-1.5 font-semibold ${
                        payMethod === m
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'নোট', 'Note')}</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayCustomer(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  {t(lang, 'পেমেন্ট জমা নিন', 'Record Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {ledgerCustomer.name} — {t(lang, 'কাস্টমার লেজার', 'Customer Ledger')}
                </h3>
                <p className="text-xs text-slate-500 font-mono-num">
                  {ledgerCustomer.phone} · {t(lang, 'বাকি', 'Due')}: {formatTaka(ledgerCustomer.due, lang)}
                </p>
              </div>
              <button type="button" onClick={() => setLedgerCustomer(null)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5">
              {ledgerEntries.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  {t(lang, 'কোনো লেনদেনের ইতিহাস নেই', 'No transaction history yet')}
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                      <th className="py-2 font-medium">{t(lang, 'বিবরণ', 'Description')}</th>
                      <th className="py-2 text-right font-medium">{t(lang, 'বিল / ক্রয়', 'Billed')}</th>
                      <th className="py-2 text-right font-medium">{t(lang, 'জমা', 'Paid')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerEntries.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2.5 tabular-nums text-slate-500">{formatDateTime(row.date, lang)}</td>
                        <td className="py-2.5 font-medium text-slate-900">
                          {row.title} <span className="text-slate-400">({row.method})</span>
                        </td>
                        <td className="py-2.5 text-right font-mono-num text-slate-800">
                          {row.debit > 0 ? formatTaka(row.debit, lang) : '—'}
                        </td>
                        <td className="py-2.5 text-right font-mono-num font-semibold text-emerald-700">
                          {row.credit > 0 ? formatTaka(row.credit, lang) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SuppliersViewProps {
  data: ShopBootstrapData;
  lang: Language;
  onRefresh: () => Promise<void>;
}

export function SuppliersView({ data, lang, onRefresh }: SuppliersViewProps) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState('0');
  const [saving, setSaving] = useState(false);

  const [paySupplier, setPaySupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payNote, setPayNote] = useState('');

  const [ledgerSupplier, setLedgerSupplier] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.suppliers;
    return data.suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
    );
  }, [data.suppliers, search]);

  const totalDue = useMemo(() => data.suppliers.reduce((s, sup) => s + sup.due, 0), [data.suppliers]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      await api.createSupplier(data.shop.id, {
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),
        address: address.trim(),
        openingDue: Number(openingDue) || 0,
      });
      setName('');
      setCompany('');
      setPhone('');
      setAddress('');
      setOpeningDue('0');
      setShowAdd(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplier) return;
    setSaving(true);
    try {
      await api.paySupplierDue(data.shop.id, paySupplier.id, {
        amount: Number(payAmount) || 0,
        paymentMethod: payMethod,
        note: payNote.trim(),
      });
      setPaySupplier(null);
      setPayAmount('');
      setPayNote('');
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const ledgerEntries = useMemo(() => {
    if (!ledgerSupplier) return [];
    const purchases = data.purchases
      .filter((p) => p.supplierId === ledgerSupplier.id)
      .map((p) => ({
        id: p.id,
        date: p.date,
        title: `${t(lang, 'ক্রয় ইনভয়েস', 'Purchase Invoice')} — ${p.invoiceNo}`,
        credit: p.totalAmount,
        debit: p.paidAmount,
        method: p.paymentMethod,
      }));
    const payments = data.cashbook
      .filter((c) => c.type === 'supplier_payment' && c.referenceId === ledgerSupplier.id)
      .map((c) => ({
        id: c.id,
        date: c.date,
        title: c.description,
        credit: 0,
        debit: c.amount,
        method: c.account,
      }));
    return [...purchases, ...payments].sort((a, b) => b.date.localeCompare(a.date));
  }, [ledgerSupplier, data.purchases, data.cashbook, lang]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            {t(lang, 'সাপ্লায়ার ম্যানেজমেন্ট ও লেজার', 'Supplier Management & Ledger')}
          </h1>
          <p className="text-xs text-slate-500">
            {t(lang, 'মোট সাপ্লায়ার বাকি', 'Total Supplier Payable')}:{' '}
            <span className="font-mono-num font-bold text-rose-600">{formatTaka(totalDue, lang)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          {t(lang, 'নতুন সাপ্লায়ার', 'Add Supplier')}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, 'সাপ্লায়ার বা কোম্পানি খুঁজুন...', 'Search supplier or company...')}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-medium">{t(lang, 'সাপ্লায়ার', 'Supplier')}</th>
                <th className="py-2.5 font-medium">{t(lang, 'মোবাইল', 'Phone')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'মোট ক্রয়', 'Total Purchase')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'পরিশোধিত', 'Total Paid')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'বাকি আছে', 'Due Payable')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'অ্যাকশন', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 font-semibold text-slate-900">
                    {s.name}
                    {s.company && <div className="text-[11px] font-normal text-slate-400">{s.company}</div>}
                  </td>
                  <td className="py-3 font-mono-num text-slate-600">{s.phone}</td>
                  <td className="py-3 text-right font-mono-num text-slate-800">
                    {formatTaka(s.totalPurchase, lang)}
                  </td>
                  <td className="py-3 text-right font-mono-num text-emerald-700">
                    {formatTaka(s.totalPaid, lang)}
                  </td>
                  <td className="py-3 text-right font-mono-num font-bold">
                    {s.due > 0 ? (
                      <span className="text-rose-600">{formatTaka(s.due, lang)}</span>
                    ) : (
                      <span className="text-emerald-600">৳০</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {s.due > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaySupplier(s);
                            setPayAmount(String(s.due));
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
                        >
                          <Banknote className="h-3 w-3" />
                          {t(lang, 'বাকি পরিশোধ', 'Pay Due')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setLedgerSupplier(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <FileText className="h-3 w-3" />
                        {t(lang, 'লেজার', 'Ledger')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {t(lang, 'নতুন সাপ্লায়ার যোগ করুন', 'Add New Supplier')}
              </h3>
              <button type="button" onClick={() => setShowAdd(false)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="space-y-3 p-5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'নাম *', 'Name *')}</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'কোম্পানি / প্রতিষ্ঠান', 'Company')}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'মোবাইল *', 'Phone *')}</label>
                <input
                  required
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'ঠিকানা', 'Address')}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'পূর্বের বাকি (Opening Due)', 'Opening Due (৳)')}
                </label>
                <input
                  type="number"
                  min={0}
                  value={openingDue}
                  onChange={(e) => setOpeningDue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  {t(lang, 'সেভ করুন', 'Save Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Due Modal */}
      {paySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {t(lang, 'সাপ্লায়ার বাকি পরিশোধ', 'Pay Supplier Due')}
              </h3>
              <button type="button" onClick={() => setPaySupplier(null)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handlePaySupplier} className="space-y-3 p-5 text-xs">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="font-semibold text-slate-900">{paySupplier.name}</div>
                <div className="mt-0.5 text-slate-500">
                  {t(lang, 'বাকি পাওনা', 'Payable Due')}:{' '}
                  <span className="font-mono-num font-bold text-rose-600">
                    {formatTaka(paySupplier.due, lang)}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'পরিশোধের পরিমাণ (৳)', 'Payment Amount (৳)')}
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  max={paySupplier.due}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm font-semibold"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'পেমেন্ট মাধ্যম', 'Payment Account')}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'bKash', 'Nagad', 'Bank'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`rounded-lg border py-1.5 font-semibold ${
                        payMethod === m
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'নোট', 'Note')}</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaySupplier(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  {t(lang, 'পেমেন্ট সম্পন্ন করুন', 'Confirm Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Ledger Modal */}
      {ledgerSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {ledgerSupplier.name} — {t(lang, 'সাপ্লায়ার লেজার', 'Supplier Ledger')}
                </h3>
                <p className="text-xs text-slate-500 font-mono-num">
                  {ledgerSupplier.phone} · {t(lang, 'বাকি', 'Due')}: {formatTaka(ledgerSupplier.due, lang)}
                </p>
              </div>
              <button type="button" onClick={() => setLedgerSupplier(null)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5">
              {ledgerEntries.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  {t(lang, 'কোনো লেনদেনের ইতিহাস নেই', 'No ledger history yet')}
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                      <th className="py-2 font-medium">{t(lang, 'বিবরণ', 'Description')}</th>
                      <th className="py-2 text-right font-medium">{t(lang, 'ক্রয় বিল', 'Purchase')}</th>
                      <th className="py-2 text-right font-medium">{t(lang, 'পরিশোধ', 'Paid')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerEntries.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2.5 tabular-nums text-slate-500">{formatDateTime(row.date, lang)}</td>
                        <td className="py-2.5 font-medium text-slate-900">
                          {row.title} <span className="text-slate-400">({row.method})</span>
                        </td>
                        <td className="py-2.5 text-right font-mono-num text-slate-800">
                          {row.credit > 0 ? formatTaka(row.credit, lang) : '—'}
                        </td>
                        <td className="py-2.5 text-right font-mono-num font-semibold text-emerald-700">
                          {row.debit > 0 ? formatTaka(row.debit, lang) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
