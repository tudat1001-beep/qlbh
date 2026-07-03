/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Transaction,
  Product,
  Warehouse,
  Customer,
  Supplier,
  Employee,
  FundAccount,
  TransactionCategory
} from '../types';
import {
  Calendar,
  Filter,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  Download,
  DollarSign,
  Briefcase
} from 'lucide-react';

interface ReportsManagerProps {
  view: string;
  transactions: Transaction[];
  products: Product[];
  warehouses: Warehouse[];
  customers: Customer[];
  suppliers: Supplier[];
  funds: FundAccount[];
  categories: TransactionCategory[];
  decimalPlaces: number;
  excelTheme?: string;
  workingPeriod: string;
}

export default function ReportsManager({
  view,
  transactions,
  products,
  warehouses,
  customers,
  suppliers,
  funds,
  categories,
  decimalPlaces,
  excelTheme = 'GREEN',
  workingPeriod
}: ReportsManagerProps) {
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

  // Report filters
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('ALL');
  const [selectedPartnerId, setSelectedPartnerId] = useState('ALL');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(val);
  };

  // Chronologically sorted transactions within date range
  const getSortedTxs = () => {
    return [...transactions]
      .filter(t => t.date >= startDate && t.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const sortedTxs = getSortedTxs();

  // CALCULATE REPORTS DATA
  // 1. Profit & Loss Report (Lãi Lỗ)
  const calculatePL = () => {
    let grossRevenue = 0;
    let deductions = 0; // KH_TRA_HANG
    let cogs = 0; // Cost of goods sold
    let otherRevenue = 0;
    let expenses = 0;

    sortedTxs.forEach(t => {
      if (t.type === 'XUAT_BAN') {
        grossRevenue += t.totalAmount;
        // COGS = Qty * PurchasePrice
        t.details.forEach(d => {
          const prod = products.find(p => p.id === d.productId);
          if (prod) {
            cogs += d.quantity * prod.purchasePrice;
          }
        });
      } else if (t.type === 'KH_TRA_HANG') {
        deductions += t.totalAmount;
        t.details.forEach(d => {
          const prod = products.find(p => p.id === d.productId);
          if (prod) {
            cogs -= d.quantity * prod.purchasePrice;
          }
        });
      } else if (t.type === 'THU_KHAC') {
        otherRevenue += t.totalAmount;
      } else if (t.type === 'CHI_KHAC') {
        expenses += t.totalAmount;
      }
    });

    const revenue = grossRevenue - deductions;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit + otherRevenue - expenses;

    return { grossRevenue, deductions, revenue, cogs, grossProfit, otherRevenue, expenses, netProfit };
  };

  // 2. Inventory Summary Report (Tổng hợp NXT)
  const calculateNXT = () => {
    return products.map(prod => {
      // Calculate opening stock at startDate
      let initStock = 0;
      if (selectedWarehouseId === 'ALL') {
        initStock = prod.initialStock;
      } else if (prod.defaultWarehouseId === selectedWarehouseId) {
        initStock = prod.initialStock;
      }

      let openingStock = initStock;
      let importQty = 0;
      let exportQty = 0;

      transactions.forEach(t => {
        const isBefore = t.date < startDate;
        const isInPeriod = t.date >= startDate && t.date <= endDate;

        if (!isBefore && !isInPeriod) return; // ignore after period

        t.details.forEach(d => {
          if (d.productId !== prod.id) return;

          let isImport = false;
          let isExport = false;

          if (t.type === 'NHAP_MUA' || t.type === 'KH_TRA_HANG') {
            if (selectedWarehouseId === 'ALL' || t.warehouseId === selectedWarehouseId) {
              isImport = true;
            }
          } else if (t.type === 'XUAT_BAN' || t.type === 'TRA_HANG_NCC') {
            if (selectedWarehouseId === 'ALL' || t.warehouseId === selectedWarehouseId) {
              isExport = true;
            }
          } else if (t.type === 'CHUYEN_KHO') {
            if (selectedWarehouseId === 'ALL') {
              // Internal warehouse transfer does not affect global stock
            } else {
              if (t.toWarehouseId === selectedWarehouseId) {
                isImport = true;
              }
              if (t.warehouseId === selectedWarehouseId) {
                isExport = true;
              }
            }
          }

          if (isBefore) {
            if (isImport) openingStock += d.quantity;
            if (isExport) openingStock -= d.quantity;
          } else if (isInPeriod) {
            if (isImport) importQty += d.quantity;
            if (isExport) exportQty += d.quantity;
          }
        });
      });

      const openingValue = openingStock * prod.purchasePrice;
      const closingStock = openingStock + importQty - exportQty;
      const closingValue = closingStock * prod.purchasePrice;

      return {
        id: prod.id,
        code: prod.code,
        name: prod.name,
        unit: prod.unit,
        price: prod.purchasePrice,
        openingStock,
        openingValue,
        importQty,
        importValue: importQty * prod.purchasePrice,
        exportQty,
        exportValue: exportQty * prod.purchasePrice,
        closingStock,
        closingValue
      };
    });
  };

  // Helper for opening balance of selected product in stock card
  const getTheKhoOpeningBalance = () => {
    const selectedProd = products.find(p => p.id === selectedProductId);
    if (!selectedProd) return 0;

    let initStock = 0;
    if (selectedWarehouseId === 'ALL') {
      initStock = selectedProd.initialStock;
    } else if (selectedProd.defaultWarehouseId === selectedWarehouseId) {
      initStock = selectedProd.initialStock;
    }

    let openingBalance = initStock;

    const sortedAll = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    sortedAll.forEach(t => {
      if (t.date >= startDate) return; // only before startDate

      const matchDetails = t.details.filter(d => d.productId === selectedProductId);
      matchDetails.forEach(d => {
        let qtyIn = 0;
        let qtyOut = 0;

        if (t.type === 'NHAP_MUA' || t.type === 'KH_TRA_HANG') {
          if (selectedWarehouseId === 'ALL' || t.warehouseId === selectedWarehouseId) {
            qtyIn = d.quantity;
          }
        } else if (t.type === 'XUAT_BAN' || t.type === 'TRA_HANG_NCC') {
          if (selectedWarehouseId === 'ALL' || t.warehouseId === selectedWarehouseId) {
            qtyOut = d.quantity;
          }
        } else if (t.type === 'CHUYEN_KHO') {
          if (selectedWarehouseId === 'ALL') {
            // General stock card shows internal movement without net change
          } else {
            if (t.toWarehouseId === selectedWarehouseId) {
              qtyIn = d.quantity;
            }
            if (t.warehouseId === selectedWarehouseId) {
              qtyOut = d.quantity;
            }
          }
        }

        openingBalance += qtyIn - qtyOut;
      });
    });

    return openingBalance;
  };

  // 3. Stock Card Report (Thẻ kho)
  const calculateTheKho = () => {
    const selectedProd = products.find(p => p.id === selectedProductId);
    if (!selectedProd) return [];

    let balance = getTheKhoOpeningBalance();
    const entries: any[] = [];

    const sortedAll = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    sortedAll.forEach(t => {
      const isBefore = t.date < startDate;
      const isInPeriod = t.date >= startDate && t.date <= endDate;

      if (!isInPeriod) return; // we only list entries inside the period

      const matchDetails = t.details.filter(d => d.productId === selectedProductId);
      if (matchDetails.length === 0) return;

      matchDetails.forEach(d => {
        let qtyIn = 0;
        let qtyOut = 0;

        if (t.type === 'NHAP_MUA' || t.type === 'KH_TRA_HANG') {
          if (selectedWarehouseId === 'ALL' || t.warehouseId === selectedWarehouseId) {
            qtyIn = d.quantity;
          }
        } else if (t.type === 'XUAT_BAN' || t.type === 'TRA_HANG_NCC') {
          if (selectedWarehouseId === 'ALL' || t.warehouseId === selectedWarehouseId) {
            qtyOut = d.quantity;
          }
        } else if (t.type === 'CHUYEN_KHO') {
          if (selectedWarehouseId === 'ALL') {
            qtyIn = d.quantity;
            qtyOut = d.quantity;
          } else {
            if (t.toWarehouseId === selectedWarehouseId) {
              qtyIn = d.quantity;
            }
            if (t.warehouseId === selectedWarehouseId) {
              qtyOut = d.quantity;
            }
          }
        }

        if (qtyIn > 0 || qtyOut > 0) {
          balance += qtyIn - qtyOut;
          entries.push({
            date: t.date,
            code: t.code,
            type: t.type,
            qtyIn: qtyIn || undefined,
            qtyOut: qtyOut || undefined,
            balance,
            note: t.note
          });
        }
      });
    });

    return entries;
  };

  // Helper for opening balance of cash ledger / Cash Book
  const getSoQuyOpeningBalance = () => {
    let openingBalance = funds.reduce((sum, f) => sum + f.initialBalance, 0);

    const sortedAll = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    sortedAll.forEach(t => {
      if (t.date >= startDate) return; // only before startDate

      let receipt = 0;
      let payment = 0;

      // Receipts
      if (t.type === 'THU_TIEN_KH' || t.type === 'THU_KHAC' || t.type === 'HOAN_UNG' || t.type === 'TRA_HANG_NCC') {
        receipt = t.totalAmount;
        openingBalance += receipt;
      }
      // Payments
      else if (t.type === 'TRA_TIEN_NCC' || t.type === 'CHI_KHAC' || t.type === 'TAM_UNG' || t.type === 'KH_TRA_HANG') {
        payment = t.totalAmount;
        openingBalance -= payment;
      }
    });

    return openingBalance;
  };

  // 4. Fund ledger / Cash Book (Sổ quỹ & TH Quỹ)
  const calculateSoQuy = () => {
    let balance = getSoQuyOpeningBalance();
    const entries: any[] = [];

    const sortedAll = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    sortedAll.forEach(t => {
      if (t.date < startDate || t.date > endDate) return;

      let receipt = 0;
      let payment = 0;

      // Receipts
      if (t.type === 'THU_TIEN_KH' || t.type === 'THU_KHAC' || t.type === 'HOAN_UNG' || t.type === 'TRA_HANG_NCC') {
        receipt = t.totalAmount;
        balance += receipt;
      }
      // Payments
      else if (t.type === 'TRA_TIEN_NCC' || t.type === 'CHI_KHAC' || t.type === 'TAM_UNG' || t.type === 'KH_TRA_HANG') {
        payment = t.totalAmount;
        balance -= payment;
      }
      // Internal Transfer
      else if (t.type === 'CHUYEN_QUY') {
        receipt = t.totalAmount;
        payment = t.totalAmount;
      }

      if (receipt > 0 || payment > 0) {
        entries.push({
          date: t.date,
          code: t.code,
          type: t.type,
          receipt,
          payment,
          balance,
          note: t.note
        });
      }
    });

    return entries;
  };

  // 5. Customer & Supplier Debt Summary (TH Công nợ)
  const calculateTHCongNo = () => {
    const custDebts = customers.map(c => {
      let opening = c.initialDebt;
      let increase = 0;
      let decrease = 0;

      transactions.forEach(t => {
        if (t.partnerId !== c.id) return;

        const isBefore = t.date < startDate;
        const isInPeriod = t.date >= startDate && t.date <= endDate;

        if (t.type === 'XUAT_BAN') {
          if (isBefore) opening += t.totalAmount;
          else if (isInPeriod) increase += t.totalAmount;
        } else if (t.type === 'THU_TIEN_KH' || t.type === 'KH_TRA_HANG') {
          if (isBefore) opening -= t.totalAmount;
          else if (isInPeriod) decrease += t.totalAmount;
        }
      });

      const ending = opening + increase - decrease;

      return {
        id: c.id,
        code: c.code,
        name: c.name,
        type: 'KHÁCH HÀNG',
        opening,
        increase,
        decrease,
        ending
      };
    });

    const suppDebts = suppliers.map(s => {
      let opening = s.initialDebt;
      let increase = 0;
      let decrease = 0;

      transactions.forEach(t => {
        if (t.partnerId !== s.id) return;

        const isBefore = t.date < startDate;
        const isInPeriod = t.date >= startDate && t.date <= endDate;

        if (t.type === 'NHAP_MUA') {
          if (isBefore) opening += t.totalAmount;
          else if (isInPeriod) increase += t.totalAmount;
        } else if (t.type === 'TRA_TIEN_NCC' || t.type === 'TRA_HANG_NCC') {
          if (isBefore) opening -= t.totalAmount;
          else if (isInPeriod) decrease += t.totalAmount;
        }
      });

      const ending = opening + increase - decrease;

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        type: 'NHÀ CUNG CẤP',
        opening,
        increase,
        decrease,
        ending
      };
    });

    return [...custDebts, ...suppDebts];
  };

  return (
    <div id="reports-manager" className="p-4 bg-gray-50 flex-1 overflow-auto">
      {/* Title block */}
      <div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${excelTheme === 'GREEN' ? 'border-[#107c41]' : excelTheme === 'BLUE' ? 'border-blue-800' : excelTheme === 'PURPLE' ? 'border-purple-800' : 'border-slate-800'} select-none transition-all duration-200`}>
        <div>
          <h2 className="text-base font-bold text-gray-800 tracking-tight flex items-center space-x-2">
            <span className={`${theme.primary} text-[10px] px-2 py-0.5 rounded font-mono font-bold transition-colors duration-200`}>EXCEL REPORT</span>
            <span>
              {view === 'BC_LAI_LO' && 'BÁO CÁO HẠCH TOÁN LÃI LỖ'}
              {view === 'BC_CT_NHAP_XUAT' && 'BÁO CÁO CHI TIẾT NHẬP XUẤT KHO'}
              {view === 'BC_CT_THU_CHI' && 'SỔ CHI TIẾT THU CHI TIỀN TỆ'}
              {view === 'BC_CT_CONG_NO' && 'SỔ CHI TIẾT CÔNG NỢ ĐỐI TÁC'}
              {view === 'BC_TH_NXT' && 'BÁO CÁO TỔNG HỢP NHẬP XUẤT TỒN KHO'}
              {view === 'BC_THE_KHO' && 'THẺ KHO CHI TIẾT SẢN PHẨM'}
              {view === 'BC_SO_QUY' && 'SỔ QUỸ TIỀN MẶT & TIỀN GỬI'}
              {view === 'BC_TH_CONG_NO' && 'TỔNG HỢP CÔNG NỢ KHÁCH HÀNG & NCC'}
              {view === 'BC_TH_QUY' && 'BÁO CÁO TỔNG HỢP SỐ DƯ QUỸ'}
            </span>
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Dữ liệu được hạch toán tự động từ sổ sách chứng từ phát sinh chính xác theo quy chuẩn kế toán.</p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded shadow-sm flex items-center space-x-1 transition"
        >
          <Download className="h-4 w-4" />
          <span>Xuất / In Excel</span>
        </button>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white p-3 rounded shadow-sm border border-gray-200 mb-4 flex flex-wrap items-center gap-4 text-xs select-none">
        <div className="flex items-center space-x-2">
          <Calendar className={`h-4 w-4 ${theme.text}`} />
          <span>Từ ngày:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`border border-gray-300 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 ${focusRing}`}
          />
        </div>

        <div className="flex items-center space-x-2">
          <span>Đến ngày:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`border border-gray-300 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 ${focusRing}`}
          />
        </div>

        {/* Product selector for Stock Card */}
        {view === 'BC_THE_KHO' && (
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${theme.text}`}>Chọn sản phẩm:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={`border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 ${focusRing}`}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Warehouse Filter for NXT */}
        {(view === 'BC_TH_NXT' || view === 'BC_THE_KHO') && (
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${theme.text}`}>Chọn kho:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className={`border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 ${focusRing}`}
            >
              <option value="ALL">Tất cả kho hàng</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {view === 'BC_CT_CONG_NO' && (
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${theme.text}`}>Chọn đối tác:</span>
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className={`border border-gray-300 rounded px-2 py-1 bg-white w-52 focus:outline-none focus:ring-1 ${focusRing}`}
            >
              <option value="ALL">Tất cả đối tác</option>
              <optgroup label="Khách hàng">
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </optgroup>
              <optgroup label="Nhà cung cấp">
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
      </div>

      {/* RENDER ACTIVE REPORT SHEET */}

      {/* 1. LÃI LỖ (PROFIT & LOSS) */}
      {view === 'BC_LAI_LO' && (
        <div className="space-y-4">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">DOANH THU THUẦN</span>
                <span className="text-sm font-bold text-blue-600 font-mono mt-1 block">
                  {formatCurrency(calculatePL().revenue)}
                </span>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-blue-100" />
            </div>

            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">GIÁ VỐN HÀNG BÁN</span>
                <span className="text-sm font-bold text-orange-600 font-mono mt-1 block">
                  {formatCurrency(calculatePL().cogs)}
                </span>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-orange-100" />
            </div>

            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">CHI PHÍ VẬN HÀNH</span>
                <span className="text-sm font-bold text-red-600 font-mono mt-1 block">
                  {formatCurrency(calculatePL().expenses)}
                </span>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-red-100" />
            </div>

            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">LỢI NHUẬN RÒNG (LÃI/LỖ)</span>
                <span className="text-sm font-bold text-emerald-700 font-mono mt-1 block">
                  {formatCurrency(calculatePL().netProfit)}
                </span>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-100" />
            </div>
          </div>

          {/* Formal Accounting Ledger Report */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase">HẠCH TOÁN BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Kỳ hạch toán: {startDate} đến {endDate}</p>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-y border-gray-300 font-bold text-gray-700">
                  <th className="px-3 py-2 text-left w-12">Mã số</th>
                  <th className="px-3 py-2 text-left">Chỉ tiêu hạch toán</th>
                  <th className="px-3 py-2 text-right w-44">Thành tiền (VND)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 font-mono text-gray-400">01</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">Doanh thu bán hàng và cung cấp dịch vụ</td>
                  <td className="px-3 py-2.5 text-right font-mono text-blue-600 font-semibold">{formatCurrency(calculatePL().grossRevenue)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 font-mono text-gray-400">02</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">Các khoản giảm trừ doanh thu (KH trả hàng)</td>
                  <td className="px-3 py-2.5 text-right font-mono text-red-500">{formatCurrency(calculatePL().deductions)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50 font-semibold bg-gray-50/30">
                  <td className="px-3 py-2.5 font-mono text-gray-500">10</td>
                  <td className="px-3 py-2.5 text-gray-800 uppercase">Doanh thu thuần từ hoạt động kinh doanh (01 - 02)</td>
                  <td className="px-3 py-2.5 text-right font-mono text-blue-700">{formatCurrency(calculatePL().revenue)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 font-mono text-gray-400">11</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">Giá vốn hàng bán xuất kho (COGS)</td>
                  <td className="px-3 py-2.5 text-right font-mono text-orange-600">{formatCurrency(calculatePL().cogs)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50 font-bold bg-gray-50">
                  <td className="px-3 py-2.5 font-mono text-gray-600">20</td>
                  <td className="px-3 py-2.5 text-gray-800 uppercase">Lợi nhuận gộp về bán hàng (10 - 11)</td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-700">{formatCurrency(calculatePL().grossProfit)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 font-mono text-gray-400">21</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">Doanh thu hoạt động tài chính & Khác</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[#107c41]">{formatCurrency(calculatePL().otherRevenue)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 font-mono text-gray-400">22</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">Chi phí quản lý doanh nghiệp & Chi khác</td>
                  <td className="px-3 py-2.5 text-right font-mono text-red-600">{formatCurrency(calculatePL().expenses)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50 font-black bg-emerald-50 text-emerald-950 text-sm border-y border-emerald-200">
                  <td className="px-3 py-3 font-mono">30</td>
                  <td className="px-3 py-3 uppercase">LỢI NHUẬN THUẦN TRƯỚC THUẾ (20 + 21 - 22)</td>
                  <td className="px-3 py-3 text-right font-mono">{formatCurrency(calculatePL().netProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CHI TIẾT NHẬP XUẤT */}
      {view === 'BC_CT_NHAP_XUAT' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <th className="px-3 py-2 text-center w-12">STT</th>
                <th className="px-3 py-2 w-24">Ngày chứng từ</th>
                <th className="px-3 py-2 w-24">Số phiếu</th>
                <th className="px-3 py-2 w-32">Nghiệp vụ</th>
                <th className="px-3 py-2">Mặt hàng chi tiết</th>
                <th className="px-3 py-2 text-center w-20">ĐVT</th>
                <th className="px-3 py-2 text-center w-24">Số lượng</th>
                <th className="px-3 py-2 text-right w-32">Đơn giá vốn</th>
                <th className="px-3 py-2 text-right w-36">Thành tiền (VND)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTxs
                .filter(t => ['NHAP_MUA', 'XUAT_BAN', 'TRA_HANG_NCC', 'KH_TRA_HANG', 'CHUYEN_KHO'].includes(t.type))
                .map((tx, idx) => (
                  <React.Fragment key={tx.id}>
                    {tx.details.map((d, dIdx) => {
                      const prod = products.find(p => p.id === d.productId);
                      return (
                        <tr key={`${tx.id}-${dIdx}`} className="hover:bg-gray-50">
                          {dIdx === 0 ? (
                            <>
                              <td className="px-3 py-2 border-r border-gray-100 text-center text-gray-400 font-mono" rowSpan={tx.details.length}>
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 border-r border-gray-100 text-center text-gray-500 font-mono" rowSpan={tx.details.length}>
                                {tx.date}
                              </td>
                              <td className="px-3 py-2 border-r border-gray-100 font-mono font-semibold text-[#107c41]" rowSpan={tx.details.length}>
                                {tx.code}
                              </td>
                              <td className="px-3 py-2 border-r border-gray-100 font-semibold" rowSpan={tx.details.length}>
                                {tx.type === 'NHAP_MUA' && 'Nhập mua hàng'}
                                {tx.type === 'XUAT_BAN' && 'Xuất bán sỉ'}
                                {tx.type === 'CHUYEN_KHO' && 'Chuyển kho hàng'}
                                {tx.type === 'TRA_HANG_NCC' && 'Xuất trả NCC'}
                                {tx.type === 'KH_TRA_HANG' && 'Nhập KH trả hàng'}
                              </td>
                            </>
                          ) : null}
                          <td className="px-3 py-2 border-r border-gray-100 text-gray-700">{prod?.name || 'Sản phẩm ẩn'}</td>
                          <td className="px-3 py-2 border-r border-gray-100 text-center text-gray-500">{prod?.unit}</td>
                          <td className="px-3 py-2 border-r border-gray-100 text-center font-mono font-medium">{d.quantity}</td>
                          <td className="px-3 py-2 border-r border-gray-100 text-right font-mono text-gray-500">{formatCurrency(d.price)}</td>
                          <td className="px-3 py-2 text-right font-mono text-blue-600 font-semibold">{formatCurrency(d.quantity * d.price)}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. CHI TIẾT THU CHI */}
      {view === 'BC_CT_THU_CHI' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <th className="px-3 py-2 text-center w-12">STT</th>
                <th className="px-3 py-2 w-24 text-center">Ngày ghi sổ</th>
                <th className="px-3 py-2 w-24">Số chứng từ</th>
                <th className="px-3 py-2">Mô tả nghiệp vụ quỹ</th>
                <th className="px-3 py-2 text-right w-36">Số tiền thu (+)</th>
                <th className="px-3 py-2 text-right w-36">Số tiền chi (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTxs
                .filter(t => ['TRA_TIEN_NCC', 'THU_TIEN_KH', 'CHUYEN_QUY', 'THU_KHAC', 'CHI_KHAC', 'TAM_UNG', 'QUYET_TOAN_TAM_UNG', 'HOAN_UNG'].includes(t.type))
                .map((tx, idx) => {
                  const isThu = ['THU_TIEN_KH', 'THU_KHAC', 'HOAN_UNG', 'TRA_HANG_NCC'].includes(tx.type);
                  const isTransfer = tx.type === 'CHUYEN_QUY';

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-center text-gray-400 font-mono border-r border-gray-100">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 font-mono border-r border-gray-100">{tx.date}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#107c41] border-r border-gray-100">{tx.code}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100">
                        <span className="font-semibold block">{tx.note}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Người lập: {tx.creator}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-600 font-semibold border-r border-gray-100">
                        {isThu || isTransfer ? formatCurrency(tx.totalAmount) : '0 đ'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-rose-600 font-semibold">
                        {!isThu || isTransfer ? formatCurrency(tx.totalAmount) : '0 đ'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. CHI TIẾT CÔNG NỢ */}
      {view === 'BC_CT_CONG_NO' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <th className="px-3 py-2 text-center w-12">STT</th>
                <th className="px-3 py-2 w-24 text-center">Ngày lập</th>
                <th className="px-3 py-2 w-24">Chứng từ</th>
                <th className="px-3 py-2 w-48">Đối tác liên đới</th>
                <th className="px-3 py-2">Diễn giải nội dung nợ</th>
                <th className="px-3 py-2 text-right w-36">Tăng công nợ (+)</th>
                <th className="px-3 py-2 text-right w-36">Giảm công nợ (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTxs
                .filter(t => ['NHAP_MUA', 'XUAT_BAN', 'TRA_TIEN_NCC', 'THU_TIEN_KH', 'TRA_HANG_NCC', 'KH_TRA_HANG'].includes(t.type))
                .filter(t => selectedPartnerId === 'ALL' || t.partnerId === selectedPartnerId)
                .map((tx, idx) => {
                  const isIncrease = ['NHAP_MUA', 'XUAT_BAN'].includes(tx.type);
                  let partnerName = 'Đối tác';
                  if (tx.partnerType === 'CUSTOMER') {
                    partnerName = customers.find(c => c.id === tx.partnerId)?.name || 'Khách hàng';
                  } else if (tx.partnerType === 'SUPPLIER') {
                    partnerName = suppliers.find(s => s.id === tx.partnerId)?.name || 'Nhà cung cấp';
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-center text-gray-400 font-mono border-r border-gray-100">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 font-mono border-r border-gray-100">{tx.date}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#107c41] border-r border-gray-100">{tx.code}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 font-medium text-gray-800">{partnerName}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 text-gray-600">{tx.note}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-orange-600 font-semibold border-r border-gray-100">
                        {isIncrease ? formatCurrency(tx.totalAmount) : '0 đ'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-600 font-semibold">
                        {!isIncrease ? formatCurrency(tx.totalAmount) : '0 đ'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TỔNG HỢP NHẬP XUẤT TỒN (NXT) */}
      {view === 'BC_TH_NXT' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 font-bold select-none text-center">
                <th className="px-2 py-3 border-r border-gray-200 w-10" rowSpan={2}>STT</th>
                <th className="px-2 py-3 border-r border-gray-200 w-20" rowSpan={2}>Mã Hàng</th>
                <th className="px-2 py-3 border-r border-gray-200 text-left" rowSpan={2}>Tên sản phẩm hàng hóa</th>
                <th className="px-2 py-3 border-r border-gray-200 w-12" rowSpan={2}>ĐVT</th>
                <th className="px-2 py-2 border-r border-gray-200" colSpan={2}>Tồn đầu kỳ</th>
                <th className="px-2 py-2 border-r border-gray-200" colSpan={2}>Nhập trong kỳ</th>
                <th className="px-2 py-2 border-r border-gray-200" colSpan={2}>Xuất trong kỳ</th>
                <th className="px-2 py-2" colSpan={2}>Tồn cuối kỳ</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 font-bold text-right">
                <th className="px-2 py-1.5 border-r border-gray-200 w-14">SL</th>
                <th className="px-2 py-1.5 border-r border-gray-200 w-24">Trị giá</th>
                <th className="px-2 py-1.5 border-r border-gray-200 w-14">SL</th>
                <th className="px-2 py-1.5 border-r border-gray-200 w-24">Trị giá</th>
                <th className="px-2 py-1.5 border-r border-gray-200 w-14">SL</th>
                <th className="px-2 py-1.5 border-r border-gray-200 w-24">Trị giá</th>
                <th className="px-2 py-1.5 border-r border-gray-200 w-14">SL</th>
                <th className="px-2 py-1.5 w-24">Trị giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {calculateNXT().map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 text-gray-700 text-right">
                  <td className="px-2 py-2.5 border-r border-gray-200 text-center text-gray-400 font-sans">{idx + 1}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-center text-[#107c41] font-bold">{item.code}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-left font-sans font-medium text-gray-800">{item.name}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-center font-sans text-gray-500">{item.unit}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-gray-500">{item.openingStock}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-gray-500">{formatCurrency(item.openingValue)}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-blue-600 font-medium">{item.importQty}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-blue-600">{formatCurrency(item.importValue)}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-orange-600 font-medium">{item.exportQty}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-orange-600">{formatCurrency(item.exportValue)}</td>
                  <td className="px-2 py-2.5 border-r border-gray-200 text-gray-900 font-bold">{item.closingStock}</td>
                  <td className="px-2 py-2.5 text-gray-900 font-bold">{formatCurrency(item.closingValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. THẺ KHO (STOCK CARD) */}
      {view === 'BC_THE_KHO' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 max-w-4xl mx-auto font-sans">
          <div className="text-center mb-6 select-none">
            <h3 className="text-sm font-bold text-gray-800 uppercase">THẺ KHO CHI TIẾT</h3>
            <p className="text-xs text-gray-600 font-bold mt-1">Sản phẩm: {products.find(p => p.id === selectedProductId)?.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Kỳ thẻ kho: {startDate} đến {endDate}</p>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-300 font-bold text-gray-700 text-center">
                <th className="px-3 py-2 border-r border-gray-200 w-12">STT</th>
                <th className="px-3 py-2 border-r border-gray-200 w-24">Ngày chứng từ</th>
                <th className="px-3 py-2 border-r border-gray-200 w-24">Số hiệu phiếu</th>
                <th className="px-3 py-2 border-r border-gray-200">Diễn giải hạch toán</th>
                <th className="px-3 py-2 border-r border-gray-200 w-24">Nhập (+)</th>
                <th className="px-3 py-2 border-r border-gray-200 w-24">Xuất (-)</th>
                <th className="px-3 py-2 w-28">Tồn cuối dòng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-center">
              <tr className="bg-gray-50/50 font-bold italic text-left">
                <td className="px-3 py-2 border-r border-gray-200 text-center">-</td>
                <td className="px-3 py-2 border-r border-gray-200 text-center">-</td>
                <td className="px-3 py-2 border-r border-gray-200 text-center">-</td>
                <td className="px-3 py-2 border-r border-gray-200 text-gray-800 font-sans">TỒN ĐẦU KỲ BÁO CÁO</td>
                <td className="px-3 py-2 border-r border-gray-200 text-right">-</td>
                <td className="px-3 py-2 border-r border-gray-200 text-right">-</td>
                <td className="px-3 py-2 text-right text-gray-900">
                  {getTheKhoOpeningBalance()}
                </td>
              </tr>
              {calculateTheKho().map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-3 py-2 border-r border-gray-200 text-center text-gray-400 font-sans">{idx + 1}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-center text-gray-500">{item.date}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-center font-bold text-[#107c41]">{item.code}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-left font-sans text-gray-600 truncate max-w-xs" title={item.note}>{item.note || 'Điều động hàng hóa'}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-right text-blue-600 font-semibold">{item.qtyIn || '-'}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-right text-orange-600 font-semibold">{item.qtyOut || '-'}</td>
                  <td className="px-3 py-2 text-right font-bold text-gray-950">{item.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. SỔ QUỸ (CASH BOOK) */}
      {view === 'BC_SO_QUY' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 max-w-4xl mx-auto font-sans">
          <div className="text-center mb-6 select-none">
            <h3 className="text-sm font-bold text-gray-800 uppercase">SỔ QUỸ TIỀN MẶT & TÀI KHOẢN TIỀN GỬI</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Kỳ sổ quỹ: {startDate} đến {endDate}</p>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-300 font-bold text-gray-700 text-center">
                <th className="px-3 py-2 border-r border-gray-200 w-12">STT</th>
                <th className="px-3 py-2 border-r border-gray-200 w-24">Ngày tháng</th>
                <th className="px-3 py-2 border-r border-gray-200 w-24">Số chứng từ</th>
                <th className="px-3 py-2 border-r border-gray-200">Diễn giải nội dung quỹ</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32">Thu vào (+)</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32">Chi ra (-)</th>
                <th className="px-3 py-2 w-36">Số dư hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-center">
              <tr className="bg-gray-50/50 font-bold italic text-left">
                <td className="px-3 py-2 border-r border-gray-200 text-center">-</td>
                <td className="px-3 py-2 border-r border-gray-200 text-center">-</td>
                <td className="px-3 py-2 border-r border-gray-200 text-center">-</td>
                <td className="px-3 py-2 border-r border-gray-200 text-gray-800 font-sans">SỐ DƯ ĐẦU KỲ BÁO CÁO</td>
                <td className="px-3 py-2 border-r border-gray-200 text-right">-</td>
                <td className="px-3 py-2 border-r border-gray-200 text-right">-</td>
                <td className="px-3 py-2 text-right text-emerald-800 font-bold">
                  {formatCurrency(getSoQuyOpeningBalance())}
                </td>
              </tr>
              {calculateSoQuy().map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-3 py-2 border-r border-gray-200 text-center text-gray-400 font-sans">{idx + 1}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-center text-gray-500">{item.date}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-center font-bold text-[#107c41]">{item.code}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-left font-sans text-gray-600 truncate max-w-xs" title={item.note}>{item.note}</td>
                  <td className="px-3 py-2 border-r border-gray-200 text-right text-emerald-600 font-semibold">
                    {item.receipt > 0 ? formatCurrency(item.receipt) : '-'}
                  </td>
                  <td className="px-3 py-2 border-r border-gray-200 text-right text-rose-600 font-semibold">
                    {item.payment > 0 ? formatCurrency(item.payment) : '-'}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-950">{formatCurrency(item.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. TỔNG HỢP CÔNG NỢ (TH_CONG_NO) */}
      {view === 'BC_TH_CONG_NO' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 font-bold select-none text-center">
                <th className="px-3 py-3 border-r border-gray-200 w-12" rowSpan={2}>STT</th>
                <th className="px-3 py-3 border-r border-gray-200 w-24" rowSpan={2}>Mã Đối Tác</th>
                <th className="px-3 py-3 border-r border-gray-200 text-left" rowSpan={2}>Họ tên / Doanh nghiệp</th>
                <th className="px-3 py-3 border-r border-gray-200 w-28" rowSpan={2}>Phân loại</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32" colSpan={1}>Dư đầu kỳ</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32" colSpan={1}>Phát sinh tăng (+)</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32" colSpan={1}>Phát sinh giảm (-)</th>
                <th className="px-3 py-2 w-36" colSpan={1}>Dư cuối kỳ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-right">
              {calculateTHCongNo().map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-3 py-2.5 border-r border-gray-200 text-center text-gray-400 font-sans">{idx + 1}</td>
                  <td className="px-3 py-2.5 border-r border-gray-200 text-center text-[#107c41] font-bold">{item.code}</td>
                  <td className="px-3 py-2.5 border-r border-gray-200 text-left font-sans font-medium text-gray-800">{item.name}</td>
                  <td className="px-3 py-2.5 border-r border-gray-200 text-center font-sans">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.type === 'KHÁCH HÀNG' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-r border-gray-200 text-gray-500">{formatCurrency(item.opening)}</td>
                  <td className="px-3 py-2.5 border-r border-gray-200 text-orange-600 font-semibold">{formatCurrency(item.increase)}</td>
                  <td className="px-3 py-2.5 border-r border-gray-200 text-emerald-600 font-semibold">{formatCurrency(item.decrease)}</td>
                  <td className={`px-3 py-2.5 font-bold ${item.ending >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatCurrency(item.ending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 9. TỔNG HỢP QUỸ (TH_QUY) */}
      {view === 'BC_TH_QUY' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 max-w-3xl mx-auto font-sans">
          <div className="text-center mb-6 select-none">
            <h3 className="text-sm font-bold text-gray-800 uppercase">TỔNG HỢP SỐ DƯ QUỸ TIỀN TỆ</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Thời điểm báo cáo: Đến {endDate}</p>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-300 font-bold text-gray-700 text-center">
                <th className="px-3 py-2.5 border-r border-gray-200 w-12">STT</th>
                <th className="px-3 py-2.5 border-r border-gray-200 w-24">Mã Quỹ</th>
                <th className="px-3 py-2.5 border-r border-gray-200 text-left">Tên gọi / Tài khoản</th>
                <th className="px-3 py-2.5 border-r border-gray-200 w-28">Phân loại</th>
                <th className="px-3 py-2.5 w-40 text-right">Số dư khả dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-right">
              {funds.map((f, idx) => {
                // Find balance including transactions up to endDate
                let balance = f.initialBalance;
                transactions.forEach(t => {
                  if (t.date > endDate) return; // filter by date

                  if (t.fundAccountId === f.id) {
                    if (['THU_TIEN_KH', 'THU_KHAC', 'HOAN_UNG', 'TRA_HANG_NCC'].includes(t.type)) {
                      balance += t.totalAmount;
                    } else if (['TRA_TIEN_NCC', 'CHI_KHAC', 'TAM_UNG', 'KH_TRA_HANG'].includes(t.type)) {
                      balance -= t.totalAmount;
                    } else if (t.type === 'CHUYEN_QUY') {
                      balance -= t.totalAmount; // Left this fund
                    }
                  } else if (t.toFundAccountId === f.id && t.type === 'CHUYEN_QUY') {
                    balance += t.totalAmount; // Entered this fund
                  }
                });

                return (
                  <tr key={f.id} className="hover:bg-gray-50 text-gray-700">
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-gray-400 font-sans">{idx + 1}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center font-bold text-[#107c41]">{f.code}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-left font-sans font-medium text-gray-800">{f.name}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center font-sans">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${f.type === 'TIEN_MAT' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {f.type === 'TIEN_MAT' ? 'TIỀN MẶT' : 'NGÂN HÀNG'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-800 text-sm">{formatCurrency(balance)}</td>
                  </tr>
                );
              })}
              <tr className="bg-emerald-50 text-emerald-950 font-bold border-t-2 border-gray-300">
                <td className="px-3 py-3 border-r border-gray-200 text-center font-sans" colSpan={2}>∑</td>
                <td className="px-3 py-3 border-r border-gray-200 text-left font-sans" colSpan={2}>TỔNG CỘNG QUỸ TIỀN TỆ</td>
                <td className="px-3 py-3 text-right text-sm">
                  {formatCurrency(
                    funds.reduce((sum, f) => {
                      let balance = f.initialBalance;
                      transactions.forEach(t => {
                        if (t.date > endDate) return; // filter by date

                        if (t.fundAccountId === f.id) {
                          if (['THU_TIEN_KH', 'THU_KHAC', 'HOAN_UNG', 'TRA_HANG_NCC'].includes(t.type)) {
                            balance += t.totalAmount;
                          } else if (['TRA_TIEN_NCC', 'CHI_KHAC', 'TAM_UNG', 'KH_TRA_HANG'].includes(t.type)) {
                            balance -= t.totalAmount;
                          } else if (t.type === 'CHUYEN_QUY') {
                            balance -= t.totalAmount;
                          }
                        } else if (t.toFundAccountId === f.id && t.type === 'CHUYEN_QUY') {
                          balance += t.totalAmount;
                        }
                      });
                      return sum + balance;
                    }, 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
