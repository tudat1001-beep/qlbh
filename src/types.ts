/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Master Data Interfaces
export interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  defaultWarehouseId: string;
  initialStock: number;
  category?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  initialDebt: number; // Positive = Customer owes us, Negative = We owe customer
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  initialDebt: number; // Positive = We owe supplier, Negative = Supplier owes us
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  position: string;
  department: string;
}

export interface FundAccount {
  id: string;
  code: string;
  name: string;
  initialBalance: number;
  type: 'TIEN_MAT' | 'NGAN_HANG';
}

export interface TransactionCategory {
  id: string;
  code: string;
  name: string;
  type: 'THU' | 'CHI';
}

// Transaction Types
export type TransactionType =
  | 'NHAP_MUA'          // Nhập mua hàng
  | 'TRA_TIEN_NCC'       // Trả tiền NCC
  | 'TRA_HANG_NCC'       // Trả hàng NCC
  | 'CHUYEN_KHO'         // Chuyển kho
  | 'XUAT_BAN'          // Xuất bán hàng
  | 'THU_TIEN_KH'        // Thu tiền KH
  | 'KH_TRA_HANG'        // Khách hàng trả hàng
  | 'THU_KHAC'           // Thu tiền khác
  | 'CHI_KHAC'           // Chi tiền khác
  | 'CHUYEN_QUY'         // Chuyển quỹ
  | 'TAM_UNG'            // Tạm ứng
  | 'QUYET_TOAN_TAM_UNG' // Quyết toán tạm ứng
  | 'HOAN_UNG';          // Hoàn ứng

export interface TransactionDetail {
  productId: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface Transaction {
  id: string;
  code: string; // Auto-generated code like PT-0001, PC-0001, XK-0001, NK-0001
  type: TransactionType;
  date: string;
  warehouseId?: string; // Active warehouse
  toWarehouseId?: string; // For CHUYEN_KHO
  partnerId?: string; // Customer, Supplier, or Employee ID depending on type
  partnerType?: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'OTHER';
  fundAccountId?: string; // Source/Destination account
  toFundAccountId?: string; // For CHUYEN_QUY
  categoryId?: string; // For THU_KHAC, CHI_KHAC
  details: TransactionDetail[]; // For inventory transactions
  totalAmount: number; // Total money involved
  note: string;
  creator: string;
}

// Quotation Interface
export interface QuotationDetail {
  productId: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface Quotation {
  id: string;
  code: string;
  date: string;
  customerId: string;
  title: string;
  details: QuotationDetail[];
  totalAmount: number;
  note: string;
  validUntil: string;
  status: 'CHO_DUYET' | 'DA_DUYET' | 'DA_XUAT_KHO' | 'HUY';
}

// Enterprise Info
export interface EnterpriseInfo {
  name: string;
  address: string;
  taxCode: string;
  phone: string;
  email: string;
  director: string;
  chiefAccountant: string;
}

// System Settings
export interface Store {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'LOCKED';
  expiryDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'SALES' | 'STOREKEEPER';
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
  storeId?: string; // Optional: empty or special ID for system Super Admin
}

export interface SystemSettings {
  enterprise: EnterpriseInfo;
  decimalPlaces: number;
  workingPeriod: string; // e.g. "Tháng 07/2026"
  backupFrequency: 'DAILY' | 'WEEKLY' | 'MANUAL';
}
