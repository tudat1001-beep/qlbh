import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Polyfill WebSocket for Node.js 20
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

const supabaseUrl = process.argv[2] || process.env.VITE_SUPABASE_URL || 'https://jgxmwlwkkufbfxyeuqpf.supabase.co';
const supabaseAnonKey = process.argv[3] || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Ygm9r7aHUN11KRh3UHoJYg_KkRVE4sc';

console.log('=== THÔNG TIN DỮ LIỆU TRÊN SUPABASE ===');
console.log(`URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function showData() {
  try {
    // Fetch stores
    console.log('--- DANH SÁCH CỬA HÀNG (STORES) ---');
    const { data: stores, error: storesError } = await supabase.from('stores').select('*');
    if (storesError) {
      console.log('Lỗi tải stores:', storesError.message);
    } else {
      console.table(stores.map(s => ({
        ID: s.id,
        Name: s.name,
        Owner: s.owner_name,
        Phone: s.phone,
        Status: s.status,
        Expiry: s.expiry_date
      })));
    }

    // Fetch users
    console.log('\n--- DANH SÁCH TÀI KHOẢN (APP_USERS) ---');
    const { data: users, error: usersError } = await supabase.from('app_users').select('*');
    if (usersError) {
      console.log('Lỗi tải app_users:', usersError.message);
    } else {
      console.table(users.map(u => ({
        ID: u.id,
        Store_ID: u.store_id,
        Username: u.username,
        FullName: u.full_name,
        Role: u.role,
        Status: u.status
      })));
    }
  } catch (err) {
    console.error('Lỗi truy vấn:', err.message || err);
  }
}

showData();
