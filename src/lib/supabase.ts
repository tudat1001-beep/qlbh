import { createClient } from '@supabase/supabase-js';
import {
  Store,
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
} from '../types';

// Read connection credentials from environment variables
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are set
export const isSupabaseConfigured = (): boolean => {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL';
};

// Lazy initialization of Supabase client to prevent startup crash if keys are missing
let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return supabaseInstance;
};

/**
 * Kiểm tra kết nối tới Supabase
 */
export async function dbTestConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase chưa được cấu hình. Vui lòng thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào file .env'
    };
  }
  const sb = getSupabase();
  if (!sb) {
    return { success: false, message: 'Không thể khởi tạo Client kết nối Supabase.' };
  }
  try {
    const { error } = await sb.from('stores').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
        return {
          success: true,
          message: 'Kết nối API Supabase thành công! Tuy nhiên bảng "stores" chưa tồn tại. Hãy copy script SQL bên phải để tạo bảng trong Supabase SQL Editor.'
        };
      }
      throw error;
    }
    return {
      success: true,
      message: 'Kết nối tới Supabase thành công! Cơ sở dữ liệu đám mây đang hoạt động hoàn hảo.'
    };
  } catch (err: any) {
    console.warn('Lỗi kết nối Supabase:', err);
    return {
      success: false,
      message: `Lỗi kết nối tới Supabase: ${err.message || JSON.stringify(err)}`
    };
  }
}

// SQL DDL generator to assist the user in setting up their database in Supabase
export const getSupabaseSQLSchema = (): string => {
  return `-- SCRIPT TẠO BẢNG CHO HỆ THỐNG QUẢN LÝ BÁN HÀNG SAAS (SUPABASE)
-- Copy toàn bộ nội dung này dán vào phần SQL Editor của dự án Supabase của bạn và chạy.

-- 1. Bảng Stores (Cửa hàng / Doanh nghiệp thành viên)
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_name TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED')),
    expiry_date TEXT NOT NULL, -- Định dạng YYYY-MM-DD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bật Row Level Security (RLS) hoặc tắt tùy chọn bảo mật để dễ dàng thử nghiệm ban đầu
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to stores" ON public.stores FOR ALL USING (true);

-- 2. Bảng Users (Nhân viên / Tài khoản)
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('ADMIN', 'ACCOUNTANT', 'SALES', 'STOREKEEPER')),
    password TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (store_id, username)
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on app_users" ON public.app_users FOR ALL USING (true);

-- 3. Bảng Sản phẩm (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT,
    purchase_price NUMERIC DEFAULT 0,
    sale_price NUMERIC DEFAULT 0,
    default_warehouse_id TEXT,
    initial_stock NUMERIC DEFAULT 0,
    category TEXT,
    UNIQUE (store_id, code)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true);

-- 4. Bảng Kho hàng (Warehouses)
CREATE TABLE IF NOT EXISTS public.warehouses (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    UNIQUE (store_id, code)
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on warehouses" ON public.warehouses FOR ALL USING (true);

-- 5. Bảng Khách hàng (Customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    initial_debt NUMERIC DEFAULT 0,
    UNIQUE (store_id, code)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on customers" ON public.customers FOR ALL USING (true);

-- 6. Bảng Nhà cung cấp (Suppliers)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    initial_debt NUMERIC DEFAULT 0,
    UNIQUE (store_id, code)
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on suppliers" ON public.suppliers FOR ALL USING (true);

-- 7. Bảng Nhân viên trong cửa hàng (Employees)
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    position TEXT,
    department TEXT,
    UNIQUE (store_id, code)
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on employees" ON public.employees FOR ALL USING (true);

-- 8. Bảng Tài khoản / Quỹ tiền (Funds)
CREATE TABLE IF NOT EXISTS public.funds (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    initial_balance NUMERIC DEFAULT 0,
    type TEXT CHECK (type IN ('TIEN_MAT', 'NGAN_HANG')),
    UNIQUE (store_id, code)
);

ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on funds" ON public.funds FOR ALL USING (true);

-- 9. Bảng Danh mục thu chi (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('THU', 'CHI')),
    UNIQUE (store_id, code)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true);

-- 10. Bảng Chứng từ / Phát sinh giao dịch (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    warehouse_id TEXT,
    to_warehouse_id TEXT,
    partner_id TEXT,
    partner_type TEXT,
    fund_account_id TEXT,
    to_fund_account_id TEXT,
    category_id TEXT,
    details JSONB DEFAULT '[]'::jsonb, -- Lưu chi tiết sản phẩm
    total_amount NUMERIC DEFAULT 0,
    note TEXT,
    creator TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on transactions" ON public.transactions FOR ALL USING (true);

-- 11. Bảng Báo giá (Quotations)
CREATE TABLE IF NOT EXISTS public.quotations (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    date TEXT NOT NULL,
    customer_id TEXT,
    title TEXT NOT NULL,
    details JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC DEFAULT 0,
    note TEXT,
    valid_until TEXT,
    status TEXT CHECK (status IN ('CHO_DUYET', 'DA_DUYET', 'DA_XUAT_KHO', 'HUY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on quotations" ON public.quotations FOR ALL USING (true);

-- 12. Bảng Cấu hình hệ thống (Settings)
CREATE TABLE IF NOT EXISTS public.settings (
    store_id TEXT PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    enterprise JSONB NOT NULL,
    decimal_places INT DEFAULT 0,
    working_period TEXT,
    backup_frequency TEXT
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true);

-- CHÈN DỮ LIỆU CỬA HÀNG MẪU ĐẦU TIÊN
INSERT INTO public.stores (id, name, owner_name, phone, email, status, expiry_date)
VALUES ('store_default', 'Cửa Hàng Trung Tâm (Mặc Định)', 'Phạm Thanh Mai', '028 3845 6789', 'admin@erp-saas.com', 'ACTIVE', '2030-12-31')
ON CONFLICT (id) DO NOTHING;

-- CẤP QUYỀN TRUY CẬP CHO API (SỬA LỖI PERMISSION DENIED CHO TABLES)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
`;
};

// --- DATA ACCESS LAYER WRAPPERS ---

/**
 * Fetch all stores from Supabase
 */
export async function dbFetchStores(): Promise<Store[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      ownerName: s.owner_name || '',
      phone: s.phone || '',
      email: s.email || '',
      status: s.status || 'ACTIVE',
      expiryDate: s.expiry_date,
      createdAt: s.created_at
    }));
  } catch (err) {
    console.warn('Thông tin Supabase (Tải danh sách): Dự án chưa khởi tạo bảng. Bạn có thể sử dụng SQL Editor trong Supabase.', err);
    return [];
  }
}

/**
 * Save or update store to Supabase
 */
export async function dbSaveStore(store: Store): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const payload = {
      id: store.id,
      name: store.name,
      owner_name: store.ownerName,
      phone: store.phone,
      email: store.email,
      status: store.status,
      expiry_date: store.expiryDate,
    };
    const { error } = await sb
      .from('stores')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Thông tin Supabase (Lưu cửa hàng): Không thể lưu lên đám mây, dữ liệu đã lưu cục bộ.', err);
    return false;
  }
}

/**
 * Save single user to Supabase
 */
export async function dbSaveUser(user: AppUser): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const payload = {
      id: user.id,
      store_id: user.storeId,
      username: user.username,
      full_name: user.fullName,
      role: user.role,
      password: user.password,
      status: user.status
    };
    const { error } = await sb
      .from('app_users')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Thông tin Supabase (Lưu người dùng): Không thể lưu lên đám mây, dữ liệu đã lưu cục bộ.', err);
    return false;
  }
}

/**
 * Synchronize entire dataset of a store to/from Supabase (Push backup)
 */
export async function dbPushAllStoreData(
  storeId: string,
  data: {
    products: Product[];
    warehouses: Warehouse[];
    customers: Customer[];
    suppliers: Supplier[];
    employees: Employee[];
    funds: FundAccount[];
    categories: TransactionCategory[];
    transactions: Transaction[];
    quotations: Quotation[];
    settings: SystemSettings;
    users: AppUser[];
  }
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabase();
  if (!sb) return { success: false, message: 'Supabase chưa cấu hình' };

  try {
    // 1. Save products
    if (data.products.length > 0) {
      const dbProducts = data.products.map(p => ({
        id: p.id,
        store_id: storeId,
        code: p.code,
        name: p.name,
        unit: p.unit,
        purchase_price: p.purchasePrice,
        sale_price: p.salePrice,
        default_warehouse_id: p.defaultWarehouseId,
        initial_stock: p.initialStock,
        category: p.category
      }));
      await sb.from('products').upsert(dbProducts, { onConflict: 'id' });
    }

    // 2. Save warehouses
    if (data.warehouses.length > 0) {
      const dbWarehouses = data.warehouses.map(w => ({
        id: w.id,
        store_id: storeId,
        code: w.code,
        name: w.name,
        address: w.address
      }));
      await sb.from('warehouses').upsert(dbWarehouses, { onConflict: 'id' });
    }

    // 3. Save customers
    if (data.customers.length > 0) {
      const dbCustomers = data.customers.map(c => ({
        id: c.id,
        store_id: storeId,
        code: c.code,
        name: c.name,
        phone: c.phone,
        address: c.address,
        initial_debt: c.initialDebt
      }));
      await sb.from('customers').upsert(dbCustomers, { onConflict: 'id' });
    }

    // 4. Save suppliers
    if (data.suppliers.length > 0) {
      const dbSuppliers = data.suppliers.map(s => ({
        id: s.id,
        store_id: storeId,
        code: s.code,
        name: s.name,
        phone: s.phone,
        address: s.address,
        initial_debt: s.initialDebt
      }));
      await sb.from('suppliers').upsert(dbSuppliers, { onConflict: 'id' });
    }

    // 5. Save employees
    if (data.employees.length > 0) {
      const dbEmployees = data.employees.map(e => ({
        id: e.id,
        store_id: storeId,
        code: e.code,
        name: e.name,
        position: e.position,
        department: e.department
      }));
      await sb.from('employees').upsert(dbEmployees, { onConflict: 'id' });
    }

    // 6. Save funds
    if (data.funds.length > 0) {
      const dbFunds = data.funds.map(f => ({
        id: f.id,
        store_id: storeId,
        code: f.code,
        name: f.name,
        initial_balance: f.initialBalance,
        type: f.type
      }));
      await sb.from('funds').upsert(dbFunds, { onConflict: 'id' });
    }

    // 7. Save categories
    if (data.categories.length > 0) {
      const dbCategories = data.categories.map(c => ({
        id: c.id,
        store_id: storeId,
        code: c.code,
        name: c.name,
        type: c.type
      }));
      await sb.from('categories').upsert(dbCategories, { onConflict: 'id' });
    }

    // 8. Save transactions
    if (data.transactions.length > 0) {
      const dbTransactions = data.transactions.map(t => ({
        id: t.id,
        store_id: storeId,
        code: t.code,
        type: t.type,
        date: t.date,
        warehouse_id: t.warehouseId,
        to_warehouse_id: t.toWarehouseId,
        partner_id: t.partnerId,
        partner_type: t.partnerType,
        fund_account_id: t.fundAccountId,
        to_fund_account_id: t.toFundAccountId,
        category_id: t.categoryId,
        details: JSON.stringify(t.details),
        total_amount: t.totalAmount,
        note: t.note,
        creator: t.creator
      }));
      await sb.from('transactions').upsert(dbTransactions, { onConflict: 'id' });
    }

    // 9. Save quotations
    if (data.quotations.length > 0) {
      const dbQuotations = data.quotations.map(q => ({
        id: q.id,
        store_id: storeId,
        code: q.code,
        date: q.date,
        customer_id: q.customerId,
        title: q.title,
        details: JSON.stringify(q.details),
        total_amount: q.totalAmount,
        note: q.note,
        valid_until: q.validUntil,
        status: q.status
      }));
      await sb.from('quotations').upsert(dbQuotations, { onConflict: 'id' });
    }

    // 10. Save users
    if (data.users.length > 0) {
      const dbUsers = data.users.map(u => ({
        id: u.id,
        store_id: storeId,
        username: u.username,
        full_name: u.fullName,
        role: u.role,
        password: u.password,
        status: u.status
      }));
      await sb.from('app_users').upsert(dbUsers, { onConflict: 'id' });
    }

    // 11. Save settings
    const dbSettings = {
      store_id: storeId,
      enterprise: JSON.stringify(data.settings.enterprise),
      decimal_places: data.settings.decimalPlaces,
      working_period: data.settings.workingPeriod,
      backup_frequency: data.settings.backupFrequency
    };
    await sb.from('settings').upsert(dbSettings, { onConflict: 'store_id' });

    return { success: true, message: 'Đồng bộ dữ liệu lên đám mây Supabase thành công!' };
  } catch (err: any) {
    console.warn('Thông tin Supabase (Đồng bộ thất bại):', err);
    return { success: false, message: `Lỗi đồng bộ: ${err.message || err}` };
  }
}
