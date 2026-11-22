import fs from 'node:fs';
import path from 'node:path';
import type {
  AdminOverviewData,
  AppUser,
  CashbookTransaction,
  Customer,
  Expense,
  PlanDefinition,
  Product,
  Purchase,
  Sale,
  Shop,
  ShopBootstrapData,
  StockAdjustment,
  Supplier,
} from '../src/shared/types.ts';

export interface DatabaseState {
  softwareVersion: string;
  plans: PlanDefinition[];
  shops: Shop[];
  users: AppUser[];
  products: Product[];
  stockAdjustments: StockAdjustment[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  cashbook: CashbookTransaction[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mitra-db.json');

function isoDateDaysAgo(daysAgo: number, hour = 11, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeSeedData(): DatabaseState {
  const today = isoDateDaysAgo(0, 10, 15);
  const yesterday = isoDateDaysAgo(1, 15, 20);
  const twoDaysAgo = isoDateDaysAgo(2, 12, 0);
  const fiveDaysAgo = isoDateDaysAgo(5, 16, 40);
  const tenDaysAgo = isoDateDaysAgo(10, 11, 10);
  const twentyDaysAgo = isoDateDaysAgo(20, 14, 0);
  const thirtyFiveDaysAgo = isoDateDaysAgo(35, 13, 0);

  const plans: PlanDefinition[] = [
    {
      id: 'Basic',
      name: 'Basic',
      nameBn: 'বেসিক প্ল্যান',
      priceLabel: '৳1,500 one-time',
      priceLabelBn: '৳১,৫০০ এককালীন',
      billing: 'one-time',
      maxProducts: 500,
      maxUsers: 2,
      featuresBn: ['দৈনিক হিসাব ও ড্যাশবোর্ড', 'বিক্রি ও থার্মাল মেমো', 'পণ্য ও স্টক ম্যানেজমেন্ট', 'লো-স্টক অ্যালার্ট'],
      featuresEn: ['Daily Dashboard & Sales', 'POS & Thermal Memo', 'Product & Stock Control', 'Low Stock Alerts'],
    },
    {
      id: 'Standard',
      name: 'Standard',
      nameBn: 'স্ট্যান্ডার্ড প্ল্যান',
      priceLabel: '৳3,000 one-time',
      priceLabelBn: '৳৩,০০০ এককালীন',
      billing: 'one-time',
      maxProducts: 2500,
      maxUsers: 5,
      featuresBn: ['বেসিকের সব ফিচার', 'কাস্টমার ও বাকি লেজার', 'সাপ্লায়ার ও ক্রয় হিসাব', 'বিস্তারিত PDF রিপোর্টস'],
      featuresEn: ['All Basic Features', 'Customer Due Ledger', 'Supplier & Purchase Ledger', 'Full PDF Reports'],
    },
    {
      id: 'Premium',
      name: 'Premium',
      nameBn: 'প্রিমিয়াম প্ল্যান',
      priceLabel: '৳6,500 one-time',
      priceLabelBn: '৳৫,০০০–৮,০০০ এককালীন',
      billing: 'one-time',
      maxProducts: null,
      maxUsers: 15,
      featuresBn: ['সব ফিচার আনলিমিটেড', 'বারকোড স্ক্যানার সাপোর্ট', 'অ্যাডভান্সড লাভ-ক্ষতি ও ক্যাশবুক', 'মাল্টি-স্টাফ অ্যাকাউন্ট'],
      featuresEn: ['All Unlimited Features', 'Barcode Scanner Support', 'Advanced P&L & Cashbook', 'Multi-Staff Accounts'],
    },
    {
      id: 'Cloud',
      name: 'Cloud Plan',
      nameBn: 'ক্লাউড প্ল্যান',
      priceLabel: '৳500 / month',
      priceLabelBn: '৳৩০০–৭০০ / মাস',
      billing: 'monthly',
      maxProducts: null,
      maxUsers: 25,
      featuresBn: ['অনলাইন অটো ব্যাকআপ', 'যেকোনো ডিভাইস থেকে ক্লাউড অ্যাক্সেস', 'লাইফটাইম সফটওয়্যার আপডেট', 'প্রায়োরিটি সাপোর্ট'],
      featuresEn: ['Automated Cloud Backup', 'Access From Any Device', 'Continuous Updates', 'Priority Support'],
    },
  ];

  const shops: Shop[] = [
    {
      id: 'shop_mitra',
      code: 'MB-1001',
      name: 'মিত্র জেনারেল স্টোর',
      category: 'মুদি ও ডিপার্টমেন্টাল স্টোর',
      ownerName: 'শান্তনু মিত্র',
      ownerPhone: '01711223344',
      ownerEmail: 'shantonumitra52@gmail.com',
      address: '৪২ নবাবপুর রোড, ঢাকা-১১০০',
      plan: 'Premium',
      status: 'active',
      softwareVersion: '2.4.0',
      openingCash: 10000,
      openingBank: 45000,
      openingMobile: 12000,
      lowStockThreshold: 15,
      receiptFooter: 'ধন্যবাদ! আবার আসবেন — মিত্র জেনারেল স্টোর',
      thermalWidth: '80mm',
      createdAt: thirtyFiveDaysAgo,
    },
    {
      id: 'shop_desh',
      code: 'MB-1002',
      name: 'দেশ টেক ইলেকট্রনিক্স',
      category: 'ইলেকট্রনিক্স ও মোবাইল এক্সেসরিজ',
      ownerName: 'তানভীর আহমেদ',
      ownerPhone: '01819887766',
      ownerEmail: 'tanvir@deshtech.bd',
      address: 'লেভেল-৪, বসুন্ধরা সিটি, ঢাকা',
      plan: 'Standard',
      status: 'active',
      softwareVersion: '2.4.0',
      openingCash: 25000,
      openingBank: 120000,
      openingMobile: 32000,
      lowStockThreshold: 5,
      receiptFooter: '৭ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি প্রযোজ্য',
      thermalWidth: '80mm',
      createdAt: twentyDaysAgo,
    },
    {
      id: 'shop_taj',
      code: 'MB-1003',
      name: 'তাজ ফ্যাশন হাউস',
      category: 'গার্মেন্টস ও পাঞ্জাবি শপ',
      ownerName: 'রফিকুল ইসলাম',
      ownerPhone: '01911554433',
      ownerEmail: 'rafiq@tajfashion.bd',
      address: 'চকবাজার, চট্টগ্রাম',
      plan: 'Basic',
      status: 'trial',
      trialEndsAt: isoDateDaysAgo(-14),
      softwareVersion: '2.4.0',
      openingCash: 8000,
      openingBank: 15000,
      openingMobile: 5000,
      lowStockThreshold: 10,
      receiptFooter: 'বিক্রিত পণ্য ৩ দিনের মধ্যে পরিবর্তনযোগ্য',
      thermalWidth: '58mm',
      createdAt: tenDaysAgo,
    },
  ];

  const users: AppUser[] = [
    {
      id: 'usr_admin',
      shopId: null,
      name: 'শান্তনু মিত্র (Master Admin)',
      phone: '01700000000',
      email: 'shantonumitra52@gmail.com',
      role: 'master_admin',
      pin: '1234',
      active: true,
      createdAt: thirtyFiveDaysAgo,
    },
    {
      id: 'usr_mitra_owner',
      shopId: 'shop_mitra',
      name: 'শান্তনু মিত্র',
      phone: '01711223344',
      email: 'shantonumitra52@gmail.com',
      role: 'owner',
      pin: '1234',
      active: true,
      createdAt: thirtyFiveDaysAgo,
    },
    {
      id: 'usr_mitra_cashier',
      shopId: 'shop_mitra',
      name: 'কামরুল হাসান',
      phone: '01755667788',
      email: 'kamrul@mitrastore.bd',
      role: 'cashier',
      pin: '1234',
      active: true,
      createdAt: twentyDaysAgo,
    },
    {
      id: 'usr_desh_owner',
      shopId: 'shop_desh',
      name: 'তানভীর আহমেদ',
      phone: '01819887766',
      email: 'tanvir@deshtech.bd',
      role: 'owner',
      pin: '1234',
      active: true,
      createdAt: twentyDaysAgo,
    },
    {
      id: 'usr_taj_owner',
      shopId: 'shop_taj',
      name: 'রফিকুল ইসলাম',
      phone: '01911554433',
      email: 'rafiq@tajfashion.bd',
      role: 'owner',
      pin: '1234',
      active: true,
      createdAt: tenDaysAgo,
    },
  ];

  const products: Product[] = [
    // Mitra General Store
    {
      id: 'prod_1',
      shopId: 'shop_mitra',
      name: 'Lux Soap (লাক্স সাবান ১০০ গ্রাম)',
      code: 'LUX001',
      category: 'Soap & Personal Care',
      purchasePrice: 50,
      salePrice: 60,
      stock: 100,
      minStock: 20,
      unit: 'Piece',
      barcode: '8901030865412',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_2',
      shopId: 'shop_mitra',
      name: 'রশিদ মিনিকেট চাল (৫ কেজি)',
      code: 'RICE005',
      category: 'Rice & Grains',
      purchasePrice: 340,
      salePrice: 390,
      stock: 48,
      minStock: 15,
      unit: 'Pack',
      barcode: '8941100234011',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_3',
      shopId: 'shop_mitra',
      name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)',
      code: 'OIL005',
      category: 'Cooking Oil',
      purchasePrice: 780,
      salePrice: 860,
      stock: 22,
      minStock: 10,
      unit: 'Bottle',
      barcode: '8941100550051',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_4',
      shopId: 'shop_mitra',
      name: 'ফ্রেশ পরিশোধিত চিনি (১ কেজি)',
      code: 'SUG001',
      category: 'Grocery',
      purchasePrice: 118,
      salePrice: 135,
      stock: 9,
      minStock: 15,
      unit: 'Kg',
      barcode: '8941100881014',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_5',
      shopId: 'shop_mitra',
      name: 'আড়ং ডেইরি মিল্ক (১ লিটার)',
      code: 'MLK001',
      category: 'Beverages & Dairy',
      purchasePrice: 82,
      salePrice: 95,
      stock: 35,
      minStock: 12,
      unit: 'Litre',
      barcode: '8941100992018',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_6',
      shopId: 'shop_mitra',
      name: 'প্রাণ ম্যাঙ্গো জুস (২৫০ মিলি)',
      code: 'JUC250',
      category: 'Beverages & Dairy',
      purchasePrice: 22,
      salePrice: 30,
      stock: 140,
      minStock: 30,
      unit: 'Piece',
      barcode: '8941100114422',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_7',
      shopId: 'shop_mitra',
      name: 'কোলগেট স্ট্রং টিথ (২০০ গ্রাম)',
      code: 'COL200',
      category: 'Soap & Personal Care',
      purchasePrice: 125,
      salePrice: 155,
      stock: 6,
      minStock: 12,
      unit: 'Piece',
      barcode: '8901314010025',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_8',
      shopId: 'shop_mitra',
      name: 'এসিআই পিওর লবণ (১ কেজি)',
      code: 'SLT001',
      category: 'Grocery',
      purchasePrice: 32,
      salePrice: 40,
      stock: 65,
      minStock: 20,
      unit: 'Pack',
      barcode: '8941100330019',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_9',
      shopId: 'shop_mitra',
      name: 'ডেটল অ্যান্টিসেপটিক লিকুইড (৫০০ মিলি)',
      code: 'DET500',
      category: 'Soap & Personal Care',
      purchasePrice: 195,
      salePrice: 240,
      stock: 11,
      minStock: 12,
      unit: 'Bottle',
      barcode: '8901396345001',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_10',
      shopId: 'shop_mitra',
      name: 'ইস্পাহানি মির্জাপুর চা (৪০০ গ্রাম)',
      code: 'TEA400',
      category: 'Beverages & Dairy',
      purchasePrice: 180,
      salePrice: 215,
      stock: 42,
      minStock: 10,
      unit: 'Pack',
      barcode: '8941100440407',
      createdAt: thirtyFiveDaysAgo,
      updatedAt: today,
    },
    // Desh Tech Electronics
    {
      id: 'prod_desh_1',
      shopId: 'shop_desh',
      name: 'Anker 20W Fast Charger USB-C',
      code: 'ANK020',
      category: 'Chargers & Cables',
      purchasePrice: 850,
      salePrice: 1250,
      stock: 28,
      minStock: 6,
      unit: 'Piece',
      barcode: '194644041236',
      createdAt: twentyDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_desh_2',
      shopId: 'shop_desh',
      name: 'Xiaomi Redmi Buds 5',
      code: 'XIA005',
      category: 'Audio & Earbuds',
      purchasePrice: 2200,
      salePrice: 2950,
      stock: 12,
      minStock: 5,
      unit: 'Box',
      barcode: '6941812754321',
      createdAt: twentyDaysAgo,
      updatedAt: today,
    },
    {
      id: 'prod_desh_3',
      shopId: 'shop_desh',
      name: 'Baseus 10000mAh Power Bank',
      code: 'BAS010',
      category: 'Power Banks',
      purchasePrice: 1350,
      salePrice: 1850,
      stock: 4,
      minStock: 6,
      unit: 'Piece',
      barcode: '6953156284517',
      createdAt: twentyDaysAgo,
      updatedAt: today,
    },
    // Taj Fashion
    {
      id: 'prod_taj_1',
      shopId: 'shop_taj',
      name: 'প্রিমিয়াম কটন পাঞ্জাবি (সাদা)',
      code: 'PNJ101',
      category: 'Panjabi',
      purchasePrice: 950,
      salePrice: 1450,
      stock: 25,
      minStock: 8,
      unit: 'Piece',
      barcode: '202600101',
      createdAt: tenDaysAgo,
      updatedAt: today,
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust_1',
      shopId: 'shop_mitra',
      name: 'করিম উদ্দিন',
      phone: '01712345678',
      address: 'বংশাল, ঢাকা',
      totalPurchase: 18500,
      totalPaid: 11000,
      due: 7500,
      createdAt: twentyDaysAgo,
    },
    {
      id: 'cust_2',
      shopId: 'shop_mitra',
      name: 'সালমা বেগম',
      phone: '01812998877',
      address: 'ওয়ারী, ঢাকা',
      totalPurchase: 14200,
      totalPaid: 9200,
      due: 5000,
      createdAt: tenDaysAgo,
    },
    {
      id: 'cust_3',
      shopId: 'shop_mitra',
      name: 'আরিফুল ইসলাম',
      phone: '01914556622',
      address: 'নবাবপুর, ঢাকা',
      totalPurchase: 9800,
      totalPaid: 9800,
      due: 0,
      createdAt: fiveDaysAgo,
    },
    {
      id: 'cust_desh_1',
      shopId: 'shop_desh',
      name: 'মাহমুদ হাসান',
      phone: '01677112233',
      address: 'ধানমন্ডি, ঢাকা',
      totalPurchase: 12400,
      totalPaid: 10000,
      due: 2400,
      createdAt: tenDaysAgo,
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup_1',
      shopId: 'shop_mitra',
      name: 'হাজী মোস্তফা ট্রেডার্স',
      company: 'Mostafa Wholesale Co.',
      phone: '01711889900',
      address: 'মৌলভীবাজার পাইকারি মার্কেট, ঢাকা',
      totalPurchase: 82000,
      totalPaid: 68000,
      due: 14000,
      createdAt: thirtyFiveDaysAgo,
    },
    {
      id: 'sup_2',
      shopId: 'shop_mitra',
      name: 'ইউনিলিভার ও প্রাণ ডিস্ট্রিবিউশন',
      company: 'Metro FMCG Distributors',
      phone: '01822334455',
      address: 'তেজগাঁও শিল্প এলাকা, ঢাকা',
      totalPurchase: 54000,
      totalPaid: 49000,
      due: 5000,
      createdAt: twentyDaysAgo,
    },
    {
      id: 'sup_desh_1',
      shopId: 'shop_desh',
      name: 'গ্লোবাল গেজেট ইম্পোর্টার্স',
      company: 'Global Gadget BD',
      phone: '01799001122',
      address: 'স্টেডিয়াম মার্কেট, ঢাকা',
      totalPurchase: 95000,
      totalPaid: 80000,
      due: 15000,
      createdAt: twentyDaysAgo,
    },
  ];

  // Today's sales sum to 25,500 BDT with approx 4,800 BDT profit for Mitra Store
  const sales: Sale[] = [
    {
      id: 'sale_1',
      shopId: 'shop_mitra',
      memoNo: 'MEMO-2026-0104',
      date: isoDateDaysAgo(0, 9, 45),
      customerId: 'cust_1',
      customerName: 'করিম উদ্দিন',
      customerPhone: '01712345678',
      items: [
        { productId: 'prod_2', name: 'রশিদ মিনিকেট চাল (৫ কেজি)', code: 'RICE005', unit: 'Pack', qty: 15, unitPrice: 390, purchasePrice: 340, subtotal: 5850 },
        { productId: 'prod_3', name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', code: 'OIL005', unit: 'Bottle', qty: 6, unitPrice: 860, purchasePrice: 780, subtotal: 5160 },
        { productId: 'prod_1', name: 'Lux Soap (লাক্স সাবান ১০০ গ্রাম)', code: 'LUX001', unit: 'Piece', qty: 24, unitPrice: 60, purchasePrice: 50, subtotal: 1440 },
      ],
      subtotal: 12450,
      discount: 150,
      totalAmount: 12300,
      paidAmount: 9800,
      dueAmount: 2500,
      paymentMethod: 'Cash',
      note: 'সকালের পাইকারি ও খুচরা অর্ডার',
      createdBy: 'শান্তনু মিত্র',
    },
    {
      id: 'sale_2',
      shopId: 'shop_mitra',
      memoNo: 'MEMO-2026-0105',
      date: isoDateDaysAgo(0, 11, 20),
      customerId: 'cust_2',
      customerName: 'সালমা বেগম',
      customerPhone: '01812998877',
      items: [
        { productId: 'prod_10', name: 'ইস্পাহানি মির্জাপুর চা (৪০০ গ্রাম)', code: 'TEA400', unit: 'Pack', qty: 20, unitPrice: 215, purchasePrice: 180, subtotal: 4300 },
        { productId: 'prod_9', name: 'ডেটল অ্যান্টিসেপটিক লিকুইড (৫০০ মিলি)', code: 'DET500', unit: 'Bottle', qty: 10, unitPrice: 240, purchasePrice: 195, subtotal: 2400 },
        { productId: 'prod_7', name: 'কোলগেট স্ট্রং টিথ (২০০ গ্রাম)', code: 'COL200', unit: 'Piece', qty: 10, unitPrice: 155, purchasePrice: 125, subtotal: 1550 },
      ],
      subtotal: 8250,
      discount: 50,
      totalAmount: 8200,
      paidAmount: 8200,
      dueAmount: 0,
      paymentMethod: 'bKash',
      note: 'বিকাশ পেমেন্ট',
      createdBy: 'কামরুল হাসান',
    },
    {
      id: 'sale_3',
      shopId: 'shop_mitra',
      memoNo: 'MEMO-2026-0106',
      date: isoDateDaysAgo(0, 13, 10),
      customerId: 'cust_3',
      customerName: 'আরিফুল ইসলাম',
      customerPhone: '01914556622',
      items: [
        { productId: 'prod_4', name: 'ফ্রেশ পরিশোধিত চিনি (১ কেজি)', code: 'SUG001', unit: 'Kg', qty: 20, unitPrice: 135, purchasePrice: 118, subtotal: 2700 },
        { productId: 'prod_6', name: 'প্রাণ ম্যাঙ্গো জুস (২৫০ মিলি)', code: 'JUC250', unit: 'Piece', qty: 50, unitPrice: 30, purchasePrice: 22, subtotal: 1500 },
        { productId: 'prod_8', name: 'এসিআই পিওর লবণ (১ কেজি)', code: 'SLT001', unit: 'Pack', qty: 20, unitPrice: 40, purchasePrice: 32, subtotal: 800 },
      ],
      subtotal: 5000,
      discount: 0,
      totalAmount: 5000,
      paidAmount: 5000,
      dueAmount: 0,
      paymentMethod: 'Cash',
      note: 'নগদ বিক্রি',
      createdBy: 'শান্তনু মিত্র',
    },
    // Historical sales for monthly graph
    {
      id: 'sale_hist_1',
      shopId: 'shop_mitra',
      memoNo: 'MEMO-2026-0099',
      date: yesterday,
      customerId: 'cust_1',
      customerName: 'করিম উদ্দিন',
      customerPhone: '01712345678',
      items: [
        { productId: 'prod_2', name: 'রশিদ মিনিকেট চাল (৫ কেজি)', code: 'RICE005', unit: 'Pack', qty: 25, unitPrice: 390, purchasePrice: 340, subtotal: 9750 },
        { productId: 'prod_3', name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', code: 'OIL005', unit: 'Bottle', qty: 10, unitPrice: 860, purchasePrice: 780, subtotal: 8600 },
      ],
      subtotal: 18350,
      discount: 0,
      totalAmount: 18350,
      paidAmount: 15350,
      dueAmount: 3000,
      paymentMethod: 'Bank',
      note: 'ব্যাংক ট্রান্সফার',
      createdBy: 'শান্তনু মিত্র',
    },
    {
      id: 'sale_hist_2',
      shopId: 'shop_mitra',
      memoNo: 'MEMO-2026-0092',
      date: fiveDaysAgo,
      customerId: 'cust_3',
      customerName: 'আরিফুল ইসলাম',
      customerPhone: '01914556622',
      items: [
        { productId: 'prod_5', name: 'আড়ং ডেইরি মিল্ক (১ লিটার)', code: 'MLK001', unit: 'Litre', qty: 60, unitPrice: 95, purchasePrice: 82, subtotal: 5700 },
        { productId: 'prod_1', name: 'Lux Soap (লাক্স সাবান ১০০ গ্রাম)', code: 'LUX001', unit: 'Piece', qty: 100, unitPrice: 60, purchasePrice: 50, subtotal: 6000 },
      ],
      subtotal: 11700,
      discount: 200,
      totalAmount: 11500,
      paidAmount: 11500,
      dueAmount: 0,
      paymentMethod: 'Nagad',
      note: 'নগদ অ্যাপ পেমেন্ট',
      createdBy: 'শান্তনু মিত্র',
    },
    {
      id: 'sale_hist_3',
      shopId: 'shop_mitra',
      memoNo: 'MEMO-2026-0081',
      date: tenDaysAgo,
      customerId: null,
      customerName: 'খুচরা ক্রেতা (Walk-in)',
      customerPhone: '',
      items: [
        { productId: 'prod_3', name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', code: 'OIL005', unit: 'Bottle', qty: 15, unitPrice: 860, purchasePrice: 780, subtotal: 12900 },
        { productId: 'prod_10', name: 'ইস্পাহানি মির্জাপুর চা (৪০০ গ্রাম)', code: 'TEA400', unit: 'Pack', qty: 30, unitPrice: 215, purchasePrice: 180, subtotal: 6450 },
      ],
      subtotal: 19350,
      discount: 350,
      totalAmount: 19000,
      paidAmount: 19000,
      dueAmount: 0,
      paymentMethod: 'Cash',
      note: '',
      createdBy: 'কামরুল হাসান',
    },
    {
      id: 'sale_hist_4',
      shopId: 'shop_mitra',
      memoNo: 'MEMO-2026-0065',
      date: twentyDaysAgo,
      customerId: 'cust_2',
      customerName: 'সালমা বেগম',
      customerPhone: '01812998877',
      items: [
        { productId: 'prod_2', name: 'রশিদ মিনিকেট চাল (৫ কেজি)', code: 'RICE005', unit: 'Pack', qty: 30, unitPrice: 390, purchasePrice: 340, subtotal: 11700 },
      ],
      subtotal: 11700,
      discount: 0,
      totalAmount: 11700,
      paidAmount: 9700,
      dueAmount: 2000,
      paymentMethod: 'Cash',
      note: '',
      createdBy: 'শান্তনু মিত্র',
    },
    // Desh Tech sale
    {
      id: 'sale_desh_1',
      shopId: 'shop_desh',
      memoNo: 'MEMO-2026-0011',
      date: today,
      customerId: 'cust_desh_1',
      customerName: 'মাহমুদ হাসান',
      customerPhone: '01677112233',
      items: [
        { productId: 'prod_desh_1', name: 'Anker 20W Fast Charger USB-C', code: 'ANK020', unit: 'Piece', qty: 4, unitPrice: 1250, purchasePrice: 850, subtotal: 5000 },
        { productId: 'prod_desh_2', name: 'Xiaomi Redmi Buds 5', code: 'XIA005', unit: 'Box', qty: 2, unitPrice: 2950, purchasePrice: 2200, subtotal: 5900 },
      ],
      subtotal: 10900,
      discount: 400,
      totalAmount: 10500,
      paidAmount: 8100,
      dueAmount: 2400,
      paymentMethod: 'Bank',
      note: 'দেশ টেক সেলস মেমো',
      createdBy: 'তানভীর আহমেদ',
    },
  ];

  const purchases: Purchase[] = [
    {
      id: 'pur_1',
      shopId: 'shop_mitra',
      invoiceNo: 'PUR-2026-0041',
      date: isoDateDaysAgo(0, 8, 30),
      supplierId: 'sup_1',
      supplierName: 'হাজী মোস্তফা ট্রেডার্স',
      items: [
        { productId: 'prod_2', name: 'রশিদ মিনিকেট চাল (৫ কেজি)', code: 'RICE005', unit: 'Pack', qty: 20, purchasePrice: 340, subtotal: 6800 },
        { productId: 'prod_3', name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', code: 'OIL005', unit: 'Bottle', qty: 10, purchasePrice: 780, subtotal: 7800 },
      ],
      totalAmount: 14600,
      paidAmount: 10600,
      dueAmount: 4000,
      paymentMethod: 'Cash',
      note: 'সকালের স্টক ক্রয়',
    },
    {
      id: 'pur_2',
      shopId: 'shop_mitra',
      invoiceNo: 'PUR-2026-0038',
      date: twoDaysAgo,
      supplierId: 'sup_2',
      supplierName: 'ইউনিলিভার ও প্রাণ ডিস্ট্রিবিউশন',
      items: [
        { productId: 'prod_1', name: 'Lux Soap (লাক্স সাবান ১০০ গ্রাম)', code: 'LUX001', unit: 'Piece', qty: 100, purchasePrice: 50, subtotal: 5000 },
        { productId: 'prod_6', name: 'প্রাণ ম্যাঙ্গো জুস (২৫০ মিলি)', code: 'JUC250', unit: 'Piece', qty: 100, purchasePrice: 22, subtotal: 2200 },
      ],
      totalAmount: 7200,
      paidAmount: 7200,
      dueAmount: 0,
      paymentMethod: 'Bank',
      note: '',
    },
    {
      id: 'pur_desh_1',
      shopId: 'shop_desh',
      invoiceNo: 'PUR-2026-0005',
      date: yesterday,
      supplierId: 'sup_desh_1',
      supplierName: 'গ্লোবাল গেজেট ইম্পোর্টার্স',
      items: [
        { productId: 'prod_desh_1', name: 'Anker 20W Fast Charger USB-C', code: 'ANK020', unit: 'Piece', qty: 20, purchasePrice: 850, subtotal: 17000 },
      ],
      totalAmount: 17000,
      paidAmount: 12000,
      dueAmount: 5000,
      paymentMethod: 'Bank',
      note: '',
    },
  ];

  // Today's expenses sum to 2,000 BDT for Mitra Store
  const expenses: Expense[] = [
    {
      id: 'exp_1',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 10, 0),
      category: 'পরিবহন',
      description: 'মৌলভীবাজার থেকে মালামাল ভ্যান ভাড়া',
      amount: 1200,
      paymentMethod: 'Cash',
    },
    {
      id: 'exp_2',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 12, 30),
      category: 'চা-নাস্তা',
      description: 'কাস্টমার ও স্টাফ আপ্যায়ন',
      amount: 800,
      paymentMethod: 'Cash',
    },
    {
      id: 'exp_3',
      shopId: 'shop_mitra',
      date: fiveDaysAgo,
      category: 'বিদ্যুৎ বিল',
      description: 'দোকানের মাসিক বিদ্যুৎ বিল',
      amount: 3450,
      paymentMethod: 'bKash',
    },
    {
      id: 'exp_4',
      shopId: 'shop_mitra',
      date: tenDaysAgo,
      category: 'দোকান ভাড়া',
      description: 'দোকান ভাড়া পরিশোধ',
      amount: 18000,
      paymentMethod: 'Bank',
    },
    {
      id: 'exp_5',
      shopId: 'shop_mitra',
      date: tenDaysAgo,
      category: 'কর্মচারীর বেতন',
      description: 'কামরুল হাসান — মাসিক বেতন',
      amount: 12000,
      paymentMethod: 'Cash',
    },
    {
      id: 'exp_desh_1',
      shopId: 'shop_desh',
      date: today,
      category: 'চা-নাস্তা',
      description: 'অফিস আপ্যায়ন',
      amount: 450,
      paymentMethod: 'Cash',
    },
  ];

  const cashbook: CashbookTransaction[] = [
    {
      id: 'cb_1',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 8, 30),
      type: 'purchase_payment',
      direction: 'out',
      account: 'Cash',
      amount: 10600,
      description: 'ক্রয় পেমেন্ট — PUR-2026-0041',
      referenceId: 'pur_1',
      partyName: 'হাজী মোস্তফা ট্রেডার্স',
    },
    {
      id: 'cb_2',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 9, 45),
      type: 'sale_cash',
      direction: 'in',
      account: 'Cash',
      amount: 9800,
      description: 'বিক্রি মেমো — MEMO-2026-0104',
      referenceId: 'sale_1',
      partyName: 'করিম উদ্দিন',
    },
    {
      id: 'cb_3',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 10, 0),
      type: 'expense',
      direction: 'out',
      account: 'Cash',
      amount: 1200,
      description: 'পরিবহন — মৌলভীবাজার থেকে মালামাল ভ্যান ভাড়া',
      referenceId: 'exp_1',
    },
    {
      id: 'cb_4',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 11, 20),
      type: 'sale_cash',
      direction: 'in',
      account: 'bKash',
      amount: 8200,
      description: 'বিক্রি মেমো — MEMO-2026-0105',
      referenceId: 'sale_2',
      partyName: 'সালমা বেগম',
    },
    {
      id: 'cb_5',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 12, 30),
      type: 'expense',
      direction: 'out',
      account: 'Cash',
      amount: 800,
      description: 'চা-নাস্তা — কাস্টমার ও স্টাফ আপ্যায়ন',
      referenceId: 'exp_2',
    },
    {
      id: 'cb_6',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 13, 10),
      type: 'sale_cash',
      direction: 'in',
      account: 'Cash',
      amount: 5000,
      description: 'বিক্রি মেমো — MEMO-2026-0106',
      referenceId: 'sale_3',
      partyName: 'আরিফুল ইসলাম',
    },
    {
      id: 'cb_7',
      shopId: 'shop_mitra',
      date: isoDateDaysAgo(0, 14, 0),
      type: 'customer_payment',
      direction: 'in',
      account: 'Cash',
      amount: 2000,
      description: 'কাস্টমার বাকি আদায় — করিম উদ্দিন',
      referenceId: 'cust_1',
      partyName: 'করিম উদ্দিন',
    },
    {
      id: 'cb_8',
      shopId: 'shop_mitra',
      date: yesterday,
      type: 'sale_cash',
      direction: 'in',
      account: 'Bank',
      amount: 15350,
      description: 'বিক্রি মেমো — MEMO-2026-0099',
      referenceId: 'sale_hist_1',
      partyName: 'করিম উদ্দিন',
    },
    {
      id: 'cb_9',
      shopId: 'shop_mitra',
      date: fiveDaysAgo,
      type: 'sale_cash',
      direction: 'in',
      account: 'Nagad',
      amount: 11500,
      description: 'বিক্রি মেমো — MEMO-2026-0092',
      referenceId: 'sale_hist_2',
      partyName: 'আরিফুল ইসলাম',
    },
    {
      id: 'cb_10',
      shopId: 'shop_mitra',
      date: fiveDaysAgo,
      type: 'expense',
      direction: 'out',
      account: 'bKash',
      amount: 3450,
      description: 'বিদ্যুৎ বিল — দোকানের মাসিক বিদ্যুৎ বিল',
      referenceId: 'exp_3',
    },
    {
      id: 'cb_desh_1',
      shopId: 'shop_desh',
      date: today,
      type: 'sale_cash',
      direction: 'in',
      account: 'Bank',
      amount: 8100,
      description: 'বিক্রি মেমো — MEMO-2026-0011',
      referenceId: 'sale_desh_1',
      partyName: 'মাহমুদ হাসান',
    },
  ];

  const stockAdjustments: StockAdjustment[] = [
    {
      id: 'stk_1',
      shopId: 'shop_mitra',
      productId: 'prod_1',
      productName: 'Lux Soap (লাক্স সাবান ১০০ গ্রাম)',
      productCode: 'LUX001',
      type: 'in',
      quantity: 100,
      previousStock: 24,
      newStock: 124,
      reason: 'পাইকারি স্টক ইন',
      date: twoDaysAgo,
    },
  ];

  return {
    softwareVersion: '2.4.0',
    plans,
    shops,
    users,
    products,
    stockAdjustments,
    customers,
    suppliers,
    sales,
    purchases,
    expenses,
    cashbook,
  };
}

class StoreManager {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw) as DatabaseState;
      }
    } catch (err) {
      console.error('Failed to read DB file, recreating seed DB:', err);
    }
    const seed = makeSeedData();
    this.saveState(seed);
    return seed;
  }

  private saveState(state: DatabaseState) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  }

  private commit() {
    this.saveState(this.state);
  }

  getPublicShops(): Shop[] {
    return this.state.shops;
  }

  getPlans(): PlanDefinition[] {
    return this.state.plans;
  }

  getShopBootstrap(shopId: string): ShopBootstrapData | null {
    const shop = this.state.shops.find((s) => s.id === shopId);
    if (!shop) return null;
    return {
      shop,
      products: this.state.products.filter((p) => p.shopId === shopId),
      stockAdjustments: this.state.stockAdjustments
        .filter((s) => s.shopId === shopId)
        .sort((a, b) => b.date.localeCompare(a.date)),
      customers: this.state.customers.filter((c) => c.shopId === shopId),
      suppliers: this.state.suppliers.filter((s) => s.shopId === shopId),
      sales: this.state.sales
        .filter((s) => s.shopId === shopId)
        .sort((a, b) => b.date.localeCompare(a.date)),
      purchases: this.state.purchases
        .filter((p) => p.shopId === shopId)
        .sort((a, b) => b.date.localeCompare(a.date)),
      expenses: this.state.expenses
        .filter((e) => e.shopId === shopId)
        .sort((a, b) => b.date.localeCompare(a.date)),
      cashbook: this.state.cashbook
        .filter((c) => c.shopId === shopId)
        .sort((a, b) => b.date.localeCompare(a.date)),
      users: this.state.users.filter((u) => u.shopId === shopId),
    };
  }

  authenticate(identifier: string, pin: string): { user: AppUser; shop: Shop | null } | null {
    const clean = identifier.trim().toLowerCase();
    const user = this.state.users.find(
      (u) =>
        u.active &&
        (u.phone === identifier.trim() || u.email.toLowerCase() === clean) &&
        u.pin === pin
    );
    if (!user) return null;
    const shop = user.shopId ? this.state.shops.find((s) => s.id === user.shopId) ?? null : null;
    return { user, shop };
  }

  // Products
  createProduct(shopId: string, payload: Omit<Product, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>): Product {
    const now = new Date().toISOString();
    const product: Product = {
      ...payload,
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      shopId,
      createdAt: now,
      updatedAt: now,
    };
    this.state.products.unshift(product);
    if (product.stock > 0) {
      this.state.stockAdjustments.unshift({
        id: `stk_${Date.now()}`,
        shopId,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        type: 'in',
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: 'নতুন পণ্য প্রারম্ভিক স্টক',
        date: now,
      });
    }
    this.commit();
    return product;
  }

  updateProduct(shopId: string, id: string, updates: Partial<Product>): Product | null {
    const idx = this.state.products.findIndex((p) => p.id === id && p.shopId === shopId);
    if (idx === -1) return null;
    const updated: Product = {
      ...this.state.products[idx],
      ...updates,
      id,
      shopId,
      updatedAt: new Date().toISOString(),
    };
    this.state.products[idx] = updated;
    this.commit();
    return updated;
  }

  deleteProduct(shopId: string, id: string): boolean {
    const before = this.state.products.length;
    this.state.products = this.state.products.filter((p) => !(p.id === id && p.shopId === shopId));
    if (this.state.products.length !== before) {
      this.commit();
      return true;
    }
    return false;
  }

  adjustStock(
    shopId: string,
    productId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason: string
  ): Product | null {
    const prod = this.state.products.find((p) => p.id === productId && p.shopId === shopId);
    if (!prod) return null;
    const prev = prod.stock;
    let next = prev;
    if (type === 'in') next = prev + Math.abs(quantity);
    else if (type === 'out') next = Math.max(0, prev - Math.abs(quantity));
    else next = Math.max(0, quantity);

    prod.stock = next;
    prod.updatedAt = new Date().toISOString();

    this.state.stockAdjustments.unshift({
      id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      type,
      quantity: type === 'adjustment' ? next - prev : quantity,
      previousStock: prev,
      newStock: next,
      reason: reason || (type === 'in' ? 'Stock In' : type === 'out' ? 'Stock Out' : 'Stock Adjustment'),
      date: new Date().toISOString(),
    });
    this.commit();
    return prod;
  }

  // Sales & Memo
  createSale(
    shopId: string,
    payload: {
      customerId: string | null;
      customerName: string;
      customerPhone: string;
      items: Array<{ productId: string; qty: number; unitPrice: number }>;
      discount: number;
      paidAmount: number;
      paymentMethod: Sale['paymentMethod'];
      note?: string;
      createdBy?: string;
      date?: string;
    }
  ): Sale {
    const now = payload.date || new Date().toISOString();
    const shopSalesCount = this.state.sales.filter((s) => s.shopId === shopId).length;
    const memoNo = `MEMO-${new Date().getFullYear()}-${String(shopSalesCount + 101).padStart(4, '0')}`;

    const saleItems = payload.items.map((line) => {
      const prod = this.state.products.find((p) => p.id === line.productId && p.shopId === shopId);
      if (!prod) {
        throw new Error(`Product not found: ${line.productId}`);
      }
      if (prod.stock < line.qty) {
        throw new Error(`পর্যাপ্ত স্টক নেই: ${prod.name} (বর্তমান স্টক: ${prod.stock})`);
      }
      prod.stock -= line.qty;
      prod.updatedAt = now;

      return {
        productId: prod.id,
        name: prod.name,
        code: prod.code,
        unit: prod.unit,
        qty: line.qty,
        unitPrice: line.unitPrice,
        purchasePrice: prod.purchasePrice,
        subtotal: line.qty * line.unitPrice,
      };
    });

    const subtotal = saleItems.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = Math.max(0, payload.discount || 0);
    const totalAmount = Math.max(0, subtotal - discount);
    const paidAmount = Math.min(totalAmount, Math.max(0, payload.paidAmount || 0));
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    let customerId = payload.customerId;
    let customerName = payload.customerName?.trim() || 'খুচরা ক্রেতা (Walk-in)';
    let customerPhone = payload.customerPhone?.trim() || '';

    if (customerId) {
      const cust = this.state.customers.find((c) => c.id === customerId && c.shopId === shopId);
      if (cust) {
        cust.totalPurchase += totalAmount;
        cust.totalPaid += paidAmount;
        cust.due += dueAmount;
        customerName = cust.name;
        customerPhone = cust.phone;
      }
    } else if (customerPhone && dueAmount > 0) {
      // Auto-create customer when a phone + due is entered
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        shopId,
        name: customerName,
        phone: customerPhone,
        address: '',
        totalPurchase: totalAmount,
        totalPaid: paidAmount,
        due: dueAmount,
        createdAt: now,
      };
      this.state.customers.unshift(newCust);
      customerId = newCust.id;
    }

    const sale: Sale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      memoNo,
      date: now,
      customerId,
      customerName,
      customerPhone,
      items: saleItems,
      subtotal,
      discount,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMethod: payload.paymentMethod,
      note: payload.note || '',
      createdBy: payload.createdBy || 'দোকানদার',
    };

    this.state.sales.unshift(sale);

    if (paidAmount > 0) {
      this.state.cashbook.unshift({
        id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        shopId,
        date: now,
        type: 'sale_cash',
        direction: 'in',
        account: payload.paymentMethod,
        amount: paidAmount,
        description: `বিক্রি মেমো — ${memoNo}`,
        referenceId: sale.id,
        partyName: customerName,
      });
    }

    this.commit();
    return sale;
  }

  // Purchases
  createPurchase(
    shopId: string,
    payload: {
      supplierId: string;
      invoiceNo?: string;
      date?: string;
      items: Array<{ productId: string; qty: number; purchasePrice: number }>;
      paidAmount: number;
      paymentMethod: Purchase['paymentMethod'];
      note?: string;
    }
  ): Purchase {
    const now = payload.date || new Date().toISOString();
    const supplier = this.state.suppliers.find((s) => s.id === payload.supplierId && s.shopId === shopId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const shopPurCount = this.state.purchases.filter((p) => p.shopId === shopId).length;
    const invoiceNo =
      payload.invoiceNo?.trim() ||
      `PUR-${new Date().getFullYear()}-${String(shopPurCount + 45).padStart(4, '0')}`;

    const items = payload.items.map((line) => {
      const prod = this.state.products.find((p) => p.id === line.productId && p.shopId === shopId);
      if (!prod) throw new Error(`Product not found: ${line.productId}`);
      const prevStock = prod.stock;
      prod.stock += line.qty;
      prod.purchasePrice = line.purchasePrice;
      prod.updatedAt = now;

      this.state.stockAdjustments.unshift({
        id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        shopId,
        productId: prod.id,
        productName: prod.name,
        productCode: prod.code,
        type: 'in',
        quantity: line.qty,
        previousStock: prevStock,
        newStock: prod.stock,
        reason: `ক্রয় ইনভয়েস ${invoiceNo}`,
        date: now,
      });

      return {
        productId: prod.id,
        name: prod.name,
        code: prod.code,
        unit: prod.unit,
        qty: line.qty,
        purchasePrice: line.purchasePrice,
        subtotal: line.qty * line.purchasePrice,
      };
    });

    const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);
    const paidAmount = Math.min(totalAmount, Math.max(0, payload.paidAmount || 0));
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    supplier.totalPurchase += totalAmount;
    supplier.totalPaid += paidAmount;
    supplier.due += dueAmount;

    const purchase: Purchase = {
      id: `pur_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      invoiceNo,
      date: now,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMethod: payload.paymentMethod,
      note: payload.note || '',
    };

    this.state.purchases.unshift(purchase);

    if (paidAmount > 0) {
      this.state.cashbook.unshift({
        id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        shopId,
        date: now,
        type: 'purchase_payment',
        direction: 'out',
        account: payload.paymentMethod,
        amount: paidAmount,
        description: `ক্রয় পেমেন্ট — ${invoiceNo}`,
        referenceId: purchase.id,
        partyName: supplier.name,
      });
    }

    this.commit();
    return purchase;
  }

  // Customers
  createCustomer(shopId: string, payload: { name: string; phone: string; address: string; openingDue?: number }): Customer {
    const openingDue = Math.max(0, payload.openingDue || 0);
    const customer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      name: payload.name,
      phone: payload.phone,
      address: payload.address || '',
      totalPurchase: openingDue,
      totalPaid: 0,
      due: openingDue,
      createdAt: new Date().toISOString(),
    };
    this.state.customers.unshift(customer);
    this.commit();
    return customer;
  }

  receiveCustomerPayment(
    shopId: string,
    customerId: string,
    amount: number,
    paymentMethod: CashbookTransaction['account'],
    note?: string
  ): Customer | null {
    const cust = this.state.customers.find((c) => c.id === customerId && c.shopId === shopId);
    if (!cust) return null;
    const pay = Math.max(0, amount);
    cust.totalPaid += pay;
    cust.due = Math.max(0, cust.due - pay);

    this.state.cashbook.unshift({
      id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      date: new Date().toISOString(),
      type: 'customer_payment',
      direction: 'in',
      account: paymentMethod,
      amount: pay,
      description: note ? `কাস্টমার বাকি আদায় — ${note}` : `কাস্টমার বাকি আদায় — ${cust.name}`,
      referenceId: cust.id,
      partyName: cust.name,
    });
    this.commit();
    return cust;
  }

  // Suppliers
  createSupplier(
    shopId: string,
    payload: { name: string; company: string; phone: string; address: string; openingDue?: number }
  ): Supplier {
    const openingDue = Math.max(0, payload.openingDue || 0);
    const supplier: Supplier = {
      id: `sup_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      name: payload.name,
      company: payload.company || '',
      phone: payload.phone,
      address: payload.address || '',
      totalPurchase: openingDue,
      totalPaid: 0,
      due: openingDue,
      createdAt: new Date().toISOString(),
    };
    this.state.suppliers.unshift(supplier);
    this.commit();
    return supplier;
  }

  paySupplierDue(
    shopId: string,
    supplierId: string,
    amount: number,
    paymentMethod: CashbookTransaction['account'],
    note?: string
  ): Supplier | null {
    const sup = this.state.suppliers.find((s) => s.id === supplierId && s.shopId === shopId);
    if (!sup) return null;
    const pay = Math.max(0, amount);
    sup.totalPaid += pay;
    sup.due = Math.max(0, sup.due - pay);

    this.state.cashbook.unshift({
      id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      date: new Date().toISOString(),
      type: 'supplier_payment',
      direction: 'out',
      account: paymentMethod,
      amount: pay,
      description: note ? `সাপ্লায়ার পেমেন্ট — ${note}` : `সাপ্লায়ার বাকি পরিশোধ — ${sup.name}`,
      referenceId: sup.id,
      partyName: sup.name,
    });
    this.commit();
    return sup;
  }

  // Expenses
  createExpense(
    shopId: string,
    payload: Omit<Expense, 'id' | 'shopId'>
  ): Expense {
    const expense: Expense = {
      ...payload,
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      date: payload.date || new Date().toISOString(),
    };
    this.state.expenses.unshift(expense);
    this.state.cashbook.unshift({
      id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      date: expense.date,
      type: 'expense',
      direction: 'out',
      account: expense.paymentMethod,
      amount: expense.amount,
      description: `${expense.category} — ${expense.description}`,
      referenceId: expense.id,
    });
    this.commit();
    return expense;
  }

  deleteExpense(shopId: string, id: string): boolean {
    const before = this.state.expenses.length;
    this.state.expenses = this.state.expenses.filter((e) => !(e.id === id && e.shopId === shopId));
    this.state.cashbook = this.state.cashbook.filter((c) => !(c.referenceId === id && c.shopId === shopId));
    if (this.state.expenses.length !== before) {
      this.commit();
      return true;
    }
    return false;
  }

  // Cashbook manual entry
  createCashbookEntry(
    shopId: string,
    payload: {
      direction: 'in' | 'out';
      account: CashbookTransaction['account'];
      amount: number;
      description: string;
      partyName?: string;
      date?: string;
    }
  ): CashbookTransaction {
    const txn: CashbookTransaction = {
      id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      shopId,
      date: payload.date || new Date().toISOString(),
      type: payload.direction === 'in' ? 'cash_in' : 'cash_out',
      direction: payload.direction,
      account: payload.account,
      amount: Math.max(0, payload.amount),
      description: payload.description,
      partyName: payload.partyName,
    };
    this.state.cashbook.unshift(txn);
    this.commit();
    return txn;
  }

  // Shop Settings
  updateShopSettings(shopId: string, updates: Partial<Shop>): Shop | null {
    const idx = this.state.shops.findIndex((s) => s.id === shopId);
    if (idx === -1) return null;
    this.state.shops[idx] = {
      ...this.state.shops[idx],
      ...updates,
      id: shopId,
    };
    this.commit();
    return this.state.shops[idx];
  }

  // Shop Backup / Restore
  exportShopBackup(shopId: string) {
    return this.getShopBootstrap(shopId);
  }

  restoreShopBackup(shopId: string, backup: ShopBootstrapData): boolean {
    if (!backup || !backup.shop) return false;
    // Isolate restore strictly to target shopId
    const sIdx = this.state.shops.findIndex((s) => s.id === shopId);
    if (sIdx !== -1) {
      this.state.shops[sIdx] = { ...backup.shop, id: shopId };
    }
    this.state.products = [
      ...this.state.products.filter((x) => x.shopId !== shopId),
      ...(backup.products || []).map((x) => ({ ...x, shopId })),
    ];
    this.state.stockAdjustments = [
      ...this.state.stockAdjustments.filter((x) => x.shopId !== shopId),
      ...(backup.stockAdjustments || []).map((x) => ({ ...x, shopId })),
    ];
    this.state.customers = [
      ...this.state.customers.filter((x) => x.shopId !== shopId),
      ...(backup.customers || []).map((x) => ({ ...x, shopId })),
    ];
    this.state.suppliers = [
      ...this.state.suppliers.filter((x) => x.shopId !== shopId),
      ...(backup.suppliers || []).map((x) => ({ ...x, shopId })),
    ];
    this.state.sales = [
      ...this.state.sales.filter((x) => x.shopId !== shopId),
      ...(backup.sales || []).map((x) => ({ ...x, shopId })),
    ];
    this.state.purchases = [
      ...this.state.purchases.filter((x) => x.shopId !== shopId),
      ...(backup.purchases || []).map((x) => ({ ...x, shopId })),
    ];
    this.state.expenses = [
      ...this.state.expenses.filter((x) => x.shopId !== shopId),
      ...(backup.expenses || []).map((x) => ({ ...x, shopId })),
    ];
    this.state.cashbook = [
      ...this.state.cashbook.filter((x) => x.shopId !== shopId),
      ...(backup.cashbook || []).map((x) => ({ ...x, shopId })),
    ];
    this.commit();
    return true;
  }

  // Master Admin Panel
  getAdminOverview(): AdminOverviewData {
    const shopStats: AdminOverviewData['shopStats'] = {};
    for (const shop of this.state.shops) {
      const sSales = this.state.sales.filter((s) => s.shopId === shop.id);
      shopStats[shop.id] = {
        totalSales: sSales.reduce((acc, s) => acc + s.totalAmount, 0),
        totalProducts: this.state.products.filter((p) => p.shopId === shop.id).length,
        totalCustomers: this.state.customers.filter((c) => c.shopId === shop.id).length,
        totalOrders: sSales.length,
      };
    }
    return {
      softwareVersion: this.state.softwareVersion,
      plans: this.state.plans,
      shops: this.state.shops,
      users: this.state.users,
      shopStats,
    };
  }

  createShopByAdmin(payload: {
    name: string;
    category: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    address: string;
    plan: Shop['plan'];
    status: Shop['status'];
    openingCash?: number;
  }): { shop: Shop; ownerUser: AppUser } {
    const now = new Date().toISOString();
    const id = `shop_${Date.now()}`;
    const code = `MB-${1001 + this.state.shops.length}`;
    const shop: Shop = {
      id,
      code,
      name: payload.name,
      category: payload.category || 'জেনারেল স্টোর',
      ownerName: payload.ownerName,
      ownerPhone: payload.ownerPhone,
      ownerEmail: payload.ownerEmail || '',
      address: payload.address || '',
      plan: payload.plan,
      status: payload.status,
      trialEndsAt: payload.status === 'trial' ? isoDateDaysAgo(-14) : undefined,
      softwareVersion: this.state.softwareVersion,
      openingCash: payload.openingCash ?? 5000,
      openingBank: 0,
      openingMobile: 0,
      lowStockThreshold: 10,
      receiptFooter: `ধন্যবাদ! — ${payload.name}`,
      thermalWidth: '80mm',
      createdAt: now,
    };

    const ownerUser: AppUser = {
      id: `usr_${Date.now()}`,
      shopId: id,
      name: payload.ownerName,
      phone: payload.ownerPhone,
      email: payload.ownerEmail || '',
      role: 'owner',
      pin: '1234',
      active: true,
      createdAt: now,
    };

    this.state.shops.push(shop);
    this.state.users.push(ownerUser);
    this.commit();
    return { shop, ownerUser };
  }

  updateShopByAdmin(id: string, updates: Partial<Shop>): Shop | null {
    const idx = this.state.shops.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.state.shops[idx] = { ...this.state.shops[idx], ...updates, id };
    this.commit();
    return this.state.shops[idx];
  }

  createUserByAdmin(payload: Omit<AppUser, 'id' | 'createdAt'>): AppUser {
    const user: AppUser = {
      ...payload,
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.users.push(user);
    this.commit();
    return user;
  }

  updateUserByAdmin(id: string, updates: Partial<AppUser>): AppUser | null {
    const idx = this.state.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.state.users[idx] = { ...this.state.users[idx], ...updates, id };
    this.commit();
    return this.state.users[idx];
  }

  updateSoftwareVersion(version: string): string {
    this.state.softwareVersion = version;
    this.state.shops = this.state.shops.map((s) => ({ ...s, softwareVersion: version }));
    this.commit();
    return version;
  }

  exportFullBackup(): DatabaseState {
    return this.state;
  }

  restoreFullBackup(data: DatabaseState): boolean {
    if (!data || !Array.isArray(data.shops) || !Array.isArray(data.users)) {
      return false;
    }
    this.state = data;
    this.commit();
    return true;
  }
}

export const store = new StoreManager();
