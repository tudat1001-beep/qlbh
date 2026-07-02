/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  AppUser,
  Store
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_EMPLOYEES,
  INITIAL_FUNDS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_QUOTATIONS,
  INITIAL_SETTINGS,
  INITIAL_USERS
} from './initialData';

import Ribbon from './components/Ribbon';
import CategoryManager from './components/CategoryManager';
import TransactionManager from './components/TransactionManager';
import ReportsManager from './components/ReportsManager';
import QuotationManager from './components/QuotationManager';
import SettingsManager from './components/SettingsManager';
import SaaSAdminManager from './components/SaaSAdminManager';
import { isSupabaseConfigured, getSupabase, dbFetchStores, dbFetchAllUsers } from './lib/supabase';

const DEFAULT_PERMISSION_MATRIX = {
  ACCOUNTANT: {
    quotations: true,
    sales: true,
    cash_collection: true,
    purchases: true,
    warehouse: true,
    inventory_reports: true,
    financial_reports: true,
    enterprise_setup: false,
    system_setup: false
  },
  SALES: {
    quotations: true,
    sales: true,
    cash_collection: true,
    purchases: false,
    warehouse: false,
    inventory_reports: false,
    financial_reports: false,
    enterprise_setup: false,
    system_setup: false
  },
  STOREKEEPER: {
    quotations: false,
    sales: true,
    cash_collection: false,
    purchases: true,
    warehouse: true,
    inventory_reports: true,
    financial_reports: false,
    enterprise_setup: false,
    system_setup: false
  }
};

import {
  BarChart,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Building,
  ArrowRight,
  Sparkles,
  ClipboardList,
  Layers,
  Shield
} from 'lucide-react';

export default function App() {
  // --- SaaS Store and Tenant States ---
  const [currentStoreId, setCurrentStoreId] = useState<string>(() => {
    return localStorage.getItem('excel_erp_current_store_id') || 'store_default';
  });

  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('excel_erp_stores');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'store_default',
        name: 'Cửa Hàng Trung Tâm (Mặc Định)',
        ownerName: 'Phạm Thanh Mai',
        phone: '028 3845 6789',
        email: 'admin@erp-saas.com',
        status: 'ACTIVE',
        expiryDate: '2030-12-31',
        createdAt: '2026-06-01T00:00:00.000Z'
      }
    ];
  });

  // Whether the Super Admin is viewing the SaaS Control Panel or a specific store's ERP
  const [isAdminViewingSaaS, setIsAdminViewingSaaS] = useState(true);

  // State Initialization from LocalStorage partitioned by currentStoreId
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`excel_erp_products_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_PRODUCTS : []);
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(`excel_erp_warehouses_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_WAREHOUSES : []);
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`excel_erp_customers_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_CUSTOMERS : []);
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`excel_erp_suppliers_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_SUPPLIERS : []);
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(`excel_erp_employees_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_EMPLOYEES : []);
  });

  const [funds, setFunds] = useState<FundAccount[]>(() => {
    const saved = localStorage.getItem(`excel_erp_funds_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_FUNDS : []);
  });

  const [categories, setCategories] = useState<TransactionCategory[]>(() => {
    const saved = localStorage.getItem(`excel_erp_categories_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_CATEGORIES : []);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`excel_erp_transactions_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_TRANSACTIONS : []);
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(`excel_erp_quotations_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_QUOTATIONS : []);
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(`excel_erp_settings_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_SETTINGS : {
      ...INITIAL_SETTINGS,
      enterprise: {
        ...INITIAL_SETTINGS.enterprise,
        name: `CỬA HÀNG THÀNH VIÊN`
      }
    });
  });

  // User Management and Session State
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(`excel_erp_users_${currentStoreId}`);
    return saved ? JSON.parse(saved) : (currentStoreId === 'store_default' ? INITIAL_USERS : [
      { id: `u_${Date.now()}_admin`, username: 'store_admin', fullName: 'Quản lý cửa hàng', role: 'ADMIN', password: '123', status: 'ACTIVE', storeId: currentStoreId }
    ]);
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('excel_erp_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [permissionMatrix, setPermissionMatrix] = useState(() => {
    const saved = localStorage.getItem('excel_erp_permission_matrix');
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSION_MATRIX;
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<'BAN_HANG' | 'DANH_MUC' | 'CAI_DAT' | 'CHINH_SUA'>('BAN_HANG');
  const [selectedView, setSelectedView] = useState<string>('DASHBOARD');

  // Excel customization formatting states (CHỈNH SỬA tab)
  const [excelTheme, setExcelTheme] = useState<'GREEN' | 'BLUE' | 'PURPLE' | 'SLATE'>('GREEN');
  const [fontSize, setFontSize] = useState<12 | 14 | 16>(12);
  const [boldHeaders, setBoldHeaders] = useState(true);
  const [stickyNotes, setStickyNotes] = useState<string[]>([]);
  const [newStickyNote, setNewStickyNote] = useState('');

  // Partitioned Store Switcher Helper
  const handleSwitchStore = (storeId: string) => {
    // 1. Save current active store state
    localStorage.setItem(`excel_erp_products_${currentStoreId}`, JSON.stringify(products));
    localStorage.setItem(`excel_erp_warehouses_${currentStoreId}`, JSON.stringify(warehouses));
    localStorage.setItem(`excel_erp_customers_${currentStoreId}`, JSON.stringify(customers));
    localStorage.setItem(`excel_erp_suppliers_${currentStoreId}`, JSON.stringify(suppliers));
    localStorage.setItem(`excel_erp_employees_${currentStoreId}`, JSON.stringify(employees));
    localStorage.setItem(`excel_erp_funds_${currentStoreId}`, JSON.stringify(funds));
    localStorage.setItem(`excel_erp_categories_${currentStoreId}`, JSON.stringify(categories));
    localStorage.setItem(`excel_erp_transactions_${currentStoreId}`, JSON.stringify(transactions));
    localStorage.setItem(`excel_erp_quotations_${currentStoreId}`, JSON.stringify(quotations));
    localStorage.setItem(`excel_erp_settings_${currentStoreId}`, JSON.stringify(settings));
    localStorage.setItem(`excel_erp_users_${currentStoreId}`, JSON.stringify(users));

    // 2. Set new active store ID
    setCurrentStoreId(storeId);
    localStorage.setItem('excel_erp_current_store_id', storeId);

    // 3. Load next active store state (using fallback datasets if new store)
    const p = localStorage.getItem(`excel_erp_products_${storeId}`);
    setProducts(p ? JSON.parse(p) : (storeId === 'store_default' ? INITIAL_PRODUCTS : []));

    const w = localStorage.getItem(`excel_erp_warehouses_${storeId}`);
    setWarehouses(w ? JSON.parse(w) : (storeId === 'store_default' ? INITIAL_WAREHOUSES : []));

    const c = localStorage.getItem(`excel_erp_customers_${storeId}`);
    setCustomers(c ? JSON.parse(c) : (storeId === 'store_default' ? INITIAL_CUSTOMERS : []));

    const s = localStorage.getItem(`excel_erp_suppliers_${storeId}`);
    setSuppliers(s ? JSON.parse(s) : (storeId === 'store_default' ? INITIAL_SUPPLIERS : []));

    const e = localStorage.getItem(`excel_erp_employees_${storeId}`);
    setEmployees(e ? JSON.parse(e) : (storeId === 'store_default' ? INITIAL_EMPLOYEES : []));

    const f = localStorage.getItem(`excel_erp_funds_${storeId}`);
    setFunds(f ? JSON.parse(f) : (storeId === 'store_default' ? INITIAL_FUNDS : []));

    const cat = localStorage.getItem(`excel_erp_categories_${storeId}`);
    setCategories(cat ? JSON.parse(cat) : (storeId === 'store_default' ? INITIAL_CATEGORIES : []));

    const t = localStorage.getItem(`excel_erp_transactions_${storeId}`);
    setTransactions(t ? JSON.parse(t) : (storeId === 'store_default' ? INITIAL_TRANSACTIONS : []));

    const q = localStorage.getItem(`excel_erp_quotations_${storeId}`);
    setQuotations(q ? JSON.parse(q) : (storeId === 'store_default' ? INITIAL_QUOTATIONS : []));

    const set = localStorage.getItem(`excel_erp_settings_${storeId}`);
    setSettings(set ? JSON.parse(set) : (storeId === 'store_default' ? INITIAL_SETTINGS : {
      ...INITIAL_SETTINGS,
      enterprise: {
        ...INITIAL_SETTINGS.enterprise,
        name: `CỬA HÀNG THÀNH VIÊN`
      }
    }));

    const us = localStorage.getItem(`excel_erp_users_${storeId}`);
    setUsers(us ? JSON.parse(us) : (storeId === 'store_default' ? INITIAL_USERS : [
      { id: `u_${Date.now()}_admin`, username: 'store_admin', fullName: 'Quản lý cửa hàng', role: 'ADMIN', password: '123', status: 'ACTIVE', storeId: storeId }
    ]));
  };

  // Persist state to LocalStorage
  useEffect(() => {
    localStorage.setItem(`excel_erp_products_${currentStoreId}`, JSON.stringify(products));
  }, [products, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_warehouses_${currentStoreId}`, JSON.stringify(warehouses));
  }, [warehouses, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_customers_${currentStoreId}`, JSON.stringify(customers));
  }, [customers, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_suppliers_${currentStoreId}`, JSON.stringify(suppliers));
  }, [suppliers, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_employees_${currentStoreId}`, JSON.stringify(employees));
  }, [employees, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_funds_${currentStoreId}`, JSON.stringify(funds));
  }, [funds, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_categories_${currentStoreId}`, JSON.stringify(categories));
  }, [categories, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_transactions_${currentStoreId}`, JSON.stringify(transactions));
  }, [transactions, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_quotations_${currentStoreId}`, JSON.stringify(quotations));
  }, [quotations, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_settings_${currentStoreId}`, JSON.stringify(settings));
  }, [settings, currentStoreId]);

  useEffect(() => {
    localStorage.setItem(`excel_erp_users_${currentStoreId}`, JSON.stringify(users));
  }, [users, currentStoreId]);

  useEffect(() => {
    localStorage.setItem('excel_erp_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('excel_erp_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('excel_erp_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('excel_erp_permission_matrix', JSON.stringify(permissionMatrix));
  }, [permissionMatrix]);

  // Pre-fetch all stores and users from Supabase on mount to prevent lockouts on new machines
  useEffect(() => {
    const initSaaSData = async () => {
      if (isSupabaseConfigured()) {
        try {
          const cloudStores = await dbFetchStores();
          if (cloudStores.length > 0) {
            setStores(cloudStores);
            localStorage.setItem('excel_erp_stores', JSON.stringify(cloudStores));
          }
          const cloudUsers = await dbFetchAllUsers();
          if (cloudUsers.length > 0) {
            // Group users by storeId
            const usersByStore: { [storeId: string]: AppUser[] } = {};
            cloudUsers.forEach(u => {
              if (u.storeId) {
                if (!usersByStore[u.storeId]) {
                  usersByStore[u.storeId] = [];
                }
                usersByStore[u.storeId].push(u);
              }
            });
            // Persist to localStorage partitions
            Object.entries(usersByStore).forEach(([storeId, storeUsersList]) => {
              localStorage.setItem(`excel_erp_users_${storeId}`, JSON.stringify(storeUsersList));
            });
            
            // Also update the current users list if it matches currentStoreId
            const currentStoreUsers = usersByStore[currentStoreId];
            if (currentStoreUsers) {
              setUsers(currentStoreUsers);
            }
          }
        } catch (err) {
          console.warn('Lỗi đồng bộ dữ liệu SaaS ban đầu từ Supabase:', err);
        }
      }
    };
    initSaaSData();
  }, [currentStoreId]);

  // Master Data Add/Edit/Delete Handlers
  const handleAddProduct = (item: Product) => setProducts([...products, item]);
  const handleEditProduct = (item: Product) => setProducts(products.map(p => p.id === item.id ? item : p));
  const handleDeleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));

  const handleAddWarehouse = (item: Warehouse) => setWarehouses([...warehouses, item]);
  const handleEditWarehouse = (item: Warehouse) => setWarehouses(warehouses.map(w => w.id === item.id ? item : w));
  const handleDeleteWarehouse = (id: string) => setWarehouses(warehouses.filter(w => w.id !== id));

  const handleAddCustomer = (item: Customer) => setCustomers([...customers, item]);
  const handleEditCustomer = (item: Customer) => setCustomers(customers.map(c => c.id === item.id ? item : c));
  const handleDeleteCustomer = (id: string) => setCustomers(customers.filter(c => c.id !== id));

  const handleAddSupplier = (item: Supplier) => setSuppliers([...suppliers, item]);
  const handleEditSupplier = (item: Supplier) => setSuppliers(suppliers.map(s => s.id === item.id ? item : s));
  const handleDeleteSupplier = (id: string) => setSuppliers(suppliers.filter(s => s.id !== id));

  const handleAddEmployee = (item: Employee) => {
    setEmployees([...employees, item]);
    if (item.username) {
      const newUser: AppUser = {
        id: item.id,
        username: item.username,
        fullName: item.name,
        role: item.role || 'SALES',
        password: item.password || '123',
        status: 'ACTIVE',
        storeId: currentStoreId
      };
      if (!users.some(u => u.username.toLowerCase() === item.username?.toLowerCase())) {
        setUsers(prev => [...prev, newUser]);
      }
    }
  };
  const handleEditEmployee = (item: Employee) => {
    setEmployees(employees.map(e => e.id === item.id ? item : e));
    if (item.username) {
      setUsers(prev => {
        const idx = prev.findIndex(u => u.id === item.id || u.username.toLowerCase() === item.username?.toLowerCase());
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            username: item.username || updated[idx].username,
            fullName: item.name,
            role: item.role || updated[idx].role,
            password: item.password || updated[idx].password
          };
          return updated;
        } else {
          return [...prev, {
            id: item.id,
            username: item.username || '',
            fullName: item.name,
            role: item.role || 'SALES',
            password: item.password || '123',
            status: 'ACTIVE',
            storeId: currentStoreId
          }];
        }
      });
    }
  };
  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleAddFund = (item: FundAccount) => setFunds([...funds, item]);
  const handleEditFund = (item: FundAccount) => setFunds(funds.map(f => f.id === item.id ? item : f));
  const handleDeleteFund = (id: string) => setFunds(funds.filter(f => f.id !== id));

  const handleAddCategory = (item: TransactionCategory) => setCategories([...categories, item]);
  const handleEditCategory = (item: TransactionCategory) => setCategories(categories.map(c => c.id === item.id ? item : c));
  const handleDeleteCategory = (id: string) => setCategories(categories.filter(c => c.id !== id));

  // Transactions Handlers
  const handleAddTransaction = (newTx: Transaction) => setTransactions([...transactions, newTx]);
  const handleDeleteTransaction = (id: string) => setTransactions(transactions.filter(t => t.id !== id));

  // Quotation Handlers
  const handleAddQuotation = (q: Quotation) => setQuotations([...quotations, q]);
  const handleUpdateQuotationStatus = (id: string, status: 'CHO_DUYET' | 'DA_DUYET' | 'DA_XUAT_KHO' | 'HUY') => {
    setQuotations(quotations.map(q => q.id === id ? { ...q, status } : q));
  };
  const handleDeleteQuotation = (id: string) => setQuotations(quotations.filter(q => q.id !== id));

  // Backup and Restore Helpers
  const exportDatabase = () => ({
    products,
    warehouses,
    customers,
    suppliers,
    employees,
    funds,
    categories,
    transactions,
    quotations,
    settings,
    users
  });

  const handleImportBackup = (imported: any) => {
    if (imported.products) setProducts(imported.products);
    if (imported.warehouses) setWarehouses(imported.warehouses);
    if (imported.customers) setCustomers(imported.customers);
    if (imported.suppliers) setSuppliers(imported.suppliers);
    if (imported.employees) setEmployees(imported.employees);
    if (imported.funds) setFunds(imported.funds);
    if (imported.categories) setCategories(imported.categories);
    if (imported.transactions) setTransactions(imported.transactions);
    if (imported.quotations) setQuotations(imported.quotations);
    if (imported.settings) setSettings(imported.settings);
  };

  const handleResetDatabase = () => {
    // 1. Reset all state arrays to empty lists
    setProducts([]);
    setWarehouses([]);
    setCustomers([]);
    setSuppliers([]);
    setEmployees([]);
    setFunds([]);
    setCategories([]);
    setTransactions([]);
    setQuotations([]);
    
    // Save empty arrays to localStorage for current store so they don't load initialData on next refresh
    localStorage.setItem(`excel_erp_products_${currentStoreId}`, '[]');
    localStorage.setItem(`excel_erp_warehouses_${currentStoreId}`, '[]');
    localStorage.setItem(`excel_erp_customers_${currentStoreId}`, '[]');
    localStorage.setItem(`excel_erp_suppliers_${currentStoreId}`, '[]');
    localStorage.setItem(`excel_erp_employees_${currentStoreId}`, '[]');
    localStorage.setItem(`excel_erp_funds_${currentStoreId}`, '[]');
    localStorage.setItem(`excel_erp_categories_${currentStoreId}`, '[]');
    localStorage.setItem(`excel_erp_transactions_${currentStoreId}`, '[]');
    localStorage.setItem(`excel_erp_quotations_${currentStoreId}`, '[]');

    // Keep settings but reset them to non-sample defaults
    const defaultSettings = {
      ...INITIAL_SETTINGS,
      enterprise: {
        name: 'DOANH NGHIỆP TRUNG TÂM',
        taxCode: '',
        address: '',
        phone: '',
        email: '',
        director: '',
        chiefAccountant: ''
      }
    };
    setSettings(defaultSettings);
    localStorage.setItem(`excel_erp_settings_${currentStoreId}`, JSON.stringify(defaultSettings));

    // Keep the current logged in user so they aren't locked out, but clear others
    const defaultAdmin = { 
      id: `u1`, 
      username: 'mai.pt', 
      fullName: 'Phạm Thanh Mai', 
      role: 'ADMIN' as const, 
      password: '123', 
      status: 'ACTIVE' as const,
      storeId: 'store_default'
    };
    const keptUsers = currentUser ? [currentUser] : [defaultAdmin];
    setUsers(keptUsers);
    localStorage.setItem(`excel_erp_users_${currentStoreId}`, JSON.stringify(keptUsers));

    // 2. Best-effort clear in Supabase Cloud for current store only
    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (sb) {
        Promise.all([
          sb.from('products').delete().eq('store_id', currentStoreId),
          sb.from('warehouses').delete().eq('store_id', currentStoreId),
          sb.from('customers').delete().eq('store_id', currentStoreId),
          sb.from('suppliers').delete().eq('store_id', currentStoreId),
          sb.from('employees').delete().eq('store_id', currentStoreId),
          sb.from('funds').delete().eq('store_id', currentStoreId),
          sb.from('categories').delete().eq('store_id', currentStoreId),
          sb.from('transactions').delete().eq('store_id', currentStoreId),
          sb.from('quotations').delete().eq('store_id', currentStoreId),
        ]).then(() => {
          console.log(`Đã reset dữ liệu cloud của cửa hàng: ${currentStoreId}`);
        }).catch(err => {
          console.warn('Lỗi khi dọn dẹp dữ liệu đám mây:', err);
        });
      }
    }
  };

  // Quick Dashboard Metrics Calculations
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: settings.decimalPlaces,
      maximumFractionDigits: settings.decimalPlaces
    }).format(val);
  };

  const getDashboardMetrics = () => {
    // Total Revenue (XUAT_BAN)
    const revenue = transactions
      .filter(t => t.type === 'XUAT_BAN')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Total Cost (NHAP_MUA)
    const cost = transactions
      .filter(t => t.type === 'NHAP_MUA')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Total Cash/Bank funds balance
    const totalFunds = funds.reduce((sum, f) => {
      let balance = f.initialBalance;
      transactions.forEach(t => {
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
    }, 0);

    // Count of products
    const totalProducts = products.length;

    return { revenue, cost, totalFunds, totalProducts };
  };

  const metrics = getDashboardMetrics();

  // Helper to trigger view redirection when tab is changed
  const handleSetTab = (tab: 'BAN_HANG' | 'DANH_MUC' | 'CAI_DAT' | 'CHINH_SUA') => {
    setActiveTab(tab);
    if (tab === 'BAN_HANG') {
      setSelectedView('DASHBOARD');
    } else if (tab === 'DANH_MUC') {
      setSelectedView('DM_HANG_HOA');
    } else if (tab === 'CAI_DAT') {
      const isEnterpriseSetupAllowed = currentUser?.role === 'ADMIN' || !!permissionMatrix?.[currentUser?.role || '']?.enterprise_setup;
      if (isEnterpriseSetupAllowed) {
        setSelectedView('CD_THONG_TIN_DN');
      } else {
        setSelectedView('CD_DOI_MAT_KHAU');
      }
    } else if (tab === 'CHINH_SUA') {
      setSelectedView('CHINH_SUA_WIDGET');
    }
  };

  const handleAddStickyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStickyNote.trim()) {
      setStickyNotes([...stickyNotes, newStickyNote]);
      setNewStickyNote('');
    }
  };

  const handleDeleteStickyNote = (idx: number) => {
    setStickyNotes(stickyNotes.filter((_, i) => i !== idx));
  };

  const bannerGradients = {
    GREEN: 'from-[#107c41] to-[#185e37]',
    BLUE: 'from-blue-800 to-indigo-700',
    PURPLE: 'from-purple-800 to-fuchsia-700',
    SLATE: 'from-slate-800 to-slate-700'
  };
  const themeAccentColors = {
    GREEN: 'text-[#107c41]',
    BLUE: 'text-blue-700',
    PURPLE: 'text-purple-700',
    SLATE: 'text-slate-800'
  };
  const themeColorsApp = {
    GREEN: {
      text: 'text-[#107c41]',
      bg: 'bg-[#107c41]',
      hover: 'hover:bg-[#185e37]',
      focusRing: 'focus:ring-[#107c41]'
    },
    BLUE: {
      text: 'text-blue-800',
      bg: 'bg-blue-800',
      hover: 'hover:bg-blue-950',
      focusRing: 'focus:ring-blue-800'
    },
    PURPLE: {
      text: 'text-purple-800',
      bg: 'bg-purple-800',
      hover: 'hover:bg-purple-950',
      focusRing: 'focus:ring-purple-800'
    },
    SLATE: {
      text: 'text-slate-800',
      bg: 'bg-slate-800',
      hover: 'hover:bg-slate-900',
      focusRing: 'focus:ring-slate-800'
    }
  };
  const currentAppTheme = themeColorsApp[excelTheme] || themeColorsApp.GREEN;

  const quickActionHoverBg = excelTheme === 'GREEN'
    ? 'hover:bg-green-50/40 hover:border-green-200'
    : excelTheme === 'BLUE'
    ? 'hover:bg-blue-50/40 hover:border-blue-200'
    : excelTheme === 'PURPLE'
    ? 'hover:bg-purple-50/40 hover:border-purple-200'
    : 'hover:bg-slate-50/40 hover:border-slate-200';

  const quickActionHoverText = excelTheme === 'GREEN'
    ? 'group-hover:text-[#107c41]'
    : excelTheme === 'BLUE'
    ? 'group-hover:text-blue-800'
    : excelTheme === 'PURPLE'
    ? 'group-hover:text-purple-800'
    : 'group-hover:text-slate-800';

  const themeBadgeColors = {
    GREEN: 'bg-emerald-500/30 text-emerald-100 border-emerald-400/20',
    BLUE: 'bg-blue-500/30 text-blue-100 border-blue-400/20',
    PURPLE: 'bg-purple-500/30 text-purple-100 border-purple-400/20',
    SLATE: 'bg-slate-500/30 text-slate-100 border-slate-400/20'
  };
  const footerBgs = {
    GREEN: 'bg-[#107c41]',
    BLUE: 'bg-blue-800',
    PURPLE: 'bg-purple-800',
    SLATE: 'bg-slate-800'
  };
  const footerBadges = {
    GREEN: 'bg-[#185e37]',
    BLUE: 'bg-blue-950',
    PURPLE: 'bg-purple-950',
    SLATE: 'bg-slate-900'
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden relative z-10">
          {/* Header */}
          <div className="bg-[#107c41] p-6 text-white text-center relative">
            <div className="absolute top-3 right-3 bg-white/10 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider">
              UTC: 2026-07-02
            </div>
            <div className="flex justify-center mb-2">
              <div className="bg-white/20 p-2.5 rounded-full border border-white/20">
                <Layers className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <h1 className="text-lg font-extrabold tracking-wide uppercase font-sans">EXCEL ERP SAAS PLATFORM</h1>
            <p className="text-green-100 text-[11px] font-mono mt-1">CỔNG ĐĂNG NHẬP HỆ THỐNG ERP</p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const username = (form.elements.namedItem('username') as HTMLInputElement).value;
              const password = (form.elements.namedItem('password') as HTMLInputElement).value;
              
              const trimmedUsername = username.trim().toLowerCase();
              let user: AppUser | undefined;
              let resolvedStoreId = currentStoreId;

              // Force dynamic fetch of latest stores and users from Cloud to ensure smooth login on new devices
              let activeStoresList = stores;
              if (isSupabaseConfigured()) {
                try {
                  const cloudStores = await dbFetchStores();
                  if (cloudStores.length > 0) {
                    setStores(cloudStores);
                    activeStoresList = cloudStores;
                    localStorage.setItem('excel_erp_stores', JSON.stringify(cloudStores));
                  }
                  const cloudUsers = await dbFetchAllUsers();
                  if (cloudUsers.length > 0) {
                    const usersByStore: { [storeId: string]: AppUser[] } = {};
                    cloudUsers.forEach(u => {
                      if (u.storeId) {
                        if (!usersByStore[u.storeId]) {
                          usersByStore[u.storeId] = [];
                        }
                        usersByStore[u.storeId].push(u);
                      }
                    });
                    Object.entries(usersByStore).forEach(([storeId, storeUsersList]) => {
                      localStorage.setItem(`excel_erp_users_${storeId}`, JSON.stringify(storeUsersList));
                    });
                    
                    const currentStoreUsers = usersByStore[currentStoreId];
                    if (currentStoreUsers) {
                      setUsers(currentStoreUsers);
                    }
                  }
                } catch (err) {
                  console.warn('Lỗi đồng bộ dữ liệu cloud khi đăng nhập:', err);
                }
              }

              if (trimmedUsername === 'admin') {
                if (password !== '123') {
                  alert('Mật khẩu Admin hệ thống không chính xác!');
                  return;
                }
                user = {
                  id: 'saas_super_admin',
                  username: 'admin',
                  fullName: 'SaaS System Admin',
                  role: 'ADMIN',
                  status: 'ACTIVE'
                };
              } else {
                // Find user in all stores
                for (const store of activeStoresList) {
                  const savedUsersStr = localStorage.getItem(`excel_erp_users_${store.id}`);
                  const storeUsers: AppUser[] = savedUsersStr 
                    ? JSON.parse(savedUsersStr) 
                    : (store.id === 'store_default' 
                        ? INITIAL_USERS 
                        : [{ id: `u_default_admin_${store.id}`, username: 'store_admin', fullName: 'Quản lý cửa hàng', role: 'ADMIN', password: '123', status: 'ACTIVE', storeId: store.id }]);
                  
                  const matched = storeUsers.find(u => u.username.toLowerCase() === trimmedUsername);
                  if (matched) {
                    user = matched;
                    resolvedStoreId = store.id;
                    break;
                  }
                }

                if (!user) {
                  alert('Tên đăng nhập không đúng hoặc không tồn tại trên hệ thống!');
                  return;
                }
                if (user.status === 'INACTIVE') {
                  alert('Tài khoản nhân viên này đã bị khóa!');
                  return;
                }
                if (user.password !== password) {
                  alert('Mật khẩu không chính xác!');
                  return;
                }
              }

              const isSaaSAdmin = user.username === 'admin';
              if (!isSaaSAdmin) {
                const selectedStore = stores.find(s => s.id === resolvedStoreId);
                if (selectedStore && selectedStore.status === 'LOCKED') {
                  alert('Cửa hàng này hiện đang bị khóa bản quyền! Vui lòng liên hệ nhà quản trị SaaS để mở khóa.');
                  return;
                }
                const isExpired = selectedStore ? new Date(selectedStore.expiryDate) < new Date() : false;
                if (isExpired) {
                  alert(`Cửa hàng này đã hết hạn đăng ký bản quyền sử dụng (${selectedStore?.expiryDate})! Vui lòng liên hệ quản trị viên SaaS để gia hạn.`);
                  return;
                }

                // Automatically load and switch context to this store
                handleSwitchStore(resolvedStoreId);
              }
              
              setCurrentUser(user);
              if (user.username === 'admin') {
                setIsAdminViewingSaaS(true);
              } else {
                setIsAdminViewingSaaS(false);
                setActiveTab('BAN_HANG');
                setSelectedView('DASHBOARD');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Tên đăng nhập</label>
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="Nhập tên đăng nhập của bạn"
                  className="w-full text-xs p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#107c41] focus:border-[#107c41] bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Mật khẩu hệ thống</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full text-xs p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#107c41] focus:border-[#107c41] bg-slate-50 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#107c41] hover:bg-[#185e37] text-white font-bold py-3 rounded transition-all duration-200 shadow-md text-xs uppercase tracking-wider cursor-pointer"
              >
                Đăng Nhập Hệ Thống
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 text-center">
            <span className="text-[10px] text-gray-400 font-mono">
              Hệ thống ERP an toàn • Tự động lưu trữ ngoại tuyến
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.username === 'admin' && isAdminViewingSaaS) {
    return (
      <SaaSAdminManager
        stores={stores}
        setStores={setStores}
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          setIsAdminViewingSaaS(true);
        }}
        excelTheme={excelTheme}
        onSelectStoreERP={(storeId) => {
          handleSwitchStore(storeId);
          setIsAdminViewingSaaS(false);
          setActiveTab('BAN_HANG');
          setSelectedView('DASHBOARD');
        }}
        getERPDataSnapshot={exportDatabase}
      />
    );
  }

  const activeStore = stores.find(s => s.id === currentStoreId);
  const activeStoreExpiry = activeStore ? activeStore.expiryDate : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-slate-800" id="sales-management-app">
      {/* Super Admin Back to SaaS bar */}
      {currentUser?.username === 'admin' && (
        <div className="bg-slate-950 text-slate-100 px-6 py-2.5 text-xs flex justify-between items-center border-b border-slate-800 shadow-sm font-sans">
          <div className="flex items-center space-x-2 font-mono">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span>Bạn đang giám sát dữ liệu ERP của cửa hàng: <strong className="text-emerald-400 font-bold">{stores.find(s => s.id === currentStoreId)?.name || currentStoreId}</strong></span>
          </div>
          <button
            onClick={() => setIsAdminViewingSaaS(true)}
            className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-400/20 text-white font-extrabold px-3.5 py-1.5 rounded transition-all cursor-pointer text-[11px] shadow-sm flex items-center space-x-1"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Quay lại Admin Panel</span>
          </button>
        </div>
      )}

      {/* Excel Ribbon Control Bar */}
      <Ribbon
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        decimalPlaces={settings.decimalPlaces}
        workingPeriod={settings.workingPeriod}
        excelTheme={excelTheme}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        permissionMatrix={permissionMatrix}
        expiryDate={activeStoreExpiry}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Sticky notes (Excel Shapes/Ghi Chú) layer */}
        {stickyNotes.length > 0 && (
          <div className="absolute right-4 top-4 z-40 space-y-2 pointer-events-none max-w-xs">
            {stickyNotes.map((noteText, idx) => (
              <div
                key={idx}
                className="bg-yellow-100 border-2 border-yellow-300 text-yellow-900 rounded p-3 shadow-lg pointer-events-auto relative animate-bounce"
              >
                <button
                  onClick={() => handleDeleteStickyNote(idx)}
                  className="absolute right-1 top-1 text-yellow-700 hover:text-red-600 font-bold text-xs"
                >
                  ✕
                </button>
                <span className="font-mono text-[9px] font-bold text-yellow-600 block mb-1">📌 STICKY SHAPE NOTE:</span>
                <p className="text-[11px] leading-normal font-sans font-medium">{noteText}</p>
              </div>
            ))}
          </div>
        )}

        {/* WELCOME / DASHBOARD IF SELECTED */}
        {selectedView === 'DASHBOARD' && (
          <div className="p-6 overflow-auto flex-1 bg-slate-50/50">
            {/* Enterprise Header Banner */}
            <div className={`bg-gradient-to-r ${bannerGradients[excelTheme]} text-white p-6 rounded-lg shadow-sm mb-6 relative overflow-hidden transition-all duration-200`}>
              <div className="absolute right-0 top-0 opacity-10 translate-x-12 translate-y-[-10px] select-none pointer-events-none">
                <ClipboardList className="h-64 w-64" />
              </div>
              <h1 className="text-xl font-extrabold tracking-wide uppercase">{settings.enterprise.name}</h1>
              <p className="text-xs text-green-100 mt-1 flex items-center space-x-1.5">
                <span>📍 {settings.enterprise.address}</span>
                <span>•</span>
                <span>📞 {settings.enterprise.phone}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeStoreExpiry && (
                  <span className="bg-amber-400 text-slate-900 border border-amber-300 text-[10px] px-3 py-1 rounded-full font-bold flex items-center space-x-1 shadow-sm">
                    <span className="h-1.5 w-1.5 bg-slate-900 rounded-full inline-block animate-pulse"></span>
                    <span>Bản quyền ERP đến: {activeStoreExpiry}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">DOANH THU THUẦN</span>
                  <span className={`text-base font-black ${themeAccentColors[excelTheme]} font-mono mt-1 block transition-colors duration-200`}>
                    {formatCurrency(metrics.revenue)}
                  </span>
                </div>
                <div className="p-2 bg-green-50 rounded text-green-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">CHI MUA HÀNG HÓA</span>
                  <span className="text-base font-black text-blue-600 font-mono mt-1 block">
                    {formatCurrency(metrics.cost)}
                  </span>
                </div>
                <div className="p-2 bg-blue-50 rounded text-blue-700">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">SỐ DƯ QUỸ TIỀN TỆ</span>
                  <span className="text-base font-black text-emerald-700 font-mono mt-1 block">
                    {formatCurrency(metrics.totalFunds)}
                  </span>
                </div>
                <div className="p-2 bg-emerald-50 rounded text-emerald-700">
                  <Building className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">DANH MỤC MẶT HÀNG</span>
                  <span className="text-base font-black text-indigo-700 font-mono mt-1 block">
                    {metrics.totalProducts} dòng hàng
                  </span>
                </div>
                <div className="p-2 bg-indigo-50 rounded text-indigo-700">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-gray-700 tracking-wider uppercase font-mono mb-3 border-b border-gray-100 pb-1.5 flex items-center space-x-1">
                  <Sparkles className={`h-4 w-4 ${currentAppTheme.text}`} />
                  <span>TRUY CẬP NHANH PHÁT SINH</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedView('XUAT_BAN')}
                    className={`p-3 text-left border border-gray-100 rounded ${quickActionHoverBg} transition group`}
                  >
                    <span className={`font-bold text-xs text-gray-700 block ${quickActionHoverText}`}>Xuất Bán Hàng</span>
                    <span className="text-[10px] text-gray-400">Ghi sổ hóa đơn bán sỉ lẻ</span>
                  </button>
                  <button
                    onClick={() => setSelectedView('NHAP_MUA')}
                    className={`p-3 text-left border border-gray-100 rounded ${quickActionHoverBg} transition group`}
                  >
                    <span className={`font-bold text-xs text-gray-700 block ${quickActionHoverText}`}>Nhập Mua Hàng</span>
                    <span className="text-[10px] text-gray-400">Ghi sổ nhập kho từ NCC</span>
                  </button>
                  <button
                    onClick={() => setSelectedView('THU_TIEN_KH')}
                    className={`p-3 text-left border border-gray-100 rounded ${quickActionHoverBg} transition group`}
                  >
                    <span className={`font-bold text-xs text-gray-700 block ${quickActionHoverText}`}>Thu Tiền Khách</span>
                    <span className="text-[10px] text-gray-400">Ghi nhận thanh lý nợ</span>
                  </button>
                  <button
                    onClick={() => setSelectedView('TRA_TIEN_NCC')}
                    className={`p-3 text-left border border-gray-100 rounded ${quickActionHoverBg} transition group`}
                  >
                    <span className={`font-bold text-xs text-gray-700 block ${quickActionHoverText}`}>Trả Tiền Đối Tác</span>
                    <span className="text-[10px] text-gray-400">Ghi chi hạch toán nợ nần</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-gray-700 tracking-wider uppercase font-mono mb-3 border-b border-gray-100 pb-1.5 flex items-center space-x-1">
                  <BarChart className="h-4 w-4 text-blue-600" />
                  <span>XEM THỐNG KÊ SỔ KẾ TOÁN</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedView('BC_LAI_LO')}
                    className="p-3 text-left border border-gray-100 rounded hover:bg-blue-50/40 hover:border-blue-200 transition group"
                  >
                    <span className="font-bold text-xs text-gray-700 block group-hover:text-blue-700">Hạch Toán Lãi Lỗ</span>
                    <span className="text-[10px] text-gray-400">Doanh thu, giá vốn, chi phí</span>
                  </button>
                  <button
                    onClick={() => setSelectedView('BC_TH_NXT')}
                    className="p-3 text-left border border-gray-100 rounded hover:bg-blue-50/40 hover:border-blue-200 transition group"
                  >
                    <span className="font-bold text-xs text-gray-700 block group-hover:text-blue-700">Nhập Xuất Tồn</span>
                    <span className="text-[10px] text-gray-400">Báo cáo kho chi tiết</span>
                  </button>
                  <button
                    onClick={() => setSelectedView('BC_SO_QUY')}
                    className="p-3 text-left border border-gray-100 rounded hover:bg-blue-50/40 hover:border-blue-200 transition group"
                  >
                    <span className="font-bold text-xs text-gray-700 block group-hover:text-blue-700">Sổ Quỹ Tiền Tệ</span>
                    <span className="text-[10px] text-gray-400">Dòng tiền mặt, ngân hàng</span>
                  </button>
                  <button
                    onClick={() => setSelectedView('BC_TH_CONG_NO')}
                    className="p-3 text-left border border-gray-100 rounded hover:bg-blue-50/40 hover:border-blue-200 transition group"
                  >
                    <span className="font-bold text-xs text-gray-700 block group-hover:text-blue-700">Công Nợ Tổng Hợp</span>
                    <span className="text-[10px] text-gray-400">Tra cứu nợ KH & NCC</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CHỈNH SỬA & TRANG TRÍ (SHAPES, FONT, ALIGNMENT, NUMBER, INSERTTEXT TOOL VIEW) */}
        {selectedView === 'CHINH_SUA_WIDGET' && (
          <div className="p-6 overflow-auto flex-1 bg-white max-w-2xl mx-auto border border-gray-200 rounded shadow-sm my-6">
            <h2 className="text-sm font-bold text-gray-800 uppercase border-b border-gray-200 pb-2 mb-4">
              CÔNG CỤ THIẾT KẾ & TRANG TRÍ BÁO CÁO (EXCEL FORMAT)
            </h2>
            <div className="space-y-6 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-gray-600 block">1. LÀM ĐẸP CHỦ ĐỀ SỔ SÁCH (THEME COLOR):</span>
                <p className="text-gray-400 text-[11px]">Đổi màu biểu tượng và thanh tiêu đề Ribbon theo nhận diện thương hiệu:</p>
                <div className="flex space-x-3 pt-1">
                  <button onClick={() => setExcelTheme('GREEN')} className={`px-3 py-1.5 rounded font-bold text-xs border ${excelTheme === 'GREEN' ? 'bg-[#107c41] text-white border-[#107c41]' : 'bg-gray-100 text-gray-700'}`}>
                    Classic Excel Green
                  </button>
                  <button onClick={() => setExcelTheme('BLUE')} className={`px-3 py-1.5 rounded font-bold text-xs border ${excelTheme === 'BLUE' ? 'bg-blue-700 text-white border-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    Navy Enterprise Blue
                  </button>
                  <button onClick={() => setExcelTheme('PURPLE')} className={`px-3 py-1.5 rounded font-bold text-xs border ${excelTheme === 'PURPLE' ? 'bg-purple-700 text-white border-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    Royal Purple Accent
                  </button>
                  <button onClick={() => setExcelTheme('SLATE')} className={`px-3 py-1.5 rounded font-bold text-xs border ${excelTheme === 'SLATE' ? 'bg-slate-800 text-white border-slate-800' : 'bg-gray-100 text-gray-700'}`}>
                    Corporate Slate Gray
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-gray-600 block">2. CỠ CHỮ BÁO CÁO (FONT SIZE):</span>
                <div className="flex space-x-3 pt-1">
                  {[12, 14, 16].map(sz => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz as any)}
                      className={`px-3 py-1 border rounded text-xs font-mono transition-colors ${fontSize === sz ? `${currentAppTheme.bg} text-white font-bold` : 'bg-white text-gray-700'}`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-gray-600 block">3. TIÊU ĐỀ SẮC NÉT (HEADER STYLE):</span>
                <label className="flex items-center space-x-2 cursor-pointer font-bold select-none pt-1">
                  <input
                    type="checkbox"
                    checked={boldHeaders}
                    onChange={(e) => setBoldHeaders(e.target.checked)}
                    className={`h-4 w-4 ${currentAppTheme.text} ${currentAppTheme.focusRing}`}
                  />
                  <span>Tự động viết đậm các thanh tiêu đề (Bold Column Headers)</span>
                </label>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4">
                <span className="font-bold text-gray-600 block">4. CHÈN SHAPE NỐT GHI CHÚ (INSERT TEXT SHAPES):</span>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Thiết kế một Sticky Shape màu vàng nổi bên góc phải màn hình để nhắc nhở công việc, ghi nhớ hạn nợ hoặc chỉ tiêu doanh số trực tiếp trong kỳ.
                </p>
                
                <form onSubmit={handleAddStickyNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhắc nhở KH001 hẹn thanh toán 15.500.000đ ngày mai..."
                    value={newStickyNote}
                    onChange={(e) => setNewStickyNote(e.target.value)}
                    className={`flex-1 text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 ${currentAppTheme.focusRing}`}
                  />
                  <button
                    type="submit"
                    className={`${currentAppTheme.bg} ${currentAppTheme.hover} text-white px-4 py-2 rounded font-bold transition`}
                  >
                    Chèn Ghi Chú
                  </button>
                </form>

                {stickyNotes.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Danh sách nốt ghi chú đã chèn:</span>
                    <div className="space-y-1">
                      {stickyNotes.map((nt, i) => (
                        <div key={i} className="flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-200">
                          <span className="truncate max-w-md font-medium text-yellow-900">{nt}</span>
                          <button onClick={() => handleDeleteStickyNote(i)} className="text-red-500 font-bold hover:underline">Xoá</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. MASTER DATA VIEW */}
        {selectedView.startsWith('DM_') && (
          <CategoryManager
            view={selectedView}
            products={products}
            warehouses={warehouses}
            customers={customers}
            suppliers={suppliers}
            employees={employees}
            funds={funds}
            categories={categories}
            transactions={transactions}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddWarehouse={handleAddWarehouse}
            onEditWarehouse={handleEditWarehouse}
            onDeleteWarehouse={handleDeleteWarehouse}
            onAddCustomer={handleAddCustomer}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddSupplier={handleAddSupplier}
            onEditSupplier={handleEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onAddFund={handleAddFund}
            onEditFund={handleEditFund}
            onDeleteFund={handleDeleteFund}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            decimalPlaces={settings.decimalPlaces}
            excelTheme={excelTheme}
            currentUser={currentUser}
          />
        )}

        {/* 2. TRANSACTION ENTRY VIEW */}
        {['NHAP_MUA', 'XUAT_BAN', 'TRA_TIEN_NCC', 'THU_TIEN_KH', 'TRA_HANG_NCC', 'KH_TRA_HANG', 'CHUYEN_KHO', 'CHUYEN_QUY', 'THU_CHI_KHAC', 'TAM_UNG_HOAN_UNG'].includes(selectedView) && (
          <TransactionManager
            view={selectedView}
            transactions={transactions}
            products={products}
            warehouses={warehouses}
            customers={customers}
            suppliers={suppliers}
            employees={employees}
            funds={funds}
            categories={categories}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            decimalPlaces={settings.decimalPlaces}
            excelTheme={excelTheme}
            workingPeriod={settings.workingPeriod}
          />
        )}

        {/* 3. REPORT VIEWS */}
        {selectedView.startsWith('BC_') && selectedView !== 'BC_THE_KHO_DETAIL' && (
          <ReportsManager
            view={selectedView}
            transactions={transactions}
            products={products}
            warehouses={warehouses}
            customers={customers}
            suppliers={suppliers}
            funds={funds}
            categories={categories}
            decimalPlaces={settings.decimalPlaces}
            excelTheme={excelTheme}
            workingPeriod={settings.workingPeriod}
          />
        )}

        {/* 4. QUOTATION VIEW */}
        {selectedView === 'BAO_GIA' && (
          <QuotationManager
            quotations={quotations}
            products={products}
            customers={customers}
            onAddQuotation={handleAddQuotation}
            onUpdateQuotationStatus={handleUpdateQuotationStatus}
            onDeleteQuotation={handleDeleteQuotation}
            decimalPlaces={settings.decimalPlaces}
            excelTheme={excelTheme}
          />
        )}

        {/* 5. SETTINGS VIEW */}
        {selectedView.startsWith('CD_') && (
          <SettingsManager
            view={selectedView}
            settings={settings}
            onUpdateSettings={setSettings}
            onResetDatabase={handleResetDatabase}
            onImportBackup={handleImportBackup}
            exportDatabase={exportDatabase}
            excelTheme={excelTheme}
            users={users}
            onUpdateUsers={setUsers}
            permissionMatrix={permissionMatrix}
            onUpdatePermissionMatrix={setPermissionMatrix}
            currentUser={currentUser}
            onUpdateCurrentUser={setCurrentUser}
          />
        )}
      </div>
    </div>
  );
}
