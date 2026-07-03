/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Transaction,
  TransactionType,
  TransactionDetail,
  Product,
  Warehouse,
  Customer,
  Supplier,
  Employee,
  FundAccount,
  TransactionCategory
} from '../types';
import {
  Plus,
  Trash2,
  Calendar,
  User,
  Building,
  CreditCard,
  Tag,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Download,
  Search,
  Eye,
  Printer,
  X,
  Users
} from 'lucide-react';

interface TransactionManagerProps {
  view: string; // The transaction type/view (e.g., 'NHAP_MUA', 'XUAT_BAN', etc.)
  transactions: Transaction[];
  products: Product[];
  warehouses: Warehouse[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  funds: FundAccount[];
  categories: TransactionCategory[];
  onAddTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  decimalPlaces: number;
  excelTheme?: string;
  workingPeriod: string;
}

export interface NewTransactionDetail {
  productId: string;
  quantity: number;
  price: number;
}

export default function TransactionManager({
  view,
  transactions,
  products,
  warehouses,
  customers,
  suppliers,
  employees,
  funds,
  categories,
  onAddTransaction,
  onDeleteTransaction,
  decimalPlaces,
  excelTheme = 'GREEN',
  workingPeriod
}: TransactionManagerProps) {
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

  // Mode: 'LIST' or 'CREATE'
  const [mode, setMode] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id || '');
  const [partnerId, setPartnerId] = useState('');
  const [partnerType, setPartnerType] = useState<'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'OTHER'>('CUSTOMER');
  const [fundAccountId, setFundAccountId] = useState(funds[0]?.id || '');
  const [toFundAccountId, setToFundAccountId] = useState(funds[1]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [creator, setCreator] = useState('Trần Thị Thu Thảo');
  const [totalAmountState, setTotalAmountState] = useState(0); // for money-only txs

  // Product grid for inventory txs
  const [details, setDetails] = useState<NewTransactionDetail[]>([
    { productId: products[0]?.id || '', quantity: 1, price: products[0]?.purchasePrice || 0 }
  ]);

  // Popup & Multi-product selection states
  const [showProductSelectorModal, setShowProductSelectorModal] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [tempProductQuantities, setTempProductQuantities] = useState<Record<string, number>>({});

  // Detailed accounting printout popup states
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [modalTx, setModalTx] = useState<Transaction | null>(null);

  // Search state for partners list in the creation popup
  const [partnerSearch, setPartnerSearch] = useState('');

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

  // Vietnamese Numbers-to-Words converter for professional accounting
  const convertNumberToWords = (number: number): string => {
    if (number === 0) return 'Không đồng';
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const places = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
    
    const readGroup3 = (group: number, isFirst: boolean): string => {
      let result = '';
      const hundreds = Math.floor(group / 100);
      const tens = Math.floor((group % 100) / 10);
      const ones = group % 10;
      
      if (hundreds > 0 || !isFirst) {
        result += units[hundreds] + ' trăm ';
      }
      
      if (tens > 1) {
        result += units[tens] + ' mươi ';
        if (ones === 1) result += 'mốt ';
        else if (ones === 5) result += 'lăm ';
        else if (ones > 0) result += units[ones] + ' ';
      } else if (tens === 1) {
        result += 'mười ';
        if (ones === 5) result += 'lăm ';
        else if (ones > 0) result += units[ones] + ' ';
      } else {
        if (ones > 0) {
          if (hundreds > 0 || !isFirst) result += 'lẻ ';
          result += units[ones] + ' ';
        }
      }
      return result;
    };

    let numStr = Math.floor(number).toString();
    let groups: number[] = [];
    while (numStr.length > 0) {
      let len = Math.min(3, numStr.length);
      groups.push(parseInt(numStr.substring(numStr.length - len), 10));
      numStr = numStr.substring(0, numStr.length - len);
    }
    
    let words = '';
    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i];
      if (g > 0) {
        const isFirst = i === groups.length - 1;
        words += readGroup3(g, isFirst) + places[i] + ' ';
      }
    }
    
    words = words.trim();
    if (!words) return '';
    return words.charAt(0).toUpperCase() + words.slice(1) + ' đồng chẵn';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(val);
  };

  // Map transaction type code to Vietnamese title
  const getVoucherTitle = (type: TransactionType) => {
    switch (type) {
      case 'NHAP_MUA': return 'Phiếu Nhập Mua Hàng';
      case 'XUAT_BAN': return 'Hóa Đơn Xuất Bán Hàng';
      case 'TRA_TIEN_NCC': return 'Phiếu Chi Trả Tiền NCC';
      case 'THU_TIEN_KH': return 'Phiếu Thu Tiền Khách Hàng';
      case 'TRA_HANG_NCC': return 'Phiếu Xuất Trả Hàng NCC';
      case 'KH_TRA_HANG': return 'Phiếu Nhập Khách Hàng Trả Hàng';
      case 'CHUYEN_KHO': return 'Phiếu Điều Chuyển Kho';
      case 'CHUYEN_QUY': return 'Ủy Nhiệm Chi Chuyển Quỹ';
      case 'THU_KHAC': return 'Phiếu Thu Tiền Khác';
      case 'CHI_KHAC': return 'Phiếu Chi Tiền Khác';
      case 'TAM_UNG': return 'Phiếu Chi Tạm Ứng Nhân Viên';
      case 'QUYET_TOAN_TAM_UNG': return 'Phiếu Quyết Toán Tạm Ứng';
      case 'HOAN_UNG': return 'Phiếu Thu Hoàn Ứng';
      default: return 'Chứng Từ Nghiệp Vụ';
    }
  };

  // Convert current view name to TransactionType
  const getActiveTxType = (): TransactionType => {
    if (view === 'THU_CHI_KHAC') {
      const selectedCat = categories.find(c => c.id === categoryId);
      return selectedCat?.type === 'THU' ? 'THU_KHAC' : 'CHI_KHAC';
    }
    if (view === 'TAM_UNG_HOAN_UNG') {
      return 'TAM_UNG'; // Default, we let user choose inside
    }
    return view as TransactionType;
  };

  // Filter transactions of the active view category
  const getFilteredTransactions = () => {
    const activeType = getActiveTxType();
    
    let baseFiltered = [];
    if (view === 'THU_CHI_KHAC') {
      baseFiltered = transactions.filter(t => t.type === 'THU_KHAC' || t.type === 'CHI_KHAC');
    } else if (view === 'TAM_UNG_HOAN_UNG') {
      baseFiltered = transactions.filter(t => t.type === 'TAM_UNG' || t.type === 'QUYET_TOAN_TAM_UNG' || t.type === 'HOAN_UNG');
    } else {
      baseFiltered = transactions.filter(t => t.type === activeType);
    }

    return baseFiltered;
  };

  const filteredTxs = getFilteredTransactions();

  // Helper to generate next receipt code based on type
  const generateVoucherCode = (type: TransactionType) => {
    let prefix = 'CT';
    switch (type) {
      case 'NHAP_MUA': prefix = 'NK'; break;
      case 'XUAT_BAN': prefix = 'XK'; break;
      case 'TRA_TIEN_NCC': prefix = 'PC'; break;
      case 'THU_TIEN_KH': prefix = 'PT'; break;
      case 'TRA_HANG_NCC': prefix = 'TH'; break;
      case 'KH_TRA_HANG': prefix = 'NT'; break;
      case 'CHUYEN_KHO': prefix = 'CK'; break;
      case 'CHUYEN_QUY': prefix = 'CQ'; break;
      case 'THU_KHAC': prefix = 'PTK'; break;
      case 'CHI_KHAC': prefix = 'PCK'; break;
      case 'TAM_UNG': prefix = 'TU'; break;
      case 'QUYET_TOAN_TAM_UNG': prefix = 'QT'; break;
      case 'HOAN_UNG': prefix = 'HU'; break;
    }
    const matchingTxs = transactions.filter(t => t.code.startsWith(prefix));
    const nextNum = matchingTxs.length + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  };

  // Add line to product table
  const addDetailLine = () => {
    setDetails([...details, { productId: products[0]?.id || '', quantity: 1, price: products[0]?.salePrice || 0 }]);
  };

  // Remove line from product table
  const removeDetailLine = (idx: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== idx));
    }
  };

  const handleDetailChange = (idx: number, field: keyof NewTransactionDetail, value: any) => {
    const updated = [...details];
    updated[idx] = { ...updated[idx], [field]: value };

    // Auto update price if product is changed
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        const isSales = view === 'XUAT_BAN' || view === 'KH_TRA_HANG';
        updated[idx].price = isSales ? prod.salePrice : prod.purchasePrice;
      }
    }
    setDetails(updated);
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
      const isSales = view === 'XUAT_BAN' || view === 'KH_TRA_HANG';
      const price = prod ? (isSales ? prod.salePrice : prod.purchasePrice) : 0;
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

  // Submit new voucher
  const handleSubmitVoucher = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine target type
    let finalType: TransactionType = getActiveTxType();
    let finalPartnerType = partnerType;

    if (view === 'THU_CHI_KHAC') {
      const selectedCat = categories.find(c => c.id === categoryId);
      finalType = selectedCat?.type === 'THU' ? 'THU_KHAC' : 'CHI_KHAC';
      finalPartnerType = 'OTHER';
    } else if (view === 'TAM_UNG_HOAN_UNG') {
      finalType = (document.getElementById('tam_ung_sub_type') as HTMLSelectElement)?.value as TransactionType || 'TAM_UNG';
      finalPartnerType = 'EMPLOYEE';
    } else if (view === 'NHAP_MUA' || view === 'TRA_TIEN_NCC' || view === 'TRA_HANG_NCC') {
      finalPartnerType = 'SUPPLIER';
    } else if (view === 'XUAT_BAN' || view === 'THU_TIEN_KH' || view === 'KH_TRA_HANG') {
      finalPartnerType = 'CUSTOMER';
    }

    const isInventoryTx = ['NHAP_MUA', 'XUAT_BAN', 'TRA_HANG_NCC', 'KH_TRA_HANG', 'CHUYEN_KHO'].includes(finalType);

    // Calculate sum of lines or money field
    let totalAmount = 0;
    let savedDetails: TransactionDetail[] = [];

    if (isInventoryTx) {
      savedDetails = details.map(d => ({
        productId: d.productId,
        quantity: d.quantity,
        price: d.price,
        amount: d.quantity * d.price
      }));
      totalAmount = savedDetails.reduce((sum, d) => sum + d.amount, 0);
    } else {
      totalAmount = totalAmountState;
    }

    const code = generateVoucherCode(finalType);

    const newTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      code,
      type: finalType,
      date,
      warehouseId: isInventoryTx ? warehouseId : undefined,
      toWarehouseId: finalType === 'CHUYEN_KHO' ? toWarehouseId : undefined,
      partnerId: finalType !== 'CHUYEN_QUY' && finalType !== 'CHUYEN_KHO' && !finalType.endsWith('KHAC') ? partnerId : undefined,
      partnerType: finalPartnerType,
      fundAccountId: !isInventoryTx || finalType === 'TRA_HANG_NCC' || finalType === 'KH_TRA_HANG' ? fundAccountId : undefined,
      toFundAccountId: finalType === 'CHUYEN_QUY' ? toFundAccountId : undefined,
      categoryId: finalType.endsWith('KHAC') ? categoryId : undefined,
      details: savedDetails,
      totalAmount,
      note,
      creator
    };

    onAddTransaction(newTx);
    setMode('LIST');
    setSelectedTx(newTx);

    // Reset fields
    setNote('');
    setTotalAmountState(0);
    setDetails([{ productId: products[0]?.id || '', quantity: 1, price: products[0]?.purchasePrice || 0 }]);
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

  const getPartnerName = (tx: Transaction) => {
    if (tx.partnerType === 'CUSTOMER') {
      return customers.find(c => c.id === tx.partnerId)?.name || 'Khách hàng ẩn danh';
    }
    if (tx.partnerType === 'SUPPLIER') {
      return suppliers.find(s => s.id === tx.partnerId)?.name || 'Nhà cung cấp ẩn danh';
    }
    if (tx.partnerType === 'EMPLOYEE') {
      return employees.find(e => e.id === tx.partnerId)?.name || 'Nhân viên';
    }
    return tx.note || 'Thu chi khác';
  };

  const getWarehouseName = (id?: string) => {
    return warehouses.find(w => w.id === id)?.name || 'Kho chính';
  };

  const getFundName = (id?: string) => {
    return funds.find(f => f.id === id)?.name || 'Quỹ mặt';
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
    <div id="transaction-manager" className="p-4 bg-gray-50 flex-1 overflow-auto flex flex-col lg:flex-row gap-4">
      
      {/* LEFT COLUMN: LIST OF VOUCHERS */}
      <div className="flex-1 bg-white rounded border border-gray-200 shadow-sm flex flex-col min-h-[400px]">
        {/* Module Header */}
        <div className={`${headerBg} px-4 py-3 border-b border-gray-200 flex justify-between items-center select-none`}>
          <div>
            <h3 className="text-xs font-bold text-gray-800 tracking-wider uppercase font-mono">
              SỔ CHỨNG TỪ PHÁT SINH
            </h3>
            <span className="text-[10px] text-gray-500">Phân loại đang chọn: <strong className="text-gray-800 font-sans">{getVoucherTitle(getActiveTxType())}</strong></span>
          </div>
          <button
            onClick={() => {
              setMode('CREATE');
              setPartnerSearch('');
            }}
            className={`${theme.accent} text-xs font-semibold px-3 py-1.5 rounded shadow-sm flex items-center space-x-1 transition`}
          >
            <Plus className="h-4 w-4" />
            <span>Lập Phiếu Mới</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredTxs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-mono italic">
              <AlertCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              Không có chứng từ nào được ghi nhận cho nghiệp vụ này trong kỳ.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f9f9fb] border-b border-gray-200 text-gray-600 font-semibold sticky top-0">
                  <th className="px-3 py-2 border-r border-gray-200 text-center w-12">STT</th>
                  <th className="px-3 py-2 border-r border-gray-200 w-24">Số Chứng Từ</th>
                  <th className="px-3 py-2 border-r border-gray-200 w-24 text-center">Ngày lập</th>
                  <th className="px-3 py-2 border-r border-gray-200">Đối Tượng / Nội Dung</th>
                  <th className="px-3 py-2 border-r border-gray-200 text-right w-32">Giá Trị (VND)</th>
                  <th className="px-3 py-2 text-center w-14 border-r border-gray-200">Xem</th>
                  <th className="px-3 py-2 text-center w-14">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTxs.map((tx, idx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`cursor-pointer ${rowHoverBg} transition-colors ${
                      selectedTx?.id === tx.id ? rowActiveBg : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 border-r border-gray-200 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className={`px-3 py-2.5 border-r border-gray-200 font-mono ${theme.text} font-semibold`}>{tx.code}</td>
                    <td className="px-3 py-2.5 border-r border-gray-200 text-center font-mono text-gray-500">{tx.date}</td>
                    <td className="px-3 py-2.5 border-r border-gray-200">
                      <span className="block text-gray-800 font-medium">{getPartnerName(tx)}</span>
                      <span className="text-[10px] text-gray-400 block line-clamp-1">{tx.note}</span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-gray-200 text-right font-mono text-blue-600 font-bold">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-center border-r border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalTx(tx);
                          setShowVoucherModal(true);
                        }}
                        className={`p-1 hover:bg-slate-100 ${theme.text} rounded transition`}
                        title="Xem chi tiết phiếu hạch toán (Popup)"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Bạn có thực sự muốn xóa chứng từ này khỏi sổ sách? Thao tác này sẽ cập nhật lại kho và tiền mặt tương ứng.')) {
                            onDeleteTransaction(tx.id);
                            if (selectedTx?.id === tx.id) setSelectedTx(null);
                          }
                        }}
                        className="p-1 hover:bg-red-50 text-red-500 rounded transition"
                        title="Xóa chứng từ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILED VIEW / BILLING CARD */}
      <div className="w-full lg:w-[380px] bg-white rounded border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
        <div>
          <div className="border-b border-gray-100 pb-2 mb-3">
            <h3 className="text-xs font-bold text-gray-700 tracking-wider font-mono flex items-center space-x-1.5">
              <FileSpreadsheet className={`h-4 w-4 ${theme.text}`} />
              <span>CHI TIẾT CHỨNG TỪ LẬP SỔ</span>
            </h3>
            <span className="text-[10px] text-gray-400">Xem trước & In hóa đơn hạch toán chứng từ</span>
          </div>

          {selectedTx ? (
            <div className="space-y-4 text-xs">
              <div className="bg-[#f3f2f1] p-3 rounded border border-gray-200 font-mono text-center relative overflow-hidden">
                <div className={`absolute right-[-15px] top-[-10px] rotate-12 ${excelTheme === 'GREEN' ? 'text-[#107c41]/10' : excelTheme === 'BLUE' ? 'text-blue-800/10' : excelTheme === 'PURPLE' ? 'text-purple-800/10' : 'text-slate-800/10'} font-bold text-4xl`}>
                  {selectedTx.code.substring(0, 2)}
                </div>
                <div className="text-[11px] text-gray-400 font-sans font-semibold uppercase tracking-wider">LIÊN LƯU HỆ THỐNG</div>
                <div className={`text-base font-bold ${theme.text} mt-0.5`}>{selectedTx.code}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Ngày hạch toán: {selectedTx.date}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                  <span className="text-gray-400">Loại nghiệp vụ:</span>
                  <span className="font-semibold text-gray-800">{getVoucherTitle(selectedTx.type)}</span>
                </div>

                {selectedTx.partnerId && (
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                    <span className="text-gray-400">Đối tác:</span>
                    <span className="font-semibold text-gray-800">{getPartnerName(selectedTx)}</span>
                  </div>
                )}

                {selectedTx.warehouseId && (
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                    <span className="text-gray-400">Giao dịch tại:</span>
                    <span className="font-semibold text-gray-800">{getWarehouseName(selectedTx.warehouseId)}</span>
                  </div>
                )}

                {selectedTx.toWarehouseId && (
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                    <span className="text-gray-400">Nhập sang kho:</span>
                    <span className="font-semibold text-blue-700">{getWarehouseName(selectedTx.toWarehouseId)}</span>
                  </div>
                )}

                {selectedTx.fundAccountId && (
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                    <span className="text-gray-400">Hạch toán quỹ:</span>
                    <span className="font-semibold text-gray-800">{getFundName(selectedTx.fundAccountId)}</span>
                  </div>
                )}

                {selectedTx.toFundAccountId && (
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                    <span className="text-gray-400">Quỹ nhận về:</span>
                    <span className="font-semibold text-green-700">{getFundName(selectedTx.toFundAccountId)}</span>
                  </div>
                )}

                {selectedTx.creator && (
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                    <span className="text-gray-400">Kế toán lập:</span>
                    <span className="font-medium text-gray-700">{selectedTx.creator}</span>
                  </div>
                )}
              </div>

              {/* Items detail list inside voucher info */}
              {selectedTx.details && selectedTx.details.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">DANH SÁCH MẶT HÀNG:</span>
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-[140px] overflow-auto space-y-1">
                    {selectedTx.details.map((d, i) => {
                      const prod = products.find(p => p.id === d.productId);
                      return (
                        <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-600 truncate max-w-[160px]" title={prod?.name}>
                            {prod?.name || 'Mặt hàng ẩn'}
                          </span>
                          <span className="font-mono text-gray-700">
                            {d.quantity} x {formatCurrency(d.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Note section */}
              {selectedTx.note && (
                <div className="bg-amber-50/50 p-2 border border-amber-100 rounded text-[11px] text-amber-900 leading-normal">
                  <span className="font-bold">Diễn giải:</span> {selectedTx.note}
                </div>
              )}

              {/* Total money banner */}
              <div className={`${excelTheme === 'GREEN' ? 'bg-green-50 border-green-200' : excelTheme === 'BLUE' ? 'bg-blue-50 border-blue-200' : excelTheme === 'PURPLE' ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'} p-3 rounded border text-center select-none`}>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">TỔNG TIỀN QUYẾT TOÁN</span>
                <span className={`text-base font-black ${theme.text} font-mono`}>
                  {formatCurrency(selectedTx.totalAmount)}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 italic">
              Vui lòng chọn một chứng từ bên trái để hiển thị thông tin hóa đơn hạch toán chi tiết.
            </div>
          )}
        </div>

        {selectedTx && (
          <button
            onClick={() => {
              setModalTx(selectedTx);
              setShowVoucherModal(true);
            }}
            className={`w-full ${theme.accent} text-white font-bold py-2.5 rounded text-xs transition flex items-center justify-center space-x-1.5 mt-4 select-none shadow`}
          >
            <Eye className="h-4 w-4" />
            <span>Xem / In Phiếu Popup</span>
          </button>
        )}
      </div>

      {/* ==================== POPUP MODAL: CHỌN NHANH NHIỀU SẢN PHẨM ==================== */}
      {showProductSelectorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className={`${theme.primary} px-4 py-3 rounded-t-lg flex justify-between items-center`}>
              <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center space-x-1.5">
                <Search className="h-4 w-4" />
                <span>CHỌN NHANH NHIỀU SẢN PHẨM</span>
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
                        const isSales = view === 'XUAT_BAN' || view === 'KH_TRA_HANG';
                        const currentPrice = isSales ? p.salePrice : p.purchasePrice;
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
                              {formatThousand(currentPrice)}
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
                  Thêm vào chứng từ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== POPUP MODAL: IN PHIẾU CHI TIẾT (PRINT LETTERHEAD) ==================== */}
      {showVoucherModal && modalTx && (() => {
        const getEnterpriseInfo = () => {
          try {
            const saved = localStorage.getItem('excel_erp_settings');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.enterprise) return parsed.enterprise;
            }
          } catch (e) {}
          return {
            name: 'CÔNG TY TNHH THƯƠNG MẠI & DỊCH VỤ EXCEL VIỆT NAM',
            address: 'Số 123 Đường Láng, Quận Đống Đa, Hà Nội',
            taxCode: '0101234567',
            phone: '024.3212.8888',
            email: 'info@excelerp.com.vn',
            director: 'Nguyễn Văn Hùng',
            chiefAccountant: 'Trần Thị Thu Thảo'
          };
        };

        const ent = getEnterpriseInfo();
        const txType = modalTx.type;
        const isInv = ['NHAP_MUA', 'XUAT_BAN', 'TRA_HANG_NCC', 'KH_TRA_HANG', 'CHUYEN_KHO'].includes(txType);
        
        let title = 'CHỨNG TỪ KẾ TOÁN';
        let formCode = 'Mẫu số: 01-VT';
        switch (txType) {
          case 'NHAP_MUA': title = 'PHIẾU NHẬP KHO'; formCode = 'Mẫu số: 01-VT'; break;
          case 'XUAT_BAN': title = 'HÓA ĐƠN BÁN HÀNG'; formCode = 'Mẫu số: 02-VT'; break;
          case 'TRA_TIEN_NCC': title = 'PHIẾU CHI TIỀN MẶT'; formCode = 'Mẫu số: 02-TT'; break;
          case 'THU_TIEN_KH': title = 'PHIẾU THU TIỀN MẶT'; formCode = 'Mẫu số: 01-TT'; break;
          case 'TRA_HANG_NCC': title = 'PHIẾU XUẤT TRẢ HÀNG NCC'; formCode = 'Mẫu số: 03-VT'; break;
          case 'KH_TRA_HANG': title = 'PHIẾU NHẬP KHÁCH HÀNG TRẢ'; formCode = 'Mẫu số: 04-VT'; break;
          case 'CHUYEN_KHO': title = 'PHIẾU ĐIỀU CHUYỂN KHO'; formCode = 'Mẫu số: 05-VT'; break;
          case 'CHUYEN_QUY': title = 'ỦY NHIỆM CHI (CHUYỂN QUỸ)'; formCode = 'Mẫu số: 03-TT'; break;
          case 'THU_KHAC': title = 'PHIẾU THU KHÁC'; formCode = 'Mẫu số: 01-TTK'; break;
          case 'CHI_KHAC': title = 'PHIẾU CHI KHÁC'; formCode = 'Mẫu số: 02-TTK'; break;
          case 'TAM_UNG': title = 'PHIẾU CHI TẠM ỨNG'; formCode = 'Mẫu số: 06-TT'; break;
          case 'QUYET_TOAN_TAM_UNG': title = 'BẢNG QUYẾT TOÁN TẠM ỨNG'; formCode = 'Mẫu số: 07-TT'; break;
          case 'HOAN_UNG': title = 'PHIẾU THU HOÀN ỨNG'; formCode = 'Mẫu số: 08-TT'; break;
        }

        const dateParts = modalTx.date.split('-');
        const formattedDateText = dateParts.length === 3 
          ? `Ngày ${dateParts[2]} tháng ${dateParts[1]} năm ${dateParts[0]}`
          : `Ngày ... tháng ... năm ...`;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 overflow-auto">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-4xl w-full flex flex-col my-8">
              {/* Toolbar Controls */}
              <div className={`${theme.primary} px-4 py-3 rounded-t-lg flex justify-between items-center select-none no-print`}>
                <div className="flex items-center space-x-2 text-white">
                  <Printer className="h-4 w-4" />
                  <span className="text-xs font-bold tracking-wider font-mono">XEM & IN CHỨNG TỪ POPUP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const printContent = document.getElementById('printable-voucher-card')?.innerHTML;
                      if (printContent) {
                        const win = window.open('', '_blank');
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>In Chứng Từ - ${modalTx.code}</title>
                                <link href="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" rel="stylesheet">
                                <style>
                                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                                  body {
                                    font-family: 'Inter', sans-serif;
                                    padding: 20px;
                                    color: #000;
                                    background: #fff;
                                  }
                                  @media print {
                                    .no-print { display: none !important; }
                                  }
                                </style>
                              </head>
                              <body onload="window.print(); window.close();">
                                <div class="max-w-4xl mx-auto border border-gray-400 p-8 rounded bg-white">
                                  ${printContent}
                                </div>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }
                    }}
                    className="bg-white text-gray-800 hover:bg-gray-100 text-[11px] font-bold px-3 py-1.5 rounded flex items-center space-x-1 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>In Phiếu</span>
                  </button>
                  <button
                    onClick={() => setShowVoucherModal(false)}
                    className="text-white hover:text-gray-200 font-bold p-1 rounded"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Card Area */}
              <div className="p-8 overflow-auto max-h-[75vh]" id="printable-voucher-card">
                {/* Standard Corporate Letterhead */}
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                  <div className="space-y-0.5 text-left">
                    <div className="text-[12px] font-bold text-gray-800 tracking-wide uppercase">{ent.name}</div>
                    <div className="text-[10px] text-gray-500">Địa chỉ: {ent.address}</div>
                    <div className="text-[10px] text-gray-500">Mã số thuế: {ent.taxCode} | ĐT: {ent.phone}</div>
                    <div className="text-[10px] text-gray-500">Email: {ent.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-700 font-mono">{formCode}</div>
                    <div className="text-[9px] text-gray-400 italic">(Ban hành theo TT số 200/2014/TT-BTC)</div>
                    <div className="mt-2 text-[11px] text-gray-700 font-semibold font-mono">Số: {modalTx.code}</div>
                  </div>
                </div>

                {/* Main Voucher Title */}
                <div className="text-center space-y-1 my-6">
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-wider uppercase font-sans">
                    {title}
                  </h2>
                  <div className="text-xs text-gray-500 italic">
                    {formattedDateText}
                  </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left text-gray-700 mb-6 bg-slate-50 p-4 rounded border border-gray-200">
                  <div className="space-y-1.5">
                    <div>
                      <span className="font-semibold text-gray-500">Đối tác giao dịch: </span>
                      <strong className="text-gray-900 font-sans">{getPartnerName(modalTx)}</strong>
                    </div>
                    {modalTx.partnerId && (
                      <div>
                        <span className="font-semibold text-gray-500">Mã số / ID đối tác: </span>
                        <span className="font-mono">{modalTx.partnerId}</span>
                      </div>
                    )}
                    {modalTx.warehouseId && (
                      <div>
                        <span className="font-semibold text-gray-500">Địa điểm / Kho hàng: </span>
                        <span className="font-medium">{getWarehouseName(modalTx.warehouseId)}</span>
                      </div>
                    )}
                    {modalTx.toWarehouseId && (
                      <div>
                        <span className="font-semibold text-gray-500">Kho nhận đích: </span>
                        <span className="font-medium text-emerald-700">{getWarehouseName(modalTx.toWarehouseId)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="font-semibold text-gray-500">Quỹ / Tài khoản thu chi: </span>
                      <span className="font-mono font-semibold">{getFundName(modalTx.fundAccountId)}</span>
                    </div>
                    {modalTx.toFundAccountId && (
                      <div>
                        <span className="font-semibold text-gray-500">Tài khoản đích nhận: </span>
                        <span className="font-mono text-emerald-700 font-semibold">{getFundName(modalTx.toFundAccountId)}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-500">Kế toán viên lập: </span>
                      <span className="font-medium">{modalTx.creator || 'Hệ thống'}</span>
                    </div>
                    {modalTx.note && (
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-500">Lý do phát sinh / Ghi chú: </span>
                        <span className="italic text-gray-800">{modalTx.note}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Details Table (If Inventory/Product Tx) */}
                {isInv && modalTx.details && modalTx.details.length > 0 && (
                  <div className="mb-6">
                    <table className="w-full text-xs text-left border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                          <th className="px-3 py-2 border border-gray-300 text-center w-12">STT</th>
                          <th className="px-3 py-2 border border-gray-300 w-28">Mã sản phẩm</th>
                          <th className="px-3 py-2 border border-gray-300">Tên hàng hóa, dịch vụ</th>
                          <th className="px-3 py-2 border border-gray-300 text-center w-16">ĐVT</th>
                          <th className="px-3 py-2 border border-gray-300 text-center w-20">S.Lượng</th>
                          <th className="px-3 py-2 border border-gray-300 text-right w-28">Đơn giá (VND)</th>
                          <th className="px-3 py-2 border border-gray-300 text-right w-32">Thành tiền (VND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {modalTx.details.map((d, i) => {
                          const prod = products.find(p => p.id === d.productId);
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 border border-gray-300 text-center font-mono">{i + 1}</td>
                              <td className="px-3 py-2 border border-gray-300 font-mono text-gray-600">{prod?.code || 'N/A'}</td>
                              <td className="px-3 py-2 border border-gray-300 font-semibold text-gray-800">{prod?.name || 'Mặt hàng ẩn'}</td>
                              <td className="px-3 py-2 border border-gray-300 text-center text-gray-500">{prod?.unit || 'Cái'}</td>
                              <td className="px-3 py-2 border border-gray-300 text-center font-mono">{d.quantity}</td>
                              <td className="px-3 py-2 border border-gray-300 text-right font-mono">{formatThousand(d.price)}</td>
                              <td className="px-3 py-2 border border-gray-300 text-right font-mono font-semibold">{formatThousand(d.quantity * d.price)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total and Written Out Word block */}
                <div className="space-y-2 border-t pt-4 text-left">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-extrabold text-gray-800 tracking-wider">TỔNG SỐ TIỀN THANH TOÁN (VND):</span>
                    <span className="font-black text-blue-800 font-mono text-lg">{formatCurrency(modalTx.totalAmount)}</span>
                  </div>
                  <div className="text-xs italic text-gray-700">
                    <span className="font-bold">Bằng chữ: </span>
                    <span className="underline decoration-dotted decoration-gray-400 font-medium">
                      {convertNumberToWords(modalTx.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Signature Board (5 columns for corporate audit) */}
                <div className="grid grid-cols-5 gap-2 text-[10px] text-center font-sans mt-12 pt-8 border-t border-dashed border-gray-200">
                  <div className="space-y-1">
                    <div className="font-bold uppercase text-gray-900">Giám Đốc</div>
                    <div className="text-gray-400 italic">(Ký, đóng dấu, họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-bold text-gray-800">{ent.director || 'Nguyễn Văn Hùng'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold uppercase text-gray-900">Kế Toán Trưởng</div>
                    <div className="text-gray-400 italic">(Ký, họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-bold text-gray-800">{ent.chiefAccountant || 'Trần Thị Thu Thảo'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold uppercase text-gray-900">Thủ Quỹ / Thủ Kho</div>
                    <div className="text-gray-400 italic">(Ký, họ tên)</div>
                    <div className="h-16"></div>
                    <div className="h-4"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold uppercase text-gray-900">Người giao/nhận</div>
                    <div className="text-gray-400 italic">(Ký, họ tên)</div>
                    <div className="h-16"></div>
                    <div className="h-4"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold uppercase text-gray-900">Người Lập Phiếu</div>
                    <div className="text-gray-400 italic">(Ký, họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-bold text-gray-800">{modalTx.creator || 'Hệ thống'}</div>
                  </div>
                </div>

                <div className="text-center text-[8px] text-gray-400 italic mt-16 border-t pt-2">
                  Hệ thống phần mềm quản lý Excel ERP - Ngày in: {new Date().toLocaleString('vi-VN')}
                </div>
              </div>

              {/* Modal Footer (Controls) */}
              <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-end space-x-2 border-t border-gray-200 select-none no-print">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs text-gray-700 font-bold transition"
                >
                  Đóng lại
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* POPUP MODAL: CREATE VOUCHER */}
      {mode === 'CREATE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-[#f8f9fa]">
              <div>
                <h3 className="text-sm font-bold text-gray-800 tracking-wider uppercase font-mono flex items-center space-x-2">
                  <PlusCircle className={`h-5 w-5 ${theme.text}`} />
                  <span>LẬP CHỨNG TỪ SỔ SÁCH MỚI</span>
                </h3>
                <span className="text-[11px] text-gray-500">
                  Nghiệp vụ hạch toán: <strong className="text-gray-800 font-sans">{getVoucherTitle(getActiveTxType())}</strong>
                </span>
              </div>
              <button
                onClick={() => setMode('LIST')}
                className="text-gray-400 hover:text-gray-600 transition p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-5 flex flex-col lg:flex-row gap-5">
              
              {/* Main Form Section */}
              <form onSubmit={handleSubmitVoucher} className="flex-1 space-y-4">
                
                {/* General Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">NGÀY GHI SỔ</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`w-full text-xs p-2 pl-8 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                      />
                      <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">NGƯỜI LẬP BIỂU</label>
                    <input
                      type="text"
                      required
                      value={creator}
                      onChange={(e) => setCreator(e.target.value)}
                      className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                    />
                  </div>
                </div>

                {/* Partner and Accounts Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                  
                  {/* Partner selector depending on view type */}
                  {['NHAP_MUA', 'TRA_TIEN_NCC', 'TRA_HANG_NCC'].includes(view) && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 flex justify-between">
                        <span className="flex items-center space-x-1">
                          <Building className="h-3 w-3 text-indigo-600" />
                          <span>NHÀ CUNG CẤP ĐỐI TÁC</span>
                        </span>
                        {partnerId && suppliers.some(s => s.id === partnerId) && (
                          <span className="text-[10px] font-bold text-orange-600">
                            Dư nợ NCC: {formatCurrency(getActualSupplierDebt(suppliers.find(s => s.id === partnerId)!))}
                          </span>
                        )}
                      </label>
                      <select
                        required
                        value={partnerId}
                        onChange={(e) => {
                          setPartnerId(e.target.value);
                          setPartnerType('SUPPLIER');
                        }}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        <option value="">-- Chọn Nhà Cung Cấp --</option>
                        {suppliers.map(s => {
                          const currentDebt = getActualSupplierDebt(s);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.code} - {s.name} (Dư nợ: {formatCurrency(currentDebt)})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {['XUAT_BAN', 'THU_TIEN_KH', 'KH_TRA_HANG'].includes(view) && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 flex justify-between">
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3 text-green-600" />
                          <span>KHÁCH HÀNG ĐỐI TÁC</span>
                        </span>
                        {partnerId && customers.some(c => c.id === partnerId) && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            Dư nợ KH: {formatCurrency(getActualCustomerDebt(customers.find(c => c.id === partnerId)!))}
                          </span>
                        )}
                      </label>
                      <select
                        required
                        value={partnerId}
                        onChange={(e) => {
                          setPartnerId(e.target.value);
                          setPartnerType('CUSTOMER');
                        }}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        <option value="">-- Chọn Khách Hàng --</option>
                        {customers.map(c => {
                          const currentDebt = getActualCustomerDebt(c);
                          return (
                            <option key={c.id} value={c.id}>
                              {c.code} - {c.name} (Dư nợ: {formatCurrency(currentDebt)})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {view === 'TAM_UNG_HOAN_UNG' && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 flex items-center space-x-1">
                        <User className="h-3 w-3 text-fuchsia-600" />
                        <span>NHÂN VIÊN YÊU CẦU</span>
                      </label>
                      <select
                        required
                        value={partnerId}
                        onChange={(e) => {
                          setPartnerId(e.target.value);
                          setPartnerType('EMPLOYEE');
                        }}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        <option value="">-- Chọn Nhân Viên --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.code} - {emp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Warehouse options for Inventory Txs */}
                  {['NHAP_MUA', 'XUAT_BAN', 'TRA_HANG_NCC', 'KH_TRA_HANG', 'CHUYEN_KHO'].includes(view) && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 font-mono">
                        {view === 'CHUYEN_KHO' ? 'KHO NGUỒN (XUẤT ĐI)' : 'KHO GIAO DỊCH'}
                      </label>
                      <select
                        required
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {view === 'CHUYEN_KHO' && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 font-mono">KHO ĐÍCH (NHẬN VỀ)</label>
                      <select
                        required
                        value={toWarehouseId}
                        onChange={(e) => setToWarehouseId(e.target.value)}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        {warehouses.filter(w => w.id !== warehouseId).map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Financial source accounts for payments */}
                  {['TRA_TIEN_NCC', 'THU_TIEN_KH', 'CHUYEN_QUY', 'THU_CHI_KHAC', 'TAM_UNG_HOAN_UNG', 'TRA_HANG_NCC', 'KH_TRA_HANG'].includes(view) && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 flex items-center space-x-1">
                        <CreditCard className="h-3 w-3 text-emerald-600" />
                        <span>
                          {view === 'THU_TIEN_KH' || view === 'TRA_HANG_NCC' || view === 'CHUYEN_QUY' ? 'QUỸ / TÀI KHOẢN NHẬN' : 'QUỸ / TÀI KHOẢN CHI'}
                        </span>
                      </label>
                      <select
                        required
                        value={fundAccountId}
                        onChange={(e) => setFundAccountId(e.target.value)}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        {funds.map(f => (
                          <option key={f.id} value={f.id}>{f.code} - {f.name} ({formatCurrency(f.initialBalance)})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {view === 'CHUYEN_QUY' && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 flex items-center space-x-1">
                        <CreditCard className="h-3 w-3 text-blue-600" />
                        <span>TÀI KHOẢN ĐÍCH (NHẬN TIỀN)</span>
                      </label>
                      <select
                        required
                        value={toFundAccountId}
                        onChange={(e) => setToFundAccountId(e.target.value)}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        {funds.filter(f => f.id !== fundAccountId).map(f => (
                          <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {view === 'THU_CHI_KHAC' && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 flex items-center space-x-1">
                        <Tag className="h-3 w-3 text-purple-600" />
                        <span>HẠNG MỤC THU CHI</span>
                      </label>
                      <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className={`w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 ${focusRing}`}
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>[{c.type}] {c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* PRODUCT GRID - FOR INVENTORY TRANSACTIONS */}
                {['NHAP_MUA', 'XUAT_BAN', 'TRA_HANG_NCC', 'KH_TRA_HANG', 'CHUYEN_KHO'].includes(view) ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center select-none">
                      <span className="text-[10px] font-bold text-gray-500">CHI TIẾT MẶT HÀNG PHÁT SINH</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={openProductSelectorModal}
                          className={`text-xs font-bold flex items-center space-x-1 border ${theme.border} px-2 py-1 rounded bg-white ${theme.text} hover:opacity-85 transition-opacity shadow-sm`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Chọn nhanh nhiều sản phẩm</span>
                        </button>
                        <button
                          type="button"
                          onClick={addDetailLine}
                          className={`text-xs font-bold flex items-center space-x-1 ${theme.text} hover:opacity-85 transition-opacity px-2 py-1`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Thêm dòng</span>
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded overflow-hidden max-h-[180px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold sticky top-0">
                            <th className="px-3 py-1.5 border-r border-gray-200">Mặt hàng</th>
                            <th className="px-3 py-1.5 border-r border-gray-200 w-24 text-center">Số lượng</th>
                            {view !== 'CHUYEN_KHO' && (
                              <>
                                <th className="px-3 py-1.5 border-r border-gray-200 w-32 text-right">Đơn giá (VND)</th>
                                <th className="px-3 py-1.5 border-r border-gray-200 w-32 text-right">Thành tiền</th>
                              </>
                            )}
                            <th className="px-3 py-1.5 w-10 text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {details.map((det, idx) => (
                            <tr key={idx}>
                              <td className="p-1 border-r border-gray-200">
                                <select
                                  value={det.productId}
                                  onChange={(e) => handleDetailChange(idx, 'productId', e.target.value)}
                                  className="w-full text-xs p-1 border border-transparent rounded bg-transparent focus:bg-white focus:border-gray-300"
                                >
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.code} - {p.name} (ĐVT: {p.unit})</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-1 border-r border-gray-200">
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={det.quantity}
                                  onChange={(e) => handleDetailChange(idx, 'quantity', Number(e.target.value))}
                                  className="w-full text-xs p-1 border border-transparent rounded bg-transparent text-center font-mono focus:bg-white focus:border-gray-300"
                                />
                              </td>
                              {view !== 'CHUYEN_KHO' && (
                                <>
                                  <td className="p-1 border-r border-gray-200">
                                    <input
                                      type="text"
                                      required
                                      value={formatThousand(det.price)}
                                      onChange={(e) => handleDetailChange(idx, 'price', parseThousand(e.target.value))}
                                      className="w-full text-xs p-1 border border-transparent rounded bg-transparent text-right font-mono focus:bg-white focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                                    />
                                  </td>
                                  <td className="px-3 py-1 text-right font-mono font-semibold text-gray-700 border-r border-gray-200 select-none">
                                    {formatCurrency(det.quantity * det.price)}
                                  </td>
                                </>
                              )}
                              <td className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeDetailLine(idx)}
                                  className="p-1 hover:bg-gray-100 text-red-500 rounded"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {view !== 'CHUYEN_KHO' && (
                      <div className="text-right text-xs font-bold text-gray-800 pr-3 pt-1 select-none">
                        TỔNG CỘNG THANH TOÁN:{' '}
                        <span className={`${theme.text} font-mono text-sm ml-2`}>
                          {formatCurrency(
                            details.reduce((sum, d) => sum + d.quantity * d.price, 0)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* CASH / VALUE INPUT FOR OTHER TRANSACTIONS */
                  <div className={`${excelTheme === 'GREEN' ? 'bg-emerald-50/50 border-emerald-100' : excelTheme === 'BLUE' ? 'bg-blue-50 border-blue-100' : excelTheme === 'PURPLE' ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'} p-4 rounded border`}>
                    <label className={`block text-[11px] font-bold ${excelTheme === 'GREEN' ? 'text-[#185e37]' : theme.text} mb-1 font-mono`}>
                      GIÁ TRỊ TIỀN THANH TOÁN (VND)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Nhập số tiền..."
                        value={formatThousand(totalAmountState)}
                        onChange={(e) => setTotalAmountState(parseThousand(e.target.value))}
                        className={`w-full text-sm font-bold p-3 pl-12 border border-gray-300 rounded font-mono focus:ring-1 ${focusRing} focus:outline-none`}
                      />
                      <span className={`absolute left-4 top-3 font-bold text-sm ${excelTheme === 'GREEN' ? 'text-[#185e37]' : theme.text}`}>₫</span>
                    </div>
                  </div>
                )}

                {/* NOTE / DESCRIPTION */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">NỘI DUNG / GHI CHÚ CHỨNG TỪ</label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả cụ thể lý do xuất kho, thu tiền hoặc diễn giải nghiệp vụ để phục vụ kế toán..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={`w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 ${focusRing}`}
                  />
                </div>

                {/* Submit Controls */}
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setMode('LIST')}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-xs font-semibold transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 ${theme.accent} rounded text-xs font-bold shadow transition flex items-center space-x-1`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Ghi Sổ Phiếu</span>
                  </button>
                </div>
              </form>

              {/* Sidebar Section: PARTNERS LIST WITH ACTIVE DEBTS (trả nợ, trả hàng) */}
              {['NHAP_MUA', 'TRA_TIEN_NCC', 'TRA_HANG_NCC', 'XUAT_BAN', 'THU_TIEN_KH', 'KH_TRA_HANG'].includes(view) && (
                <div className="w-full lg:w-[320px] bg-slate-50 rounded-lg p-4 border border-gray-200 flex flex-col min-h-[300px]">
                  <div className="border-b border-gray-200 pb-2 mb-3">
                    <h4 className="text-xs font-bold text-gray-700 tracking-wider font-mono flex items-center space-x-1.5">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span>DANH SÁCH & DƯ NỢ ĐỐI TÁC</span>
                    </h4>
                    <span className="text-[10px] text-gray-400">Xem nhanh dư nợ hiện tại để xử lý trả nợ / trả hàng</span>
                  </div>

                  {/* Partner Search Filter */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Tìm đối tác..."
                      value={partnerSearch}
                      onChange={(e) => setPartnerSearch(e.target.value)}
                      className="w-full text-xs p-2 pl-8 border border-gray-300 rounded focus:ring-1 focus:ring-slate-300 bg-white"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    {partnerSearch && (
                      <button
                        type="button"
                        onClick={() => setPartnerSearch('')}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dynamic directory lists */}
                  <div className="flex-1 overflow-y-auto max-h-[320px] space-y-1.5 pr-1">
                    {['NHAP_MUA', 'TRA_TIEN_NCC', 'TRA_HANG_NCC'].includes(view) ? (
                      // Display suppliers
                      suppliers
                        .filter(s =>
                          s.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                          s.code.toLowerCase().includes(partnerSearch.toLowerCase())
                        )
                        .map(s => {
                          const debt = getActualSupplierDebt(s);
                          const isSelected = partnerId === s.id;
                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                setPartnerId(s.id);
                                setPartnerType('SUPPLIER');
                              }}
                              className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300'
                                  : 'bg-white hover:bg-slate-100 border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-mono font-bold text-gray-500">{s.code}</span>
                                <span className={`font-mono font-bold ${debt > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                  {formatCurrency(debt)}
                                </span>
                              </div>
                              <div className="font-medium text-gray-800 line-clamp-1 mt-0.5">{s.name}</div>
                              <div className="text-[10px] text-gray-400 italic mt-0.5">Dư nợ nhà cung cấp</div>
                            </div>
                          );
                        })
                    ) : (
                      // Display customers
                      customers
                        .filter(c =>
                          c.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                          c.code.toLowerCase().includes(partnerSearch.toLowerCase())
                        )
                        .map(c => {
                          const debt = getActualCustomerDebt(c);
                          const isSelected = partnerId === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setPartnerId(c.id);
                                setPartnerType('CUSTOMER');
                              }}
                              className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                                  : 'bg-white hover:bg-slate-100 border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-mono font-bold text-gray-500">{c.code}</span>
                                <span className={`font-mono font-bold ${debt > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                  {formatCurrency(debt)}
                                </span>
                              </div>
                              <div className="font-medium text-gray-800 line-clamp-1 mt-0.5">{c.name}</div>
                              <div className="text-[10px] text-gray-400 italic mt-0.5">Dư nợ khách hàng</div>
                            </div>
                          );
                        })
                    )}

                    {/* Empty search state */}
                    {['NHAP_MUA', 'TRA_TIEN_NCC', 'TRA_HANG_NCC'].includes(view) && suppliers.filter(s => s.name.toLowerCase().includes(partnerSearch.toLowerCase()) || s.code.toLowerCase().includes(partnerSearch.toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-gray-400 italic font-mono text-[10px]">Không tìm thấy NCC nào</div>
                    )}
                    {['XUAT_BAN', 'THU_TIEN_KH', 'KH_TRA_HANG'].includes(view) && customers.filter(c => c.name.toLowerCase().includes(partnerSearch.toLowerCase()) || c.code.toLowerCase().includes(partnerSearch.toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-gray-400 italic font-mono text-[10px]">Không tìm thấy khách hàng nào</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
