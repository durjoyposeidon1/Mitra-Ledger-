import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  Menu,
  Package,
  Receipt,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type {
  AppUser,
  Language,
  Sale,
  Shop,
  ShopBootstrapData,
} from './shared/types';
import { api } from './lib/api';
import { t } from './lib/format';
import { DashboardView } from './components/DashboardView';
import { SalesMemoView } from './components/SalesMemoView';
import { ProductsStockView } from './components/ProductsStockView';
import { PurchaseView } from './components/PurchaseView';
import { CustomersView, SuppliersView } from './components/CustomersSuppliersView';
import { CashbookView, ExpensesView } from './components/ExpensesCashbookView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { MasterAdminView } from './components/MasterAdminView';
import { MemoReceiptModal } from './components/MemoReceiptModal';

type NavTab =
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'purchase'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'cashbook'
  | 'reports'
  | 'settings'
  | 'admin';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('mitra_lang');
    return saved === 'en' ? 'en' : 'bn';
  });
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeShopId, setActiveShopId] = useState<string>(() => {
    return localStorage.getItem('mitra_shop_id') || 'shop_mitra';
  });
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const raw = localStorage.getItem('mitra_user');
    if (!raw) {
      return {
        id: 'usr_admin',
        shopId: null,
        name: 'শান্তনু মিত্র (Master Admin)',
        phone: '01700000000',
        email: 'shantonumitra52@gmail.com',
        role: 'master_admin',
        pin: '1234',
        active: true,
        createdAt: '',
      };
    }
    try {
      return JSON.parse(raw) as AppUser;
    } catch {
      return null;
    }
  });

  const [shops, setShops] = useState<Shop[]>([]);
  const [data, setData] = useState<ShopBootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [previewMemo, setPreviewMemo] = useState<Sale | null>(null);
  const [productInitialModal, setProductInitialModal] = useState<'add-product' | 'stock-adjust' | null>(null);

  // Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('01711223344');
  const [loginPin, setLoginPin] = useState('1234');
  const [loginError, setLoginError] = useState('');

  const handleChangeLang = (next: Language) => {
    setLang(next);
    localStorage.setItem('mitra_lang', next);
  };

  const loadData = useCallback(async (shopId: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [shopListRes, bootstrapRes] = await Promise.all([
        api.getPublicShops(),
        api.getBootstrap(shopId),
      ]);
      setShops(shopListRes.shops);
      setData(bootstrapRes);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load shop data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeShopId);
  }, [activeShopId, loadData]);

  const handleSwitchShop = (shopId: string) => {
    setActiveShopId(shopId);
    localStorage.setItem('mitra_shop_id', shopId);
    setActiveTab('dashboard');
    setMobileMenuOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.login(loginIdentifier, loginPin);
      setCurrentUser(res.user);
      localStorage.setItem('mitra_user', JSON.stringify(res.user));
      if (res.shop) {
        handleSwitchShop(res.shop.id);
      } else {
        setActiveTab('admin');
      }
      setShowLoginModal(false);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleQuickAction = (action: 'add-product' | 'stock-adjust' | 'new-sale' | 'cash-entry') => {
    if (action === 'add-product') {
      setProductInitialModal('add-product');
      setActiveTab('products');
    } else if (action === 'stock-adjust') {
      setProductInitialModal('stock-adjust');
      setActiveTab('products');
    } else if (action === 'new-sale') {
      setActiveTab('sales');
    } else if (action === 'cash-entry') {
      setActiveTab('cashbook');
    }
  };

  const canAccessAdmin = !currentUser || currentUser.role === 'master_admin';

  const navItems: Array<{
    key: NavTab;
    bn: string;
    en: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'dashboard', bn: 'ড্যাশবোর্ড', en: 'Dashboard', icon: LayoutDashboard },
    { key: 'sales', bn: 'বিক্রি ও মেমো', en: 'Sales & Memo', icon: ShoppingCart },
    { key: 'products', bn: 'পণ্য ও স্টক', en: 'Products & Stock', icon: Package },
    { key: 'purchase', bn: 'ক্রয় হিসাব', en: 'Purchase', icon: Receipt },
    { key: 'customers', bn: 'কাস্টমার', en: 'Customers', icon: Users },
    { key: 'suppliers', bn: 'সাপ্লায়ার', en: 'Suppliers', icon: Building2 },
    { key: 'expenses', bn: 'দোকানের খরচ', en: 'Expenses', icon: Wallet },
    { key: 'cashbook', bn: 'ক্যাশবুক', en: 'Cashbook', icon: BookOpen },
    { key: 'reports', bn: 'রিপোর্টস', en: 'Reports', icon: BarChart3 },
    { key: 'settings', bn: 'সেটিংস', en: 'Settings', icon: Settings },
  ];

  const activeNavMeta =
    activeTab === 'admin'
      ? { bn: 'মাস্টার অ্যাডমিন', en: 'Master Admin' }
      : navItems.find((n) => n.key === activeTab) || { bn: 'ড্যাশবোর্ড', en: 'Dashboard' };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        {/* Brand & Active Shop Identity */}
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-display text-sm font-bold text-white shrink-0">
              MB
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold text-slate-900 truncate">
                Mitra Business
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {data?.shop.name || 'মিত্র বিজনেস'}
              </div>
            </div>
          </div>

          {canAccessAdmin && shops.length > 0 && (
            <div className="mt-3">
              <label className="mb-1 block text-[10px] font-semibold text-slate-400">
                {t(lang, 'দোকান পরিবর্তন (Shop Isolation)', 'Active Isolated Shop')}
              </label>
              <div className="relative">
                <select
                  value={activeShopId}
                  onChange={(e) => handleSwitchShop(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-2.5 pr-7 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{lang === 'bn' ? item.bn : item.en}</span>
              </button>
            );
          })}

          {canAccessAdmin && (
            <div className="pt-3 mt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck
                  className={`h-4 w-4 shrink-0 ${activeTab === 'admin' ? 'text-emerald-400' : 'text-slate-500'}`}
                />
                <span className="truncate">{t(lang, 'মাস্টার অ্যাডমিন', 'Master Admin')}</span>
              </button>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-900">
                {currentUser?.name || data?.shop.ownerName}
              </div>
              <div className="text-[11px] text-slate-500">
                {currentUser?.role || 'owner'} · v{data?.shop.softwareVersion || '2.4.0'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              title={t(lang, 'অ্যাকাউন্ট পরিবর্তন', 'Switch User')}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-72 max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
              <span className="font-display text-base font-bold text-slate-900">Mitra Business</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{lang === 'bn' ? item.bn : item.en}</span>
                  </button>
                );
              })}
              {canAccessAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    activeTab === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>{t(lang, 'মাস্টার অ্যাডমিন', 'Master Admin')}</span>
                </button>
              )}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Bar (3-zone contract) */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          {/* Zone 1: Mobile Menu + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Store className="hidden sm:block h-4 w-4 text-emerald-600 shrink-0" />
              <span className="truncate font-semibold text-slate-900">
                {data?.shop.name || 'Mitra Business'}
              </span>
              <span className="text-slate-300">/</span>
              <span className="truncate text-slate-600">
                {lang === 'bn' ? activeNavMeta.bn : activeNavMeta.en}
              </span>
            </div>
          </div>

          {/* Zone 2 & 3: Utility Controls & 1 Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => loadData(activeShopId)}
              title={t(lang, 'রিফ্রেশ', 'Refresh')}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => handleChangeLang(lang === 'bn' ? 'en' : 'bn')}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              {lang === 'bn' ? 'EN' : 'বাংলা'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {t(lang, 'নতুন মেমো', 'New Sale')}
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {errorMsg ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
              <p className="font-semibold">{errorMsg}</p>
              <button
                type="button"
                onClick={() => loadData(activeShopId)}
                className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
              >
                {t(lang, 'আবার চেষ্টা করুন', 'Retry')}
              </button>
            </div>
          ) : !data ? (
            <div className="space-y-4">
              <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  data={data}
                  lang={lang}
                  onNavigate={(tab) => setActiveTab(tab as NavTab)}
                  onQuickAction={handleQuickAction}
                  onViewMemo={setPreviewMemo}
                />
              )}
              {activeTab === 'sales' && (
                <SalesMemoView
                  data={data}
                  lang={lang}
                  currentUserName={currentUser?.name || data.shop.ownerName}
                  onRefresh={() => loadData(activeShopId)}
                  onViewMemo={setPreviewMemo}
                />
              )}
              {activeTab === 'products' && (
                <ProductsStockView
                  data={data}
                  lang={lang}
                  onRefresh={() => loadData(activeShopId)}
                  initialModal={productInitialModal}
                  onClearInitialModal={() => setProductInitialModal(null)}
                />
              )}
              {activeTab === 'purchase' && (
                <PurchaseView
                  data={data}
                  lang={lang}
                  onRefresh={() => loadData(activeShopId)}
                />
              )}
              {activeTab === 'customers' && (
                <CustomersView
                  data={data}
                  lang={lang}
                  onRefresh={() => loadData(activeShopId)}
                />
              )}
              {activeTab === 'suppliers' && (
                <SuppliersView
                  data={data}
                  lang={lang}
                  onRefresh={() => loadData(activeShopId)}
                />
              )}
              {activeTab === 'expenses' && (
                <ExpensesView
                  data={data}
                  lang={lang}
                  onRefresh={() => loadData(activeShopId)}
                />
              )}
              {activeTab === 'cashbook' && (
                <CashbookView
                  data={data}
                  lang={lang}
                  onRefresh={() => loadData(activeShopId)}
                />
              )}
              {activeTab === 'reports' && <ReportsView data={data} lang={lang} />}
              {activeTab === 'settings' && (
                <SettingsView
                  data={data}
                  lang={lang}
                  onChangeLang={handleChangeLang}
                  onRefresh={() => loadData(activeShopId)}
                />
              )}
              {activeTab === 'admin' && (
                <MasterAdminView
                  lang={lang}
                  activeShopId={activeShopId}
                  onSwitchShop={handleSwitchShop}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Printable Memo Receipt Modal */}
      {data && (
        <MemoReceiptModal
          sale={previewMemo}
          shop={data.shop}
          lang={lang}
          onClose={() => setPreviewMemo(null)}
        />
      )}

      {/* User Login / Shop Account Switch Modal */}
      {showLoginModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900">
                {t(lang, 'অ্যাকাউন্ট লগইন / পরিবর্তন', 'Sign In / Switch Account')}
              </h3>
              <button type="button" onClick={() => setShowLoginModal(false)} className="p-1 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-3 p-5 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">
                  {t(lang, 'ডেমো অ্যাকাউন্টসমূহ (PIN: 1234):', 'Demo Accounts (PIN: 1234):')}
                </div>
                <div>Master Admin: 01700000000</div>
                <div>মিত্র জেনারেল স্টোর (Owner): 01711223344</div>
                <div>দেশ টেক ইলেকট্রনিক্স (Owner): 01819887766</div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'ফোন বা ইমেইল', 'Phone or Email')}
                </label>
                <input
                  required
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  {t(lang, 'পিন (PIN)', 'PIN')}
                </label>
                <input
                  required
                  type="password"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-num text-sm"
                />
              </div>

              {loginError && <p className="font-medium text-rose-600">{loginError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  {t(lang, 'বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  {t(lang, 'লগইন করুন', 'Sign In')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
