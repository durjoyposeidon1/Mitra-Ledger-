import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit3,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import type { Language, Product, ShopBootstrapData } from '../shared/types';
import { formatDateTime, formatNumber, formatTaka, t } from '../lib/format';
import { api } from '../lib/api';

interface ProductsStockViewProps {
  data: ShopBootstrapData;
  lang: Language;
  onRefresh: () => Promise<void>;
  initialModal?: 'add-product' | 'stock-adjust' | null;
  onClearInitialModal?: () => void;
}

export function ProductsStockView({
  data,
  lang,
  onRefresh,
  initialModal = null,
  onClearInitialModal,
}: ProductsStockViewProps) {
  const [subTab, setSubTab] = useState<'inventory' | 'movements'>('inventory');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Add/Edit Product Modal
  const [showProductModal, setShowProductModal] = useState(initialModal === 'add-product');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('Grocery');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formUnit, setFormUnit] = useState('Piece');
  const [formBarcode, setFormBarcode] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Stock In/Out/Adjust Modal
  const [showStockModal, setShowStockModal] = useState(initialModal === 'stock-adjust');
  const [stockProdId, setStockProdId] = useState(data.products[0]?.id || '');
  const [stockType, setStockType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [stockQty, setStockQty] = useState('10');
  const [stockReason, setStockReason] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(data.products.map((p) => p.category)));
    return ['ALL', ...cats];
  }, [data.products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (onlyLowStock && p.stock > p.minStock) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      );
    });
  }, [data.products, search, categoryFilter, onlyLowStock]);

  const summary = useMemo(() => {
    const totalItems = data.products.length;
    const totalUnits = data.products.reduce((s, p) => s + p.stock, 0);
    const totalValue = data.products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
    const lowCount = data.products.filter((p) => p.stock <= p.minStock).length;
    return { totalItems, totalUnits, totalValue, lowCount };
  }, [data.products]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCode(`PRD${String(data.products.length + 1).padStart(3, '0')}`);
    setFormCategory('Grocery');
    setFormPurchasePrice('');
    setFormSalePrice('');
    setFormStock('0');
    setFormMinStock(String(data.shop.lowStockThreshold || 10));
    setFormUnit('Piece');
    setFormBarcode('');
    setErrorMsg('');
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCode(p.code);
    setFormCategory(p.category);
    setFormPurchasePrice(String(p.purchasePrice));
    setFormSalePrice(String(p.salePrice));
    setFormStock(String(p.stock));
    setFormMinStock(String(p.minStock));
    setFormUnit(p.unit);
    setFormBarcode(p.barcode);
    setErrorMsg('');
    setShowProductModal(true);
  };

  const openStockModalFor = (p: Product, type: 'in' | 'out' | 'adjustment') => {
    setStockProdId(p.id);
    setStockType(type);
    setStockQty(type === 'adjustment' ? String(p.stock) : '10');
    setStockReason('');
    setErrorMsg('');
    setShowStockModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setErrorMsg(t(lang, 'পণ্যের নাম ও কোড আবশ্যক', 'Product name and code are required'));
      return;
    }
    setSavingProduct(true);
    setErrorMsg('');
    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim(),
        category: formCategory.trim() || 'General',
        purchasePrice: Number(formPurchasePrice) || 0,
        salePrice: Number(formSalePrice) || 0,
        stock: Number(formStock) || 0,
        minStock: Number(formMinStock) || 10,
        unit: formUnit.trim() || 'Piece',
        barcode: formBarcode.trim(),
      };
      if (editingProduct) {
        await api.updateProduct(data.shop.id, editingProduct.id, payload);
      } else {
        await api.createProduct(data.shop.id, payload);
      }
      await onRefresh();
      setShowProductModal(false);
      onClearInitialModal?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    try {
      await api.deleteProduct(data.shop.id, p.id);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProdId) return;
    setSavingStock(true);
    setErrorMsg('');
    try {
      await api.adjustStock(data.shop.id, stockProdId, {
        type: stockType,
        quantity: Number(stockQty) || 0,
        reason: stockReason.trim(),
      });
      await onRefresh();
      setShowStockModal(false);
      onClearInitialModal?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            {t(lang, 'পণ্য ও স্টক ম্যানেজমেন্ট', 'Products & Stock Management')}
          </h1>
          <p className="text-xs text-slate-500">
            {t(
              lang,
              'দোকানের সব পণ্য, বারকোড, স্টক ইন/আউট এবং লো-স্টক অ্যালার্ট নিয়ন্ত্রণ করুন',
              'Manage products, barcodes, stock adjustments, and low-stock alerts'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setStockProdId(data.products[0]?.id || '');
              setStockType('in');
              setStockQty('10');
              setShowStockModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-sky-600" />
            {t(lang, 'স্টক ইন / আউট', 'Stock In / Out')}
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            {t(lang, 'নতুন পণ্য যোগ করুন', 'Add Product')}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">{t(lang, 'মোট পণ্য (SKU)', 'Total Products')}</div>
          <div className="mt-1 font-mono-num text-xl font-bold text-slate-900">
            {formatNumber(summary.totalItems, lang)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">{t(lang, 'মোট স্টক পরিমাণ', 'Total Units')}</div>
          <div className="mt-1 font-mono-num text-xl font-bold text-slate-900">
            {formatNumber(summary.totalUnits, lang)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">{t(lang, 'মোট স্টক মূল্য (ক্রয়মূল্যে)', 'Total Stock Cost')}</div>
          <div className="mt-1 font-mono-num text-xl font-bold text-emerald-700">
            {formatTaka(summary.totalValue, lang)}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between text-xs text-amber-800">
            <span>{t(lang, 'লো-স্টক অ্যালার্ট', 'Low Stock Alerts')}</span>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 font-mono-num text-xl font-bold text-amber-700">
            {formatNumber(summary.lowCount, lang)}
          </div>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => setSubTab('inventory')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                subTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t(lang, 'পণ্য তালিকা', 'Product List')}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('movements')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                subTab === 'movements' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t(lang, 'স্টক হিস্টোরি (In/Out)', 'Stock Movements')}
            </button>
          </div>

          {subTab === 'inventory' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(lang, 'নাম, কোড বা বারকোড...', 'Search name, code, barcode...')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? t(lang, 'সব ক্যাটাগরি', 'All Categories') : c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyLowStock((v) => !v)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  onlyLowStock
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t(lang, 'শুধু কম স্টক', 'Low Stock Only')}
              </button>
            </div>
          )}
        </div>

        {subTab === 'inventory' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 font-medium">{t(lang, 'পণ্যের নাম ও কোড', 'Product & Code')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'ক্যাটাগরি', 'Category')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'বারকোড', 'Barcode')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'ক্রয়মূল্য', 'Purchase')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'বিক্রয়মূল্য', 'Sale')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'স্টক', 'Stock')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'অ্যাকশন', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="font-mono-num text-[11px] text-slate-400">{p.code}</div>
                      </td>
                      <td className="py-3 text-slate-600">{p.category}</td>
                      <td className="py-3 font-mono-num text-slate-500">{p.barcode || '—'}</td>
                      <td className="py-3 text-right font-mono-num text-slate-700">
                        {formatTaka(p.purchasePrice, lang)}
                      </td>
                      <td className="py-3 text-right font-mono-num font-semibold text-slate-900">
                        {formatTaka(p.salePrice, lang)}
                      </td>
                      <td className="py-3 text-right font-mono-num">
                        <span
                          className={`font-bold ${
                            p.stock <= 0
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                        {isLow && (
                          <div className="text-[10px] text-amber-600">
                            {t(lang, 'কম স্টক', 'Low')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openStockModalFor(p, 'in')}
                            title={t(lang, 'স্টক ইন', 'Stock In')}
                            className="rounded border border-slate-200 p-1.5 text-emerald-700 hover:bg-emerald-50"
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openStockModalFor(p, 'out')}
                            title={t(lang, 'স্টক আউট', 'Stock Out')}
                            className="rounded border border-slate-200 p-1.5 text-amber-700 hover:bg-amber-50"
                          >
                            <ArrowUpFromLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            title={t(lang, 'সম্পাদনা', 'Edit')}
                            className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            title={t(lang, 'মুছুন', 'Delete')}
                            className="rounded border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 font-medium">{t(lang, 'তারিখ', 'Date')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'পণ্য', 'Product')}</th>
                  <th className="py-2.5 font-medium">{t(lang, 'ধরন', 'Type')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'পরিমাণ', 'Qty')}</th>
                  <th className="py-2.5 text-right font-medium">{t(lang, 'পূর্বের → বর্তমান', 'Prev → New')}</th>
                  <th className="py-2.5 font-medium pl-4">{t(lang, 'কারণ', 'Reason')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.stockAdjustments.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 tabular-nums text-slate-500">{formatDateTime(log.date, lang)}</td>
                    <td className="py-2.5 font-medium text-slate-900">
                      {log.productName}{' '}
                      <span className="font-mono-num text-[11px] text-slate-400">({log.productCode})</span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`font-semibold ${
                          log.type === 'in'
                            ? 'text-emerald-700'
                            : log.type === 'out'
                            ? 'text-rose-600'
                            : 'text-sky-700'
                        }`}
                      >
                        {log.type === 'in'
                          ? t(lang, 'স্টক ইন', 'Stock In')
                          : log.type === 'out'
                          ? t(lang, 'স্টক আউট', 'Stock Out')
                          : t(lang, 'অ্যাডজাস্টমেন্ট', 'Adjustment')}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono-num font-semibold text-slate-900">
                      {log.quantity > 0 && log.type === 'in' ? `+${log.quantity}` : log.quantity}
                    </td>
                    <td className="py-2.5 text-right font-mono-num text-slate-600">
                      {log.previousStock} → {log.newStock}
                    </td>
                    <td className="py-2.5 pl-4 text-slate-600">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {editingProduct
                  ? t(lang, 'পণ্য সম্পাদনা করুন', 'Edit Product')
                  : t(lang, 'নতুন পণ্য যোগ করুন', 'Add New Product')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowProductModal(false);
                  onClearInitialModal?.();
                }}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 p-5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'পণ্যের নাম *', 'Product Name *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Lux Soap"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'পণ্য কোড (SKU) *', 'Product Code *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="LUX001"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'ক্যাটাগরি', 'Category')}
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Soap / Grocery"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'ক্রয়মূল্য (৳)', 'Purchase Price (৳)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    placeholder="50"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'বিক্রয়মূল্য (৳)', 'Sale Price (৳)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    placeholder="60"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'বর্তমান স্টক', 'Stock Quantity')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'একক (Unit)', 'Unit')}
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Piece">Piece</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                    <option value="Pack">Pack</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Box">Box</option>
                    <option value="Dozen">Dozen</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'লো-স্টক অ্যালার্ট সীমা', 'Low Stock Alert')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'বারকোড (ঐচ্ছিক)', 'Barcode (Optional)')}
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="8901030865412"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {errorMsg && <p className="text-rose-600 font-medium">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    onClearInitialModal?.();
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingProduct ? t(lang, 'সেভ হচ্ছে...', 'Saving...') : t(lang, 'পণ্য সেভ করুন', 'Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {t(lang, 'স্টক ইন / আউট / অ্যাডজাস্টমেন্ট', 'Stock In / Out / Adjustment')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowStockModal(false);
                  onClearInitialModal?.();
                }}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-3 p-5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'পণ্য নির্বাচন করুন', 'Select Product')}
                </label>
                <select
                  value={stockProdId}
                  onChange={(e) => setStockProdId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {data.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — {t(lang, 'বর্তমান', 'Current')}: {p.stock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'in', bn: 'স্টক ইন (+)', en: 'Stock In (+)' },
                    { key: 'out', bn: 'স্টক আউট (-)', en: 'Stock Out (-)' },
                    { key: 'adjustment', bn: 'সরাসরি সেট', en: 'Set Exact' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setStockType(opt.key)}
                    className={`rounded-lg border py-2 text-xs font-semibold ${
                      stockType === opt.key
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {lang === 'bn' ? opt.bn : opt.en}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {stockType === 'adjustment'
                    ? t(lang, 'নতুন মোট স্টক সংখ্যা', 'New Exact Stock Quantity')
                    : t(lang, 'পরিমাণ', 'Quantity')}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'কারণ / নোট', 'Reason / Note')}
                </label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder={t(lang, 'যেমন: ড্যামেজ পণ্য বাদ / নতুন স্টক', 'e.g. Damaged goods / Restock')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false);
                    onClearInitialModal?.();
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingStock}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingStock ? t(lang, 'আপডেট হচ্ছে...', 'Updating...') : t(lang, 'স্টক আপডেট করুন', 'Update Stock')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
