import { useState } from 'react';
import { Download, Save, Upload } from 'lucide-react';
import type { Language, ShopBootstrapData } from '../shared/types';
import { t } from '../lib/format';
import { api } from '../lib/api';

interface SettingsViewProps {
  data: ShopBootstrapData;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onRefresh: () => Promise<void>;
}

export function SettingsView({ data, lang, onChangeLang, onRefresh }: SettingsViewProps) {
  const [name, setName] = useState(data.shop.name);
  const [category, setCategory] = useState(data.shop.category);
  const [ownerPhone, setOwnerPhone] = useState(data.shop.ownerPhone);
  const [address, setAddress] = useState(data.shop.address);
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>(data.shop.thermalWidth);
  const [receiptFooter, setReceiptFooter] = useState(data.shop.receiptFooter);
  const [openingCash, setOpeningCash] = useState(String(data.shop.openingCash));
  const [openingBank, setOpeningBank] = useState(String(data.shop.openingBank));
  const [openingMobile, setOpeningMobile] = useState(String(data.shop.openingMobile));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(data.shop.lowStockThreshold));
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    try {
      await api.updateShopSettings(data.shop.id, {
        name: name.trim(),
        category: category.trim(),
        ownerPhone: ownerPhone.trim(),
        address: address.trim(),
        thermalWidth,
        receiptFooter: receiptFooter.trim(),
        openingCash: Number(openingCash) || 0,
        openingBank: Number(openingBank) || 0,
        openingMobile: Number(openingMobile) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 10,
      });
      await onRefresh();
      setStatusMsg(t(lang, 'দোকানের সেটিংস সংরক্ষণ করা হয়েছে', 'Shop settings saved successfully.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    const backup = await api.exportShopBackup(data.shop.id);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.shop.code}_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.restoreShopBackup(data.shop.id, parsed);
      await onRefresh();
      setStatusMsg(t(lang, 'ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!', 'Shop backup restored successfully!'));
    } catch {
      setStatusMsg(t(lang, 'সঠিক ব্যাকআপ JSON ফাইল দিন', 'Invalid backup JSON file.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-900">
          {t(lang, 'সেটিংস ও ব্যাকআপ (Shop Settings)', 'Shop Settings & Backup')}
        </h1>
        <p className="text-xs text-slate-500">
          {t(
            lang,
            'দোকানের তথ্য, থার্মাল প্রিন্টার সেটআপ, ভাষা এবং নিজস্ব ডেটা ব্যাকআপ/রিস্টোর',
            'Configure shop profile, thermal receipt width, language, and shop-level backup'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <form
          onSubmit={handleSave}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-xs lg:col-span-8"
        >
          <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
            {t(lang, 'দোকানের প্রোফাইল ও মেমো সেটিংস', 'Shop Profile & Receipt Settings')}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'দোকানের নাম', 'Shop Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'ব্যবসার ধরন', 'Business Category')}
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'ফোন নম্বর', 'Phone Number')}
              </label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'দোকানের ঠিকানা', 'Shop Address')}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'থার্মাল প্রিন্টার পেপার সাইজ', 'Thermal Paper Width')}
              </label>
              <select
                value={thermalWidth}
                onChange={(e) => setThermalWidth(e.target.value as '58mm' | '80mm')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="80mm">80mm (Standard POS)</option>
                <option value="58mm">58mm (Compact Portable)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'ডিফল্ট লো-স্টক সতর্কতা সীমা', 'Default Low Stock Alert')}
              </label>
              <input
                type="number"
                min={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'মেমো ফুটার মেসেজ', 'Memo Receipt Footer')}
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'প্রারম্ভিক নগদ (Opening Cash)', 'Opening Cash (৳)')}
              </label>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'প্রারম্ভিক ব্যাংক (Opening Bank)', 'Opening Bank (৳)')}
              </label>
              <input
                type="number"
                value={openingBank}
                onChange={(e) => setOpeningBank(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                {t(lang, 'প্রারম্ভিক মোবাইল ব্যাংকিং', 'Opening bKash/Nagad (৳)')}
              </label>
              <input
                type="number"
                value={openingMobile}
                onChange={(e) => setOpeningMobile(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
              />
            </div>
          </div>

          {statusMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              {statusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? t(lang, 'সেভ হচ্ছে...', 'Saving...') : t(lang, 'সেটিংস সেভ করুন', 'Save Settings')}
          </button>
        </form>

        {/* Language & Backup Card */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {t(lang, 'সফটওয়্যারের ভাষা (Language)', 'Interface Language')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeLang('bn')}
                className={`rounded-lg border py-2 text-xs font-semibold ${
                  lang === 'bn'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                বাংলা (Bangla)
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('en')}
                className={`rounded-lg border py-2 text-xs font-semibold ${
                  lang === 'en'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-slate-900">
              {t(lang, 'দোকানের ডেটা ব্যাকআপ ও রিস্টোর', 'Shop Backup & Restore')}
            </h3>
            <p className="text-slate-500">
              {t(
                lang,
                'আপনার দোকানের সকল পণ্য, মেমো, কাস্টমার ও ক্যাশবুক ডেটা JSON ফাইলে ডাউনলোড বা রিস্টোর করুন।',
                'Download or restore isolated JSON backup for this shop only.'
              )}
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2.5 font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Download className="h-3.5 w-3.5" />
              {t(lang, 'ব্যাকআপ ডাউনলোড (JSON)', 'Download Shop Backup')}
            </button>
            <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
              <Upload className="h-3.5 w-3.5" />
              {t(lang, 'ব্যাকআপ ফাইল রিস্টোর করুন', 'Restore from JSON')}
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
