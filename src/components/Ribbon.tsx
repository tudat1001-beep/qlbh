/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  PlusCircle,
  Database,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FolderOpen,
  UserCheck,
  Settings as SettingsIcon,
  Trash2,
  Lock,
  Download,
  Upload,
  Layers,
  ShoppingBag,
  Users,
  Building,
  CreditCard,
  Tag,
  BookOpen,
  DollarSign,
  HelpCircle,
  Printer,
  ChevronDown,
  Sparkles,
  Scissors,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LogOut
} from 'lucide-react';
import { AppUser } from '../types';

interface RibbonProps {
  activeTab: 'BAN_HANG' | 'DANH_MUC' | 'CAI_DAT' | 'CHINH_SUA';
  setActiveTab: (tab: 'BAN_HANG' | 'DANH_MUC' | 'CAI_DAT' | 'CHINH_SUA') => void;
  selectedView: string;
  setSelectedView: (view: string) => void;
  decimalPlaces: number;
  workingPeriod: string;
  excelTheme?: 'GREEN' | 'BLUE' | 'PURPLE' | 'SLATE';
  currentUser: AppUser | null;
  onLogout: () => void;
  permissionMatrix?: any;
}

export default function Ribbon({
  activeTab,
  setActiveTab,
  selectedView,
  setSelectedView,
  decimalPlaces,
  workingPeriod,
  excelTheme = 'GREEN',
  currentUser,
  onLogout,
  permissionMatrix
}: RibbonProps) {
  const themeColors = {
    GREEN: {
      primary: 'bg-[#107c41]',
      text: 'text-[#107c41]',
      badge: 'bg-[#185e37]',
      badgeLight: 'bg-green-100 text-green-800 border-green-200',
      activeTabClass: 'bg-white border border-b-0 border-slate-300 text-[#107c41] font-semibold z-10 shadow-sm',
      activeBtnClass: 'bg-green-50 border border-green-300 text-green-800 font-semibold',
    },
    BLUE: {
      primary: 'bg-blue-800',
      text: 'text-blue-700',
      badge: 'bg-blue-900',
      badgeLight: 'bg-blue-100 text-blue-800 border-blue-200',
      activeTabClass: 'bg-white border border-b-0 border-slate-300 text-blue-700 font-semibold z-10 shadow-sm',
      activeBtnClass: 'bg-blue-50 border border-blue-300 text-blue-800 font-semibold',
    },
    PURPLE: {
      primary: 'bg-purple-800',
      text: 'text-purple-700',
      badge: 'bg-purple-900',
      badgeLight: 'bg-purple-100 text-purple-800 border-purple-200',
      activeTabClass: 'bg-white border border-b-0 border-slate-300 text-purple-700 font-semibold z-10 shadow-sm',
      activeBtnClass: 'bg-purple-50 border border-purple-300 text-purple-800 font-semibold',
    },
    SLATE: {
      primary: 'bg-slate-800',
      text: 'text-slate-800',
      badge: 'bg-slate-900',
      badgeLight: 'bg-slate-100 text-slate-800 border-slate-200',
      activeTabClass: 'bg-white border border-b-0 border-slate-300 text-slate-800 font-semibold z-10 shadow-sm',
      activeBtnClass: 'bg-slate-100 border border-slate-300 text-slate-800 font-semibold',
    }
  };

  const c = themeColors[excelTheme];
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const getBtnClass = (viewId: string) => {
    if (currentUser ? !hasPermission(currentUser, viewId) : false) {
      return 'opacity-40 cursor-not-allowed border border-transparent text-slate-400 bg-slate-50/50';
    }
    return selectedView === viewId
      ? c.activeBtnClass
      : 'hover:bg-slate-200 border border-transparent text-slate-700';
  };

  const hasPermission = (user: AppUser | null, target: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const matrix = permissionMatrix?.[user.role];
    if (!matrix) {
      return false;
    }

    if (target === 'DASHBOARD' || target === 'CD_DOI_MAT_KHAU') return true;

    if (['BAO_GIA'].includes(target)) {
      return !!matrix.quotations;
    }
    if (['XUAT_BAN', 'KH_TRA_HANG', 'DM_KHACH_HANG'].includes(target)) {
      return !!matrix.sales;
    }
    if (['THU_TIEN_KH', 'DM_QUY_TAI_KHOAN'].includes(target)) {
      return !!matrix.cash_collection;
    }
    if (['NHAP_MUA', 'TRA_HANG_NCC', 'TRA_TIEN_NCC', 'DM_NHA_CUNG_CAP'].includes(target)) {
      return !!matrix.purchases;
    }
    if (['CHUYEN_KHO', 'DM_KHO_CHI_NHANH', 'KIEM_KE_KHO'].includes(target)) {
      return !!matrix.warehouse;
    }
    if (['BC_TH_NXT', 'BC_THE_KHO', 'BC_CT_NHAP_XUAT'].includes(target)) {
      return !!matrix.inventory_reports;
    }
    if (['BC_LAI_LO', 'BC_CT_THU_CHI', 'BC_CT_CONG_NO', 'BC_SO_QUY', 'BC_TH_CONG_NO', 'BC_TH_QUY', 'CHUYEN_QUY', 'THU_CHI_KHAC', 'TAM_UNG_HOAN_UNG', 'DM_HANG_MUC_THU_CHI'].includes(target)) {
      return !!matrix.financial_reports;
    }
    if (['CD_THONG_TIN_DN', 'CD_KỲ_MOI', 'CD_LAM_TRON'].includes(target)) {
      return !!matrix.enterprise_setup;
    }
    if (['CD_QUAN_LY_QUYEN', 'CD_DOI_MAT_KHAU', 'CD_SAO_LUU', 'CD_KHOI_PHUC', 'CD_RESET_DATA', 'DM_NHAN_VIEN'].includes(target)) {
      return !!matrix.system_setup;
    }

    if (target === 'DM_HANG_HOA') {
      return !!(matrix.sales || matrix.purchases || matrix.warehouse);
    }

    if (target === 'DM_KHAC') {
      return !!matrix.system_setup;
    }

    return false;
  };

  const isTabAllowed = (tab: 'BAN_HANG' | 'DANH_MUC' | 'CAI_DAT' | 'CHINH_SUA') => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (tab === 'CHINH_SUA') return true;
    if (tab === 'BAN_HANG') return true;

    if (tab === 'DANH_MUC') {
      const dmViews = ['DM_HANG_HOA', 'DM_KHO_CHI_NHANH', 'DM_KHACH_HANG', 'DM_NHA_CUNG_CAP', 'DM_NHAN_VIEN', 'DM_QUY_TAI_KHOAN', 'DM_HANG_MUC_THU_CHI', 'DM_KHAC'];
      return dmViews.some(v => hasPermission(currentUser, v));
    }

    if (tab === 'CAI_DAT') {
      const cdViews = ['CD_THONG_TIN_DN', 'CD_BAN_QUYEN', 'CD_LAM_TRON', 'CD_QUAN_LY_QUYEN', 'CD_DOI_MAT_KHAU', 'CD_SAO_LUU', 'CD_KHOI_PHUC', 'CD_RESET_DATA'];
      return cdViews.some(v => hasPermission(currentUser, v));
    }

    return false;
  };

  const handleViewClick = (viewId: string) => {
    if (!currentUser) return;
    if (hasPermission(currentUser, viewId)) {
      setSelectedView(viewId);
    } else {
      alert(`🔒 Quyền hạn của bạn (${currentUser.fullName} - [${currentUser.role}]) KHÔNG ĐỦ để truy cập chức năng này! Vui lòng liên hệ Kế toán trưởng để được phân quyền.`);
    }
  };

  const handleTabClick = (tab: 'BAN_HANG' | 'DANH_MUC' | 'CAI_DAT' | 'CHINH_SUA') => {
    if (!isTabAllowed(tab)) {
      alert(`⚠️ Quyền hạn của bạn (${currentUser?.fullName} - [${currentUser?.role}]) không cho phép truy cập tab này!`);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div id="ribbon-container" className="bg-slate-100 border-b border-slate-300 text-xs text-slate-700 select-none shrink-0 shadow-sm">
      {/* Title Bar */}
      <div className={`${c.primary} text-white px-4 py-2 flex justify-between items-center font-medium shadow-sm transition-colors duration-200`}>
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 animate-pulse text-green-100" />
          <span className="font-semibold text-sm tracking-wide">EXCEL ERP - PHẦN MỀM QUẢN LÝ BÁN HÀNG</span>
          <span className={`${c.badge} text-[10px] px-2 py-0.5 rounded text-white font-normal transition-colors duration-200`}>Chế độ Offline</span>
        </div>
        <div className="flex items-center space-x-4 text-[11px] text-slate-100">
          <div>Làm tròn: <strong className="text-white bg-black/20 px-2 py-0.5 rounded">{decimalPlaces} TP</strong></div>
          
          {currentUser && (
            <div className="bg-black/20 border border-white/10 px-2.5 py-0.5 rounded flex items-center space-x-2 text-white font-sans">
              <span>Chào, <strong className="text-green-200">{currentUser.fullName}</strong></span>
              <span className="bg-white/20 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider text-white">
                {currentUser.role === 'ADMIN' ? 'Kế toán trưởng' :
                 currentUser.role === 'ACCOUNTANT' ? 'Kế toán viên' :
                 currentUser.role === 'SALES' ? 'Bán hàng' : 'Thủ kho'}
              </span>
              <button 
                onClick={onLogout}
                className="hover:text-red-300 transition-colors pl-2 border-l border-white/20 flex items-center space-x-1 cursor-pointer font-bold"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="h-3 w-3 inline" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          <div className="text-white bg-black/10 border border-white/20 px-2 py-0.5 rounded flex items-center space-x-1">
            <span className="h-1.5 w-1.5 bg-green-400 rounded-full inline-block animate-ping"></span>
            <span>Đã kết nối</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu with Collapse Toggle */}
      <div className="flex justify-between items-center bg-slate-100 border-b border-slate-200 px-4 pt-1">
        <div className="flex space-x-1 overflow-x-auto">
          <button
            id="tab-ban-hang"
            onClick={() => handleTabClick('BAN_HANG')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-t transition-colors duration-150 -mb-[1px] ${
              activeTab === 'BAN_HANG'
                ? c.activeTabClass
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            QUẢN LÝ BÁN HÀNG
          </button>
          <button
            id="tab-danh-muc"
            onClick={() => handleTabClick('DANH_MUC')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-t transition-colors duration-150 -mb-[1px] ${
              activeTab === 'DANH_MUC'
                ? c.activeTabClass
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            CÁC DANH MỤC (MASTER DATA)
          </button>
          <button
            id="tab-cai-dat"
            onClick={() => handleTabClick('CAI_DAT')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-t transition-colors duration-150 -mb-[1px] ${
              activeTab === 'CAI_DAT'
                ? c.activeTabClass
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            CÀI ĐẶT HỆ THỐNG
          </button>
          <button
            id="tab-chinh-sua"
            onClick={() => handleTabClick('CHINH_SUA')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-t transition-colors duration-150 -mb-[1px] ${
              activeTab === 'CHINH_SUA'
                ? c.activeTabClass
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            CHỈNH SỬA & TRANG TRÍ
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-2.5 py-0.5 mb-1 hover:bg-slate-200 text-slate-600 rounded flex items-center space-x-1 text-[11px] font-semibold transition-all duration-150 border border-slate-300 shadow-sm bg-white cursor-pointer select-none"
          title={isCollapsed ? "Mở rộng thanh công cụ" : "Thu gọn thanh công cụ"}
        >
          <ChevronDown className={`h-3 w-3 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
          <span>{isCollapsed ? "Hiện công cụ" : "Ẩn công cụ"}</span>
        </button>
      </div>

      {/* Tab Panels with Groups */}
      {!isCollapsed && (
        <div className="bg-white p-2 flex items-stretch space-x-4 border-b border-slate-300 overflow-x-auto min-h-[92px]">
        {/* TAB 1: QUẢN LÝ BÁN HÀNG */}
        {activeTab === 'BAN_HANG' && (
          <>
            {/* Group 1: Nhập phát sinh */}
            <div className="flex flex-col border-r border-gray-200 pr-3">
              <div className="flex flex-wrap gap-1 max-w-[560px]">
                <button
                  onClick={() => handleViewClick('NHAP_MUA')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('NHAP_MUA')}`}
                >
                  <ArrowDownLeft className="h-5 w-5 text-blue-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Nhập mua</span>
                </button>
                <button
                  onClick={() => handleViewClick('XUAT_BAN')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('XUAT_BAN')}`}
                >
                  <ArrowUpRight className="h-5 w-5 text-green-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Xuất bán</span>
                </button>
                <button
                  onClick={() => handleViewClick('TRA_TIEN_NCC')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('TRA_TIEN_NCC')}`}
                >
                  <CreditCard className="h-5 w-5 text-red-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Trả tiền NCC</span>
                </button>
                <button
                  onClick={() => handleViewClick('THU_TIEN_KH')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('THU_TIEN_KH')}`}
                >
                  <DollarSign className="h-5 w-5 text-emerald-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Thu tiền KH</span>
                </button>
                <button
                  onClick={() => handleViewClick('TRA_HANG_NCC')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('TRA_HANG_NCC')}`}
                >
                  <RefreshCw className="h-5 w-5 text-orange-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Trả hàng NCC</span>
                </button>
                <button
                  onClick={() => handleViewClick('KH_TRA_HANG')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('KH_TRA_HANG')}`}
                >
                  <RefreshCw className="h-5 w-5 text-indigo-600 mb-0.5 text-scale-x-[-1]" />
                  <span className="text-[10px] text-center leading-tight">KH trả hàng</span>
                </button>
                <button
                  onClick={() => handleViewClick('CHUYEN_KHO')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('CHUYEN_KHO')}`}
                >
                  <Database className="h-5 w-5 text-amber-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Chuyển kho</span>
                </button>
                <button
                  onClick={() => handleViewClick('CHUYEN_QUY')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('CHUYEN_QUY')}`}
                >
                  <RefreshCw className="h-5 w-5 text-teal-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Chuyển quỹ</span>
                </button>
                <button
                  onClick={() => handleViewClick('THU_CHI_KHAC')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('THU_CHI_KHAC')}`}
                >
                  <PlusCircle className="h-5 w-5 text-purple-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Thu/Chi khác</span>
                </button>
                <button
                  onClick={() => handleViewClick('TAM_UNG_HOAN_UNG')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('TAM_UNG_HOAN_UNG')}`}
                >
                  <UserCheck className="h-5 w-5 text-fuchsia-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight">Tạm/Hoàn ứng</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">NHẬP PHÁT SINH VÀO SỔ</span>
            </div>

            {/* Group 2: Báo cáo chi tiết */}
            <div className="flex flex-col border-r border-gray-200 pr-3 justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('BC_LAI_LO')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${getBtnClass('BC_LAI_LO')}`}
                >
                  <TrendingUp className="h-5 w-5 text-emerald-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Lãi Lỗ</span>
                </button>
                <button
                  onClick={() => handleViewClick('BC_CT_NHAP_XUAT')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${getBtnClass('BC_CT_NHAP_XUAT')}`}
                >
                  <FileText className="h-5 w-5 text-blue-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">CT Nhập Xuất</span>
                </button>
                <button
                  onClick={() => handleViewClick('BC_CT_THU_CHI')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${getBtnClass('BC_CT_THU_CHI')}`}
                >
                  <FileText className="h-5 w-5 text-amber-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">CT Thu Chi</span>
                </button>
                <button
                  onClick={() => handleViewClick('BC_CT_CONG_NO')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${getBtnClass('BC_CT_CONG_NO')}`}
                >
                  <FileText className="h-5 w-5 text-purple-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">CT Công Nợ</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">BÁO CÁO CHI TIẾT SỔ</span>
            </div>

            {/* Group 3: Báo cáo tổng hợp */}
            <div className="flex flex-col border-r border-gray-200 pr-3 justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('BC_TH_NXT')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[72px] transition-all duration-150 ${getBtnClass('BC_TH_NXT')}`}
                >
                  <Database className="h-5 w-5 text-sky-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Tổng hợp NXT</span>
                </button>
                <button
                  onClick={() => handleViewClick('BC_THE_KHO')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[72px] transition-all duration-150 ${getBtnClass('BC_THE_KHO')}`}
                >
                  <BookOpen className="h-5 w-5 text-cyan-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Thẻ Kho</span>
                </button>
                <button
                  onClick={() => handleViewClick('BC_SO_QUY')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[72px] transition-all duration-150 ${getBtnClass('BC_SO_QUY')}`}
                >
                  <BookOpen className="h-5 w-5 text-emerald-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Sổ Quỹ</span>
                </button>
                <button
                  onClick={() => handleViewClick('BC_TH_CONG_NO')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[72px] transition-all duration-150 ${getBtnClass('BC_TH_CONG_NO')}`}
                >
                  <Users className="h-5 w-5 text-indigo-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">TH Công nợ</span>
                </button>
                <button
                  onClick={() => handleViewClick('BC_TH_QUY')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[72px] transition-all duration-150 ${getBtnClass('BC_TH_QUY')}`}
                >
                  <Layers className="h-5 w-5 text-violet-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">TH Quỹ</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">BÁO CÁO TỔNG HỢP</span>
            </div>

            {/* Group 4: Báo giá */}
            <div className="flex flex-col justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('BAO_GIA')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[76px] transition-all duration-150 ${getBtnClass('BAO_GIA')}`}
                >
                  <Tag className="h-5 w-5 text-amber-500 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Báo giá</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">KINH DOANH</span>
            </div>
          </>
        )}

        {/* TAB 2: CÁC DANH MỤC */}
        {activeTab === 'DANH_MUC' && (
          <>
            {/* Group 1: Hàng hóa & Kho */}
            <div className="flex flex-col border-r border-gray-200 pr-3 justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('DM_HANG_HOA')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${getBtnClass('DM_HANG_HOA')}`}
                >
                  <ShoppingBag className="h-5 w-5 text-blue-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Hàng Hoá</span>
                </button>
                <button
                  onClick={() => handleViewClick('DM_KHO_CHI_NHANH')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${
                    selectedView === 'DM_KHO_CHI_NHANH' ? 'bg-green-50 border border-green-300 text-green-800 font-semibold' : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <Building className="h-5 w-5 text-amber-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Kho / C.Nhánh</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">QUẢN LÝ KHO</span>
            </div>

            {/* Group 2: Đối tác & Nhân sự */}
            <div className="flex flex-col border-r border-gray-200 pr-3 justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('DM_KHACH_HANG')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${getBtnClass('DM_KHACH_HANG')}`}
                >
                  <Users className="h-5 w-5 text-green-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Khách Hàng</span>
                </button>
                <button
                  onClick={() => handleViewClick('DM_NHA_CUNG_CAP')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${getBtnClass('DM_NHA_CUNG_CAP')}`}
                >
                  <Building className="h-5 w-5 text-indigo-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Nhà Cung Cấp</span>
                </button>
                <button
                  onClick={() => handleViewClick('DM_NHAN_VIEN')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[80px] transition-all duration-150 ${getBtnClass('DM_NHAN_VIEN')}`}
                >
                  <UserCheck className="h-5 w-5 text-teal-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Nhân Viên</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">ĐỐI TÁC & NHÂN SỰ</span>
            </div>

            {/* Group 3: Tài chính & Danh mục khác */}
            <div className="flex flex-col justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('DM_QUY_TAI_KHOAN')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('DM_QUY_TAI_KHOAN')}`}
                >
                  <CreditCard className="h-5 w-5 text-emerald-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Quỹ / Tài khoản</span>
                </button>
                <button
                  onClick={() => handleViewClick('DM_HANG_MUC_THU_CHI')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('DM_HANG_MUC_THU_CHI')}`}
                >
                  <Tag className="h-5 w-5 text-rose-500 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Hạng mục thu chi</span>
                </button>
                <button
                  onClick={() => handleViewClick('DM_KHAC')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('DM_KHAC')}`}
                >
                  <FolderOpen className="h-5 w-5 text-purple-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Danh mục khác</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">TÀI CHÍNH & KHÁC</span>
            </div>
          </>
        )}

        {/* TAB 3: CÀI ĐẶT HỆ THỐNG */}
        {activeTab === 'CAI_DAT' && (
          <>
            {/* Group 1: Doanh nghiệp & Bản quyền */}
            <div className="flex flex-col border-r border-gray-200 pr-3 justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('CD_THONG_TIN_DN')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('CD_THONG_TIN_DN')}`}
                >
                  <Building className="h-5 w-5 text-slate-700 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Thông tin DN</span>
                </button>
                <button
                  onClick={() => handleViewClick('CD_BAN_QUYEN')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('CD_BAN_QUYEN')}`}
                >
                  <Sparkles className="h-5 w-5 text-amber-500 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Bản quyền PM</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">THÔNG TIN DOANH NGHIỆP</span>
            </div>

            {/* Group 2: Hệ thống */}
            <div className="flex flex-col border-r border-gray-200 pr-3 justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('CD_LAM_TRON')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('CD_LAM_TRON')}`}
                >
                  <DollarSign className="h-5 w-5 text-green-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Làm tròn TP</span>
                </button>
                <button
                  onClick={() => handleViewClick('CD_QUAN_LY_QUYEN')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('CD_QUAN_LY_QUYEN')}`}
                  title="Quản lý người dùng & Phân quyền nhân viên"
                >
                  <UserCheck className="h-5 w-5 text-purple-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Quyền & NV</span>
                </button>
                <button
                  onClick={() => handleViewClick('CD_DOI_MAT_KHAU')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('CD_DOI_MAT_KHAU')}`}
                >
                  <Lock className="h-5 w-5 text-red-500 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Đổi mật khẩu</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">CÀI ĐẶT THAM SỐ</span>
            </div>

            {/* Group 3: Dữ liệu & Sao lưu */}
            <div className="flex flex-col justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleViewClick('CD_SAO_LUU')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('CD_SAO_LUU')}`}
                >
                  <Download className="h-5 w-5 text-indigo-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Tạo sao lưu</span>
                </button>
                <button
                  onClick={() => handleViewClick('CD_KHOI_PHUC')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('CD_KHOI_PHUC')}`}
                >
                  <Upload className="h-5 w-5 text-cyan-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Khôi phục cũ</span>
                </button>
                <button
                  onClick={() => handleViewClick('CD_RESET_DATA')}
                  className={`flex flex-col items-center justify-center p-1.5 rounded w-[85px] transition-all duration-150 ${getBtnClass('CD_RESET_DATA')}`}
                >
                  <Trash2 className="h-5 w-5 text-red-600 mb-0.5" />
                  <span className="text-[10px] text-center leading-tight font-medium text-gray-700">Xoá toàn bộ</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-400 text-center mt-auto font-medium tracking-wide">QUẢN TRỊ DỮ LIỆU</span>
            </div>
          </>
        )}

        {/* TAB 4: CHỈNH SỬA & TRANG TRÍ */}
        {activeTab === 'CHINH_SUA' && (
          <>
            <div className="flex items-center space-x-3 text-xs w-full py-1">
              <div className="bg-gray-50 border border-gray-200 rounded p-2 flex items-center space-x-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold">TÔNG MÀU EXCEL</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="h-5 w-5 bg-[#107c41] rounded border cursor-pointer hover:scale-110 transition-transform" title="Classic Excel Green"></div>
                    <div className="h-5 w-5 bg-blue-700 rounded border cursor-pointer hover:scale-110 transition-transform" title="Navy Enterprise"></div>
                    <div className="h-5 w-5 bg-purple-700 rounded border cursor-pointer hover:scale-110 transition-transform" title="Amethyst Bold"></div>
                    <div className="h-5 w-5 bg-rose-600 rounded border cursor-pointer hover:scale-110 transition-transform" title="Ruby Rose"></div>
                    <div className="h-5 w-5 bg-slate-800 rounded border cursor-pointer hover:scale-110 transition-transform" title="Slate Minimal"></div>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-gray-200"></div>

                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold">CỠ CHỮ BÁO CÁO (FONT)</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <button className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-bold">12px</button>
                    <button className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-[11px]">14px</button>
                    <button className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-[11px]">16px</button>
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200"></div>

                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold">ĐỊNH DẠNG SỐ</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <button className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-mono">123,456 đ</button>
                    <button className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-[11px] font-mono">$123,456</button>
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200"></div>

                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold">CĂN LỀ & SHAPES</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <button className="p-1 bg-gray-100 border border-gray-300 rounded" title="Căn trái"><AlignLeft className="h-3 w-3" /></button>
                    <button className="p-1 bg-white border border-gray-300 rounded" title="Căn giữa"><AlignCenter className="h-3 w-3" /></button>
                    <button className="p-1 bg-gray-100 border border-gray-300 rounded" title="Căn phải"><AlignRight className="h-3 w-3" /></button>
                    <button className="p-1 bg-gray-100 border border-gray-300 rounded flex items-center space-x-1 text-[10px]" title="Chèn ghi chú"><Scissors className="h-3 w-3" /> <span>Chèn Shape</span></button>
                  </div>
                </div>
              </div>

              <div className="text-gray-500 text-[11px] max-w-xs leading-tight">
                <span className="font-semibold text-gray-700 block">💡 Chế độ chỉnh sửa Excel:</span>
                Các công cụ trên giúp cấu hình hiển thị phông chữ, cỡ chữ, căn lề và định dạng số cho bảng biểu báo cáo.
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}
