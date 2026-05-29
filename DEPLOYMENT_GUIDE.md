# Hướng dẫn Deploy dự án DevHub: Server (Render) & Client (Vercel) 🚀

Tài liệu này hướng dẫn chi tiết cách triển khai dự án **DevHub** với mô hình kiến trúc hiện đại, tối ưu nhất:
* **Backend (Node.js Express & MongoDB)**: Triển khai lên **Render** (Web Service).
* **Frontend (React Vite & Tailwind)**: Triển khai lên **Vercel** (Static Site Hosting) - Nền tảng tối ưu nhất cho React!

---

## 🛠️ Chuẩn bị trước khi deploy

Đảm bảo bạn đã đẩy mã nguồn mới nhất lên GitHub (tôi đã tự động commit và push toàn bộ thay đổi lên Git của bạn thành công).

---

## 📦 Bước 1: Deploy Backend lên Render

Backend của bạn cần chạy dưới dạng một dịch vụ Web trực tuyến.

1. Truy cập vào dashboard của **Render** ([dashboard.render.com](https://dashboard.render.com/)).
2. Nhấp vào nút **New +** và chọn **Web Service**.
3. Chọn repository chứa backend của bạn (`server-devhub`).
4. Cấu hình các thông số sau:
   - **Name**: `devhub-server`
   - **Environment**: `Node`
   - **Region**: Chọn khu vực gần Việt Nam nhất (ví dụ: `Singapore` hoặc `Oregon`).
   - **Branch**: `master`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

5. Mở phần **Advanced** để cấu hình các biến môi trường (**Environment Variables**):
   - `PORT`: `5000`
   - `MONGODB_URL`: Chuỗi kết nối database MongoDB Atlas của bạn (ví dụ: `mongodb+srv://...`).
   - `JWT_SECRET`: Chuỗi ký tự bí mật để ký token JWT.
   - `NODE_ENV`: `production`
   - Các biến cấu hình khác nếu có: Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), Mailer (`EMAIL_USER`, `EMAIL_PASS`).

6. Click **Create Web Service** và chờ Render khởi dựng. Khi hoàn thành, bạn sẽ nhận được địa chỉ API:
   👉 **`https://devhub-server.onrender.com`**

---

## 🌐 Bước 2: Deploy Frontend lên Vercel (Khuyên dùng)

Vercel là nền tảng tốt nhất thế giới để deploy các dự án React & Vite. Tôi đã cấu hình sẵn tệp **`vercel.json`** ở thư mục client giúp xử lý cơ chế định tuyến (React Router Client-side routing) tránh bị lỗi 404 khi tải lại trang!

1. Truy cập vào dashboard của **Vercel** ([vercel.com](https://vercel.com/)).
2. Nhấp vào **Add New...** -> chọn **Project**.
3. Kết nối với GitHub của bạn và chọn repository chứa frontend (`frontend-devhub`).
4. Cấu hình các thông số:
   - **Framework Preset**: Chọn `Vite` (Vercel sẽ tự nhận diện).
   - **Root Directory**: Để trống (hoặc chọn `./`).
   - **Build Command**: `npm run build` (Mặc định).
   - **Output Directory**: `dist` (Mặc định).

5. Nhấp vào phần **Environment Variables** để thêm biến kết nối đến Backend:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://devhub-server-ugy1.onrender.com/api` (Địa chỉ API Render thực tế của bạn)

6. Click **Deploy**! Chỉ trong chưa đầy 30 giây, dự án của bạn sẽ chạy live trên Vercel với địa chỉ chuyên nghiệp:
   👉 **`https://devhub-client.vercel.app`**

---

Chúc bạn triển khai dự án thành công rực rỡ! Dự án của bạn giờ đây đã sử dụng những hạ tầng cloud tối ưu nhất hiện nay! 🎉
