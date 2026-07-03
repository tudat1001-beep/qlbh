/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Quotation, Product, Customer } from '../types';
import { Plus, Trash, Check, X, FileText, Calendar, PlusCircle, Search, Eye } from 'lucide-react';

interface QuotationManagerProps {
  quotations: Quotation[];
  products: Product[];
  customers: Customer[];
  onAddQuotation: (q: Quotation) => void;
  onUpdateQuotationStatus: (id: string, status: 'CHO_DUYET' | 'DA_DUYET' | 'DA_XUAT_KHO' | 'HUY') => void;
  onDeleteQuotation: (id: string) => void;
  decimalPlaces: number;
  excelTheme?: string;
}

export default function QuotationManager({
  quotations,
  products,
  customers,
  onAddQuotation,
  onUpdateQuotationStatus,
  onDeleteQuotation,
  decimalPlaces,
  excelTheme = 'GREEN'
}: QuotationManagerProps) {
  const themeColors: Record<string, {
    primary: string;
    bg: string;
    border: string;
    text: string;
    accent: string;
    hover: string;
  }> = {
    GREEN: {
      primary: 'bg-[#107c41] text-white',
      bg: 'bg-green-50',
      border: 'border-[#107c41]',
      text: 'text-[#107c41]',
      accent: 'bg-[#107c41] hover:bg-[#185e37] text-white',
      hover: 'hover:bg-green-50 text-[#107c41]'
    },
    BLUE: {
      primary: 'bg-blue-800 text-white',
      bg: 'bg-blue-50 border-blue-100',
      border: 'border-blue-800',
      text: 'text-blue-800',
      accent: 'bg-blue-800 hover:bg-blue-950 text-white',
      hover: 'hover:bg-blue-50 text-blue-800'
    },
    PURPLE: {
      primary: 'bg-purple-800 text-white',
      bg: 'bg-purple-50 border-purple-100',
      border: 'border-purple-800',
      text: 'text-purple-800',
      accent: 'bg-purple-800 hover:bg-purple-950 text-white',
      hover: 'hover:bg-purple-50 text-purple-800'
    },
    SLATE: {
      primary: 'bg-slate-800 text-white',
      bg: 'bg-slate-100 border-slate-200',
      border: 'border-slate-800',
      text: 'text-slate-800',
      accent: 'bg-slate-800 hover:bg-slate-900 text-white',
      hover: 'hover:bg-slate-100 text-slate-800'
    }
  };
  const theme = themeColors[excelTheme] || themeColors.GREEN;

  const focusRing = excelTheme === 'GREEN'
    ? 'focus:ring-[#107c41]'
    : excelTheme === 'BLUE'
    ? 'focus:ring-blue-800'
    : excelTheme === 'PURPLE'
    ? 'focus:ring-purple-800'
    : 'focus:ring-slate-800';

  const [mode, setMode] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [details, setDetails] = useState<{ productId: string; quantity: number; price: number }[]>([
    { productId: products[0]?.id || '', quantity: 1, price: products[0]?.salePrice || 0 }
  ]);

  // Popup & Multi-product selection states
  const [showProductSelectorModal, setShowProductSelectorModal] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [tempProductQuantities, setTempProductQuantities] = useState<Record<string, number>>({});

  // Formatting helpers for separators
  const formatThousand = (val: number | string | null | undefined): string => {
    if (val === undefined || val === null || val === '') return '';
    const clean = String(val).replace(/[^0-9]/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('vi-VN');
  };

  const parseThousand = (str: string): number => {
    const clean = String(str).replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  // Selection handlers for multi-product modal
  const openProductSelectorModal = () => {
    setProductSearchQuery('');
    setSelectedProductIds([]);
    setTempProductQuantities({});
    setShowProductSelectorModal(true);
  };

  const toggleSelectProductInModal = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(i => i !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
      if (!tempProductQuantities[id]) {
        setTempProductQuantities(prev => ({ ...prev, [id]: 1 }));
      }
    }
  };

  const handleTempQtyChange = (id: string, val: number) => {
    if (val > 0) {
      setTempProductQuantities(prev => ({ ...prev, [id]: val }));
    }
  };

  const handleConfirmAddProductsFromModal = () => {
    const newLines = selectedProductIds.map(id => {
      const prod = products.find(p => p.id === id);
      const price = prod ? prod.salePrice : 0;
      return {
        productId: id,
        quantity: tempProductQuantities[id] || 1,
        price
      };
    });

    const isFirstLineEmpty = details.length === 1 && details[0].productId === (products[0]?.id || '') && details[0].quantity === 1;
    if (isFirstLineEmpty) {
      setDetails(newLines);
    } else {
      setDetails([...details, ...newLines]);
    }
    setShowProductSelectorModal(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(val);
  };

  const handleAddLine = () => {
    setDetails([...details, { productId: products[0]?.id || '', quantity: 1, price: products[0]?.salePrice || 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== idx));
    }
  };

  const handleLineChange = (idx: number, field: 'productId' | 'quantity' | 'price', value: any) => {
    const updated = [...details];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      updated[idx] = {
        productId: value,
        quantity: updated[idx].quantity,
        price: prod ? prod.salePrice : 0
      };
    } else {
      updated[idx] = {
        ...updated[idx],
        [field]: value
      };
    }
    setDetails(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return alert('Vui lòng chọn khách hàng');

    const totalAmount = details.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const code = `BG${String(quotations.length + 1).padStart(4, '0')}`;

    const newQuotation: Quotation = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      code,
      date: new Date().toISOString().split('T')[0],
      customerId,
      title,
      details: details.map(d => ({ ...d, amount: d.quantity * d.price })),
      totalAmount,
      note,
      validUntil,
      status: 'CHO_DUYET'
    };

    onAddQuotation(newQuotation);
    setSelectedQuote(newQuotation);
    setMode('LIST');

    // Reset fields
    setTitle('');
    setNote('');
    setDetails([{ productId: products[0]?.id || '', quantity: 1, price: products[0]?.salePrice || 0 }]);
  };

  const headerBg = excelTheme === 'GREEN' ? 'bg-[#107c41]/5' : excelTheme === 'BLUE' ? 'bg-blue-800/5' : excelTheme === 'PURPLE' ? 'bg-purple-800/5' : 'bg-slate-800/5';

  const rowHoverBg = excelTheme === 'GREEN'
    ? 'hover:bg-green-50/40'
    : excelTheme === 'BLUE'
    ? 'hover:bg-blue-50/40'
    : excelTheme === 'PURPLE'
    ? 'hover:bg-purple-50/40'
    : 'hover:bg-slate-100/40';

  const rowActiveBg = excelTheme === 'GREEN'
    ? 'bg-green-50 font-medium'
    : excelTheme === 'BLUE'
    ? 'bg-blue-50 font-medium'
    : excelTheme === 'PURPLE'
    ? 'bg-purple-50 font-medium'
    : 'bg-slate-100 font-medium';

  return (
    <div id="quotation-manager" className="p-4 bg-gray-50 flex-1 overflow-auto flex flex-col lg:flex-row gap-4">
      {/* LEFT COLUMN: LIST */}
      <div className="flex-1 bg-white rounded border border-gray-200 shadow-sm flex flex-col min-h-[400px]">
        <div className={`${headerBg} px-4 py-3 border-b border-gray-200 flex justify-between items-center select-none`}>
          <div>
            <h3 className="text-xs font-bold text-gray-800 tracking-wider font-mono">
              DANH SÁCH BÁO GIÁ KINH DOANH
            </h3>
            <span className="text-[10px] text-gray-500">Soạn thảo và lập biểu mẫu báo giá khách hàng chuyên nghiệp</span>
          </div>
          {mode === 'LIST' ? (
            <button
              onClick={() => setMode('CREATE')}
              className={`${theme.accent} text-xs font-semibold px-3 py-1.5 rounded shadow-sm flex items-center space-x-1 transition`}
            >
              <Plus className="h-4 w-4" />
              <span>Tạo Báo Giá Mới</span>
            </button>
          ) : (
            <button
              onClick={() => setMode('LIST')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium px-3 py-1.5 rounded transition"
            >
              Quay lại danh sách
            </button>
          )}
        </div>

        {mode === 'LIST' ? (
          <div className="flex-1 overflow-auto">
            {quotations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-mono italic">
                Không tìm thấy bản báo giá nào. Hãy click "Tạo Báo Giá Mới" để bắt đầu.
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f9f9fb] border-b border-gray-200 text-gray-600 font-semibold sticky top-0">
                    <th className="px-3 py-2 border-r border-gray-200 text-center w-12">STT</th>
                    <th className="px-3 py-2 border-r border-gray-200 w-24">Số Báo Giá</th>
                    <th className="px-3 py-2 border-r border-gray-200">Tiêu Đề / Khách Hàng</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-32">Tổng Cộng (VND)</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-center w-28">Trạng Thái</th>
                    <th className="px-3 py-2 text-center w-12">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotations.map((q, idx) => {
                    const cust = customers.find(c => c.id === q.customerId);
                    return (
                      <tr
                        key={q.id}
                        onClick={() => setSelectedQuote(q)}
                        className={`cursor-pointer ${rowHoverBg} transition-colors ${
                          selectedQuote?.id === q.id ? rowActiveBg : ''
                        }`}
                      >
                        <td className="px-3 py-3 border-r border-gray-200 text-center font-mono text-gray-400">{idx + 1}</td>
                        <td className={`px-3 py-3 border-r border-gray-200 font-mono font-semibold ${theme.text}`}>{q.code}</td>
                        <td className="px-3 py-3 border-r border-gray-200">
                          <span className="block text-gray-800 font-semibold">{q.title}</span>
                          <span className="text-[10px] text-gray-400 block">{cust?.name || 'Khách hàng lẻ'}</span>
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200 text-right font-mono text-blue-600 font-bold">
                          {formatCurrency(q.totalAmount)}
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            q.status === 'CHO_DUYET' ? 'bg-yellow-100 text-yellow-800' :
                            q.status === 'DA_DUYET' ? 'bg-green-100 text-green-800' :
                            q.status === 'DA_XUAT_KHO' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {q.status === 'CHO_DUYET' && 'Chờ Duyệt'}
                            {q.status === 'DA_DUYET' && 'Đã Duyệt'}
                            {q.status === 'DA_XUAT_KHO' && 'Đã Xuất Kho'}
                            {q.status === 'HUY' && 'Đã Hủy'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Xóa báo giá này?')) {
                                onDeleteQuotation(q.id);
                                if (selectedQuote?.id === q.id) setSelectedQuote(null);
                              }
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* SOẠN BÁO GIÁ */
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-auto max-h-[550px]">
            <h4 className="text-xs font-bold text-gray-700 font-mono border-b border-gray-100 pb-1 flex items-center space-x-1.5">
              <PlusCircle className={`h-4 w-4 ${theme.text}`} />
              <span>SOẠN THẢO BẢN BÁO GIÁ KHÁCH HÀNG</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">KHÁCH HÀNG ĐỂ BÁO GIÁ</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 ${focusRing}`}
                >
                  <option value="">-- Chọn Khách Hàng nhận --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">CÓ HIỆU LỰC ĐẾN NGÀY</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={`w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">TIÊU ĐỀ BÁO GIÁ</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Báo giá cung cấp văn phòng phẩm Quý 3..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center select-none">
                <span className="text-[10px] font-bold text-gray-500 uppercase">HÀNG HÓA & ĐƠN GIÁ BÁO</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={openProductSelectorModal}
                    className={`text-xs font-bold flex items-center space-x-1 border ${theme.border} px-2 py-1 rounded ${theme.bg} ${theme.text} hover:opacity-85 transition-opacity`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Chọn nhanh nhiều sản phẩm</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className={`text-xs font-bold flex items-center space-x-1 ${theme.text} hover:opacity-85 transition-opacity px-2 py-1`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm từng dòng</span>
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                      <th className="px-3 py-1.5">Mặt hàng</th>
                      <th className="px-3 py-1.5 text-center w-20">S.Lượng</th>
                      <th className="px-3 py-1.5 text-right w-28">Giá Báo (VND)</th>
                      <th className="px-3 py-1.5 text-right w-28">Thành tiền</th>
                      <th className="px-3 py-1.5 w-10 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {details.map((det, idx) => (
                      <tr key={idx}>
                        <td className="p-1">
                          <select
                            value={det.productId}
                            onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                            className="w-full text-xs p-1 bg-transparent border-transparent rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.code} - {p.name} (Gốc: {formatCurrency(p.salePrice)})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            required
                            min="1"
                            value={det.quantity}
                            onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full text-xs p-1 border border-gray-200 rounded text-center font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            required
                            value={formatThousand(det.price)}
                            onChange={(e) => handleLineChange(idx, 'price', parseThousand(e.target.value))}
                            className="w-full text-xs p-1 border border-gray-200 rounded text-right font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                          />
                        </td>
                        <td className="px-3 py-1 text-right font-mono font-semibold text-gray-700">
                          {formatCurrency(det.quantity * det.price)}
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-red-500 hover:bg-gray-50 p-1 rounded"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">GHI CHÚ / ĐIỀU KHOẢN THANH TOÁN</label>
              <textarea
                rows={2}
                placeholder="Giao hàng trong vòng 3 ngày, thanh toán 100% bằng chuyển khoản..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setMode('LIST')}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className={`px-3 py-1.5 ${theme.accent} font-bold rounded text-xs shadow transition`}
              >
                Tạo Bản Báo Giá
              </button>
            </div>
          </form>
        )}
      </div>

      {/* RIGHT COLUMN: DETAILED PRINT PREVIEW */}
      <div className="w-full lg:w-[400px] bg-white rounded border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
        <div>
          <div className="border-b border-gray-100 pb-2 mb-3">
            <h3 className="text-xs font-bold text-gray-700 tracking-wider font-mono flex items-center space-x-1.5">
              <FileText className={`h-4 w-4 ${theme.text}`} />
              <span>MẪU IN CHI TIẾT BÁO GIÁ</span>
            </h3>
            <span className="text-[10px] text-gray-400">Xem trực quan và phê duyệt bảng báo giá gửi đối tác</span>
          </div>

          {selectedQuote ? (
            <div className="space-y-4 text-xs font-sans p-2 border border-gray-100 rounded bg-gray-50/50">
              <div className="text-center pb-2 border-b border-gray-200">
                <span className="text-[9px] font-bold text-[#107c41] block">BẢN BÁO GIÁ KINH DOANH</span>
                <span className="text-sm font-bold text-gray-800">{selectedQuote.title}</span>
                <span className="text-[10px] font-mono text-gray-400 block mt-0.5">Số hiệu: {selectedQuote.code}</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-gray-400">Khách hàng nhận: </span>
                  <span className="font-semibold text-gray-800">
                    {customers.find(c => c.id === selectedQuote.customerId)?.name || 'Khách lẻ'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Ngày lập: </span>
                  <span className="font-mono text-gray-800">{selectedQuote.date}</span>
                </div>
                <div>
                  <span className="text-gray-400">Thời hạn báo giá: </span>
                  <span className="font-mono text-red-600 font-bold">{selectedQuote.validUntil}</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded overflow-hidden bg-white">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                      <th className="px-2 py-1">Sản phẩm</th>
                      <th className="px-2 py-1 text-center w-12">S.L</th>
                      <th className="px-2 py-1 text-right w-24">Giá báo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedQuote.details.map((d, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 text-gray-700 truncate max-w-[140px]">
                          {products.find(p => p.id === d.productId)?.name || 'Hàng hóa'}
                        </td>
                        <td className="px-2 py-1 text-center font-mono">{d.quantity}</td>
                        <td className="px-2 py-1 text-right font-mono text-blue-600">{formatCurrency(d.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedQuote.note && (
                <div className="bg-amber-50 p-2 border border-amber-100 rounded text-[10px] text-amber-900">
                  <span className="font-bold">Điều khoản & lưu ý:</span> {selectedQuote.note}
                </div>
              )}

              <div className={`${excelTheme === 'GREEN' ? 'bg-[#107c41]/5 border-[#107c41]/10' : excelTheme === 'BLUE' ? 'bg-blue-800/5 border-blue-800/10' : excelTheme === 'PURPLE' ? 'bg-purple-800/5 border-purple-800/10' : 'bg-slate-800/5 border-slate-800/10'} p-3 rounded text-center border`}>
                <span className="text-[10px] text-gray-500 block font-bold uppercase">TỔNG TRỊ GIÁ BÁO GIÁ</span>
                <span className={`text-sm font-black ${theme.text} font-mono`}>
                  {formatCurrency(selectedQuote.totalAmount)}
                </span>
              </div>

              {/* Approval Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 select-none">
                <span className="text-[10px] font-bold text-gray-400">DUYỆT BG:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onUpdateQuotationStatus(selectedQuote.id, 'DA_DUYET')}
                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded text-[10px] font-bold flex items-center space-x-0.5"
                    title="Duyệt bản báo giá này"
                  >
                    <Check className="h-3 w-3" />
                    <span>Duyệt</span>
                  </button>
                  <button
                    onClick={() => onUpdateQuotationStatus(selectedQuote.id, 'HUY')}
                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold flex items-center space-x-0.5"
                    title="Hủy bỏ bản báo giá này"
                  >
                    <X className="h-3 w-3" />
                    <span>Hủy</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 italic">
              Chọn bản báo giá kinh doanh ở bảng danh sách để hiển thị chi tiết biểu mẫu in gửi đối tác.
            </div>
          )}
        </div>

        {selectedQuote && (
          <button
            onClick={() => window.print()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded text-xs border border-gray-300 mt-4 flex items-center justify-center space-x-1 select-none"
          >
            <Calendar className="h-4 w-4" />
            <span>Gửi In PDF (Print Quote Sheet)</span>
          </button>
        )}
      </div>

      {/* ==================== POPUP MODAL: CHỌN NHANH NHIỀU SẢN PHẨM (BÁO GIÁ) ==================== */}
      {showProductSelectorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className={`${theme.primary} px-4 py-3 rounded-t-lg flex justify-between items-center`}>
              <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center space-x-1.5">
                <Search className="h-4 w-4" />
                <span>CHỌN NHANH NHIỀU SẢN PHẨM BÁO GIÁ</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProductSelectorModal(false)}
                className="text-white hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col overflow-hidden space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã sản phẩm hoặc tên sản phẩm..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className={`w-full text-xs p-2 pl-8 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              </div>

              <div className="flex-1 overflow-auto border border-gray-200 rounded">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-600 font-semibold sticky top-0 border-b border-gray-200 z-10">
                    <tr>
                      <th className="px-3 py-2 text-center w-12">Chọn</th>
                      <th className="px-3 py-2 w-24">Mã hàng</th>
                      <th className="px-3 py-2">Tên hàng hóa</th>
                      <th className="px-3 py-2 w-16 text-center">ĐVT</th>
                      <th className="px-3 py-2 w-28 text-right">Đơn giá (VND)</th>
                      <th className="px-3 py-2 w-24 text-center">S.Lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products
                      .filter(p => 
                        p.code.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                        p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
                      )
                      .map((p) => {
                        const isSelected = selectedProductIds.includes(p.id);
                        const qty = tempProductQuantities[p.id] || 1;
                        
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-slate-50' : ''}`}
                          >
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectProductInModal(p.id)}
                                className={`h-3.5 w-3.5 ${theme.text} ${focusRing}`}
                              />
                            </td>
                            <td className="px-3 py-2 font-mono font-medium text-gray-600">{p.code}</td>
                            <td className="px-3 py-2 font-semibold text-gray-800">{p.name}</td>
                            <td className="px-3 py-2 text-center text-gray-500">{p.unit}</td>
                            <td className="px-3 py-2 text-right font-mono text-gray-700">
                              {formatThousand(p.salePrice)}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => handleTempQtyChange(p.id, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                disabled={!isSelected}
                                className="w-16 text-xs p-1 border border-gray-300 rounded text-center font-mono disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-slate-300"
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium">
                Đã chọn: <strong className={theme.text}>{selectedProductIds.length}</strong> sản phẩm
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProductSelectorModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-100 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddProductsFromModal}
                  disabled={selectedProductIds.length === 0}
                  className={`px-4 py-1.5 ${theme.accent} rounded text-xs text-white font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Thêm vào báo giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
