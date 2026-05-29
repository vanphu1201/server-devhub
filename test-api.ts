import axios from 'axios';

// Cấu hình URL server Render đã deploy của bạn
const BASE_URL = 'https://devhub-server-ugy1.onrender.com/api/v1';

async function runAutomatedTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG HỆ THỐNG API DEVHUB...\n');
  console.log(`📡 Target Server: ${BASE_URL}\n`);

  const randomId = Math.floor(Math.random() * 10000);
  const testUser = {
    username: `tester_${randomId}`,
    email: `tester_${randomId}@gmail.com`,
    password: 'Password123!',
    displayName: `Automated Tester ${randomId}`
  };

  let token = '';
  let userId = '';
  let createdPostId = '';
  let createdTicketId = '';

  const client = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true // Cho phép nhận tất cả các mã status để tự xử lý
  });

  try {
    // ---------------------------------------------------------
    // 1. TEST ĐĂNG KÝ TÀI KHOẢN MỚI
    // ---------------------------------------------------------
    console.log('🔄 1. Đang test Đăng ký tài khoản...');
    const registerRes = await client.post('/auth/signup', {
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
      displayName: testUser.displayName
    });

    if (registerRes.status === 200 || registerRes.status === 201) {
      console.log('   ✅ [PASS] Đăng ký thành công!');
    } else {
      throw new Error(`Đăng ký thất bại với status ${registerRes.status}: ${JSON.stringify(registerRes.data)}`);
    }

    // ---------------------------------------------------------
    // 2. TEST ĐĂNG NHẬP
    // ---------------------------------------------------------
    console.log('🔄 2. Đang test Đăng nhập...');
    const loginRes = await client.post('/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (loginRes.status === 200 && loginRes.data.success) {
      token = loginRes.data.data.token;
      userId = loginRes.data.data.id;
      console.log('   ✅ [PASS] Đăng nhập thành công! Đã lấy được JWT Token.');
      // Thiết lập token cho các request tiếp theo
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      throw new Error(`Đăng nhập thất bại: ${JSON.stringify(loginRes.data)}`);
    }

    // ---------------------------------------------------------
    // 3. TEST TẠO BÀI VIẾT MỚI (Cần Auth)
    // ---------------------------------------------------------
    console.log('🔄 3. Đang test Tạo bài viết mới...');
    const postRes = await client.post('/posts', {
      content: 'Hello World! Đây là bài viết kiểm thử tự động từ tập lệnh E2E.',
      tags: ['test', 'automated', 'devhub']
    });

    if (postRes.status === 201 || postRes.status === 200) {
      createdPostId = postRes.data.data.id || postRes.data.data._id;
      console.log(`   ✅ [PASS] Tạo bài viết thành công! ID bài viết: ${createdPostId}`);
    } else {
      throw new Error(`Tạo bài viết thất bại: ${JSON.stringify(postRes.data)}`);
    }

    // ---------------------------------------------------------
    // 4. TEST THÍCH BÀI VIẾT (Like Post)
    // ---------------------------------------------------------
    console.log('🔄 4. Đang test Thích bài viết...');
    const likeRes = await client.post(`/posts/${createdPostId}/like`);
    if (likeRes.status === 200) {
      console.log('   ✅ [PASS] Thích bài viết thành công!');
    } else {
      throw new Error(`Thích bài viết thất bại: ${JSON.stringify(likeRes.data)}`);
    }

    // ---------------------------------------------------------
    // 5. TEST TẠO TICKET HỖ TRỢ (Support Ticket)
    // ---------------------------------------------------------
    console.log('🔄 5. Đang test Tạo Ticket hỗ trợ...');
    const ticketRes = await client.post('/tickets', {
      subject: 'Yêu cầu hỗ trợ kiểm thử tự động',
      description: 'Xin chào, đây là tin nhắn kiểm thử hệ thống tự động.',
      priority: 'medium'
    });

    if (ticketRes.status === 201 || ticketRes.status === 200) {
      createdTicketId = ticketRes.data.data.id || ticketRes.data.data._id;
      console.log(`   ✅ [PASS] Tạo Ticket thành công! ID Ticket: ${createdTicketId}`);
    } else {
      throw new Error(`Tạo Ticket thất bại: ${JSON.stringify(ticketRes.data)}`);
    }

    // ---------------------------------------------------------
    // 6. TEST TÌM KIẾM TOÀN CỤC (Global Search)
    // ---------------------------------------------------------
    console.log('🔄 6. Đang test Tìm kiếm toàn cục...');
    const searchRes = await client.get('/search', {
      params: { q: 'tester' }
    });

    if (searchRes.status === 200 && searchRes.data.success) {
      console.log('   ✅ [PASS] Tìm kiếm toàn cục hoạt động hoàn hảo!');
    } else {
      throw new Error(`Tìm kiếm thất bại: ${JSON.stringify(searchRes.data)}`);
    }

    console.log('\n🎉🎉🎉 CHÚC MỪNG! TẤT CẢ CÁC BÀI KIỂM THỬ TỰ ĐỘNG ĐỀU ĐÃ ĐẠT (PASS) 100%! 🎉🎉🎉');
    console.log('Hệ thống backend Render và kết nối cơ sở dữ liệu MongoDB hoạt động cực kỳ ổn định.');

  } catch (error: any) {
    console.error('\n❌❌❌ KIỂM THỬ THẤT BẠI! LỖI HỆ THỐNG:');
    console.error(error.message || error);
  }
}

runAutomatedTests();
