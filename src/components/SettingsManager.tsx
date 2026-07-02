/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemSettings, EnterpriseInfo, AppUser } from '../types';
import { Shield, Lock, FileText, Database, Sparkles, RefreshCw, Trash2, Download, Upload, UserCheck, Plus, Edit, Check } from 'lucide-react';

interface SettingsManagerProps {
  view: string;
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onResetDatabase: () => void;
  onImportBackup: (importedData: any) => void;
  exportDatabase: () => any;
  excelTheme?: string;
  users: AppUser[];
  onUpdateUsers: (newUsers: AppUser[]) => void;
  permissionMatrix?: any;
  onUpdatePermissionMatrix?: (newMatrix: any) => void;
  currentUser?: AppUser | null;
  onUpdateCurrentUser?: (user: AppUser | null) => void;
}

export default function SettingsManager({
  view,
  settings,
  onUpdateSettings,
  onResetDatabase,
  onImportBackup,
  exportDatabase,
  excelTheme = 'GREEN',
  users,
  onUpdateUsers,
  permissionMatrix,
  onUpdatePermissionMatrix,
  currentUser,
  onUpdateCurrentUser
}: SettingsManagerProps) {
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

  const [enterprise, setEnterprise] = useState<EnterpriseInfo>({ ...settings.enterprise });
  const [decimalPlaces, setDecimalPlaces] = useState(settings.decimalPlaces);
  const [password, setPassword] = useState('123456');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Local state for user management
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    role: 'SALES' as 'ADMIN' | 'ACCOUNTANT' | 'SALES' | 'STOREKEEPER',
    password: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const handleTogglePermission = (role: 'ACCOUNTANT' | 'SALES' | 'STOREKEEPER', key: string) => {
    if (!permissionMatrix || !onUpdatePermissionMatrix) return;
    const currentRolePerms = permissionMatrix[role] || {};
    const updatedRolePerms = {
      ...currentRolePerms,
      [key]: !currentRolePerms[key]
    };
    const updatedMatrix = {
      ...permissionMatrix,
      [role]: updatedRolePerms
    };
    onUpdatePermissionMatrix(updatedMatrix);
  };

  const renderCell = (role: 'ACCOUNTANT' | 'SALES' | 'STOREKEEPER', key: string, bgClass: string) => {
    const isChecked = !!permissionMatrix?.[role]?.[key];
    return (
      <td className={`p-2.5 border-r border-gray-200 text-center transition-all ${isChecked ? 'bg-green-50/70 font-semibold' : bgClass}`}>
        <div className="flex flex-col items-center justify-center space-y-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleTogglePermission(role, key)}
            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-[#107c41] bg-white cursor-pointer"
          />
          <span className={`text-[9px] font-bold ${isChecked ? 'text-green-700' : 'text-red-500'}`}>
            {isChecked ? '✔ Có' : '❌ Không'}
          </span>
        </div>
      </td>
    );
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.fullName.trim() || !userForm.password.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    if (editingUserId) {
      const updated = users.map(u => u.id === editingUserId ? { ...u, ...userForm } : u);
      onUpdateUsers(updated);
      alert('Đã cập nhật thông tin nhân viên thành công!');
      setEditingUserId(null);
    } else {
      if (users.some(u => u.username.toLowerCase() === userForm.username.trim().toLowerCase())) {
        alert('Tên đăng nhập này đã tồn tại trong hệ thống!');
        return;
      }
      const newUser: AppUser = {
        id: 'u_' + Date.now(),
        username: userForm.username.trim(),
        fullName: userForm.fullName.trim(),
        role: userForm.role,
        password: userForm.password,
        status: userForm.status
      };
      onUpdateUsers([...users, newUser]);
      alert('Đã thêm tài khoản nhân viên mới thành công!');
    }

    setUserForm({
      username: '',
      fullName: '',
      role: 'SALES',
      password: '',
      status: 'ACTIVE'
    });
  };

  const handleEditClick = (u: AppUser) => {
    setEditingUserId(u.id);
    setUserForm({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      password: u.password || '',
      status: u.status
    });
  };

  const handleDeleteClick = (id: string) => {
    if (id === 'u1') {
      alert('Không thể xóa tài khoản Quản trị viên/Kế toán trưởng mặc định!');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản nhân viên này không?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSaveEnterprise = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      enterprise
    });
    alert('Đã cập nhật thông tin doanh nghiệp thành công!');
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      decimalPlaces
    });
    alert('Đã lưu cấu hình làm tròn số thập phân thành công!');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return alert('Mật khẩu nhập lại không khớp!');
    }
    if (currentUser) {
      if (password !== currentUser.password) {
        return alert('Mật khẩu hiện tại không chính xác!');
      }
      const updatedUser = { ...currentUser, password: newPassword };
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      onUpdateUsers(updatedUsers);
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(updatedUser);
      }
      alert('Đã thay đổi mật khẩu tài khoản thành công!');
    } else {
      alert('Đã thay đổi mật khẩu hệ thống quản lý thành công!');
    }
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDownloadBackup = () => {
    const fullData = exportDatabase();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EXCEL_ERP_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && (parsed.products || parsed.transactions)) {
            onImportBackup(parsed);
            alert('Đã khôi phục dữ liệu từ bản sao lưu thành công!');
          } else {
            alert('File sao lưu không đúng định dạng!');
          }
        } catch (err) {
          alert('Đã có lỗi xảy ra khi đọc file sao lưu JSON!');
        }
      };
    }
  };

  const handleClearDatabase = () => {
    if (confirm('ẢNH BÁO NGUY HIỂM: Thao tác này sẽ xoá toàn bộ sản phẩm, khách hàng, nhà cung cấp và tất cả sổ sách chứng từ trong cơ sở dữ liệu. Bạn có chắc chắn muốn xóa không?')) {
      onResetDatabase();
      alert('Đã đặt lại dữ liệu hệ thống về mặc định!');
    }
  };

  const hasSettingsPermission = (targetView: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;

    // Password and software license views are always allowed for everyone
    if (targetView === 'CD_DOI_MAT_KHAU' || targetView === 'CD_BAN_QUYEN') return true;

    const matrix = permissionMatrix?.[currentUser.role];
    if (!matrix) return false;

    if (['CD_THONG_TIN_DN', 'CD_LAM_TRON'].includes(targetView)) {
      return !!matrix.enterprise_setup;
    }
    if (['CD_QUAN_LY_QUYEN', 'CD_SAO_LUU', 'CD_KHOI_PHUC', 'CD_RESET_DATA'].includes(targetView)) {
      return !!matrix.system_setup;
    }
    return false;
  };

  if (!hasSettingsPermission(view)) {
    return (
      <div className="p-4 bg-gray-50 flex-1 overflow-auto max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-red-200 shadow-md p-10 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="flex justify-center">
            <div className="bg-red-50 p-4 rounded-full border border-red-100">
              <Shield className="h-12 w-12 text-red-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-base font-extrabold text-red-700 tracking-wider font-sans uppercase">🔒 TRUY CẬP BỊ TỪ CHỐI</h3>
          <p className="text-gray-600 text-xs leading-relaxed max-w-md mx-auto font-sans">
            Quyền hạn của bạn (<strong>{currentUser?.fullName}</strong> - [<strong>{currentUser?.role}</strong>]) không đủ để truy cập thiết lập này. Vui lòng liên hệ Kế toán trưởng để được phân quyền.
          </p>
          <div className="pt-2 text-[11px] text-gray-400 font-mono">
            Tài khoản hiện tại: <span className="font-bold text-gray-700">{currentUser?.fullName} ({currentUser?.role})</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="settings-manager" className="p-4 bg-gray-50 flex-1 overflow-auto max-w-4xl mx-auto">
      {/* 1. THÔNG TIN DOANH NGHIỆP */}
      {view === 'CD_THONG_TIN_DN' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className={`${theme.primary} p-4`}>
            <h3 className="text-sm font-bold tracking-wider font-mono flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>CẤU HÌNH THÔNG TIN DOANH NGHIỆP PHÁT HÀNH BIỂU MẪU</span>
            </h3>
            <p className="text-[11px] text-green-100 mt-0.5">Thông tin này sẽ được chèn trực tiếp vào tiêu đề các báo cáo kế toán, phiếu in hóa đơn.</p>
          </div>
          <form onSubmit={handleSaveEnterprise} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">TÊN DOANH NGHIỆP ĐẦY ĐỦ</label>
                <input
                  type="text"
                  required
                  value={enterprise.name}
                  onChange={(e) => setEnterprise({ ...enterprise, name: e.target.value })}
                  className={`w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">MÃ SỐ THUẾ (MST)</label>
                <input
                  type="text"
                  value={enterprise.taxCode}
                  onChange={(e) => setEnterprise({ ...enterprise, taxCode: e.target.value })}
                  className={`w-full text-xs p-2.5 border border-gray-300 rounded font-mono focus:outline-none focus:ring-1 ${focusRing}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">ĐỊA CHỈ TRỤ SỞ CHÍNH</label>
              <input
                type="text"
                required
                value={enterprise.address}
                onChange={(e) => setEnterprise({ ...enterprise, address: e.target.value })}
                className={`w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">SỐ ĐIỆN THOẠI DOANH NGHIỆP</label>
                <input
                  type="text"
                  value={enterprise.phone}
                  onChange={(e) => setEnterprise({ ...enterprise, phone: e.target.value })}
                  className={`w-full text-xs p-2.5 border border-gray-300 rounded font-mono focus:outline-none focus:ring-1 ${focusRing}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">EMAIL LIÊN HỆ</label>
                <input
                  type="email"
                  value={enterprise.email}
                  onChange={(e) => setEnterprise({ ...enterprise, email: e.target.value })}
                  className={`w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">HỌ TÊN GIÁM ĐỐC / ĐẠI DIỆN</label>
                <input
                  type="text"
                  value={enterprise.director}
                  onChange={(e) => setEnterprise({ ...enterprise, director: e.target.value })}
                  className={`w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">KẾ TOÁN TRƯỞNG / LẬP BIỂU</label>
                <input
                  type="text"
                  value={enterprise.chiefAccountant}
                  onChange={(e) => setEnterprise({ ...enterprise, chiefAccountant: e.target.value })}
                  className={`w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className={`px-4 py-2 ${theme.accent} rounded font-bold transition shadow-sm`}
              >
                Cập nhật thông tin doanh nghiệp
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. LÀM TRÒN THẬP PHÂN */}
      {view === 'CD_LAM_TRON' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 text-xs space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center space-x-2">
              <Sparkles className={`h-4 w-4 ${theme.text}`} />
              <span>CẤU HÌNH ĐỊNH DẠNG SỐ & LÀM TRÒN</span>
            </h3>
            <p className="text-gray-500 text-[11px] mt-0.5">Đặt cấu hình làm tròn phần thập phân cho các báo cáo tính tiền tệ VND hoặc ngoại tệ.</p>
          </div>

          <form onSubmit={handleSaveSystem} className="space-y-4">
            <div className="max-w-md">
              <label className="block text-[10px] font-bold text-gray-500 mb-2">SỐ CHỮ SỐ LÀM TRÒN THẬP PHÂN</label>
              <select
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                className={`w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 ${focusRing}`}
              >
                <option value="0">0 chữ số thập phân (Ví dụ: 150.000 đ)</option>
                <option value="1">1 chữ số thập phân (Ví dụ: 150.000,0 đ)</option>
                <option value="2">2 chữ số thập phân (Ví dụ: 150.000,00 đ)</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className={`px-4 py-2 ${theme.accent} rounded font-bold transition`}
              >
                Lưu cấu hình hệ thống
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. ĐỔI MẬT KHẨU */}
      {view === 'CD_DOI_MAT_KHAU' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden max-w-md mx-auto">
          <div className={`${theme.primary} p-4`}>
            <h3 className="text-sm font-bold tracking-wider font-mono flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>ĐỔI MẬT KHẨU TÀI KHOẢN</span>
            </h3>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">MẬT KHẨU HIỆN TẠI</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">MẬT KHẨU MỚI</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">NHẬP LẠI MẬT KHẨU MỚI</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 ${focusRing}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full ${theme.accent} py-2 rounded font-bold transition shadow-sm`}
            >
              Cập nhật mật khẩu tài khoản
            </button>
          </form>
        </div>
      )}

      {/* 5. SAO LƯU & KHÔI PHỤC & RESET DỮ LIỆU */}
      {(view === 'CD_SAO_LUU' || view === 'CD_KHOI_PHUC' || view === 'CD_RESET_DATA') && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 text-xs space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center space-x-2">
              <Database className={`h-4 w-4 ${theme.text}`} />
              <span>CÀI ĐẶT SAO LƯU VÀ PHỤC HỒI DỮ LIỆU OFFLINE</span>
            </h3>
            <p className="text-gray-500 text-[11px] mt-0.5">Quản lý và lưu trữ dữ liệu an toàn dưới dạng file JSON về máy tính của bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Download section */}
            <div className="border border-gray-200 rounded p-4 flex flex-col justify-between hover:shadow-sm transition">
              <div>
                <span className="font-bold text-gray-800 block text-xs mb-1">1. TẠO BẢN SAO LƯU</span>
                <p className="text-gray-500 text-[11px] leading-relaxed mb-4">
                  Tải ngay tệp cơ sở dữ liệu chứa toàn bộ các danh mục hàng hóa, đối tác cùng toàn bộ số liệu phát sinh để cất giữ an toàn.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className={`w-full ${theme.accent} font-bold py-2 rounded flex items-center justify-center space-x-1.5 transition text-xs`}
              >
                <Download className="h-4 w-4" />
                <span>Xuất File Backup (.json)</span>
              </button>
            </div>

            {/* Upload section */}
            <div className="border border-gray-200 rounded p-4 flex flex-col justify-between hover:shadow-sm transition">
              <div>
                <span className="font-bold text-gray-800 block text-xs mb-1">2. KHÔI PHỤC TỪ BẢN CŨ</span>
                <p className="text-gray-500 text-[11px] leading-relaxed mb-4">
                  Chọn tệp sao lưu định dạng `.json` đã tải về trước đó từ máy tính để ghi đè khôi phục lại dữ liệu hệ thống.
                </p>
              </div>
              <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded flex items-center justify-center space-x-1.5 cursor-pointer text-xs transition text-center">
                <Upload className="h-4 w-4" />
                <span>Chọn File Restore</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Clear section */}
            <div className="border border-gray-200 rounded p-4 flex flex-col justify-between hover:shadow-sm transition">
              <div>
                <span className="font-bold text-gray-800 block text-xs mb-1">3. XOÁ TOÀN BỘ DỮ LIỆU</span>
                <p className="text-gray-500 text-[11px] leading-relaxed mb-4">
                  Xóa tất cả các hóa đơn phát sinh, sản phẩm và khách hàng để khởi động lại kỳ bán hàng hoàn toàn mới từ đầu.
                </p>
              </div>
              <button
                onClick={handleClearDatabase}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded flex items-center justify-center space-x-1.5 transition text-xs"
              >
                <Trash2 className="h-4 w-4" />
                <span>Reset Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUẢN LÝ QUYỀN & NGƯỜI DÙNG */}
      {view === 'CD_QUAN_LY_QUYEN' && currentUser?.role !== 'ADMIN' && (
        <div className="bg-white rounded-lg border border-red-200 shadow-md p-10 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="flex justify-center">
            <div className="bg-red-50 p-4 rounded-full border border-red-100">
              <Shield className="h-12 w-12 text-red-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-base font-extrabold text-red-700 tracking-wider font-sans uppercase">🔒 TRUY CẬP BỊ TỪ CHỐI • CHỈ DÀNH CHO ADMIN</h3>
          <p className="text-gray-600 text-xs leading-relaxed max-w-md mx-auto font-sans">
            Khu vực <strong>Phân Quyền & Nhân Sự</strong> chứa các thiết lập bảo mật tối cao của hệ thống. Chỉ tài khoản <strong>Kế toán trưởng (ADMIN)</strong> mới có quyền truy cập, thay đổi thông tin nhân viên hoặc cấu hình ma trận quyền hạn.
          </p>
          <div className="pt-2 text-[11px] text-gray-400 font-mono">
            Tài khoản hiện tại: <span className="font-bold text-gray-700">{currentUser?.fullName} ({currentUser?.role})</span>
          </div>
        </div>
      )}

      {view === 'CD_QUAN_LY_QUYEN' && currentUser?.role === 'ADMIN' && (
        <div className="space-y-6">
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div className={`${theme.primary} p-4 flex justify-between items-center`}>
              <h3 className="text-sm font-bold tracking-wider font-mono flex items-center space-x-2">
                <UserCheck className="h-4 w-4" />
                <span>DANH SÁCH NHÂN VIÊN & QUẢN TRỊ HỆ THỐNG</span>
              </h3>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold font-mono">
                {users.length} TÀI KHOẢN
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              {/* Form tạo/sửa tài khoản */}
              <div className="lg:col-span-1 border border-gray-200 rounded p-4 bg-gray-50/50 space-y-4">
                <div className="border-b border-gray-200 pb-2 mb-2">
                  <h4 className="font-bold text-gray-700 flex items-center space-x-1.5 uppercase tracking-wide">
                    <span>{editingUserId ? 'CẬP NHẬT TÀI KHOẢN' : 'TẠO TÀI KHOẢN MỚI'}</span>
                  </h4>
                </div>
                <form onSubmit={handleSaveUser} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tên Đăng Nhập</label>
                    <input
                      type="text"
                      required
                      disabled={editingUserId === 'u1'} // Mặc định kế toán trưởng
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="vd: mai.pt"
                      className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Họ Và Tên</label>
                    <input
                      type="text"
                      required
                      value={userForm.fullName}
                      onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                      placeholder="vd: Phạm Thanh Mai"
                      className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Vai trò / Chức danh</label>
                    <select
                      value={userForm.role}
                      disabled={editingUserId === 'u1'} // ADMIN cannot change their role here
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                      className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
                    >
                      <option value="ADMIN">Quản trị viên (Kế toán trưởng)</option>
                      <option value="ACCOUNTANT">Kế toán viên (Full chức năng nghiệp vụ)</option>
                      <option value="SALES">Nhân viên bán hàng (Bán hàng & thu chi khách)</option>
                      <option value="STOREKEEPER">Thủ kho (Nhập mua, kho bãi & thẻ kho)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Mật Khẩu Đăng Nhập</label>
                    <input
                      type="text"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Nhập mật khẩu"
                      className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Trạng Thế</label>
                    <select
                      value={userForm.status}
                      disabled={editingUserId === 'u1'} // Admin always active
                      onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                      className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
                    >
                      <option value="ACTIVE">Đang Hoạt Động</option>
                      <option value="INACTIVE">Khóa Tài Khoản</option>
                    </select>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      className={`flex-1 ${theme.accent} text-white font-bold py-2 rounded shadow-sm text-center`}
                    >
                      {editingUserId ? 'Lưu Thay Đổi' : 'Thêm Tài Khoản'}
                    </button>
                    {editingUserId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId(null);
                          setUserForm({ username: '', fullName: '', role: 'SALES', password: '', status: 'ACTIVE' });
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold px-3 py-2 rounded text-center"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Bảng danh sách tài khoản */}
              <div className="lg:col-span-2 space-y-4">
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full border-collapse text-left bg-white text-xs font-mono">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
                        <th className="p-2 border-r border-gray-200">ID</th>
                        <th className="p-2 border-r border-gray-200">Tên Đăng Nhập</th>
                        <th className="p-2 border-r border-gray-200">Họ và Tên</th>
                        <th className="p-2 border-r border-gray-200">Chức Danh</th>
                        <th className="p-2 border-r border-gray-200">Mật Khẩu</th>
                        <th className="p-2 border-r border-gray-200 text-center">Trạng Thái</th>
                        <th className="p-2 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 border-r border-gray-200 text-gray-500 font-semibold">{u.id}</td>
                          <td className="p-2 border-r border-gray-200 text-gray-900 font-bold">{u.username}</td>
                          <td className="p-2 border-r border-gray-200 text-gray-900">{u.fullName}</td>
                          <td className="p-2 border-r border-gray-200 text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                              u.role === 'ADMIN' ? 'bg-[#107c41]' :
                              u.role === 'ACCOUNTANT' ? 'bg-blue-600' :
                              u.role === 'SALES' ? 'bg-amber-500' : 'bg-purple-600'
                            }`}>
                              {u.role === 'ADMIN' ? 'Kế toán trưởng' :
                               u.role === 'ACCOUNTANT' ? 'Kế toán viên' :
                               u.role === 'SALES' ? 'Nhân viên bán hàng' : 'Thủ kho'}
                            </span>
                          </td>
                          <td className="p-2 border-r border-gray-200 text-gray-500">{u.password}</td>
                          <td className="p-2 border-r border-gray-200 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {u.status === 'ACTIVE' ? 'Đang chạy' : 'Đã khóa'}
                            </span>
                          </td>
                          <td className="p-2 text-center space-x-1.5 flex justify-center items-center">
                            <button
                              onClick={() => handleEditClick(u)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 cursor-pointer"
                              title="Sửa thông tin"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 cursor-pointer"
                              disabled={u.id === 'u1'}
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded flex items-start space-x-2 leading-relaxed">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <strong>💡 Ghi chú tài khoản thử nghiệm hệ thống:</strong> <br />
                    Tất cả tài khoản nhân viên mặc định sử dụng mật khẩu đăng nhập là <strong>123</strong>. Bạn có thể sử dụng nút <strong>Đăng xuất</strong> ở góc trên thanh công cụ để chuyển đổi qua lại giữa các nhân viên để xem sự thay đổi về giao diện và giới hạn quyền truy cập một cách trực quan!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ma trận phân quyền trực quan */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden text-xs">
            <div className="bg-gray-100 p-3.5 border-b border-gray-200">
              <h4 className="font-bold text-gray-800 uppercase flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span>BẢNG MA TRẬN PHÂN QUYỀN TRUY CẬP (ROLE-BASED PERMISSION MATRIX)</span>
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-mono">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-gray-200">
                    <th className="p-3 border-r border-gray-200">Nhóm Chức Năng Nghiệp Vụ</th>
                    <th className="p-3 border-r border-gray-200 text-center">Kế toán trưởng (ADMIN)</th>
                    <th className="p-3 border-r border-gray-200 text-center bg-blue-50/50">Kế toán viên (ACCOUNTANT)</th>
                    <th className="p-3 border-r border-gray-200 text-center bg-amber-50/50">Nhân viên bán hàng (SALES)</th>
                    <th className="p-3 text-center bg-purple-50/50">Thủ kho (STOREKEEPER)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[11px]">
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">1. Lập Phiếu & Xem Danh Sách Báo Giá (Sales Quotations)</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'quotations', 'bg-blue-50/20')}
                    {renderCell('SALES', 'quotations', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'quotations', 'bg-purple-50/20')}
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">2. Lập Phiếu Xuất Bán Hàng & KH Trả Hàng</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'sales', 'bg-blue-50/20')}
                    {renderCell('SALES', 'sales', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'sales', 'bg-purple-50/20')}
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">3. Lập Phiếu Thu Tiền Mặt / Tiền Gửi Khách Hàng</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'cash_collection', 'bg-blue-50/20')}
                    {renderCell('SALES', 'cash_collection', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'cash_collection', 'bg-purple-50/20')}
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">4. Lập Phiếu Nhập Mua Hàng & Trả Hàng NCC</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'purchases', 'bg-blue-50/20')}
                    {renderCell('SALES', 'purchases', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'purchases', 'bg-purple-50/20')}
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">5. Lập Phiếu Chuyển Kho & Kiểm Kê Hàng Hóa</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'warehouse', 'bg-blue-50/20')}
                    {renderCell('SALES', 'warehouse', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'warehouse', 'bg-purple-50/20')}
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">6. Báo Cáo Nhập Xuất Tồn & Sổ Thẻ Kho</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'inventory_reports', 'bg-blue-50/20')}
                    {renderCell('SALES', 'inventory_reports', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'inventory_reports', 'bg-purple-50/20')}
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">7. Báo Cáo Tài Chính & Doanh Thu Lợi Nhuận</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'financial_reports', 'bg-blue-50/20')}
                    {renderCell('SALES', 'financial_reports', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'financial_reports', 'bg-purple-50/20')}
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">8. Quản Lý Thông Tin Doanh Nghiệp & Kỳ Mới</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'enterprise_setup', 'bg-blue-50/20')}
                    {renderCell('SALES', 'enterprise_setup', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'enterprise_setup', 'bg-purple-50/20')}
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-gray-200 font-sans font-medium text-gray-800">9. Quản Lý Hệ Thống & Thay Đổi Mật Khẩu Khác</td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-green-600 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <input type="checkbox" checked disabled className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 bg-gray-100" />
                        <span className="text-[9px] text-green-700 font-bold">✔ Có</span>
                      </div>
                    </td>
                    {renderCell('ACCOUNTANT', 'system_setup', 'bg-blue-50/20')}
                    {renderCell('SALES', 'system_setup', 'bg-amber-50/20')}
                    {renderCell('STOREKEEPER', 'system_setup', 'bg-purple-50/20')}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. BẢN QUYỀN PHẦN MỀM */}
      {view === 'CD_BAN_QUYEN' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-8 text-center space-y-6">
          <div className="max-w-md mx-auto">
            <div className={`inline-block p-3 ${theme.bg} rounded-full mb-3 ${theme.text}`}>
              <Shield className="h-12 w-12" />
            </div>
            <h3 className="text-base font-extrabold text-gray-800 tracking-tight uppercase">EXCEL ERP SALES SOFTWARE</h3>
            <p className="text-xs text-gray-500 font-mono mt-1">Phiên Bản 2026.1.0 LTS (Ổn Định Chính Thức)</p>

            <div className="bg-gray-50 p-4 border border-gray-200 rounded mt-6 text-left space-y-2 text-gray-600 leading-relaxed text-[11px]">
              <div>• <strong>Giấy phép:</strong> Bản quyền vĩnh viễn cấp cho <strong>{settings.enterprise.name}</strong>.</div>
              <div>• <strong>Công nghệ:</strong> Thiết kế chuẩn Custom UI Ribbon, mô phỏng Excel hoàn chỉnh chạy trực tuyến offline-first bảo mật tuyệt đối.</div>
              <div>• <strong>Nhà phát triển:</strong> Google AI Studio Partner.</div>
              <div className="pt-2 border-t border-gray-200 text-center text-gray-400 font-mono text-[10px]">
                MÃ BẢN QUYỀN: AISTUDIO-BUILD-2026-X99F-P999
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
