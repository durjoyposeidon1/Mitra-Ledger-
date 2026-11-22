import { useMemo, useState } from 'react';
import {
  Barcode,
  CheckCircle2,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type {
  Language,
  PaymentMethod,
  Product,
  Sale,
  ShopBootstrapData,
} from '../shared/types';
import { formatDateTime, formatTaka, t } from '../lib/format';
import { api } from '../lib/api';

interface SalesMemoViewProps {
  data: ShopBootstrapData;
  lang: Language;
  currentUserName: string;
  onRefresh: () => Promise<void>;
  onViewMemo: (sale: Sale) => void;
}

interface CartLine {
  product: Product;
  qty: number;
  unitPrice: number;
}

export function SalesMemoView({
  data,
  lang,
  currentUserName,
  onRefresh,
  onViewMemo,
}: SalesMemoViewProps) {
  const [subTab, setSubTab] = useState<'pos' | 'history'>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartLine[]>([]);

  // Customer & Payment state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [discount, setDiscount] = useState<string>('0');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMemo, setSuccessMemo] = useState<string>('');

  // History filter
  const [historySearch, setHistorySearch] = useState('');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(data.products.map((p) => p.category)));
    return ['ALL', ...cats];
  }, [data.products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      );
    });
  }, [data.products, selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setErrorMsg('');
    if (product.stock <= 0) {
      setErrorMsg(t(lang, `"${product.name}" স্টকে নেই!`, `"${product.name}" is out of stock!`));
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          setErrorMsg(
            t(
              lang,
              `"${product.name}" এর সর্বোচ্চ স্টক ${product.stock} ${product.unit}`,
              `Max stock reached for ${product.name} (${product.stock})`
            )
          );
          return prev;
        }
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { product, qty: 1, unitPrice: product.salePrice }];
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim().toLowerCase();
    if (!code) return;
    const match = data.products.find(
      (p) => p.barcode.toLowerCase() === code || p.code.toLowerCase() === code
    );
    if (match) {
      addToCart(match);
      setBarcodeInput('');
    } else {
      setErrorMsg(t(lang, `বারকোড "${barcodeInput}" পাওয়া যায়নি`, `Barcode "${barcodeInput}" not found`));
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.product.id !== productId) return line;
          const nextQty = line.qty + delta;
          if (nextQty <= 0) return null;
          if (nextQty > line.product.stock) {
            setErrorMsg(t(lang, 'স্টকের চেয়ে বেশি পরিমাণ দেওয়া যাবে না', 'Exceeds available stock'));
            return line;
          }
          return { ...line, qty: nextQty };
        })
        .filter((x): x is CartLine => x !== null)
    );
  };

  const updateCartPrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, unitPrice: Math.max(0, price) } : l))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.qty * l.unitPrice, 0),
    [cart]
  );
  const discountVal = Math.max(0, Number(discount) || 0);
  const totalAmount = Math.max(0, subtotal - discountVal);
  const paidVal =
    paidAmountInput === '' ? totalAmount : Math.min(totalAmount, Math.max(0, Number(paidAmountInput) || 0));
  const dueVal = Math.max(0, totalAmount - paidVal);

  const handleCreateQuickCustomer = async () => {
    if (!walkInName.trim() || !walkInPhone.trim()) {
      setErrorMsg(t(lang, 'কাস্টমারের নাম ও মোবাইল নম্বর দিন', 'Enter customer name and phone'));
      return;
    }
    try {
      const cust = await api.createCustomer(data.shop.id, {
        name: walkInName.trim(),
        phone: walkInPhone.trim(),
        address: '',
      });
      await onRefresh();
      setSelectedCustomerId(cust.id);
      setShowQuickCustomer(false);
      setWalkInName('');
      setWalkInPhone('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create customer');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg(t(lang, 'মেমো তৈরি করতে অন্তত একটি পণ্য যোগ করুন', 'Add at least one product to cart'));
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const selectedCustomer = data.customers.find((c) => c.id === selectedCustomerId);
      const sale = await api.createSale(data.shop.id, {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        customerName: selectedCustomer
          ? selectedCustomer.name
          : walkInName.trim() || t(lang, 'খুচরা ক্রেতা (Walk-in)', 'Walk-in Customer'),
        customerPhone: selectedCustomer ? selectedCustomer.phone : walkInPhone.trim(),
        items: cart.map((c) => ({
          productId: c.product.id,
          qty: c.qty,
          unitPrice: c.unitPrice,
        })),
        discount: discountVal,
        paidAmount: paidVal,
        paymentMethod,
        note,
        createdBy: currentUserName,
      });

      setCart([]);
      setDiscount('0');
      setPaidAmountInput('');
      setNote('');
      setSuccessMemo(sale.memoNo);
      await onRefresh();
      onViewMemo(sale);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create memo');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSalesHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return data.sales;
    return data.sales.filter(
      (s) =>
        s.memoNo.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.toLowerCase().includes(q)
    );
  }, [data.sales, historySearch]);

  return (
    <div className="space-y-5">
      {/* Sub-navigation Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            {t(lang, 'বিক্রি এবং মেমো (POS)', 'Sales & Memo Billing')}
          </h1>
          <p className="text-xs text-slate-500">
            {t(
              lang,
              'পণ্য নির্বাচন করুন, বারকোড স্ক্যান করুন এবং তাৎক্ষণিক থার্মাল মেমো তৈরি করুন',
              'Select products, scan barcodes, and generate instant thermal/PDF memos'
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
          <button
            type="button"
            onClick={() => setSubTab('pos')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'pos' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t(lang, 'নতুন মেমো তৈরি', 'New Sale / POS')}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('history')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'history' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t(lang, `বিক্রয় তালিকা (${data.sales.length})`, `Sales History (${data.sales.length})`)}
          </button>
        </div>
      </div>

      {subTab === 'pos' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Side: Product Picker & Barcode Scanner */}
          <div className="space-y-4 lg:col-span-7 xl:col-span-8">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Product Search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t(lang, 'পণ্যের নাম বা কোড লিখুন...', 'Search by name or SKU...')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Barcode Scanner Input */}
                <form onSubmit={handleBarcodeSubmit} className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder={t(lang, 'বারকোড স্ক্যান / Enter চাপুন...', 'Scan barcode & press Enter...')}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 font-mono-num text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 whitespace-nowrap shrink-0"
                  >
                    {t(lang, 'স্ক্যান', 'Add')}
                  </button>
                </form>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? t(lang, 'সব পণ্য', 'All Products') : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white py-14 text-center text-sm text-slate-500">
                {t(lang, 'কোনো পণ্য পাওয়া যায়নি', 'No matching products found.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const low = product.stock <= product.minStock;
                  const out = product.stock <= 0;
                  const inCart = cart.find((c) => c.product.id === product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={out}
                      onClick={() => addToCart(product)}
                      className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                        out
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                          : inCart
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : 'border-slate-200 bg-white hover:border-emerald-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono-num text-[11px] font-medium text-slate-500">
                            {product.code} · {product.category}
                          </span>
                          {inCart && (
                            <span className="font-mono-num text-xs font-bold text-emerald-700">
                              ×{inCart.qty}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold text-slate-900">
                          {product.name}
                        </h3>
                      </div>

                      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                        <div>
                          <div className="font-mono-num text-base font-bold text-emerald-700">
                            {formatTaka(product.salePrice, lang)}
                          </div>
                          <div
                            className={`text-[11px] font-medium tabular-nums ${
                              out ? 'text-rose-600' : low ? 'text-amber-600' : 'text-slate-500'
                            }`}
                          >
                            {t(lang, 'স্টক', 'Stock')}: {product.stock} {product.unit}
                          </div>
                        </div>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                          <Plus className="h-4 w-4" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Memo Cart & Checkout */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Customer Picker */}
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  {t(lang, 'কাস্টমার নির্বাচন করুন', 'Customer')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {t(lang, 'নতুন কাস্টমার', 'New Customer')}
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="">{t(lang, 'খুচরা ক্রেতা (Walk-in Customer)', 'Walk-in Customer')}</option>
                {data.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.due > 0 ? `— বাকি ৳${c.due}` : ''}
                  </option>
                ))}
              </select>

              {(showQuickCustomer || !selectedCustomerId) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder={t(lang, 'কাস্টমারের নাম (ঐচ্ছিক)', 'Customer name')}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder={t(lang, 'মোবাইল নম্বর', 'Phone number')}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono-num text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  {showQuickCustomer && (
                    <button
                      type="button"
                      onClick={handleCreateQuickCustomer}
                      className="col-span-2 rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {t(lang, 'কাস্টমার সেভ করুন', 'Save Customer to Ledger')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>
                  {t(lang, 'মেমো আইটেমসমূহ', 'Cart Items')} ({cart.length})
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-rose-600 hover:underline"
                  >
                    {t(lang, 'খালি করুন', 'Clear')}
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center">
                  <ShoppingBag className="h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs text-slate-500">
                    {t(lang, 'বাম পাশ থেকে পণ্যে ক্লিক করে যোগ করুন', 'Click products on the left to add to memo')}
                  </p>
                </div>
              ) : (
                <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto pr-1">
                  {cart.map((line) => (
                    <div key={line.product.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-slate-900">
                            {line.product.name}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{t(lang, 'দর:', 'Rate:')}</span>
                            <input
                              type="number"
                              min={0}
                              value={line.unitPrice}
                              onChange={(e) => updateCartPrice(line.product.id, Number(e.target.value))}
                              className="w-20 rounded border border-slate-200 px-1.5 py-0.5 font-mono-num text-xs text-slate-900"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(line.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateCartQty(line.product.id, -1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 font-mono-num text-xs font-semibold text-slate-900">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(line.product.id, 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="font-mono-num text-xs font-bold text-slate-900">
                          {formatTaka(line.qty * line.unitPrice, lang)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculation & Payment */}
            <div className="space-y-2.5 border-t border-slate-200 pt-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t(lang, 'সাবটোটাল', 'Subtotal')}</span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {formatTaka(subtotal, lang)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-slate-600">{t(lang, 'ডিসকাউন্ট (৳)', 'Discount (৳)')}</label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 text-right font-mono-num text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-900">
                <span>{t(lang, 'মোট বিল', 'Total Amount')}</span>
                <span className="font-mono-num text-base text-emerald-700">
                  {formatTaka(totalAmount, lang)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-600">{t(lang, 'পরিশোধ (Paid)', 'Paid Amount')}</label>
                  <button
                    type="button"
                    onClick={() => setPaidAmountInput(String(totalAmount))}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    {t(lang, 'সম্পূর্ণ', 'Full')}
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={totalAmount}
                  value={paidAmountInput}
                  placeholder={String(totalAmount)}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 text-right font-mono-num text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">{t(lang, 'বাকি (Due)', 'Due Amount')}</span>
                <span
                  className={`font-mono-num font-bold ${
                    dueVal > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatTaka(dueVal, lang)}
                </span>
              </div>

              {/* Payment Method */}
              <div className="pt-1">
                <label className="mb-1.5 block text-slate-600 font-medium">
                  {t(lang, 'পেমেন্ট মাধ্যম', 'Payment Method')}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'bKash', 'Nagad', 'Bank'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                        paymentMethod === method
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t(lang, 'নোট (ঐচ্ছিক)', 'Memo note (optional)')}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            )}

            {successMemo && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  {t(lang, `মেমো ${successMemo} সফলভাবে তৈরি হয়েছে`, `Memo ${successMemo} created!`)}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={submitting || cart.length === 0}
              onClick={handleCreateQuickCustomer}
              className="hidden"
            />
            <button
              type="button"
              disabled={submitting || cart.length === 0}
              onClick={handleCheckout}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? t(lang, 'সংরক্ষণ হচ্ছে...', 'Saving Memo...')
                : t(lang, 'মেমো তৈরি ও প্রিন্ট করুন', 'Complete Sale & Print Memo')}
            </button>
          </div>
        </div>
      ) : (
        /* Sales History Tab */
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              {t(lang, 'সকল বিক্রয় ও মেমো তালিকা', 'All Sales & Memos')}
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={t(lang, 'মেমো নং বা কাস্টমার খুঁজুন...', 'Search memo no or customer...')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 font-medium">{t(lang, 'মেমো নং', 'Memo No')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'কাস্টমার', 'Customer')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'পণ্য', 'Items')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'মাধ্যম', 'Method')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'মোট বিল', 'Total')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'পরিশোধ', 'Paid')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'বাকি', 'Due')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalesHistory.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono-num font-semibold text-slate-900">{sale.memoNo}</td>
                    <td className="py-3 tabular-nums text-slate-500">{formatDateTime(sale.date, lang)}</td>
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{sale.customerName}</div>
                      {sale.customerPhone && (
                        <div className="text-[11px] font-mono-num text-slate-400">{sale.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3 text-slate-600">
                      {sale.items.length} {t(lang, 'টি আইটেম', 'items')}
                    </td>
                    <td className="py-3 font-medium text-slate-700">{sale.paymentMethod}</td>
                    <td className="py-3 text-right font-mono-num font-semibold text-slate-900">
                      {formatTaka(sale.totalAmount, lang)}
                    </td>
                    <td className="py-3 text-right font-mono-num text-emerald-700">
                      {formatTaka(sale.paidAmount, lang)}
                    </td>
                    <td className="py-3 text-right font-mono-num font-semibold">
                      {sale.dueAmount > 0 ? (
                        <span className="text-rose-600">{formatTaka(sale.dueAmount, lang)}</span>
                      ) : (
                        <span className="text-slate-400">৳০</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onViewMemo(sale)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        {t(lang, 'মেমো', 'Print')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
