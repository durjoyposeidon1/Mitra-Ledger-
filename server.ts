import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.ts';

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const getShopId = (req: express.Request): string => {
    const fromHeader = req.header('x-shop-id');
    const fromQuery = typeof req.query.shopId === 'string' ? req.query.shopId : '';
    return (fromHeader || fromQuery || 'shop_mitra').trim();
  };

  // Auth & Shop Discovery
  app.get('/api/auth/shops', (_req, res) => {
    res.json({
      shops: store.getPublicShops(),
      plans: store.getPlans(),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, pin } = req.body || {};
    if (!identifier || !pin) {
      return res.status(400).json({ error: 'ফোন/ইমেইল এবং পিন প্রদান করুন' });
    }
    const result = store.authenticate(String(identifier), String(pin));
    if (!result) {
      return res.status(401).json({ error: 'ভুল ফোন/ইমেইল বা পিন' });
    }
    if (result.shop && result.shop.status === 'suspended') {
      return res.status(403).json({ error: 'এই দোকানটির অ্যাকাউন্ট সাময়িকভাবে বন্ধ আছে' });
    }
    res.json(result);
  });

  // Shop-Isolated Bootstrap
  app.get('/api/bootstrap', (req, res) => {
    const shopId = getShopId(req);
    const data = store.getShopBootstrap(shopId);
    if (!data) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(data);
  });

  // Products & Stock
  app.post('/api/products', (req, res) => {
    const shopId = getShopId(req);
    const body = req.body;
    if (!body?.name || !body?.code) {
      return res.status(400).json({ error: 'Product name and code are required' });
    }
    const product = store.createProduct(shopId, {
      name: String(body.name),
      code: String(body.code),
      category: String(body.category || 'General'),
      purchasePrice: Number(body.purchasePrice || 0),
      salePrice: Number(body.salePrice || 0),
      stock: Number(body.stock || 0),
      minStock: Number(body.minStock || 10),
      unit: String(body.unit || 'Piece'),
      barcode: String(body.barcode || ''),
    });
    res.status(201).json(product);
  });

  app.put('/api/products/:id', (req, res) => {
    const shopId = getShopId(req);
    const updated = store.updateProduct(shopId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  });

  app.delete('/api/products/:id', (req, res) => {
    const shopId = getShopId(req);
    const ok = store.deleteProduct(shopId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  });

  app.post('/api/products/:id/stock', (req, res) => {
    const shopId = getShopId(req);
    const { type, quantity, reason } = req.body || {};
    if (!['in', 'out', 'adjustment'].includes(type)) {
      return res.status(400).json({ error: 'Invalid stock adjustment type' });
    }
    const updated = store.adjustStock(
      shopId,
      req.params.id,
      type,
      Number(quantity || 0),
      String(reason || '')
    );
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  });

  // Sales & Memo
  app.post('/api/sales', (req, res) => {
    const shopId = getShopId(req);
    try {
      const sale = store.createSale(shopId, req.body);
      res.status(201).json(sale);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create memo' });
    }
  });

  // Purchases
  app.post('/api/purchases', (req, res) => {
    const shopId = getShopId(req);
    try {
      const purchase = store.createPurchase(shopId, req.body);
      res.status(201).json(purchase);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create purchase' });
    }
  });

  // Customers
  app.post('/api/customers', (req, res) => {
    const shopId = getShopId(req);
    const { name, phone, address, openingDue } = req.body || {};
    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone are required' });
    }
    const customer = store.createCustomer(shopId, {
      name: String(name),
      phone: String(phone),
      address: String(address || ''),
      openingDue: Number(openingDue || 0),
    });
    res.status(201).json(customer);
  });

  app.post('/api/customers/:id/pay', (req, res) => {
    const shopId = getShopId(req);
    const { amount, paymentMethod, note } = req.body || {};
    const customer = store.receiveCustomerPayment(
      shopId,
      req.params.id,
      Number(amount || 0),
      paymentMethod || 'Cash',
      note
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  });

  // Suppliers
  app.post('/api/suppliers', (req, res) => {
    const shopId = getShopId(req);
    const { name, company, phone, address, openingDue } = req.body || {};
    if (!name || !phone) {
      return res.status(400).json({ error: 'Supplier name and phone are required' });
    }
    const supplier = store.createSupplier(shopId, {
      name: String(name),
      company: String(company || ''),
      phone: String(phone),
      address: String(address || ''),
      openingDue: Number(openingDue || 0),
    });
    res.status(201).json(supplier);
  });

  app.post('/api/suppliers/:id/pay', (req, res) => {
    const shopId = getShopId(req);
    const { amount, paymentMethod, note } = req.body || {};
    const supplier = store.paySupplierDue(
      shopId,
      req.params.id,
      Number(amount || 0),
      paymentMethod || 'Cash',
      note
    );
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  });

  // Expenses
  app.post('/api/expenses', (req, res) => {
    const shopId = getShopId(req);
    const { category, description, amount, paymentMethod, date } = req.body || {};
    if (!category || !amount) {
      return res.status(400).json({ error: 'Expense category and amount are required' });
    }
    const expense = store.createExpense(shopId, {
      category,
      description: String(description || category),
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      date: date || new Date().toISOString(),
    });
    res.status(201).json(expense);
  });

  app.delete('/api/expenses/:id', (req, res) => {
    const shopId = getShopId(req);
    const ok = store.deleteExpense(shopId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Expense not found' });
    res.json({ ok: true });
  });

  // Cashbook manual entry
  app.post('/api/cashbook', (req, res) => {
    const shopId = getShopId(req);
    const { direction, account, amount, description, partyName, date } = req.body || {};
    if (!['in', 'out'].includes(direction) || !amount || !description) {
      return res.status(400).json({ error: 'Invalid cashbook transaction payload' });
    }
    const txn = store.createCashbookEntry(shopId, {
      direction,
      account: account || 'Cash',
      amount: Number(amount),
      description: String(description),
      partyName,
      date,
    });
    res.status(201).json(txn);
  });

  // Shop Settings & Backup
  app.put('/api/shop/settings', (req, res) => {
    const shopId = getShopId(req);
    const updated = store.updateShopSettings(shopId, req.body);
    if (!updated) return res.status(404).json({ error: 'Shop not found' });
    res.json(updated);
  });

  app.get('/api/shop/backup', (req, res) => {
    const shopId = getShopId(req);
    const data = store.exportShopBackup(shopId);
    if (!data) return res.status(404).json({ error: 'Shop not found' });
    res.json(data);
  });

  app.post('/api/shop/restore', (req, res) => {
    const shopId = getShopId(req);
    const ok = store.restoreShopBackup(shopId, req.body);
    if (!ok) return res.status(400).json({ error: 'Invalid backup payload' });
    res.json({ ok: true });
  });

  // Master Admin Panel Routes
  app.get('/api/admin/overview', (_req, res) => {
    res.json(store.getAdminOverview());
  });

  app.post('/api/admin/shops', (req, res) => {
    const body = req.body || {};
    if (!body.name || !body.ownerName || !body.ownerPhone) {
      return res.status(400).json({ error: 'Shop name, owner name, and phone are required' });
    }
    const created = store.createShopByAdmin(body);
    res.status(201).json(created);
  });

  app.put('/api/admin/shops/:id', (req, res) => {
    const updated = store.updateShopByAdmin(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Shop not found' });
    res.json(updated);
  });

  app.post('/api/admin/users', (req, res) => {
    const body = req.body || {};
    if (!body.name || !body.phone || !body.role) {
      return res.status(400).json({ error: 'User name, phone, and role are required' });
    }
    const user = store.createUserByAdmin({
      shopId: body.shopId || null,
      name: String(body.name),
      phone: String(body.phone),
      email: String(body.email || ''),
      role: body.role,
      pin: String(body.pin || '1234'),
      active: body.active !== false,
    });
    res.status(201).json(user);
  });

  app.put('/api/admin/users/:id', (req, res) => {
    const updated = store.updateUserByAdmin(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  });

  app.put('/api/admin/version', (req, res) => {
    const version = String(req.body?.version || '').trim();
    if (!version) return res.status(400).json({ error: 'Version is required' });
    res.json({ softwareVersion: store.updateSoftwareVersion(version) });
  });

  app.get('/api/admin/backup', (_req, res) => {
    res.json(store.exportFullBackup());
  });

  app.post('/api/admin/restore', (req, res) => {
    const ok = store.restoreFullBackup(req.body);
    if (!ok) return res.status(400).json({ error: 'Invalid full backup JSON' });
    res.json({ ok: true });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mitra Business server listening on http://localhost:${PORT}`);
  });
}

startServer();
