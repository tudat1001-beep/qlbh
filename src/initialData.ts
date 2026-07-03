/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Product,
  Warehouse,
  Customer,
  Supplier,
  Employee,
  FundAccount,
  TransactionCategory,
  Transaction,
  Quotation,
  SystemSettings,
  AppUser
} from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', code: 'SP001', name: 'Sữa Bột Abbott Grow 4 900g', unit: 'Hộp', purchasePrice: 280000, salePrice: 350000, defaultWarehouseId: 'w1', initialStock: 50, category: 'Sữa - Thực phẩm' },
  { id: 'p2', code: 'SP002', name: 'Gạo ST25 Thượng Hạng', unit: 'Bao 5kg', purchasePrice: 140000, salePrice: 195000, defaultWarehouseId: 'w1', initialStock: 120, category: 'Gạo - Lương thực' },
  { id: 'p3', code: 'SP003', name: 'Nước Ngọt Coca-Cola Lon 320ml', unit: 'Thùng 24', purchasePrice: 185000, salePrice: 220000, defaultWarehouseId: 'w2', initialStock: 80, category: 'Đồ uống' },
  { id: 'p4', code: 'SP004', name: 'Cà phê Hòa Tan Trung Nguyên G7', unit: 'Hộp 20 gói', purchasePrice: 420000, salePrice: 510000, defaultWarehouseId: 'w1', initialStock: 35, category: 'Đồ uống' },
  { id: 'p5', code: 'SP005', name: 'Bia Heineken Lon 330ml', unit: 'Thùng 24', purchasePrice: 390000, salePrice: 445000, defaultWarehouseId: 'w2', initialStock: 60, category: 'Đồ uống' },
  { id: 'p6', code: 'SP006', name: 'Xi măng Holcim Đa Dụng', unit: 'Bao 50kg', purchasePrice: 82000, salePrice: 98000, defaultWarehouseId: 'w1', initialStock: 200, category: 'Vật liệu xây dựng' }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'w1', code: 'K01', name: 'Kho Chính - Quận 1', address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP. HCM' },
  { id: 'w2', code: 'K02', name: 'Kho Phụ - Thủ Đức', address: '45 Đường số 8, Phường Linh Trung, TP. Thủ Đức' }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', code: 'KH001', name: 'Công ty TNHH Thương mại Minh Anh', phone: '0901234567', address: '456 Điện Biên Phủ, Bình Thạnh, TP. HCM', initialDebt: 15500000 },
  { id: 'c2', code: 'KH002', name: 'Cửa hàng Bách hóa Thanh Tâm', phone: '0912345678', address: '89 Nguyễn Trãi, Quận 5, TP. HCM', initialDebt: 8200000 },
  { id: 'c3', code: 'KH003', name: 'Anh Nguyễn Văn Hùng (Khách lẻ)', phone: '0934567890', address: '12 Đường số 3, Quận 7, TP. HCM', initialDebt: 0 }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', code: 'NCC001', name: 'Tổng Công Ty CP Bán lẻ Hoàng Gia', phone: '0283888888', address: '101 Nguyễn Huệ, Quận 1, TP. HCM', initialDebt: 24000000 },
  { id: 's2', code: 'NCC002', name: 'Nhà Máy Bia & Nước Giải Khát Sài Gòn', phone: '0283999999', address: '187 Hoàng Hoa Thám, Tân Bình, TP. HCM', initialDebt: 12500000 },
  { id: 's3', code: 'NCC003', name: 'Công ty TNHH Vật Liệu Xây Dựng Trường Sơn', phone: '0977665544', address: '235 Quốc Lộ 1A, Quận 12, TP. HCM', initialDebt: 0 }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', code: 'NV001', name: 'Trần Thị Thu Thảo', position: 'Trưởng phòng Kinh doanh', department: 'Phòng Kinh Doanh', username: 'thao.ttt', password: '123', role: 'ACCOUNTANT' },
  { id: 'e2', code: 'NV002', name: 'Lê Văn Nam', position: 'Nhân viên bán hàng', department: 'Phòng Kinh Doanh', username: 'nam.lv', password: '123', role: 'SALES' },
  { id: 'e3', code: 'NV003', name: 'Nguyễn Minh Quân', position: 'Nhân viên kho', department: 'Bộ phận Kho', username: 'quan.nm', password: '123', role: 'STOREKEEPER' }
];

export const INITIAL_FUNDS: FundAccount[] = [
  { id: 'f1', code: 'TM', name: 'Két Sắt Tiền Mặt Văn Phòng', initialBalance: 50000000, type: 'TIEN_MAT' },
  { id: 'f2', code: 'VCB', name: 'Vietcombank - 0071001234567', initialBalance: 150000000, type: 'NGAN_HANG' },
  { id: 'f3', code: 'TCB', name: 'Techcombank - 1902009876543', initialBalance: 75000000, type: 'NGAN_HANG' }
];

export const INITIAL_CATEGORIES: TransactionCategory[] = [
  { id: 'cat1', code: 'T_TL', name: 'Thu tiền thanh lý tài sản', type: 'THU' },
  { id: 'cat2', code: 'T_LS', name: 'Thu lãi tiền gửi ngân hàng', type: 'THU' },
  { id: 'cat3', code: 'C_DN', name: 'Chi phí tiền điện nước văn phòng', type: 'CHI' },
  { id: 'cat4', code: 'C_TK', name: 'Chi phí tiếp khách và hội họp', type: 'CHI' },
  { id: 'cat5', code: 'C_VPP', name: 'Chi văn phòng phẩm và dụng cụ', type: 'CHI' }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    code: 'NK0001',
    type: 'NHAP_MUA',
    date: '2026-06-15',
    warehouseId: 'w1',
    partnerId: 's1',
    partnerType: 'SUPPLIER',
    details: [
      { productId: 'p1', quantity: 20, price: 280000, amount: 5600000 },
      { productId: 'p2', quantity: 50, price: 140000, amount: 7000000 }
    ],
    totalAmount: 12600000,
    note: 'Nhập hàng sữa và gạo đợt tháng 6',
    creator: 'Nguyễn Minh Quân'
  },
  {
    id: 't2',
    code: 'PC0001',
    type: 'TRA_TIEN_NCC',
    date: '2026-06-16',
    fundAccountId: 'f2',
    partnerId: 's1',
    partnerType: 'SUPPLIER',
    details: [],
    totalAmount: 10000000,
    note: 'Chuyển khoản thanh toán một phần công nợ cho Hoàng Gia',
    creator: 'Trần Thị Thu Thảo'
  },
  {
    id: 't3',
    code: 'XK0001',
    type: 'XUAT_BAN',
    date: '2026-06-20',
    warehouseId: 'w1',
    partnerId: 'c1',
    partnerType: 'CUSTOMER',
    details: [
      { productId: 'p1', quantity: 15, price: 350000, amount: 5250000 },
      { productId: 'p2', quantity: 30, price: 195000, amount: 5850000 }
    ],
    totalAmount: 11100000,
    note: 'Xuất bán sỉ cho Minh Anh',
    creator: 'Lê Văn Nam'
  },
  {
    id: 't4',
    code: 'PT0001',
    type: 'THU_TIEN_KH',
    date: '2026-06-21',
    fundAccountId: 'f1',
    partnerId: 'c1',
    partnerType: 'CUSTOMER',
    details: [],
    totalAmount: 8000000,
    note: 'Khách hàng Minh Anh trả tiền mặt',
    creator: 'Trần Thị Thu Thảo'
  },
  {
    id: 't5',
    code: 'CK0001',
    type: 'CHUYEN_KHO',
    date: '2026-06-22',
    warehouseId: 'w1',
    toWarehouseId: 'w2',
    details: [
      { productId: 'p1', quantity: 5, price: 280000, amount: 1400000 }
    ],
    totalAmount: 1400000,
    note: 'Điều chuyển sữa sang kho phụ Quận 9',
    creator: 'Nguyễn Minh Quân'
  },
  {
    id: 't6',
    code: 'CQ0001',
    type: 'CHUYEN_QUY',
    date: '2026-06-23',
    fundAccountId: 'f1',
    toFundAccountId: 'f2',
    details: [],
    totalAmount: 15000000,
    note: 'Nộp tiền mặt vào tài khoản Vietcombank',
    creator: 'Trần Thị Thu Thảo'
  },
  {
    id: 't7',
    code: 'PC0002',
    type: 'CHI_KHAC',
    date: '2026-06-24',
    fundAccountId: 'f1',
    categoryId: 'cat3',
    details: [],
    totalAmount: 1250000,
    note: 'Thanh toán tiền điện tháng 6',
    creator: 'Trần Thị Thu Thảo'
  },
  {
    id: 't8',
    code: 'TU0001',
    type: 'TAM_UNG',
    date: '2026-06-25',
    fundAccountId: 'f1',
    partnerId: 'e2',
    partnerType: 'EMPLOYEE',
    details: [],
    totalAmount: 2000000,
    note: 'Tạm ứng tiền đi công tác tỉnh cho Lê Văn Nam',
    creator: 'Trần Thị Thu Thảo'
  }
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'q1',
    code: 'BG0001',
    date: '2026-06-28',
    customerId: 'c1',
    title: 'Báo giá sữa bột và gạo ST25 đợt cuối năm',
    details: [
      { productId: 'p1', quantity: 50, price: 345000, amount: 17250000 },
      { productId: 'p2', quantity: 100, price: 190000, amount: 19000000 }
    ],
    totalAmount: 36250000,
    note: 'Báo giá có chiết khấu cao cho khách hàng Minh Anh',
    validUntil: '2026-07-15',
    status: 'DA_DUYET'
  },
  {
    id: 'q2',
    code: 'BG0002',
    date: '2026-06-29',
    customerId: 'c2',
    title: 'Báo giá nước giải khát giao nhanh',
    details: [
      { productId: 'p3', quantity: 40, price: 215000, amount: 8600000 },
      { productId: 'p5', quantity: 30, price: 440000, amount: 13200000 }
    ],
    totalAmount: 21800000,
    note: 'Giao hàng tận nơi tại Quận 5',
    validUntil: '2026-07-10',
    status: 'CHO_DUYET'
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  enterprise: {
    name: 'CÔNG TY TNHH THƯƠNG MẠI & DỊCH VỤ TOÀN CẦU',
    address: 'Số 150 Đường Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
    taxCode: '0315678901',
    phone: '028 3845 6789',
    email: 'info@toancau-commerce.com',
    director: 'Nguyễn Văn Toàn',
    chiefAccountant: 'Phạm Thanh Mai'
  },
  decimalPlaces: 0,
  workingPeriod: 'Tháng 07/2026',
  backupFrequency: 'MANUAL'
};

export const INITIAL_USERS: AppUser[] = [
  { id: 'u1', username: 'mai.pt', fullName: 'Phạm Thanh Mai', role: 'ADMIN', password: '123', status: 'ACTIVE' },
  { id: 'u2', username: 'thao.ttt', fullName: 'Trần Thị Thu Thảo', role: 'ACCOUNTANT', password: '123', status: 'ACTIVE' },
  { id: 'u3', username: 'nam.lv', fullName: 'Lê Văn Nam', role: 'SALES', password: '123', status: 'ACTIVE' },
  { id: 'u4', username: 'quan.nm', fullName: 'Nguyễn Minh Quân', role: 'STOREKEEPER', password: '123', status: 'ACTIVE' }
];
