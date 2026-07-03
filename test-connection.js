import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env
dotenv.config();

// Polyfill WebSocket for Node.js 20 and below
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

let supabaseUrl = process.argv[2] || process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.argv[3] || process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== KIỂM TRA KẾT NỐI SUPABASE ===\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('Không tìm thấy thông tin cấu hình Supabase.');
  console.log('Bạn có thể cấu hình bằng 1 trong 2 cách sau:');
  console.log('1. Tạo file `.env` từ `.env.example` và điền:');
  console.log('   VITE_SUPABASE_URL="https://your-project.supabase.co"');
  console.log('   VITE_SUPABASE_ANON_KEY="your-anon-key-here"');
  console.log('\n2. Chạy trực tiếp lệnh với tham số:');
  console.log('   node test-connection.js <SUPABASE_URL> <SUPABASE_ANON_KEY>\n');
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Anon Key: ${supabaseAnonKey.substring(0, 10)}... (độ dài: ${supabaseAnonKey.length})`);
console.log('\nĐang kết nối tới Supabase...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // 1. Kiểm tra kết nối cơ bản bằng cách gọi API của Supabase
    // Chúng ta sẽ thử truy vấn bảng "stores"
    const { data, error } = await supabase.from('stores').select('id').limit(1);
    
    if (error) {
      // Trường hợp kết nối thành công nhưng bảng chưa tồn tại
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
        console.log('\n✅ KẾT NỐI THÀNH CÔNG!');
        console.log('ℹ️ Trạng thái: Kết nối tới API Supabase thành công, nhưng bảng "stores" chưa tồn tại trong database.');
        console.log('👉 Vui lòng chạy script SQL DDL (trong src/lib/supabase.ts hoặc từ giao diện Admin) để tạo bảng.');
        return;
      }
      throw error;
    }
    
    console.log('\n✅ KẾT NỐI THÀNH CÔNG VÀ HOÀN HẢO!');
    console.log('🎉 Đã tìm thấy bảng "stores" và truy vấn thành công.');
    if (data && data.length > 0) {
      console.log(`Dữ liệu hiện tại: Có ít nhất ${data.length} cửa hàng trong database.`);
    } else {
      console.log('Dữ liệu hiện tại: Bảng "stores" trống (chưa có bản ghi nào).');
    }
  } catch (err) {
    console.error('\n❌ KẾT NỐI THẤT BẠI!');
    console.error('Chi tiết lỗi:', err.message || err);
    console.log('\nVui lòng kiểm tra lại:');
    console.log('1. URL và Anon Key đã chính xác chưa.');
    console.log('2. Kết nối internet/mạng.');
    console.log('3. Cấu hình CORS hoặc quyền truy cập bảng trong Supabase.');
  }
}

testConnection();
