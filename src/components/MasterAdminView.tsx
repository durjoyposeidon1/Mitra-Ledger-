import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  LogIn,
  Plus,
  ShieldCheck,
  Store,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type {
  AdminOverviewData,
  AppUser,
  Language,
  PlanTier,
  Shop,
  ShopStatus,
  UserRole,
} from '../shared/types';
import { formatDate, formatTaka, t } from '../lib/format';
import { api } from '../lib/api';

interface MasterAdminViewProps {
  lang: Language;
  activeShopId: string;
  onSwitchShop: (shopId: string) => void;
}

export function MasterAdminView({ lang, activeShopId, onSwitchShop }: MasterAdminViewProps) {
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'shops' | 'users' | 'plans' | 'system'>('shops');

  // Create Shop Modal
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopCat, setShopCat] = useState('জেনারেল ও মুদি স্টোর');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPlan, setShopPlan] = useState<PlanTier>('Standard');
  const [shopStatus, setShopStatus] = useState<ShopStatus>('active');
  const [openingCash, setOpeningCash] = useState('5000');

  // Create User Modal
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('cashier');
  const [userShopId, setUserShopId] = useState(activeShopId);
  const [userPin, setUserPin] = useState('1234');

  // Software version
  const [versionInput, setVersionInput] = useState('');
  const [toast, setToast] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setOverview(res);
      setVersionInput(res.softwareVersion);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createShopByAdmin({
      name: shopName.trim(),
      category: shopCat.trim(),
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: ownerEmail.trim(),
      address: shopAddress.trim(),
      plan: shopPlan,
      status: shopStatus,
      openingCash: Number(openingCash) || 0,
    });
    setShowCreateShop(false);
    setShopName('');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setShopAddress('');
    setToast(t(lang, `নতুন দোকান "${res.shop.name}" তৈরি হয়েছে`, `Created shop "${res.shop.name}"`));
    await loadOverview();
  };

  const handleUpdateShop = async (shop: Shop, patch: Partial<Shop>) => {
    await api.updateShopByAdmin(shop.id, patch);
    await loadOverview();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createUserByAdmin({
      name: userName.trim(),
      phone: userPhone.trim(),
      email: userEmail.trim(),
      role: userRole,
      shopId: userRole === 'master_admin' ? null : userShopId,
      pin: userPin || '1234',
      active: true,
    });
    setShowCreateUser(false);
    setUserName('');
    setUserPhone('');
    setUserEmail('');
    await loadOverview();
  };

  const handleToggleUser = async (u: AppUser) => {
    await api.updateUserByAdmin(u.id, { active: !u.active });
    await loadOverview();
  };

  const handleSaveVersion = async () => {
    if (!versionInput.trim()) return;
    await api.updateSoftwareVersion(versionInput.trim());
    setToast(t(lang, `সফটওয়্যার ভার্সন v${versionInput} আপডেট হয়েছে`, `Updated to v${versionInput}`));
    await loadOverview();
  };

  const handleDownloadFullBackup = async () => {
    const dump = await api.exportFullBackup();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mitra_business_master_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFullBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await api.restoreFullBackup(JSON.parse(text));
    setToast(t(lang, 'সম্পূর্ণ প্ল্যাটফর্ম ব্যাকআপ রিস্টোর হয়েছে', 'Master backup restored!'));
    await loadOverview();
  };

  if (loading || !overview) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        {t(lang, 'মাস্টার অ্যাডমিন ডেটা লোড হচ্ছে...', 'Loading Master Admin Console...')}
      </div>
    );
  }

  const activeCount = overview.shops.filter((s) => s.status === 'active').length;
  const trialCount = overview.shops.filter((s) => s.status === 'trial').length;
  const totalGmv = Object.values(overview.shopStats).reduce((s, x) => s + x.totalSales, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h1 className="font-display text-xl font-bold text-slate-900">
              {t(lang, 'মাস্টার অ্যাডমিন প্যানেল (SaaS Control)', 'Master Admin Panel')}
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {t(
              lang,
              'সব দোকান, সাবস্ক্রিপশন প্ল্যান, ট্রায়াল অ্যাকাউন্ট, ইউজার ও ডেটা আইসোলেশন নিয়ন্ত্রণ করুন',
              'Create shops, manage subscriptions, trial accounts, users, software version, and isolated backups'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateShop(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          {t(lang, 'নতুন দোকান তৈরি করুন', 'Create New Shop')}
        </button>
      </div>

      {toast && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {toast}
          </span>
          <button type="button" onClick={() => setToast('')} className="text-emerald-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">{t(lang, 'মোট রেজিস্টার্ড দোকান', 'Total Shops')}</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900">
            {overview.shops.length}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            Active: {activeCount} · Trial: {trialCount}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">{t(lang, 'সর্বমোট বিক্রি (সব দোকান)', 'Platform GMV')}</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-emerald-700">
            {formatTaka(totalGmv, lang)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">{t(lang, 'মোট ইউজার অ্যাকাউন্ট', 'Total Users')}</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900">
            {overview.users.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">{t(lang, 'সফটওয়্যার ভার্সন', 'Software Version')}</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900">
            v{overview.softwareVersion}
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 w-fit">
        {(
          [
            { key: 'shops', bn: 'দোকানসমূহ (Shops)', en: 'Shops & Isolation' },
            { key: 'users', bn: 'ইউজার ম্যানেজমেন্ট', en: 'User Management' },
            { key: 'plans', bn: 'সাবস্ক্রিপশন প্ল্যান ও প্রাইসিং', en: 'Pricing Plans' },
            { key: 'system', bn: 'ভার্সন ও মাস্টার ব্যাকআপ', en: 'Version & Backup' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === tab.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang === 'bn' ? tab.bn : tab.en}
          </button>
        ))}
      </div>

      {/* Shops Tab */}
      {subTab === 'shops' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-medium">{t(lang, 'দোকান ও কোড', 'Shop & Code')}</th>
                <th className="py-2.5 font-medium">{t(lang, 'মালিকের তথ্য', 'Owner Details')}</th>
                <th className="py-2.5 font-medium">{t(lang, 'প্ল্যান', 'Plan')}</th>
                <th className="py-2.5 font-medium">{t(lang, 'স্ট্যাটাস', 'Status')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'বিক্রি / পণ্য', 'Sales / SKUs')}</th>
                <th className="py-2.5 text-right font-medium">{t(lang, 'অ্যাকশন', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overview.shops.map((shop) => {
                const st = overview.shopStats[shop.id];
                const isCurrent = shop.id === activeShopId;
                return (
                  <tr key={shop.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <Store className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{shop.name}</span>
                      </div>
                      <div className="font-mono-num text-[11px] text-slate-400">
                        {shop.code} · {shop.category}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{shop.ownerName}</div>
                      <div className="font-mono-num text-[11px] text-slate-500">{shop.ownerPhone}</div>
                    </td>
                    <td className="py-3">
                      <select
                        value={shop.plan}
                        onChange={(e) => handleUpdateShop(shop, { plan: e.target.value as PlanTier })}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800"
                      >
                        <option value="Basic">Basic (৳১,৫০০)</option>
                        <option value="Standard">Standard (৳৩,০০০)</option>
                        <option value="Premium">Premium (৳৬,৫০০)</option>
                        <option value="Cloud">Cloud (৳৫০০/মাস)</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <select
                        value={shop.status}
                        onChange={(e) => handleUpdateShop(shop, { status: e.target.value as ShopStatus })}
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold ${
                          shop.status === 'active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : shop.status === 'trial'
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : 'border-rose-200 bg-rose-50 text-rose-800'
                        }`}
                      >
                        <option value="active">{t(lang, 'Active (চালু)', 'Active')}</option>
                        <option value="trial">{t(lang, 'Trial (ট্রায়াল)', 'Trial')}</option>
                        <option value="suspended">{t(lang, 'Deactivated (বন্ধ)', 'Deactivated')}</option>
                      </select>
                      {shop.status === 'trial' && shop.trialEndsAt && (
                        <div className="mt-0.5 text-[10px] text-amber-700">
                          {t(lang, 'মেয়াদ:', 'Ends:')} {formatDate(shop.trialEndsAt, lang)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono-num">
                      <div className="font-semibold text-slate-900">
                        {formatTaka(st?.totalSales || 0, lang)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {st?.totalProducts || 0} SKUs · {st?.totalOrders || 0} Memos
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSwitchShop(shop.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        <LogIn className="h-3 w-3" />
                        {isCurrent
                          ? t(lang, 'বর্তমান দোকান', 'Active View')
                          : t(lang, 'দোকানে প্রবেশ', 'Switch to Shop')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab */}
      {subTab === 'users' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600" />
              <h2 className="text-base font-semibold text-slate-900">
                {t(lang, 'সকল ইউজার ও স্টাফ অ্যাকাউন্ট', 'All Users & Staff Accounts')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateUser(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              {t(lang, 'নতুন ইউজার', 'Add User')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">{t(lang, 'নাম', 'Name')}</th>
                  <th className="py-2 font-medium">{t(lang, 'ফোন / ইমেইল', 'Phone / Email')}</th>
                  <th className="py-2 font-medium">{t(lang, 'রোল', 'Role')}</th>
                  <th className="py-2 font-medium">{t(lang, 'দোকান (Isolation)', 'Assigned Shop')}</th>
                  <th className="py-2 font-medium">{t(lang, 'পিন', 'PIN')}</th>
                  <th className="py-2 text-right font-medium">{t(lang, 'অবস্থা', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.users.map((u) => {
                  const shop = overview.shops.find((s) => s.id === u.shopId);
                  return (
                    <tr key={u.id}>
                      <td className="py-2.5 font-semibold text-slate-900">{u.name}</td>
                      <td className="py-2.5 font-mono-num text-slate-600">
                        {u.phone}
                        {u.email && <div className="text-[11px] text-slate-400">{u.email}</div>}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800">{u.role}</td>
                      <td className="py-2.5 text-slate-600">
                        {shop ? `${shop.name} (${shop.code})` : t(lang, 'সকল দোকান (Master)', 'Platform Wide')}
                      </td>
                      <td className="py-2.5 font-mono-num text-slate-500">{u.pin}</td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                            u.active
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.active ? t(lang, 'সক্রিয়', 'Active') : t(lang, 'নিষ্ক্রিয়', 'Disabled')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Business Model & Plans Tab */}
      {subTab === 'plans' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overview.plans.map((plan) => (
            <div key={plan.id} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5">
              <div>
                <div className="text-xs font-semibold text-emerald-700">
                  {plan.billing === 'monthly' ? t(lang, 'মাসিক সাবস্ক্রিপশন', 'Monthly Plan') : t(lang, 'এককালীন লাইসেন্স', 'One-time License')}
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  {lang === 'bn' ? plan.nameBn : plan.name}
                </h3>
                <div className="mt-2 font-mono-num text-xl font-bold text-slate-900">
                  {lang === 'bn' ? plan.priceLabelBn : plan.priceLabel}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {t(lang, 'সর্বোচ্চ পণ্য', 'Max Products')}:{' '}
                  {plan.maxProducts ? plan.maxProducts : t(lang, 'আনলিমিটেড', 'Unlimited')} ·{' '}
                  {t(lang, 'ইউজার', 'Users')}: {plan.maxUsers}
                </div>
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-700">
                  {(lang === 'bn' ? plan.featuresBn : plan.featuresEn).map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                {t(lang, 'সক্রিয় দোকান', 'Active Shops')}:{' '}
                <span className="font-mono-num font-bold text-slate-900">
                  {overview.shops.filter((s) => s.plan === plan.id).length}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Software Version & Full Platform Backup */}
      {subTab === 'system' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-xs">
            <h3 className="text-base font-semibold text-slate-900">
              {t(lang, 'সফটওয়্যার ভার্সন কন্ট্রোল', 'Software Version Control')}
            </h3>
            <p className="text-slate-500">
              {t(
                lang,
                'সব দোকানের জন্য বর্তমান সফটওয়্যার ভার্সন আপডেট করুন',
                'Push software release version metadata across all shops'
              )}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
              />
              <button
                type="button"
                onClick={handleSaveVersion}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                {t(lang, 'আপডেট করুন', 'Update Version')}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-xs">
            <h3 className="text-base font-semibold text-slate-900">
              {t(lang, 'সম্পূর্ণ সিস্টেম ব্যাকআপ ও রিস্টোর', 'Master Platform Backup & Restore')}
            </h3>
            <p className="text-slate-500">
              {t(
                lang,
                'সব দোকান, ইউজার ও লেনদেনের পূর্ণাঙ্গ ডাটাবেস ব্যাকআপ নিন বা রিস্টোর করুন',
                'Export or restore the entire multi-tenant database'
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadFullBackup}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                <Download className="h-3.5 w-3.5" />
                {t(lang, 'ফুল ব্যাকআপ ডাউনলোড', 'Download Full Backup')}
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                {t(lang, 'রিস্টোর করুন', 'Restore Full Backup')}
                <input type="file" accept=".json" onChange={handleRestoreFullBackup} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Create Shop Modal */}
      {showCreateShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {t(lang, 'নতুন দোকান তৈরি করুন', 'Create New Shop')}
              </h3>
              <button type="button" onClick={() => setShowCreateShop(false)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateShop} className="space-y-3 p-5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'দোকানের নাম *', 'Shop Name *')}
                  </label>
                  <input
                    required
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'দোকানের ধরন', 'Category')}
                  </label>
                  <input
                    type="text"
                    value={shopCat}
                    onChange={(e) => setShopCat(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'মালিকের নাম *', 'Owner Name *')}
                  </label>
                  <input
                    required
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'মালিকের ফোন *', 'Owner Phone *')}
                  </label>
                  <input
                    required
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'ইমেইল', 'Email')}
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'প্রারম্ভিক ক্যাশ', 'Opening Cash (৳)')}
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
                    {t(lang, 'প্ল্যান', 'Plan')}
                  </label>
                  <select
                    value={shopPlan}
                    onChange={(e) => setShopPlan(e.target.value as PlanTier)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Basic">Basic (৳১,৫০০)</option>
                    <option value="Standard">Standard (৳৩,০০০)</option>
                    <option value="Premium">Premium (৳৬,৫০০)</option>
                    <option value="Cloud">Cloud (৳৫০০/মাস)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'স্ট্যাটাস', 'Status')}
                  </label>
                  <select
                    value={shopStatus}
                    onChange={(e) => setShopStatus(e.target.value as ShopStatus)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial (14 Days)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'ঠিকানা', 'Address')}
                  </label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateShop(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  {t(lang, 'দোকান তৈরি করুন', 'Create Shop')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {t(lang, 'নতুন ইউজার যোগ করুন', 'Create User Account')}
              </h3>
              <button type="button" onClick={() => setShowCreateUser(false)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 p-5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'নাম *', 'Name *')}</label>
                <input
                  required
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'ফোন *', 'Phone *')}</label>
                <input
                  required
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'ইমেইল', 'Email')}</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'রোল', 'Role')}</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="master_admin">Master Admin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">{t(lang, 'পিন', 'Login PIN')}</label>
                  <input
                    required
                    type="text"
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                  />
                </div>
              </div>
              {userRole !== 'master_admin' && (
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    {t(lang, 'নির্ধারিত দোকান', 'Assigned Shop')}
                  </label>
                  <select
                    value={userShopId}
                    onChange={(e) => setUserShopId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {overview.shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  {t(lang, 'ইউজার তৈরি করুন', 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
