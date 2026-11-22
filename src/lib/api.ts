import type {
  AdminOverviewData,
  AppUser,
  CashbookTransaction,
  Customer,
  Expense,
  PaymentMethod,
  Product,
  Purchase,
  Sale,
  Shop,
  ShopBootstrapData,
  Supplier,
} from '../shared/types';

async function request<T>(url: string, options?: RequestInit, shopId?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (shopId) {
    headers['x-shop-id'] = shopId;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getPublicShops: () => request<{ shops: Shop[]; plans: AdminOverviewData['plans'] }>('/api/auth/shops'),
  login: (identifier: string, pin: string) =>
    request<{ user: AppUser; shop: Shop | null }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, pin }),
    }),
  getBootstrap: (shopId: string) => request<ShopBootstrapData>(`/api/bootstrap?shopId=${encodeURIComponent(shopId)}`, {}, shopId),

  // Products & Stock
  createProduct: (shopId: string, body: Omit<Product, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>) =>
    request<Product>('/api/products', { method: 'POST', body: JSON.stringify(body) }, shopId),
  updateProduct: (shopId: string, id: string, body: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }, shopId),
  deleteProduct: (shopId: string, id: string) =>
    request<{ ok: boolean }>(`/api/products/${id}`, { method: 'DELETE' }, shopId),
  adjustStock: (
    shopId: string,
    id: string,
    body: { type: 'in' | 'out' | 'adjustment'; quantity: number; reason: string }
  ) => request<Product>(`/api/products/${id}/stock`, { method: 'POST', body: JSON.stringify(body) }, shopId),

  // Sales & Memo
  createSale: (
    shopId: string,
    body: {
      customerId: string | null;
      customerName: string;
      customerPhone: string;
      items: Array<{ productId: string; qty: number; unitPrice: number }>;
      discount: number;
      paidAmount: number;
      paymentMethod: PaymentMethod;
      note?: string;
      createdBy?: string;
    }
  ) => request<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(body) }, shopId),

  // Purchases
  createPurchase: (
    shopId: string,
    body: {
      supplierId: string;
      invoiceNo?: string;
      date?: string;
      items: Array<{ productId: string; qty: number; purchasePrice: number }>;
      paidAmount: number;
      paymentMethod: PaymentMethod;
      note?: string;
    }
  ) => request<Purchase>('/api/purchases', { method: 'POST', body: JSON.stringify(body) }, shopId),

  // Customers
  createCustomer: (
    shopId: string,
    body: { name: string; phone: string; address: string; openingDue?: number }
  ) => request<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(body) }, shopId),
  receiveCustomerPayment: (
    shopId: string,
    customerId: string,
    body: { amount: number; paymentMethod: PaymentMethod; note?: string }
  ) => request<Customer>(`/api/customers/${customerId}/pay`, { method: 'POST', body: JSON.stringify(body) }, shopId),

  // Suppliers
  createSupplier: (
    shopId: string,
    body: { name: string; company: string; phone: string; address: string; openingDue?: number }
  ) => request<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(body) }, shopId),
  paySupplierDue: (
    shopId: string,
    supplierId: string,
    body: { amount: number; paymentMethod: PaymentMethod; note?: string }
  ) => request<Supplier>(`/api/suppliers/${supplierId}/pay`, { method: 'POST', body: JSON.stringify(body) }, shopId),

  // Expenses
  createExpense: (shopId: string, body: Omit<Expense, 'id' | 'shopId'>) =>
    request<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(body) }, shopId),
  deleteExpense: (shopId: string, id: string) =>
    request<{ ok: boolean }>(`/api/expenses/${id}`, { method: 'DELETE' }, shopId),

  // Cashbook
  createCashbookEntry: (
    shopId: string,
    body: { direction: 'in' | 'out'; account: PaymentMethod; amount: number; description: string; partyName?: string }
  ) => request<CashbookTransaction>('/api/cashbook', { method: 'POST', body: JSON.stringify(body) }, shopId),

  // Settings & Backup
  updateShopSettings: (shopId: string, body: Partial<Shop>) =>
    request<Shop>('/api/shop/settings', { method: 'PUT', body: JSON.stringify(body) }, shopId),
  exportShopBackup: (shopId: string) => request<ShopBootstrapData>('/api/shop/backup', {}, shopId),
  restoreShopBackup: (shopId: string, body: ShopBootstrapData) =>
    request<{ ok: boolean }>('/api/shop/restore', { method: 'POST', body: JSON.stringify(body) }, shopId),

  // Master Admin
  getAdminOverview: () => request<AdminOverviewData>('/api/admin/overview'),
  createShopByAdmin: (body: {
    name: string;
    category: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    address: string;
    plan: Shop['plan'];
    status: Shop['status'];
    openingCash?: number;
  }) => request<{ shop: Shop; ownerUser: AppUser }>('/api/admin/shops', { method: 'POST', body: JSON.stringify(body) }),
  updateShopByAdmin: (id: string, body: Partial<Shop>) =>
    request<Shop>(`/api/admin/shops/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  createUserByAdmin: (body: Omit<AppUser, 'id' | 'createdAt'>) =>
    request<AppUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUserByAdmin: (id: string, body: Partial<AppUser>) =>
    request<AppUser>(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateSoftwareVersion: (version: string) =>
    request<{ softwareVersion: string }>('/api/admin/version', { method: 'PUT', body: JSON.stringify({ version }) }),
  exportFullBackup: () => request<unknown>('/api/admin/backup'),
  restoreFullBackup: (body: unknown) =>
    request<{ ok: boolean }>('/api/admin/restore', { method: 'POST', body: JSON.stringify(body) }),
};
