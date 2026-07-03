import React, { useState, useEffect } from 'react';
import { Store, AppUser, Product, Warehouse, Customer, Supplier, Employee, FundAccount, TransactionCategory, Transaction, Quotation, SystemSettings } from '../types';
import {
  Plus, Shield, Lock, Unlock, Calendar, Search, Database, Copy, Check, Trash2,
  AlertTriangle, Activity, Clock, Building2, UserCheck, RefreshCw, LogOut,
  ExternalLink, Mail, Phone, Sparkles, Filter, CheckCircle2
} from 'lucide-react';
import { isSupabaseConfigured, getSupabaseSQLSchema, dbFetchStores, dbSaveStore, dbDeleteStore, dbPushAllStoreData, dbSaveUser, dbTestConnection } from '../lib/supabase';

interface SaaSAdminManagerProps {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
  currentUser: AppUser | null;
  onLogout: () => void;
  excelTheme?: string;
  // Callback to enter a selected store's ERP interface
  onSelectStoreERP: (storeId: string) => void;
  // Access all active state of ERP to trigger cloud sync push
  getERPDataSnapshot: () => {
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
  };
}

export default function SaaSAdminManager({
  stores,
  setStores,
  currentUser,
  onLogout,
  excelTheme = 'GREEN',
  onSelectStoreERP,
  getERPDataSnapshot
}: SaaSAdminManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [testConnStatus, setTestConnStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });

  // Modal State for Adding Store
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreOwner, setNewStoreOwner] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreEmail, setNewStoreEmail] = useState('');
  const [subscriptionTerm, setSubscriptionTerm] = useState<'3' | '6' | '12' | 'CUSTOM'>('12');
  const [customExpiryDate, setCustomExpiryDate] = useState('2027-12-31');
  
  // Custom Admin details for newly added store
  const [adminUsername, setAdminUsername] = useState('store_admin');
  const [adminPassword, setAdminPassword] = useState('123');
  const [adminFullName, setAdminFullName] = useState('Quản lý cửa hàng');

  // Modal State for Extension (Gia hạn)
  const [extendingStore, setExtendingStore] = useState<Store | null>(null);
  const [extensionMonths, setExtensionMonths] = useState<number>(12);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extensionType, setExtensionType] = useState<'PREDEFINED' | 'CUSTOM'>('PREDEFINED');
  const [customExtensionDate, setCustomExtensionDate] = useState('');

  // Modal State for Managing Store Admins
  const [managingStoreAdmin, setManagingStoreAdmin] = useState<Store | null>(null);
  const [storeAdminAccounts, setStoreAdminAccounts] = useState<AppUser[]>([]);
  const [editingAdminUser, setEditingAdminUser] = useState<AppUser | null>(null);

  // Form State for Adding / Editing Admin Account
  const [saasAdminUsername, setSaasAdminUsername] = useState('');
  const [saasAdminPassword, setSaasAdminPassword] = useState('');
  const [saasAdminFullName, setSaasAdminFullName] = useState('');
  const [saasAdminStatus, setSaasAdminStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Supabase Configuration Status
  const hasCloudDb = isSupabaseConfigured();

  // Load stores from Supabase if configured, otherwise they are initialized from local state
  useEffect(() => {
    const fetchCloudStores = async () => {
      if (hasCloudDb) {
        const cloudStores = await dbFetchStores();
        if (cloudStores.length > 0) {
          setStores(cloudStores);
        }
      }
    };
    fetchCloudStores();
  }, [hasCloudDb]);

  // Handle Copying SQL Schema to clipboard
  const handleCopySQL = () => {
    navigator.clipboard.writeText(getSupabaseSQLSchema());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create Store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    let expiryDate = '';
    if (subscriptionTerm === 'CUSTOM') {
      expiryDate = customExpiryDate;
    } else {
      const months = parseInt(subscriptionTerm);
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      expiryDate = date.toISOString().split('T')[0];
    }

    const newStore: Store = {
      id: `store_${Date.now()}`,
      name: newStoreName.trim(),
      ownerName: newStoreOwner.trim() || 'Chưa cập nhật',
      phone: newStorePhone.trim() || 'Chưa cập nhật',
      email: newStoreEmail.trim() || 'Chưa cập nhật',
      status: 'ACTIVE',
      expiryDate: expiryDate,
      createdAt: new Date().toISOString()
    };

    // Create custom administrator account for this store
    const storeAdminUser: AppUser = {
      id: `u_${Date.now()}_admin`,
      username: adminUsername.trim().toLowerCase() || 'store_admin',
      fullName: adminFullName.trim() || 'Quản lý cửa hàng',
      role: 'ADMIN',
      password: adminPassword || '123',
      status: 'ACTIVE',
      storeId: newStore.id
    };

    const updatedStores = [newStore, ...stores];
    setStores(updatedStores);
    localStorage.setItem('excel_erp_stores', JSON.stringify(updatedStores));
    
    // Save newly created admin user to local partition
    localStorage.setItem(`excel_erp_users_${newStore.id}`, JSON.stringify([storeAdminUser]));

    // Save to Supabase if configured
    if (hasCloudDb) {
      await dbSaveStore(newStore);
      await dbSaveUser(storeAdminUser);
    }

    // Reset Form
    setNewStoreName('');
    setNewStoreOwner('');
    setNewStorePhone('');
    setNewStoreEmail('');
    setAdminUsername('store_admin');
    setAdminPassword('123');
    setAdminFullName('Quản lý cửa hàng');
    setIsAddModalOpen(false);
  };

  // Toggle Store Status (Lock/Unlock)
  const handleToggleStoreStatus = async (store: Store) => {
    const nextStatus = store.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const updated = stores.map(s => {
      if (s.id === store.id) {
        return { ...s, status: nextStatus as 'ACTIVE' | 'LOCKED' };
      }
      return s;
    });

    setStores(updated);
    localStorage.setItem('excel_erp_stores', JSON.stringify(updated));

    if (hasCloudDb) {
      await dbSaveStore({ ...store, status: nextStatus as 'ACTIVE' | 'LOCKED' });
    }
  };

  // Open Store Admin Management Modal
  const handleOpenManageAdmins = (store: Store) => {
    setManagingStoreAdmin(store);
    const savedUsersStr = localStorage.getItem(`excel_erp_users_${store.id}`);
    let storeUsers: AppUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
    
    // Filter only admins
    const admins = storeUsers.filter(u => u.role === 'ADMIN');
    
    // If no administrator profile exists, build a default one matching the store_admin convention
    if (admins.length === 0) {
      const defaultAdmin: AppUser = {
        id: `u_default_admin_${store.id}`,
        username: 'store_admin',
        fullName: 'Quản lý cửa hàng',
        role: 'ADMIN',
        password: '123',
        status: 'ACTIVE',
        storeId: store.id
      };
      const updatedUsers = [defaultAdmin, ...storeUsers];
      localStorage.setItem(`excel_erp_users_${store.id}`, JSON.stringify(updatedUsers));
      setStoreAdminAccounts([defaultAdmin]);
    } else {
      setStoreAdminAccounts(admins);
    }
    
    // Reset/Clear input fields
    setEditingAdminUser(null);
    setSaasAdminUsername('');
    setSaasAdminPassword('');
    setSaasAdminFullName('');
    setSaasAdminStatus('ACTIVE');
  };

  // Add / Edit Admin Account
  const handleSaveAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingStoreAdmin) return;

    if (!saasAdminUsername.trim() || !saasAdminFullName.trim() || !saasAdminPassword.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    const savedUsersStr = localStorage.getItem(`excel_erp_users_${managingStoreAdmin.id}`);
    let storeUsers: AppUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];

    let updatedAdmin: AppUser;

    if (editingAdminUser) {
      // Edit mode
      updatedAdmin = {
        ...editingAdminUser,
        username: saasAdminUsername.trim().toLowerCase(),
        password: saasAdminPassword.trim(),
        fullName: saasAdminFullName.trim(),
        status: saasAdminStatus
      };

      storeUsers = storeUsers.map(u => u.id === editingAdminUser.id ? updatedAdmin : u);
    } else {
      // Add mode
      const isUsernameDuplicate = storeUsers.some(u => u.username.toLowerCase() === saasAdminUsername.trim().toLowerCase());
      if (isUsernameDuplicate) {
        alert('Tên đăng nhập này đã tồn tại ở cửa hàng này!');
        return;
      }

      updatedAdmin = {
        id: `u_${Date.now()}_admin`,
        username: saasAdminUsername.trim().toLowerCase(),
        fullName: saasAdminFullName.trim(),
        role: 'ADMIN',
        password: saasAdminPassword.trim(),
        status: saasAdminStatus,
        storeId: managingStoreAdmin.id
      };

      storeUsers.push(updatedAdmin);
    }

    localStorage.setItem(`excel_erp_users_${managingStoreAdmin.id}`, JSON.stringify(storeUsers));
    
    // Refresh list in UI
    const admins = storeUsers.filter(u => u.role === 'ADMIN');
    setStoreAdminAccounts(admins);

    // Save to Cloud Db if configured
    if (hasCloudDb) {
      await dbSaveUser(updatedAdmin);
    }

    // Reset Editing status
    setEditingAdminUser(null);
    setSaasAdminUsername('');
    setSaasAdminPassword('');
    setSaasAdminFullName('');
    setSaasAdminStatus('ACTIVE');
    
    alert('Đã cập nhật thông tin tài khoản quản trị!');
  };

  // Start editing a specific admin
  const handleStartEditAdmin = (admin: AppUser) => {
    setEditingAdminUser(admin);
    setSaasAdminUsername(admin.username);
    setSaasAdminPassword(admin.password || '123');
    setSaasAdminFullName(admin.fullName);
    setSaasAdminStatus(admin.status || 'ACTIVE');
  };

  // Delete/Remove admin
  const handleDeleteAdminAccount = async (adminId: string) => {
    if (!managingStoreAdmin) return;
    if (storeAdminAccounts.length <= 1) {
      alert('Không thể xóa! Cửa hàng phải giữ lại ít nhất 1 tài khoản quản trị.');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản quản trị này?')) return;

    const savedUsersStr = localStorage.getItem(`excel_erp_users_${managingStoreAdmin.id}`);
    let storeUsers: AppUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];

    storeUsers = storeUsers.filter(u => u.id !== adminId);
    localStorage.setItem(`excel_erp_users_${managingStoreAdmin.id}`, JSON.stringify(storeUsers));

    // Refresh list in UI
    const admins = storeUsers.filter(u => u.role === 'ADMIN');
    setStoreAdminAccounts(admins);

    alert('Đã xóa tài khoản quản trị thành công!');
  };

  // Extend Subscription (Gia hạn)
  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingStore) return;

    let newExpiry = '';
    if (extensionType === 'CUSTOM') {
      if (!customExtensionDate) {
        alert('Vui lòng chọn ngày hết hạn tùy chỉnh hợp lệ!');
        return;
      }
      newExpiry = customExtensionDate;
    } else {
      const currentExpiry = new Date(extendingStore.expiryDate);
      const baseline = currentExpiry < new Date() ? new Date() : currentExpiry; // Extend from now if already expired
      baseline.setMonth(baseline.getMonth() + extensionMonths);
      newExpiry = baseline.toISOString().split('T')[0];
    }

    const updated = stores.map(s => {
      if (s.id === extendingStore.id) {
        return { ...s, expiryDate: newExpiry };
      }
      return s;
    });

    setStores(updated);
    localStorage.setItem('excel_erp_stores', JSON.stringify(updated));

    if (hasCloudDb) {
      await dbSaveStore({ ...extendingStore, expiryDate: newExpiry });
    }

    setIsExtendModalOpen(false);
    setExtendingStore(null);
  };

  // Delete Store and all related local/cloud data
  const handleDeleteStore = async (storeId: string) => {
    if (storeId === 'store_default') {
      alert('Không thể xóa cửa hàng mặc định!');
      return;
    }
    const storeToDelete = stores.find(s => s.id === storeId);
    if (!storeToDelete) return;

    if (!window.confirm(`⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG:\n\nBạn có chắc chắn muốn xóa vĩnh viễn cửa hàng "${storeToDelete.name}"?\nHành động này sẽ xóa hoàn toàn tất cả người dùng, sản phẩm, kho hàng, khách hàng, nhà cung cấp, nhân viên, quỹ tiền, chứng từ phát sinh và cấu hình của riêng cửa hàng này.\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return;
    }

    // 1. Remove from local stores state
    const updated = stores.filter(s => s.id !== storeId);
    setStores(updated);
    localStorage.setItem('excel_erp_stores', JSON.stringify(updated));

    // 2. Clean up local storage data associated with this store id
    const keysToRemove = [
      `excel_erp_users_${storeId}`,
      `excel_erp_products_${storeId}`,
      `excel_erp_warehouses_${storeId}`,
      `excel_erp_customers_${storeId}`,
      `excel_erp_suppliers_${storeId}`,
      `excel_erp_employees_${storeId}`,
      `excel_erp_funds_${storeId}`,
      `excel_erp_categories_${storeId}`,
      `excel_erp_transactions_${storeId}`,
      `excel_erp_quotations_${storeId}`,
      `excel_erp_settings_${storeId}`
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // If the current active store is this one, fallback to store_default
    const currentStoreId = localStorage.getItem('excel_erp_current_store_id');
    if (currentStoreId === storeId) {
      localStorage.setItem('excel_erp_current_store_id', 'store_default');
    }

    // 3. Delete from Supabase cloud database if configured
    if (hasCloudDb) {
      await dbDeleteStore(storeId);
    }

    alert(`Đã xóa vĩnh viễn cửa hàng "${storeToDelete.name}" và toàn bộ dữ liệu thành công!`);
    
    // Close modal if open
    setIsExtendModalOpen(false);
    setExtendingStore(null);
  };

  // Trigger Bulk Cloud Sync for Selected Store
  const handleSyncToCloud = async (storeId: string) => {
    setSyncStatus({ loading: true });
    try {
      const snapshot = getERPDataSnapshot();
      const result = await dbPushAllStoreData(storeId, snapshot);
      setSyncStatus({
        loading: false,
        success: result.success,
        message: result.message
      });
      setTimeout(() => setSyncStatus({ loading: false }), 4000);
    } catch (err: any) {
      setSyncStatus({
        loading: false,
        success: false,
        message: err.message || 'Lỗi không xác định khi đồng bộ.'
      });
    }
  };

  // Test connection to Supabase
  const handleTestConnection = async () => {
    setTestConnStatus({ loading: true });
    try {
      const result = await dbTestConnection();
      setTestConnStatus({
        loading: false,
        success: result.success,
        message: result.message
      });
    } catch (err: any) {
      setTestConnStatus({
        loading: false,
        success: false,
        message: err.message || 'Lỗi không xác định khi kết nối.'
      });
    }
  };

  // Clear all mock data across all stores
  const handleClearAllMockData = () => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ dữ liệu mẫu của tất cả cửa hàng? Hành động này sẽ dọn sạch toàn bộ sản phẩm, hóa đơn, đối tác và chuyển hệ thống về trạng thái mới tinh.')) {
      return;
    }
    
    // 1. Reset stores list to just the default empty store
    const cleanDefaultStore = {
      id: 'store_default',
      name: 'Cửa Hàng Trung Tâm (Mặc Định)',
      ownerName: 'Phạm Thanh Mai',
      phone: '028 3845 6789',
      email: 'admin@erp-saas.com',
      status: 'ACTIVE' as const,
      expiryDate: '2030-12-31',
      createdAt: new Date().toISOString()
    };
    
    setStores([cleanDefaultStore]);
    localStorage.setItem('excel_erp_stores', JSON.stringify([cleanDefaultStore]));
    localStorage.setItem('excel_erp_current_store_id', 'store_default');
    
    // 2. Erase or overwrite all storage keys with empty lists
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('excel_erp_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Now initialize the default store as completely blank (saving empty arrays to prevent automatic sample reload)
    localStorage.setItem('excel_erp_current_store_id', 'store_default');
    localStorage.setItem('excel_erp_products_store_default', '[]');
    localStorage.setItem('excel_erp_warehouses_store_default', '[]');
    localStorage.setItem('excel_erp_customers_store_default', '[]');
    localStorage.setItem('excel_erp_suppliers_store_default', '[]');
    localStorage.setItem('excel_erp_employees_store_default', '[]');
    localStorage.setItem('excel_erp_funds_store_default', '[]');
    localStorage.setItem('excel_erp_categories_store_default', '[]');
    localStorage.setItem('excel_erp_transactions_store_default', '[]');
    localStorage.setItem('excel_erp_quotations_store_default', '[]');
    
    const cleanSettings = {
      enterprise: {
        name: 'CỬA HÀNG TRUNG TÂM (MẶC ĐỊNH)',
        address: '',
        taxCode: '',
        phone: '028 3845 6789',
        email: 'admin@erp-saas.com',
        director: '',
        chiefAccountant: ''
      },
      decimalPlaces: 0,
      workingPeriod: 'Tháng 07/2026',
      backupFrequency: 'MANUAL'
    };
    localStorage.setItem('excel_erp_settings_store_default', JSON.stringify(cleanSettings));
    
    const cleanUser = {
      id: 'u1',
      username: 'mai.pt',
      fullName: 'Phạm Thanh Mai',
      role: 'ADMIN' as const,
      password: '123',
      status: 'ACTIVE' as const,
      storeId: 'store_default'
    };
    localStorage.setItem('excel_erp_users_store_default', JSON.stringify([cleanUser]));
    localStorage.setItem('excel_erp_current_user', JSON.stringify(cleanUser));
    
    alert('Đã xóa sạch toàn bộ dữ liệu mẫu thành công! Hệ thống đã được chuyển về trạng thái trống hoàn toàn.');
    window.location.reload(); // Reload to refresh all state from localStorage
  };

  // Filter stores
  const filteredStores = stores.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate stats
  const totalStoresCount = stores.length;
  const activeStoresCount = stores.filter(s => s.status === 'ACTIVE').length;
  const lockedStoresCount = stores.filter(s => s.status === 'LOCKED').length;
  
  const expiringSoonCount = stores.filter(s => {
    const exp = new Date(s.expiryDate);
    const today = new Date();
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return s.status === 'ACTIVE' && diffDays >= 0 && diffDays <= 30;
  }).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col select-none">
      {/* 1. Header Admin Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded border border-emerald-400/20">
            <Shield className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 uppercase">
              HỆ THỐNG TRUNG TÂM SAAS CLOUD ADMIN
            </h1>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">EXCEL ERP MULTI-STORE PLATFORM SERVICE</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-200">{currentUser?.fullName}</div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center justify-end space-x-1">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>Quản trị viên tối cao</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="bg-slate-850 hover:bg-red-950 hover:text-red-300 border border-slate-700 hover:border-red-800 text-xs text-slate-300 font-bold px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Thoát</span>
          </button>
        </div>
      </div>

      {/* Main SaaS Layout Grid */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg shadow flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">TỔNG SỐ CỬA HÀNG</div>
              <div className="text-2xl font-black text-white mt-1">{totalStoresCount}</div>
            </div>
            <div className="bg-blue-950 text-blue-400 p-3 rounded-full border border-blue-800/30">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg shadow flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">ĐANG HOẠT ĐỘNG</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{activeStoresCount}</div>
            </div>
            <div className="bg-emerald-950 text-emerald-400 p-3 rounded-full border border-emerald-800/30">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg shadow flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">ĐANG BỊ KHÓA</div>
              <div className="text-2xl font-black text-rose-500 mt-1">{lockedStoresCount}</div>
            </div>
            <div className="bg-rose-950 text-rose-400 p-3 rounded-full border border-rose-800/30">
              <Lock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg shadow flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">SẮP HẾT HẠN (30 NGÀY)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{expiringSoonCount}</div>
            </div>
            <div className="bg-amber-950 text-amber-400 p-3 rounded-full border border-amber-800/30">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Database Sync Status Alert */}
        <div className={`p-4 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          hasCloudDb
            ? 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
            : 'bg-amber-950/20 border-amber-800 text-amber-200'
        }`}>
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded mt-0.5 ${hasCloudDb ? 'bg-emerald-900/30' : 'bg-amber-900/30'}`}>
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {hasCloudDb ? '⚡ DATABASE ĐÁM MÂY SUPABASE: ĐÃ KẾT NỐI' : '⚠️ CHẾ ĐỘ MÔ PHỎNG NGOẠI TUYẾN (LOCAL STORAGE)'}
              </h4>
              <p className="text-[11px] opacity-80 mt-0.5 font-mono leading-relaxed">
                {hasCloudDb
                  ? 'Tất cả các hành động tạo, khóa, mở khóa, gia hạn cửa hàng sẽ được tự động đồng bộ hóa thời gian thực lên Supabase.'
                  : 'Supabase chưa được cấu hình. Hệ thống đang tự động lưu trữ dữ liệu các cửa hàng độc lập trong LocalStorage. Hãy thêm các tham số VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào file .env để chuyển sang đám mây.'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
            <button
              onClick={handleTestConnection}
              disabled={testConnStatus.loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-[10px] font-bold rounded border border-slate-700 transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              title="Nhấp để kiểm tra kết nối tới Supabase thực tế"
            >
              <RefreshCw className={`h-3 w-3 ${testConnStatus.loading ? 'animate-spin' : ''}`} />
              <span>Kiểm tra kết nối</span>
            </button>
            {hasCloudDb && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-1.5 rounded border border-emerald-500/30 font-bold tracking-wider font-mono">
                ONLINE
              </span>
            )}
          </div>
        </div>

        {/* Test Connection Result Status */}
        {testConnStatus.loading && (
          <div className="bg-slate-950 border border-slate-800 text-slate-300 p-3 rounded-lg text-xs flex items-center space-x-2 font-mono animate-pulse">
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
            <span>Đang ping kiểm tra kết nối tới máy chủ Supabase...</span>
          </div>
        )}
        {!testConnStatus.loading && testConnStatus.success !== undefined && (
          <div className={`p-3 rounded-lg text-xs font-mono border flex items-center justify-between gap-2 ${
            testConnStatus.success ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-sm">{testConnStatus.success ? '⚡' : '❌'}</span>
              <span>{testConnStatus.message}</span>
            </div>
            <button 
              onClick={() => setTestConnStatus({ loading: false })}
              className="text-[10px] uppercase font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-800 bg-slate-900"
            >
              Ẩn
            </button>
          </div>
        )}

        {/* Sync loading status */}
        {syncStatus.loading && (
          <div className="bg-blue-950/50 border border-blue-800 text-blue-200 p-3 rounded-lg text-xs flex items-center space-x-2 font-mono">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
            <span>Đang đóng gói và đồng bộ hóa toàn bộ cơ sở dữ liệu lên đám mây...</span>
          </div>
        )}
        {syncStatus.success !== undefined && (
          <div className={`p-3 rounded-lg text-xs font-mono border flex items-center space-x-2 ${
            syncStatus.success ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200' : 'bg-red-950/50 border-red-800 text-red-200'
          }`}>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{syncStatus.message}</span>
          </div>
        )}

        {/* Central Grid Content: Left Stores List, Right SQL/Tech Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: Stores Management (col-span-2) */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider font-sans text-slate-100">
                  Danh Sách Cửa Hàng Doanh Nghiệp (Tenants)
                </span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center space-x-1 transition-all cursor-pointer shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Cửa Hàng</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm cửa hàng, chủ sở hữu, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded text-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Tất cả Trạng thái</option>
                  <option value="ACTIVE">Hoạt động (Active)</option>
                  <option value="LOCKED">Bị Khóa (Locked)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                    <th className="px-4 py-3">Thông Tin Doanh Nghiệp</th>
                    <th className="px-4 py-3">Chủ sở hữu & Liên hệ</th>
                    <th className="px-4 py-3 text-center">Hạn Bản Quyền</th>
                    <th className="px-4 py-3 text-center">Trạng Thái</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs font-sans">
                  {filteredStores.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-500 font-mono">
                        Không tìm thấy cửa hàng nào khớp với điều kiện.
                      </td>
                    </tr>
                  ) : (
                    filteredStores.map((store) => {
                      const isExpired = new Date(store.expiryDate) < new Date();
                      return (
                        <tr key={store.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-4 py-4.5">
                            <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                              <span>{store.name}</span>
                              {store.id === 'store_default' && (
                                <span className="text-[8px] bg-slate-800 border border-slate-700 text-slate-400 px-1 py-0.2 rounded font-mono uppercase">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {store.id}</div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              Khởi tạo: {new Date(store.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </td>
                          <td className="px-4 py-4.5 space-y-1">
                            <div className="font-semibold text-slate-200">{store.ownerName}</div>
                            <div className="flex items-center text-[10px] text-slate-400 space-x-1.5">
                              <span className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {store.email}</span>
                              <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {store.phone}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4.5 text-center">
                            <span className={`px-2 py-1 rounded font-mono text-[11px] font-bold ${
                              isExpired
                                ? 'bg-rose-950/50 border border-rose-800 text-rose-300'
                                : 'bg-slate-900 border border-slate-800 text-slate-100'
                            }`}>
                              {store.expiryDate}
                            </span>
                            {isExpired && (
                              <div className="text-[9px] text-rose-400 font-bold mt-1 animate-pulse font-mono">Hết hạn!</div>
                            )}
                          </td>
                          <td className="px-4 py-4.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              store.status === 'ACTIVE'
                                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                                : 'bg-red-950/40 border-red-800 text-red-400'
                            }`}>
                              {store.status === 'ACTIVE' ? 'Hoạt động' : 'Đã Khóa'}
                            </span>
                          </td>
                          <td className="px-4 py-4.5 text-right space-y-2">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Enter ERP switch */}
                              <button
                                onClick={() => onSelectStoreERP(store.id)}
                                disabled={store.status === 'LOCKED'}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded flex items-center space-x-1 cursor-pointer transition-all ${
                                  store.status === 'LOCKED'
                                    ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                                title="Mở môi trường ERP riêng tư của cửa hàng này"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Truy cập ERP</span>
                              </button>

                              {/* Lock/Unlock */}
                              <button
                                onClick={() => handleToggleStoreStatus(store)}
                                className={`p-1 border rounded transition-colors ${
                                  store.status === 'ACTIVE'
                                    ? 'border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-950 hover:bg-red-950/20'
                                    : 'border-slate-700 text-red-500 hover:text-emerald-400 hover:border-emerald-950 hover:bg-emerald-950/20'
                                }`}
                                title={store.status === 'ACTIVE' ? 'Khóa cửa hàng' : 'Mở khóa cửa hàng'}
                              >
                                {store.status === 'ACTIVE' ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                              </button>

                              {/* Extend */}
                              <button
                                onClick={() => {
                                  setExtendingStore(store);
                                  setIsExtendModalOpen(true);
                                  setExtensionMonths(12);
                                  setExtensionType('PREDEFINED');
                                  setCustomExtensionDate(store.expiryDate);
                                }}
                                className="p-1 border border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-950 hover:bg-amber-950/20 rounded transition-colors"
                                title="Gia hạn bản quyền"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                              </button>

                              {/* Manage Admin Accounts */}
                              <button
                                onClick={() => handleOpenManageAdmins(store)}
                                className="p-1 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-950 hover:bg-emerald-950/20 rounded transition-colors"
                                title="Quản lý Tài khoản Quản trị"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            
                            {/* Cloud Sync backup button (Only available when connected) */}
                            {hasCloudDb && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleSyncToCloud(store.id)}
                                  className="text-[9px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer font-mono"
                                  title="Đồng bộ hóa/Đóng gói dữ liệu mẫu của cửa hàng này"
                                >
                                  <RefreshCw className="h-2.5 w-2.5" />
                                  <span>Sync to Cloud</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Supabase Connection, Tech Stack, & Copyable script */}
          <div className="space-y-6">
            
            {/* Tech details card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-100">
                  CẤU HÌNH ĐA DOANH NGHIỆP SAAS
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Chào mừng bạn đến với mô hình Quản lý Bán hàng <strong>SaaS (Software-as-a-Service)</strong>. Tại đây bạn đóng vai trò là Nhà Cung Cấp phần mềm, cấp quyền sử dụng cho từng Cửa Hàng, Công Ty thành viên:
              </p>
              <ul className="text-[10px] text-slate-300 font-mono space-y-2 list-disc pl-4 leading-relaxed">
                <li>Mỗi cửa hàng có một môi trường hạch toán và cơ sở dữ liệu tách biệt hoàn toàn.</li>
                <li>Hạn bản quyền khóa hoạt động khi quá hạn đăng ký.</li>
                <li>Quản trị viên SaaS có thể trực tiếp <strong>"Truy cập ERP"</strong> của từng cửa hàng để hỗ trợ kỹ thuật hoặc bảo trì.</li>
              </ul>
            </div>

            {/* System Utilities / Clear Sample Data card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Trash2 className="h-4 w-4 text-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-100">
                  TIỆN ÍCH DỌN DẸP HỆ THỐNG
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Hệ thống hiện đang chứa các tệp dữ liệu mẫu ban đầu để thuận tiện chạy thử nghiệm. Bạn có thể dọn dẹp và xóa bỏ hoàn toàn dữ liệu mẫu này bất cứ lúc nào để bàn giao hệ thống trống hoàn toàn cho khách hàng sử dụng thực tế.
              </p>
              <button
                onClick={handleClearAllMockData}
                className="w-full bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 border border-rose-900 font-bold py-2 px-3 rounded flex items-center justify-center space-x-1.5 transition text-[11px] font-mono cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>XÓA SẠCH DỮ LIỆU MẪU (RESET)</span>
              </button>
            </div>

            {/* Supabase integration instruction card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-100">
                    Supabase SQL Editor
                  </span>
                </div>
                <button
                  onClick={handleCopySQL}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-300 flex items-center space-x-1 font-mono cursor-pointer transition-all"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Đã copy' : 'Copy SQL'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Hệ thống hỗ trợ <strong>Supabase</strong> làm hệ quản trị cơ sở dữ liệu SQL đám mây. Bạn có thể sao chép câu lệnh khởi tạo bảng (DDL) để cài đặt cấu trúc bảng và cấp quyền truy cập đầy đủ trong Supabase chỉ với một cú nhấp chuột.
              </p>

              <div className="p-3 bg-amber-950/20 border border-amber-800/40 text-amber-200 text-[10px] rounded leading-relaxed font-sans flex items-start space-x-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Sửa lỗi "Permission Denied" (Lỗi phân quyền):</strong> Nếu gặp lỗi <code>permission denied for table stores</code>, đó là do bạn chưa cấp đủ quyền truy cập bảng cho khóa công khai (API key anon). Script SQL bên dưới đã được bổ sung đầy đủ các lệnh <code>GRANT USAGE/ALL</code> để tự động cấu hình phân quyền hoàn hảo. Hãy sao chép và chạy lại toàn bộ mã SQL mới này trong SQL Editor của Supabase.
                </span>
              </div>

              <div className="text-[10px] bg-slate-900 border border-slate-800 p-3 rounded font-mono max-h-40 overflow-y-auto text-slate-300 space-y-1 scrollbar-thin">
                <pre className="text-emerald-400">// SQL Schema Preview</pre>
                <pre>CREATE TABLE IF NOT EXISTS public.stores (...)</pre>
                <pre>CREATE TABLE IF NOT EXISTS public.app_users (...)</pre>
                <pre>CREATE TABLE IF NOT EXISTS public.products (...)</pre>
                <pre>CREATE TABLE IF NOT EXISTS public.transactions (...)</pre>
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-800/30 text-blue-200 text-[10px] rounded leading-relaxed font-sans flex items-start space-x-1.5">
                <AlertTriangle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Hướng dẫn:</strong> Đăng nhập vào <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline text-blue-400 hover:text-blue-300">Supabase.com</a>, chọn dự án của bạn, mở mục <strong>"SQL Editor"</strong>, bấm <strong>"New Query"</strong>, dán câu lệnh vừa copy và chạy <strong>"Run"</strong>.
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Add Store Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center">
                <Building2 className="h-4 w-4 mr-1.5 text-emerald-400" />
                Đăng Ký Cửa Hàng Thành Viên Mới
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Tên cửa hàng / Doanh nghiệp</label>
                <input
                  type="text"
                  required
                  placeholder="vd: Siêu Thị Mini Thanh Xuân"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Chủ sở hữu</label>
                  <input
                    type="text"
                    placeholder="vd: Nguyễn Văn A"
                    value={newStoreOwner}
                    onChange={(e) => setNewStoreOwner(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="vd: 0987654321"
                    value={newStorePhone}
                    onChange={(e) => setNewStorePhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Thư điện tử (Email)</label>
                <input
                  type="email"
                  placeholder="vd: thanhxuan@gmail.com"
                  value={newStoreEmail}
                  onChange={(e) => setNewStoreEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Store Admin Account Setup Block */}
              <div className="border-t border-slate-850 pt-3.5 space-y-3">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Cấu hình Tài khoản Admin Cửa Hàng</span>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Họ và tên Admin</label>
                  <input
                    type="text"
                    required
                    placeholder="vd: Quản lý cửa hàng"
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Tên đăng nhập</label>
                    <input
                      type="text"
                      required
                      placeholder="vd: store_admin"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Mật khẩu</label>
                    <input
                      type="text"
                      required
                      placeholder="vd: 123"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Hạn Đăng ký Bản quyền</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { val: '3', label: '3 Tháng' },
                    { val: '6', label: '6 Tháng' },
                    { val: '12', label: '1 Năm' },
                    { val: 'CUSTOM', label: 'Tùy chọn' }
                  ].map(term => (
                    <button
                      key={term.val}
                      type="button"
                      onClick={() => setSubscriptionTerm(term.val as any)}
                      className={`py-2 text-center rounded border font-semibold cursor-pointer ${
                        subscriptionTerm === term.val
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {term.label}
                    </button>
                  ))}
                </div>

                {subscriptionTerm === 'CUSTOM' && (
                  <div className="mt-3">
                    <input
                      type="date"
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-4 flex space-x-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 hover:border-slate-600 rounded text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold shadow cursor-pointer"
                >
                  Xác nhận Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Subscription Extension (Gia hạn) Modal */}
      {isExtendModalOpen && extendingStore && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-amber-400" />
                Gia Hạn Đăng Ký Sử Dụng
              </h3>
              <button
                onClick={() => {
                  setIsExtendModalOpen(false);
                  setExtendingStore(null);
                }}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExtendSubscription} className="p-6 space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-mono">TÊN CỬA HÀNG</div>
                <div className="font-extrabold text-slate-100 text-sm">{extendingStore.name}</div>
                <div className="text-[11px] text-slate-400">
                  Ngày hết hạn hiện tại: <strong className="font-mono text-slate-200">{extendingStore.expiryDate}</strong>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Thời gian Gia hạn thêm</label>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  {[
                    { months: 3, label: '+3 Tháng' },
                    { months: 6, label: '+6 Tháng' },
                    { months: 12, label: '+1 Năm' },
                    { months: 24, label: '+2 Năm' },
                    { months: 36, label: '+3 Năm' },
                    { months: -1, label: 'Tùy chọn' }
                  ].map(opt => (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => {
                        if (opt.months === -1) {
                          setExtensionType('CUSTOM');
                          setExtensionMonths(-1);
                        } else {
                          setExtensionType('PREDEFINED');
                          setExtensionMonths(opt.months);
                        }
                      }}
                      className={`py-2 text-center rounded border font-semibold cursor-pointer ${
                        (opt.months === -1 && extensionType === 'CUSTOM') || (extensionType === 'PREDEFINED' && extensionMonths === opt.months)
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {extensionType === 'CUSTOM' && (
                  <div className="mt-3 animate-fadeIn">
                    <label className="block text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1 font-mono">Chọn ngày hết hạn mong muốn</label>
                    <input
                      type="date"
                      required
                      value={customExtensionDate}
                      onChange={(e) => setCustomExtensionDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-amber-500 font-bold font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-4 flex space-x-2 justify-between items-center animate-fadeIn">
                {extendingStore.id !== 'store_default' ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteStore(extendingStore.id)}
                    className="px-3 py-2 bg-red-950/40 border border-red-800 hover:bg-red-900/40 text-red-300 rounded text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa Cửa Hàng Vĩnh Viễn</span>
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExtendModalOpen(false);
                      setExtendingStore(null);
                    }}
                    className="px-4 py-2 border border-slate-700 hover:border-slate-600 rounded text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold shadow cursor-pointer"
                  >
                    Cập nhật Gia hạn
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Manage Store Admins Modal */}
      {managingStoreAdmin && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center">
                  <UserCheck className="h-4 w-4 mr-1.5 text-emerald-400" />
                  Quản lý Tài khoản Quản trị (Admin)
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">Cửa hàng: {managingStoreAdmin.name}</p>
              </div>
              <button
                onClick={() => setManagingStoreAdmin(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content Container */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Top part: List of Current Admins */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Tài khoản Admin Hiện có ({storeAdminAccounts.length})</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {storeAdminAccounts.map((admin) => (
                    <div 
                      key={admin.id} 
                      className={`p-3 rounded border flex flex-col justify-between transition-all ${
                        editingAdminUser?.id === admin.id 
                          ? 'bg-emerald-950/20 border-emerald-500' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-slate-100 text-xs">{admin.fullName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            admin.status === 'INACTIVE' 
                              ? 'bg-red-950/40 text-red-400 border border-red-800/30' 
                              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                          }`}>
                            {admin.status === 'INACTIVE' ? 'Đã Khóa' : 'Hoạt động'}
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1 font-mono text-[10px] text-slate-400">
                          <div>Tên đăng nhập: <strong className="text-slate-200">{admin.username}</strong></div>
                          <div>Mật khẩu: <strong className="text-emerald-400">{admin.password || '123'}</strong></div>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center justify-end space-x-2 border-t border-slate-800/50 pt-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleStartEditAdmin(admin)}
                          className="text-emerald-400 hover:underline font-bold"
                        >
                          Sửa thông tin
                        </button>
                        <span className="text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdminAccount(admin.id)}
                          className="text-rose-400 hover:underline font-bold"
                          disabled={storeAdminAccounts.length <= 1}
                          title={storeAdminAccounts.length <= 1 ? "Phải giữ lại ít nhất 1 admin" : "Xóa tài khoản này"}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom part: Add/Edit Admin Form */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {editingAdminUser ? '✏️ Cập nhật Tài khoản Quản trị' : '➕ Thêm Tài khoản Quản trị mới'}
                </h4>

                <form onSubmit={handleSaveAdminAccount} className="space-y-4 bg-slate-900/60 p-4 rounded border border-slate-850">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Họ và tên Quản trị viên</label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập tên đầy đủ (vd: Nguyễn Văn A)"
                        value={saasAdminFullName}
                        onChange={(e) => setSaasAdminFullName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Trạng thái tài khoản</label>
                      <select
                        value={saasAdminStatus}
                        onChange={(e) => setSaasAdminStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                        className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-bold font-mono"
                      >
                        <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                        <option value="INACTIVE">Khóa tạm thời (INACTIVE)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Tên đăng nhập</label>
                      <input
                        type="text"
                        required
                        placeholder="vd: admin_store"
                        value={saasAdminUsername}
                        onChange={(e) => setSaasAdminUsername(e.target.value)}
                        disabled={!!editingAdminUser} // lock username to prevent conflicts
                        className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Mật khẩu mới</label>
                      <input
                        type="text"
                        required
                        placeholder="Mật khẩu truy cập"
                        value={saasAdminPassword}
                        onChange={(e) => setSaasAdminPassword(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    {editingAdminUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAdminUser(null);
                          setSaasAdminUsername('');
                          setSaasAdminPassword('');
                          setSaasAdminFullName('');
                          setSaasAdminStatus('ACTIVE');
                        }}
                        className="px-3.5 py-1.5 border border-slate-700 hover:border-slate-600 rounded text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Hủy Sửa
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold shadow cursor-pointer flex items-center space-x-1"
                    >
                      <span>{editingAdminUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản admin'}</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setManagingStoreAdmin(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold shadow cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer System Credit */}
      <div className="bg-slate-950 border-t border-slate-850 py-3 text-center text-[10px] text-slate-500 font-mono tracking-wider uppercase">
        © 2026 EXCEL ERP SaaS Multi-Store Provisioning Panel • Secure Sandboxed Sandbox
      </div>
    </div>
  );
}
