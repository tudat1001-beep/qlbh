/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Product,
  Warehouse,
  Customer,
  Supplier,
  Employee,
  FundAccount,
  TransactionCategory,
  Transaction,
  AppUser
} from '../types';
import { Plus, Edit2, Trash2, Search, Filter, ShieldAlert } from 'lucide-react';

interface CategoryManagerProps {
  view: string;
  products: Product[];
  warehouses: Warehouse[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  funds: FundAccount[];
  categories: TransactionCategory[];
  transactions?: Transaction[];
  onAddProduct: (item: Product) => void;
  onEditProduct: (item: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddWarehouse: (item: Warehouse) => void;
  onEditWarehouse: (item: Warehouse) => void;
  onDeleteWarehouse: (id: string) => void;
  onAddCustomer: (item: Customer) => void;
  onEditCustomer: (item: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onAddSupplier: (item: Supplier) => void;
  onEditSupplier: (item: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onAddEmployee: (item: Employee) => void;
  onEditEmployee: (item: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onAddFund: (item: FundAccount) => void;
  onEditFund: (item: FundAccount) => void;
  onDeleteFund: (id: string) => void;
  onAddCategory: (item: TransactionCategory) => void;
  onEditCategory: (item: TransactionCategory) => void;
  onDeleteCategory: (id: string) => void;
  decimalPlaces: number;
  excelTheme?: string;
  currentUser?: AppUser | null;
}

export default function CategoryManager({
  view,
  products,
  warehouses,
  customers,
  suppliers,
  employees,
  funds,
  categories,
  transactions = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddWarehouse,
  onEditWarehouse,
  onDeleteWarehouse,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onAddFund,
  onEditFund,
  onDeleteFund,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  decimalPlaces,
  excelTheme = 'GREEN',
  currentUser
}: CategoryManagerProps) {
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
      border: 'border-green-200',
      text: 'text-[#107c41]',
      accent: 'bg-[#107c41] hover:bg-[#185e37] text-white',
      hover: 'hover:bg-green-50 text-[#107c41]'
    },
    BLUE: {
      primary: 'bg-blue-800 text-white',
      bg: 'bg-blue-50 border-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'bg-blue-800 hover:bg-blue-950 text-white',
      hover: 'hover:bg-blue-50 text-blue-800'
    },
    PURPLE: {
      primary: 'bg-purple-800 text-white',
      bg: 'bg-purple-50 border-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-800',
      accent: 'bg-purple-800 hover:bg-purple-950 text-white',
      hover: 'hover:bg-purple-50 text-purple-800'
    },
    SLATE: {
      primary: 'bg-slate-800 text-white',
      bg: 'bg-slate-100 border-slate-200',
      border: 'border-slate-300',
      text: 'text-slate-800',
      accent: 'bg-slate-800 hover:bg-slate-900 text-white',
      hover: 'hover:bg-slate-100 text-slate-800'
    }
  };
  const theme = themeColors[excelTheme] || themeColors.GREEN;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for general use
  const [formFields, setFormFields] = useState<any>({});

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(val);
  };

  const getActualStock = (prod: Product) => {
    let stock = prod.initialStock;
    transactions.forEach(t => {
      t.details.forEach(d => {
        if (d.productId === prod.id) {
          if (t.type === 'NHAP_MUA' || t.type === 'KH_TRA_HANG') {
            stock += d.quantity;
          } else if (t.type === 'XUAT_BAN' || t.type === 'TRA_HANG_NCC') {
            stock -= d.quantity;
          } else if (t.type === 'CHUYEN_KHO') {
            // Internally moving between warehouses keeps the total initial stock count the same
          }
        }
      });
    });
    return stock;
  };

  const getActualCustomerDebt = (cust: Customer) => {
    let debt = cust.initialDebt;
    transactions.forEach(t => {
      if (t.partnerId === cust.id) {
        if (t.type === 'XUAT_BAN') {
          debt += t.totalAmount;
        } else if (t.type === 'THU_TIEN_KH' || t.type === 'KH_TRA_HANG') {
          debt -= t.totalAmount;
        }
      }
    });
    return debt;
  };

  const getActualSupplierDebt = (supp: Supplier) => {
    let debt = supp.initialDebt;
    transactions.forEach(t => {
      if (t.partnerId === supp.id) {
        if (t.type === 'NHAP_MUA') {
          debt += t.totalAmount;
        } else if (t.type === 'TRA_TIEN_NCC' || t.type === 'TRA_HANG_NCC') {
          debt -= t.totalAmount;
        }
      }
    });
    return debt;
  };

  const getActualFundBalance = (fund: FundAccount) => {
    let balance = fund.initialBalance;
    transactions.forEach(t => {
      if (t.fundAccountId === fund.id) {
        if (['THU_TIEN_KH', 'THU_KHAC', 'HOAN_UNG', 'TRA_HANG_NCC'].includes(t.type)) {
          balance += t.totalAmount;
        } else if (['TRA_TIEN_NCC', 'CHI_KHAC', 'TAM_UNG', 'KH_TRA_HANG'].includes(t.type)) {
          balance -= t.totalAmount;
        } else if (t.type === 'CHUYEN_QUY') {
          balance -= t.totalAmount;
        }
      } else if (t.toFundAccountId === fund.id && t.type === 'CHUYEN_QUY') {
        balance += t.totalAmount;
      }
    });
    return balance;
  };

  const getTitle = () => {
    switch (view) {
      case 'DM_HANG_HOA': return 'DANH MỤC HÀNG HOÁ - SẢN PHẨM';
      case 'DM_KHO_CHI_NHANH': return 'DANH MỤC KHO - CHI NHÁNH';
      case 'DM_KHACH_HANG': return 'DANH MỤC KHÁCH HÀNG';
      case 'DM_NHA_CUNG_CAP': return 'DANH MỤC NHÀ CUNG CẤP';
      case 'DM_NHAN_VIEN': return 'DANH MỤC NHÂN VIÊN';
      case 'DM_QUY_TAI_KHOAN': return 'DANH MỤC QUỸ - TÀI KHOẢN TIỀN';
      case 'DM_HANG_MUC_THU_CHI': return 'DANH MỤC HẠNG MỤC THU - CHI';
      default: return 'DANH MỤC KHÁC';
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    let defaultFields = {};
    if (view === 'DM_HANG_HOA') {
      defaultFields = { code: `SP00${products.length + 1}`, name: '', unit: 'Hộp', purchasePrice: 0, salePrice: 0, defaultWarehouseId: warehouses[0]?.id || '', initialStock: 0, category: '' };
    } else if (view === 'DM_KHO_CHI_NHANH') {
      defaultFields = { code: `K0${warehouses.length + 1}`, name: '', address: '' };
    } else if (view === 'DM_KHACH_HANG') {
      defaultFields = { code: `KH00${customers.length + 1}`, name: '', phone: '', address: '', initialDebt: 0 };
    } else if (view === 'DM_NHA_CUNG_CAP') {
      defaultFields = { code: `NCC00${suppliers.length + 1}`, name: '', phone: '', address: '', initialDebt: 0 };
    } else if (view === 'DM_NHAN_VIEN') {
      defaultFields = { code: `NV00${employees.length + 1}`, name: '', position: '', department: '' };
    } else if (view === 'DM_QUY_TAI_KHOAN') {
      defaultFields = { code: `Q0${funds.length + 1}`, name: '', initialBalance: 0, type: 'TIEN_MAT' };
    } else if (view === 'DM_HANG_MUC_THU_CHI') {
      defaultFields = { code: `HM0${categories.length + 1}`, name: '', type: 'THU' };
    } else {
      defaultFields = { code: 'DMK01', name: '', details: '' };
    }
    setFormFields(defaultFields);
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormFields({ ...item });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || 'id_' + Math.random().toString(36).substr(2, 9);
    const savedItem = { id, ...formFields };

    if (view === 'DM_HANG_HOA') {
      editingId ? onEditProduct(savedItem) : onAddProduct(savedItem);
    } else if (view === 'DM_KHO_CHI_NHANH') {
      editingId ? onEditWarehouse(savedItem) : onAddWarehouse(savedItem);
    } else if (view === 'DM_KHACH_HANG') {
      editingId ? onEditCustomer(savedItem) : onAddCustomer(savedItem);
    } else if (view === 'DM_NHA_CUNG_CAP') {
      editingId ? onEditSupplier(savedItem) : onAddSupplier(savedItem);
    } else if (view === 'DM_NHAN_VIEN') {
      editingId ? onEditEmployee(savedItem) : onAddEmployee(savedItem);
    } else if (view === 'DM_QUY_TAI_KHOAN') {
      editingId ? onEditFund(savedItem) : onAddFund(savedItem);
    } else if (view === 'DM_HANG_MUC_THU_CHI') {
      editingId ? onEditCategory(savedItem) : onAddCategory(savedItem);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xoá bản ghi này không?')) {
      if (view === 'DM_HANG_HOA') onDeleteProduct(id);
      else if (view === 'DM_KHO_CHI_NHANH') onDeleteWarehouse(id);
      else if (view === 'DM_KHACH_HANG') onDeleteCustomer(id);
      else if (view === 'DM_NHA_CUNG_CAP') onDeleteSupplier(id);
      else if (view === 'DM_NHAN_VIEN') onDeleteEmployee(id);
      else if (view === 'DM_QUY_TAI_KHOAN') onDeleteFund(id);
      else if (view === 'DM_HANG_MUC_THU_CHI') onDeleteCategory(id);
    }
  };

  const getFilteredData = () => {
    const searchLower = searchTerm.toLowerCase();
    switch (view) {
      case 'DM_HANG_HOA':
        return products.filter(p =>
          (p.name.toLowerCase().includes(searchLower) || p.code.toLowerCase().includes(searchLower)) &&
          (filterType === 'ALL' || p.category === filterType)
        );
      case 'DM_KHO_CHI_NHANH':
        return warehouses.filter(w => w.name.toLowerCase().includes(searchLower) || w.code.toLowerCase().includes(searchLower));
      case 'DM_KHACH_HANG':
        return customers.filter(c => c.name.toLowerCase().includes(searchLower) || c.code.toLowerCase().includes(searchLower) || c.phone.includes(searchTerm));
      case 'DM_NHA_CUNG_CAP':
        return suppliers.filter(s => s.name.toLowerCase().includes(searchLower) || s.code.toLowerCase().includes(searchLower) || s.phone.includes(searchTerm));
      case 'DM_NHAN_VIEN':
        return employees.filter(e => e.name.toLowerCase().includes(searchLower) || e.code.toLowerCase().includes(searchLower));
      case 'DM_QUY_TAI_KHOAN':
        return funds.filter(f => f.name.toLowerCase().includes(searchLower) || f.code.toLowerCase().includes(searchLower));
      case 'DM_HANG_MUC_THU_CHI':
        return categories.filter(c =>
          (c.name.toLowerCase().includes(searchLower) || c.code.toLowerCase().includes(searchLower)) &&
          (filterType === 'ALL' || c.type === filterType)
        );
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();
  const categoriesList = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const borderAccentColors = {
    GREEN: 'border-[#107c41]',
    BLUE: 'border-blue-800',
    PURPLE: 'border-purple-800',
    SLATE: 'border-slate-800'
  };

  const focusRing = excelTheme === 'GREEN'
    ? 'focus:ring-[#107c41]'
    : excelTheme === 'BLUE'
    ? 'focus:ring-blue-800'
    : excelTheme === 'PURPLE'
    ? 'focus:ring-purple-800'
    : 'focus:ring-slate-800';

  return (
    <div id="category-manager" className="p-4 bg-gray-50 flex-1 overflow-auto">
      {/* Title with Excel style accent border */}
      <div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${borderAccentColors[excelTheme] || borderAccentColors.GREEN} transition-all duration-200`}>
        <div>
          <h2 className="text-base font-bold text-gray-800 tracking-tight flex items-center space-x-2">
            <span className={`${theme.primary} text-xs px-2 py-0.5 rounded font-mono transition-colors duration-200`}>BẢNG DANH MỤC</span>
            <span>{getTitle()}</span>
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Quản lý và cập nhật cơ sở dữ liệu danh mục để phục vụ hạch toán, báo cáo.</p>
        </div>
        {!(view === 'DM_NHAN_VIEN' && currentUser?.role !== 'ADMIN') && (
          <button
            onClick={openAddModal}
            className={`${theme.accent} text-xs font-semibold px-3 py-1.5 rounded shadow-sm flex items-center space-x-1 transition-all`}
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Bản Ghi</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded shadow-sm border border-gray-200 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:ring-1 ${focusRing} focus:outline-none`}
            />
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
          </div>

          {view === 'DM_HANG_HOA' && (
            <div className="flex items-center space-x-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 ${focusRing}`}
              >
                <option value="ALL">Tất cả nhóm</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {view === 'DM_HANG_MUC_THU_CHI' && (
            <div className="flex items-center space-x-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 ${focusRing}`}
              >
                <option value="ALL">Tất cả loại</option>
                <option value="THU">Chỉ mục Thu</option>
                <option value="CHI">Chỉ mục Chi</option>
              </select>
            </div>
          )}
        </div>

        <div className="text-[11px] text-gray-500 font-mono">
          Tổng số: <strong className="text-gray-800">{filteredData.length}</strong> dòng dữ liệu
        </div>
      </div>

      {/* Excel Sheet Layout Table */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#f9f9fb] border-b border-gray-200 text-gray-600 font-semibold select-none">
                <th className="px-3 py-2 border-r border-gray-200 w-12 text-center">STT</th>
                <th className="px-3 py-2 border-r border-gray-200 w-28">Mã Hệ Thống</th>
                <th className="px-3 py-2 border-r border-gray-200">Tên / Mô Tả</th>
                {view === 'DM_HANG_HOA' && (
                  <>
                    <th className="px-3 py-2 border-r border-gray-200 w-20 text-center">ĐVT</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-28">Giá Mua</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-28">Giá Bán</th>
                    <th className="px-3 py-2 border-r border-gray-200 w-32">Nhóm Hàng</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-24">Tồn Đầu</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-28 text-emerald-800">Tồn Hiện Tại</th>
                  </>
                )}
                {view === 'DM_KHO_CHI_NHANH' && (
                  <th className="px-3 py-2 border-r border-gray-200">Địa chỉ</th>
                )}
                {view === 'DM_KHACH_HANG' && (
                  <>
                    <th className="px-3 py-2 border-r border-gray-200 w-32">Số Điện Thoại</th>
                    <th className="px-3 py-2 border-r border-gray-200">Địa Chỉ</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-36">Dư Nợ Đầu Kỳ</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-36 text-orange-800">Dư Nợ Hiện Tại</th>
                  </>
                )}
                {view === 'DM_NHA_CUNG_CAP' && (
                  <>
                    <th className="px-3 py-2 border-r border-gray-200 w-32">Số Điện Thoại</th>
                    <th className="px-3 py-2 border-r border-gray-200">Địa Chỉ</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-36">Nợ Phải Trả Đầu Kỳ</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-36 text-red-800">Nợ Hiện Tại</th>
                  </>
                )}
                {view === 'DM_NHAN_VIEN' && (
                  <>
                    <th className="px-3 py-2 border-r border-gray-200 w-44">Chức Vụ</th>
                    <th className="px-3 py-2 border-r border-gray-200 w-44">Phòng Ban / Bộ Phận</th>
                  </>
                )}
                {view === 'DM_QUY_TAI_KHOAN' && (
                  <>
                    <th className="px-3 py-2 border-r border-gray-200 w-32 text-center">Phân Loại</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-40">Số Dư Đầu Kỳ</th>
                    <th className="px-3 py-2 border-r border-gray-200 text-right w-40 text-emerald-800">Số Dư Hiện Tại</th>
                  </>
                )}
                {view === 'DM_HANG_MUC_THU_CHI' && (
                  <th className="px-3 py-2 border-r border-gray-200 w-32 text-center">Phân Loại Quỹ</th>
                )}
                <th className="px-3 py-2 w-20 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400 font-mono italic">
                    Không tìm thấy dữ liệu phù hợp trong danh mục này.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 text-gray-700 transition-colors">
                    <td className="px-3 py-2 border-r border-gray-200 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className={`px-3 py-2 border-r border-gray-200 font-mono font-medium ${theme.text}`}>{item.code}</td>
                    <td className="px-3 py-2 border-r border-gray-200 font-medium">{item.name}</td>
                    {view === 'DM_HANG_HOA' && (
                      <>
                        <td className="px-3 py-2 border-r border-gray-200 text-center">{item.unit}</td>
                        <td className="px-3 py-2 border-r border-gray-200 text-right font-mono text-blue-600">{formatCurrency(item.purchasePrice)}</td>
                        <td className="px-3 py-2 border-r border-gray-200 text-right font-mono text-green-700">{formatCurrency(item.salePrice)}</td>
                        <td className="px-3 py-2 border-r border-gray-200">
                          <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-medium">{item.category || 'Chưa phân loại'}</span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-right font-mono text-gray-500">{item.initialStock}</td>
                        <td className="px-3 py-2 border-r border-gray-200 text-right font-mono font-bold text-emerald-800">{getActualStock(item)}</td>
                      </>
                    )}
                    {view === 'DM_KHO_CHI_NHANH' && (
                      <td className="px-3 py-2 border-r border-gray-200 text-gray-500">{item.address}</td>
                    )}
                    {view === 'DM_KHACH_HANG' && (
                      <>
                        <td className="px-3 py-2 border-r border-gray-200 font-mono">{item.phone}</td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-500">{item.address}</td>
                        <td className={`px-3 py-2 border-r border-gray-200 text-right font-mono text-gray-500`}>
                          {formatCurrency(item.initialDebt)}
                        </td>
                        <td className={`px-3 py-2 border-r border-gray-200 text-right font-mono font-bold ${getActualCustomerDebt(item) >= 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {formatCurrency(getActualCustomerDebt(item))}
                        </td>
                      </>
                    )}
                    {view === 'DM_NHA_CUNG_CAP' && (
                      <>
                        <td className="px-3 py-2 border-r border-gray-200 font-mono">{item.phone}</td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-500">{item.address}</td>
                        <td className="px-3 py-2 border-r border-gray-200 text-right font-mono text-gray-500">
                          {formatCurrency(item.initialDebt)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-right font-mono font-bold text-red-600">
                          {formatCurrency(getActualSupplierDebt(item))}
                        </td>
                      </>
                    )}
                    {view === 'DM_NHAN_VIEN' && (
                      <>
                        <td className="px-3 py-2 border-r border-gray-200">{item.position}</td>
                        <td className="px-3 py-2 border-r border-gray-200">{item.department}</td>
                      </>
                    )}
                    {view === 'DM_QUY_TAI_KHOAN' && (
                      <>
                        <td className="px-3 py-2 border-r border-gray-200 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${item.type === 'TIEN_MAT' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {item.type === 'TIEN_MAT' ? 'Tiền Mặt' : 'Ngân Hàng'}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-right font-mono text-gray-500">{formatCurrency(item.initialBalance)}</td>
                        <td className="px-3 py-2 border-r border-gray-200 text-right font-mono text-emerald-800 font-bold">{formatCurrency(getActualFundBalance(item))}</td>
                      </>
                    )}
                    {view === 'DM_HANG_MUC_THU_CHI' && (
                      <td className="px-3 py-2 border-r border-gray-200 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${item.type === 'THU' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {item.type === 'THU' ? 'Mục Thu (+)' : 'Mục Chi (-)'}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2 text-center flex items-center justify-center space-x-1.5">
                      {!(view === 'DM_NHAN_VIEN' && currentUser?.role !== 'ADMIN') ? (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 hover:bg-gray-100 text-blue-600 rounded transition-colors"
                            title="Sửa bản ghi"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:bg-gray-100 text-red-600 rounded transition-colors"
                            title="Xoá bản ghi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-[10px] italic">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-fade-in">
            <div className={`${theme.primary} px-4 py-3 flex justify-between items-center transition-colors duration-200`}>
              <h3 className="text-xs font-bold font-mono tracking-wider">
                {editingId ? 'SỬA THÔNG TIN BẢN GHI' : 'THÊM MỚI BẢN GHI'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200 text-sm font-bold font-mono"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Code Field (standard) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">MÃ HỆ THỐNG (KHÔNG TRÙNG)</label>
                  <input
                    type="text"
                    required
                    value={formFields.code || ''}
                    onChange={(e) => setFormFields({ ...formFields, code: e.target.value.toUpperCase() })}
                    className={`w-full text-xs p-2 border border-gray-300 rounded font-mono uppercase focus:ring-1 ${focusRing}`}
                  />
                </div>
                {/* Name Field */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">TÊN / TIÊU ĐỀ CHI TIẾT</label>
                  <input
                    type="text"
                    required
                    value={formFields.name || ''}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                  />
                </div>
              </div>

              {/* SPECIFIC VIEW FIELDS */}
              {view === 'DM_HANG_HOA' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">ĐƠV VỊ TÍNH (ĐVT)</label>
                      <input
                        type="text"
                        required
                        value={formFields.unit || ''}
                        onChange={(e) => setFormFields({ ...formFields, unit: e.target.value })}
                        className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">ĐƠN GIÁ MUA (VND)</label>
                      <input
                        type="number"
                        required
                        value={formFields.purchasePrice ?? 0}
                        onChange={(e) => setFormFields({ ...formFields, purchasePrice: Number(e.target.value) })}
                        className={`w-full text-xs p-2 border border-gray-300 rounded font-mono focus:ring-1 ${focusRing}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">ĐƠN GIÁ BÁN (VND)</label>
                      <input
                        type="number"
                        required
                        value={formFields.salePrice ?? 0}
                        onChange={(e) => setFormFields({ ...formFields, salePrice: Number(e.target.value) })}
                        className={`w-full text-xs p-2 border border-gray-300 rounded font-mono focus:ring-1 ${focusRing}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">NHÓM HÀNG HÓA</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Đồ uống"
                        value={formFields.category || ''}
                        onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                        className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">KHO MẶC ĐỊNH</label>
                      <select
                        value={formFields.defaultWarehouseId || ''}
                        onChange={(e) => setFormFields({ ...formFields, defaultWarehouseId: e.target.value })}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">SỐ TỒN ĐẦU KỲ</label>
                      <input
                        type="number"
                        required
                        disabled={!!editingId}
                        value={formFields.initialStock ?? 0}
                        onChange={(e) => setFormFields({ ...formFields, initialStock: Number(e.target.value) })}
                        className={`w-full text-xs p-2 border border-gray-300 rounded font-mono focus:ring-1 ${focusRing} disabled:bg-gray-100 disabled:text-gray-400`}
                        title={editingId ? "Không thể chỉnh sửa số tồn đầu kỳ sau khi đã tạo" : ""}
                      />
                    </div>
                  </div>
                </>
              )}

              {view === 'DM_KHO_CHI_NHANH' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">ĐỊA CHI CHI NHÁNH / KHO</label>
                  <input
                    type="text"
                    required
                    value={formFields.address || ''}
                    onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                    className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                  />
                </div>
              )}

              {(view === 'DM_KHACH_HANG' || view === 'DM_NHA_CUNG_CAP') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">SỐ ĐIỆN THOẠI KHẨN</label>
                      <input
                        type="text"
                        value={formFields.phone || ''}
                        onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                        className={`w-full text-xs p-2 border border-gray-300 rounded font-mono focus:ring-1 ${focusRing}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        {view === 'DM_KHACH_HANG' ? 'DƯ NỢ ĐẦU KỲ (NỢ KHÁCH NỢ TA)' : 'CÔNG NỢ NCC ĐẦU KỲ'}
                      </label>
                      <input
                        type="number"
                        required
                        value={formFields.initialDebt ?? 0}
                        onChange={(e) => setFormFields({ ...formFields, initialDebt: Number(e.target.value) })}
                        className={`w-full text-xs p-2 border border-gray-300 rounded font-mono focus:ring-1 ${focusRing}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">ĐỊA CHỈ CHI TIẾT</label>
                    <input
                      type="text"
                      value={formFields.address || ''}
                      onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                      className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                    />
                  </div>
                </>
              )}

              {view === 'DM_NHAN_VIEN' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">CHỨC VỤ ĐẢM NHIỆM</label>
                    <input
                      type="text"
                      required
                      value={formFields.position || ''}
                      onChange={(e) => setFormFields({ ...formFields, position: e.target.value })}
                      className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">PHÒNG BAN / BỘ PHẬN</label>
                    <input
                      type="text"
                      required
                      value={formFields.department || ''}
                      onChange={(e) => setFormFields({ ...formFields, department: e.target.value })}
                      className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                    />
                  </div>
                </div>
              )}

              {view === 'DM_QUY_TAI_KHOAN' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">PHÂN LOẠI QUỸ TIỀN</label>
                    <select
                      value={formFields.type || 'TIEN_MAT'}
                      onChange={(e) => setFormFields({ ...formFields, type: e.target.value })}
                      className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                    >
                      <option value="TIEN_MAT">Tiền Mặt (Két sắt)</option>
                      <option value="NGAN_HANG">Tài Khoản Ngân Hàng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">SỐ DƯ BAN ĐẦU (VND)</label>
                    <input
                      type="number"
                      required
                      value={formFields.initialBalance ?? 0}
                      onChange={(e) => setFormFields({ ...formFields, initialBalance: Number(e.target.value) })}
                      className={`w-full text-xs p-2 border border-gray-300 rounded font-mono focus:ring-1 ${focusRing}`}
                    />
                  </div>
                </div>
              )}

              {view === 'DM_HANG_MUC_THU_CHI' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">PHÂN LOẠI HẠNG MỤC</label>
                  <select
                     value={formFields.type || 'THU'}
                     onChange={(e) => setFormFields({ ...formFields, type: e.target.value })}
                     className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                  >
                    <option value="THU">Hạng Mục THU (Tăng quỹ tiền)</option>
                    <option value="CHI">Hạng Mục CHI (Giảm quỹ tiền)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-xs transition"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className={`px-3 py-1.5 ${theme.accent} rounded font-semibold text-xs transition`}
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
