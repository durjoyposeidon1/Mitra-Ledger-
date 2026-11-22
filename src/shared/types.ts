export type Language = 'bn' | 'en';

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank';

export type PlanTier = 'Basic' | 'Standard' | 'Premium' | 'Cloud';

export type ShopStatus = 'active' | 'trial' | 'suspended';

export type UserRole = 'master_admin' | 'owner' | 'manager' | 'cashier';

export type ExpenseCategory =
  | 'দোকান ভাড়া'
  | 'কর্মচারীর বেতন'
  | 'বিদ্যুৎ বিল'
  | 'পরিবহন'
  | 'চা-নাস্তা'
  | 'অন্যান্য খরচ';

export interface Shop {
  id: string;
  code: string;
  name: string;
  category: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  address: string;
  plan: PlanTier;
  status: ShopStatus;
  trialEndsAt?: string;
  softwareVersion: string;
  openingCash: number;
  openingBank: number;
  openingMobile: number;
  lowStockThreshold: number;
  receiptFooter: string;
  thermalWidth: '58mm' | '80mm';
  createdAt: string;
}

export interface AppUser {
  id: string;
  shopId: string | null; // null for master_admin
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  pin: string;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  code: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  barcode: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  productCode: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  address: string;
  totalPurchase: number;
  totalPaid: number;
  due: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  totalPurchase: number;
  totalPaid: number;
  due: number;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  code: string;
  unit: string;
  qty: number;
  unitPrice: number;
  purchasePrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  shopId: string;
  memoNo: string;
  date: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  note: string;
  createdBy: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  code: string;
  unit: string;
  qty: number;
  purchasePrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  shopId: string;
  invoiceNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  note: string;
}

export interface Expense {
  id: string;
  shopId: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export type CashbookTxnType =
  | 'sale_cash'
  | 'customer_payment'
  | 'purchase_payment'
  | 'supplier_payment'
  | 'expense'
  | 'cash_in'
  | 'cash_out';

export interface CashbookTransaction {
  id: string;
  shopId: string;
  date: string;
  type: CashbookTxnType;
  direction: 'in' | 'out';
  account: PaymentMethod;
  amount: number;
  description: string;
  referenceId?: string;
  partyName?: string;
}

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  nameBn: string;
  priceLabel: string;
  priceLabelBn: string;
  billing: 'one-time' | 'monthly';
  maxProducts: number | null;
  maxUsers: number;
  featuresBn: string[];
  featuresEn: string[];
}

export interface ShopBootstrapData {
  shop: Shop;
  products: Product[];
  stockAdjustments: StockAdjustment[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  cashbook: CashbookTransaction[];
  users: AppUser[];
}

export interface AdminOverviewData {
  softwareVersion: string;
  plans: PlanDefinition[];
  shops: Shop[];
  users: AppUser[];
  shopStats: Record<
    string,
    {
      totalSales: number;
      totalProducts: number;
      totalCustomers: number;
      totalOrders: number;
    }
  >;
}
