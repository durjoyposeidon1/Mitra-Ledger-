import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Language, PaymentMethod, ShopBootstrapData } from '../shared/types';
import { formatDateTime, formatTaka, t } from '../lib/format';
import { api } from '../lib/api';

interface PurchaseViewProps {
  data: ShopBootstrapData;
  lang: Language;
  onRefresh: () => Promise<void>;
}

interface PurchaseLine {
  productId: string;
  qty: number;
  purchasePrice: number;
}

export function PurchaseView({ data, lang, onRefresh }: PurchaseViewProps) {
  const [supplierId, setSupplierId] = useState(data.suppliers[0]?.id || '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<PurchaseLine[]>(() =>
    data.products[0]
      ? [{ productId: data.products[0].id, qty: 10, purchasePrice: data.products[0].purchasePrice }]
      : []
  );
  const [paidInput, setPaidInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const addLine = () => {
    const first = data.products[0];
    if (!first) return;
    setLines((prev) => [
      ...prev,
      { productId: first.id, qty: 10, purchasePrice: first.purchasePrice },
    ]);
  };

  const updateLine = (idx: number, patch: Partial<PurchaseLine>) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const next = { ...l, ...patch };
        if (patch.productId) {
          const prod = data.products.find((p) => p.id === patch.productId);
          if (prod) next.purchasePrice = prod.purchasePrice;
        }
        return next;
      })
    );
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalPurchase = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty * l.purchasePrice, 0),
    [lines]
  );
  const paidAmount =
    paidInput === '' ? totalPurchase : Math.min(totalPurchase, Math.max(0, Number(paidInput) || 0));
  const supplierDue = Math.max(0, totalPurchase - paidAmount);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMsg(t(lang, 'সাপ্লায়ার নির্বাচন করুন', 'Please select a supplier'));
      return;
    }
    if (lines.length === 0) {
      setErrorMsg(t(lang, 'অন্তত একটি পণ্য যোগ করুন', 'Add at least one product'));
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const created = await api.createPurchase(data.shop.id, {
        supplierId,
        invoiceNo: invoiceNo.trim() || undefined,
        date: purchaseDate ? new Date(`${purchaseDate}T12:00:00`).toISOString() : undefined,
        items: lines,
        paidAmount,
        paymentMethod,
        note,
      });
      setInvoiceNo('');
      setPaidInput('');
      setNote('');
      setSuccessMsg(
        t(
          lang,
          `ক্রয় ইনভয়েস ${created.invoiceNo} যুক্ত হয়েছে ও স্টক বৃদ্ধি পেয়েছে`,
          `Purchase ${created.invoiceNo} saved and stock incremented!`
        )
      );
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to record purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-900">
          {t(lang, 'ক্রয় হিসাব (Purchase Management)', 'Purchase Management')}
        </h1>
        <p className="text-xs text-slate-500">
          {t(
            lang,
            'সাপ্লায়ার থেকে পণ্য ক্রয় এন্ট্রি দিলে স্বয়ংক্রিয়ভাবে স্টক বাড়বে এবং সাপ্লায়ার লেজার আপডেট হবে',
            'Recording a purchase automatically increments product stock and updates supplier due & cashbook'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* New Purchase Form */}
        <form
          onSubmit={handleCreatePurchase}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 lg:col-span-5"
        >
          <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
            {t(lang, 'নতুন ক্রয় এন্ট্রি', 'New Purchase Entry')}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'সাপ্লায়ার / পাইকার *', 'Supplier *')}
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                {data.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.company || s.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'ইনভয়েস নং', 'Invoice No')}
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder={t(lang, 'অটো জেনারেট হবে', 'Auto generated')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'ক্রয়ের তারিখ', 'Purchase Date')}
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Product Lines */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{t(lang, 'ক্রয়কৃত পণ্যসমূহ', 'Purchased Items')}</span>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                {t(lang, 'পণ্য যোগ', 'Add Item')}
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-xs"
                >
                  <select
                    value={line.productId}
                    onChange={(e) => updateLine(idx, { productId: e.target.value })}
                    className="col-span-5 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none"
                  >
                    {data.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={line.qty}
                    onChange={(e) => updateLine(idx, { qty: Math.max(1, Number(e.target.value)) })}
                    title={t(lang, 'পরিমাণ', 'Qty')}
                    className="col-span-3 rounded border border-slate-200 bg-white px-2 py-1.5 text-right font-mono-num text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    value={line.purchasePrice}
                    onChange={(e) =>
                      updateLine(idx, { purchasePrice: Math.max(0, Number(e.target.value)) })
                    }
                    title={t(lang, 'ক্রয়মূল্য', 'Unit Cost')}
                    className="col-span-3 rounded border border-slate-200 bg-white px-2 py-1.5 text-right font-mono-num text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="col-span-1 flex justify-center text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payment */}
          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between font-bold text-slate-900">
              <span>{t(lang, 'মোট ক্রয় মূল্য', 'Total Purchase')}</span>
              <span className="font-mono-num text-sm text-emerald-700">
                {formatTaka(totalPurchase, lang)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-600">{t(lang, 'পরিশোধিত টাকা', 'Paid Amount')}</label>
              <input
                type="number"
                min={0}
                max={totalPurchase}
                value={paidInput}
                placeholder={String(totalPurchase)}
                onChange={(e) => setPaidInput(e.target.value)}
                className="w-32 rounded-lg border border-slate-200 px-2.5 py-1.5 text-right font-mono-num text-xs font-semibold"
              />
            </div>

            <div className="flex justify-between">
              <span className="text-slate-600">{t(lang, 'সাপ্লায়ার বাকি', 'Supplier Due')}</span>
              <span className="font-mono-num font-bold text-rose-600">
                {formatTaka(supplierDue, lang)}
              </span>
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
                    className={`rounded-lg border py-1.5 text-xs font-semibold ${
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

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(lang, 'নোট (ঐচ্ছিক)', 'Note (optional)')}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
            />
          </div>

          {errorMsg && <p className="text-xs font-medium text-rose-600">{errorMsg}</p>}
          {successMsg && <p className="text-xs font-medium text-emerald-700">{successMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? t(lang, 'সংরক্ষণ হচ্ছে...', 'Saving...') : t(lang, 'ক্রয় সেভ ও স্টক যোগ করুন', 'Save Purchase & Add Stock')}
          </button>
        </form>

        {/* Purchase History Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
            {t(lang, 'ক্রয় তালিকা (Purchase History)', 'Purchase History')}
          </h2>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 font-medium">{t(lang, 'ইনভয়েস', 'Invoice')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'সাপ্লায়ার', 'Supplier')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'মোট ক্রয়', 'Total')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'পরিশোধ', 'Paid')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'বাকি', 'Due')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono-num font-semibold text-slate-900">
                      {pur.invoiceNo}
                      <div className="text-[11px] font-normal text-slate-400">
                        {pur.items.length} {t(lang, 'টি পণ্য', 'items')}
                      </div>
                    </td>
                    <td className="py-3 tabular-nums text-slate-500">{formatDateTime(pur.date, lang)}</td>
                    <td className="py-3 font-medium text-slate-900">
                      {pur.supplierName}
                      <div className="text-[11px] font-normal text-slate-400">{pur.paymentMethod}</div>
                    </td>
                    <td className="py-3 text-right font-mono-num font-semibold text-slate-900">
                      {formatTaka(pur.totalAmount, lang)}
                    </td>
                    <td className="py-3 text-right font-mono-num text-emerald-700">
                      {formatTaka(pur.paidAmount, lang)}
                    </td>
                    <td className="py-3 text-right font-mono-num font-semibold">
                      {pur.dueAmount > 0 ? (
                        <span className="text-rose-600">{formatTaka(pur.dueAmount, lang)}</span>
                      ) : (
                        <span className="text-slate-400">৳০</span>
                      )}
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
