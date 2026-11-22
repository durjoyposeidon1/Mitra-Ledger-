import { Printer, X } from 'lucide-react';
import type { Language, Sale, Shop } from '../shared/types';
import { formatDateTime, formatTaka, t } from '../lib/format';

interface MemoReceiptModalProps {
  sale: Sale | null;
  shop: Shop;
  lang: Language;
  onClose: () => void;
}

export function MemoReceiptModal({ sale, shop, lang, onClose }: MemoReceiptModalProps) {
  if (!sale) return null;

  const isNarrowThermal = shop.thermalWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Modal Action Bar (hidden on print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {t(lang, 'বিক্রয় মেমো প্রিভিউ', 'Sales Memo Preview')}
            </h3>
            <p className="text-xs text-slate-500">
              {sale.memoNo} · {shop.thermalWidth} {t(lang, 'থার্মাল / PDF ফরম্যাট', 'Thermal / PDF Format')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              <Printer className="h-3.5 w-3.5" />
              {t(lang, 'প্রিন্ট / PDF সেভ', 'Print / Save PDF')}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Memo Sheet */}
        <div className="max-h-[78vh] overflow-y-auto bg-slate-50 p-6 print:max-h-none print:bg-white print:p-0">
          <div
            className={`print-sheet mx-auto rounded-lg border border-slate-200 bg-white p-5 text-slate-900 ${
              isNarrowThermal ? 'max-w-[300px]' : 'max-w-[400px]'
            }`}
          >
            {/* Shop Header */}
            <div className="border-b border-dashed border-slate-300 pb-3 text-center">
              <h2 className="font-display text-lg font-bold text-slate-900">{shop.name}</h2>
              <p className="mt-0.5 text-xs text-slate-600">{shop.address}</p>
              <p className="text-xs text-slate-600 font-mono-num">
                {t(lang, 'মোবাইল', 'Phone')}: {shop.ownerPhone}
              </p>
            </div>

            {/* Memo Meta */}
            <div className="mt-3 space-y-1 border-b border-dashed border-slate-300 pb-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'মেমো নং', 'Memo No')}:</span>
                <span className="font-mono-num font-semibold text-slate-900">{sale.memoNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'তারিখ', 'Date')}:</span>
                <span className="tabular-nums text-slate-800">{formatDateTime(sale.date, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'কাস্টমার', 'Customer')}:</span>
                <span className="font-medium text-slate-900">{sale.customerName}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{t(lang, 'ফোন', 'Phone')}:</span>
                  <span className="font-mono-num text-slate-800">{sale.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'পেমেন্ট মাধ্যম', 'Method')}:</span>
                <span className="font-medium text-slate-800">{sale.paymentMethod}</span>
              </div>
            </div>

            {/* Line Items */}
            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-1.5 text-left font-medium">{t(lang, 'পণ্য', 'Item')}</th>
                  <th className="py-1.5 text-right font-medium">{t(lang, 'পরিমাণ', 'Qty')}</th>
                  <th className="py-1.5 text-right font-medium">{t(lang, 'দর', 'Rate')}</th>
                  <th className="py-1.5 text-right font-medium">{t(lang, 'মোট', 'Total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={`${item.productId}-${idx}`}>
                    <td className="py-2 pr-2 font-medium text-slate-900">
                      {item.name}
                      <div className="text-[11px] font-normal text-slate-400 font-mono-num">{item.code}</div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-700">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-700">
                      {formatTaka(item.unitPrice, lang)}
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold text-slate-900">
                      {formatTaka(item.subtotal, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-3 space-y-1.5 border-t border-dashed border-slate-300 pt-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{t(lang, 'সাবটোটাল', 'Subtotal')}</span>
                <span className="tabular-nums font-medium">{formatTaka(sale.subtotal, lang)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{t(lang, 'ডিসকাউন্ট / ছাড়', 'Discount')}</span>
                  <span className="tabular-nums font-medium">-{formatTaka(sale.discount, lang)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                <span>{t(lang, 'সর্বমোট বিল', 'Total Amount')}</span>
                <span className="tabular-nums">{formatTaka(sale.totalAmount, lang)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>{t(lang, 'জমা / পরিশোধিত', 'Paid Amount')}</span>
                <span className="tabular-nums font-semibold">{formatTaka(sale.paidAmount, lang)}</span>
              </div>
              {sale.dueAmount > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>{t(lang, 'বাকি (Due)', 'Due Amount')}</span>
                  <span className="tabular-nums">{formatTaka(sale.dueAmount, lang)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 border-t border-dashed border-slate-300 pt-3 text-center text-[11px] text-slate-500">
              <p>{shop.receiptFooter || t(lang, 'ধন্যবাদ! আবার আসবেন।', 'Thank you for shopping with us!')}</p>
              <p className="mt-1 text-[10px] text-slate-400">Mitra Business POS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
