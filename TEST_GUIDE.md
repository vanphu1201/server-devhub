# Hướng dẫn Kiểm thử Toàn diện dự án DevHub (Integration Test) 🧪

Tài liệu này hướng dẫn bạn cách khởi chạy môi trường kiểm thử, sử dụng công cụ của trình duyệt để kiểm tra kết nối API giữa Frontend và Backend, kèm theo kịch bản kiểm thử từng tính năng.

---

## 💻 Phần 1: Khởi chạy môi trường kiểm thử ở Local (Máy cá nhân)

Để kiểm thử nhanh và debug dễ dàng nhất, bạn hãy chạy cả 2 dự án song song ở máy cá nhân:

### 1. Khởi động Backend:
1. Mở terminal tại thư mục `server/`.
2. Tạo file `.env` (nếu chưa có) và đảm bảo các biến môi trường chính xác (như `MONGODB_URL`, `PORT=5000`, `JWT_SECRET`).
3. Chạy lệnh:
   ```bash
   npm run dev
   ```
   *Nhìn thấy dòng chữ `Example app listening on port 5000` là Backend đã sẵn sàng!*

### 2. Khởi động Frontend:
1. Mở một terminal mới tại thư mục `client/`.
2. Tạo file `.env` từ file `.env.example` và cấu hình:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Chạy lệnh:
   ```bash
   npm run dev
   ```
   *Truy cập vào địa chỉ local (ví dụ: `http://localhost:5173`) hiển thị giao diện DevHub!*

---

## 🔍 Phần 2: Cách kiểm tra kết nối giữa Frontend & Backend có khớp hay không

Cách khoa học nhất để biết hai bên có kết nối thành công và truyền nhận dữ liệu chuẩn xác hay không là sử dụng **Trình duyệt DevTools (F12)**:

1. Trên trình duyệt, nhấn phím **F12** (hoặc chuột phải chọn **Inspect/Kiểm tra**).
2. Chuyển sang tab **Network (Mạng)**.
3. Chọn bộ lọc **Fetch/XHR** để chỉ xem các yêu cầu gọi API.
4. Khi thực hiện bất kỳ hành động nào trên màn hình (ví dụ: bấm Like, viết bình luận, load trang chủ):
   - Bạn sẽ thấy các request gọi tới địa chỉ `http://localhost:5000/api/...` (ở local) hoặc `https://devhub-server-ugy1.onrender.com/api/...` (khi đã deploy).
   - **Mã phản hồi (Status Code)**:
     - `200 OK` hoặc `201 Created`: **KẾT NỐI HOÀN HẢO!** Hai bên khớp dữ liệu 100%.
     - `500 Internal Server Error`: Có lỗi xảy ra ở phía server (hãy xem log server để sửa).
     - `401 Unauthorized` hoặc `403 Forbidden`: Lỗi token hoặc phân quyền.
     - `404 Not Found`: Đường dẫn endpoint API bị ghi sai lệch giữa front và back.

---

## 📋 Phần 3: Kịch bản kiểm thử (Test Cases) chi tiết 5 chức năng lớn

Hãy thực hiện tuần tự 5 kịch bản dưới đây để kiểm thử toàn diện dự án:

### 👤 Kịch bản 1: Đăng ký & Đăng nhập (Auth & Profile)
* **Thao tác**: Tạo tài khoản mới -> Đăng nhập -> Vào trang cá nhân -> Cập nhật thông tin/avatar.
* **Mục tiêu**:
  - Khi đăng ký/đăng nhập thành công, kiểm tra tab Network xem có nhận được `token` và thông tin `user` hay không.
  - Xem token có được lưu vào LocalStorage/Cookie để duy trì đăng nhập hay không.

### 📝 Kịch bản 2: Bài viết mạng xã hội (Social Posts Feed)
* **Thao tác**: Đăng một bài viết mới (kèm ảnh) -> Nhấn nút Like -> Nhấn Bookmark -> Viết bình luận.
* **Mục tiêu**:
  - Bài viết mới hiển thị ngay lập tức trên bảng tin.
  - Bấm Like: Số lượng like tăng lên và icon chuyển sang trạng thái đã thích (gọi API `/posts/:id/like`).
  - Viết bình luận: Bình luận xuất hiện ngay dưới bài viết.

### 📚 Kịch bản 3: Bài viết kỹ thuật & Series (Blogs & Series)
* **Thao tác**: Vào mục Blog -> Tạo một Series học tập -> Tạo một bài viết blog gán vào Series đó.
* **Mục tiêu**:
  - Truy cập xem chi tiết blog, lượt xem (Views) tự động tăng lên.
  - Bộ lọc bài viết theo Thể loại (Category) lọc dữ liệu chuẩn xác từ Database.

### 🛍️ Kịch bản 4: Chợ ứng dụng & Tài nguyên (Marketplace & Resources)
* **Thao tác**: Vào chợ ứng dụng -> Xem chi tiết một sản phẩm -> Bấm mua hàng giả lập -> Tải xuống tài nguyên Premium sau khi đã mua.
* **Mục tiêu**:
  - Trước khi mua: Nút download bị ẩn hoặc hiển thị trạng thái "Cần mua/Mở khóa".
  - Sau khi bấm mua (Mock payment thành công): Người dùng tải xuống được file hoặc liên kết Premium được hiển thị.

### 💬 Kịch bản 5: Ticket hỗ trợ (Support Tickets)
* **Thao tác**: Tạo một Ticket khiếu nại/hỗ trợ -> Viết nội dung và gửi -> Đăng nhập tài khoản Admin vào xem và trả lời.
* **Mục tiêu**:
  - Danh sách tin nhắn hỗ trợ hiển thị dạng hội thoại thời gian thực.
  - Admin cập nhật được trạng thái của Ticket (Ví dụ: từ `Open` sang `Resolved`).

---

Chúc bạn kiểm thử dự án thành công và có những trải nghiệm tuyệt vời nhất với sản phẩm của mình! 🎉
