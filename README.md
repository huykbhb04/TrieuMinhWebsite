# Minh Xoang — website thương hiệu cá nhân

Landing page ReactJS + Vite và API Node.js + Express. Bố cục tham khảo nhịp thiết kế của website mẫu, nhưng nội dung, nhận diện và media là placeholder riêng để bạn tùy chỉnh. Chưa có ảnh/video nào được tải về từ website tham chiếu.

## Cấu trúc

```text
frontend/
  src/App.jsx          Các section: header, hero, giới thiệu, chủ đề, gallery, bài viết, tư vấn, footer
  src/styles.css       Giao diện responsive và media slots
  src/uploadImage.js   Helper cho công cụ quản trị sau này
  vite.config.js
backend/
  src/server.js        Health check, form tư vấn demo, Cloudinary upload
  .env.example         Biến môi trường mẫu
```

## Chạy local

Cần Node.js 20 trở lên. Chạy từ thư mục gốc:

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
npm run dev
```

Frontend: `http://localhost:5173`; API: `http://localhost:5000/api/health`. Build: `npm run build`.

Tạo `backend/.env` từ `backend/.env.example` và điền thông tin Cloudinary. Nếu deploy frontend tách domain, đặt `VITE_API_URL` trong môi trường build frontend và `FRONTEND_ORIGIN` trong backend.

## Kết nối MySQL trong XAMPP

1. Mở XAMPP Control Panel và bấm **Start** cho Apache và MySQL.
2. Mở `http://localhost/phpmyadmin`.
3. Chọn **New**, nhập tên database `trieuminh`, chọn collation `utf8mb4_unicode_ci`, rồi bấm **Create**. Không cần tự tạo bảng; backend sẽ tự tạo bảng `consultations` và `users` khi khởi động.
4. Tạo file `backend/.env` từ `backend/.env.example` với cấu hình XAMPP và tài khoản admin đầu tiên:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=trieuminh
AUTH_SECRET=thay_bang_mot_chuoi_ngau_nhien_rieng_it_nhat_32_ky_tu
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=thay_bang_mat_khau_rieng_it_nhat_12_ky_tu
```

Không dùng các giá trị mẫu: chọn chuỗi bí mật và mật khẩu riêng, không bắt đầu bằng `replace_with_`. Không commit file `backend/.env`. Nếu MySQL `root` đã có mật khẩu, điền vào `DB_PASSWORD`. Sau đó chạy `npm run dev`, kiểm tra `http://localhost:5000/api/health` có `database.connected: true`.

### Tài khoản và phân quyền

- Lần chạy đầu, nếu chưa có admin hoạt động có **tên đăng nhập**, backend tạo **một admin khởi tạo** từ `INITIAL_ADMIN_USERNAME`/`INITIAL_ADMIN_PASSWORD`; không tự tạo nhân viên hoặc khách hàng mẫu. Đổi các giá trị này trong `.env` sau khi tạo tài khoản **không tự đổi mật khẩu** admin đã tồn tại.
- Đăng nhập admin tại `/admin`, nhân viên tại `/staff` bằng **tên đăng nhập + mật khẩu**. Trong `/admin`, admin tạo tài khoản **nhân viên hoặc admin** bằng tên đăng nhập; nhân viên chỉ quản lý yêu cầu tư vấn. Tên đăng nhập gồm 3–60 ký tự chữ cái không dấu, chữ số hoặc `_`.
- Vai trò **khách hàng** vẫn có trong cơ sở dữ liệu và dùng **email**. Đã tách API `POST /api/auth/customer/login` để dùng về sau; hiện chưa có giao diện đăng ký/đăng nhập khách hàng, chưa tạo sẵn khách hàng mẫu. Admin không tạo khách hàng thay cho họ.
- Backend tự bổ sung cột `username`, cho phép `email` trống trên bảng `users` cũ; giữ dữ liệu hiện có. Các tài khoản mẫu cũ vẫn dùng email nên không đăng nhập vào `/admin` hay `/staff` theo tên đăng nhập được; tài khoản mẫu còn giữ mật khẩu mặc định sẽ bị vô hiệu hóa.

Form tư vấn lưu vào `consultations`; nhân viên và admin xem/cập nhật trạng thái trong hệ thống. Chưa gửi thông báo email.

## Quản trị sản phẩm

Admin truy cập `/admin`, mở mục **Sản phẩm** để xem danh sách, tìm kiếm, thêm, sửa, xóa và ẩn/hiện sản phẩm. Form sản phẩm gồm tên, slug, SKU, danh mục, mô tả, thành phần, công dụng, hướng dẫn sử dụng, giá bán, giá niêm yết, tồn kho, đơn vị, sản phẩm nổi bật và ảnh.

Ảnh được tải từ form admin qua `POST /api/admin/upload`, backend kiểm tra token đăng nhập admin rồi đẩy lên Cloudinary trong folder `trieu-minh/products`. Các key Cloudinary chỉ nằm trong `backend/.env`, không đưa vào frontend. Nếu dùng bộ key khác, thay các biến `CLOUDINARY_*` trong `backend/.env` và khởi động lại backend.

Dữ liệu sản phẩm lưu trong bảng `products`; endpoint công khai `GET /api/products` trả các sản phẩm đang hiển thị, còn `GET /api/products/:slug` cấp dữ liệu cho trang chi tiết. Trang `/san-pham` tự tải danh sách từ database; bấm một sản phẩm mở `/san-pham/<slug>` với ảnh, giá, tồn kho, số lượng, mô tả, thành phần, công dụng và hướng dẫn sử dụng. Bảng cũ được backend tự migrate thêm các cột mới khi khởi động.

Trang khách hàng có nút giỏ hàng cố định ở góc trên bên trái. Giỏ hàng lưu trong `localStorage`, hỗ trợ tăng/giảm số lượng, xóa sản phẩm, xem tổng tiền và mở ngăn giỏ hàng bên cạnh. `/gio-hang` hiển thị toàn bộ giỏ; `/thanh-toan` thu thập họ tên, điện thoại, địa chỉ và ghi chú. Hiện yêu cầu đặt hàng được lưu vào `consultations` với chủ đề `Yêu cầu đặt hàng`; chưa tích hợp cổng thanh toán hoặc bảng đơn hàng riêng.


Component `MediaSlot` trong `frontend/src/App.jsx` mặc định hiển thị ô trống. Để thêm ảnh, truyền URL và alt:

```jsx
<MediaSlot label="Ảnh giới thiệu" src="https://res.cloudinary.com/..." alt="Chân dung Minh Xoang" />
```

Để thêm video, truyền `type="video"` và URL video:

```jsx
<MediaSlot label="Video giới thiệu" src="https://res.cloudinary.com/..." type="video" />
```

Ảnh/video công khai vẫn dùng `MediaSlot`. API legacy `POST /api/upload` chỉ dành cho các tích hợp cũ và yêu cầu header `x-upload-token`; giao diện admin dùng endpoint bảo vệ `POST /api/admin/upload`. **Không đưa `UPLOAD_TOKEN` hoặc Cloudinary API secret vào bundle frontend công khai.**

## Chuyển địa chỉ cũ sang địa chỉ mới sau sáp nhập

Checkout cho phép khách chọn địa chỉ theo bộ cũ trước sáp nhập. Backend dùng `LOCATION_API_V2_BASE_URL` và mã xã/phường cũ để tra cứu đơn vị mới, sau đó hiển thị một dòng chuẩn hóa dạng `Số nhà, Xã/Phường mới, Tỉnh/Thành phố mới`. Đơn hàng lưu cả snapshot địa chỉ cũ và `normalized_address`/đơn vị hiện hành; không ghi đè địa chỉ cũ.

API preview:

```text
POST /api/locations/normalize
```

Nếu một xã cũ có nhiều kết quả, checkout bắt khách xác nhận xã/phường mới; nếu provider lỗi hoặc chưa map được, không cho tạo đơn và giữ nguyên dữ liệu đã nhập. Cấu hình:

```env
LOCATION_API_BASE_URL=https://provinces.open-api.vn/api
LOCATION_API_V2_BASE_URL=https://provinces.open-api.vn/api/v2
```


Trang `/thanh-toan` hiện có họ tên, số điện thoại, cascading select tỉnh/thành phố → quận/huyện → xã/phường qua backend proxy, địa chỉ cụ thể, ghi chú, mã giảm giá và COD/QR. Server xác minh địa giới, đọc lại giá/tồn kho, tính tổng và tạo đơn trong transaction; không tin giá trong localStorage.

API chính:

```text
GET  /api/checkout/config
GET  /api/locations/provinces
GET  /api/locations/provinces/:code/districts
GET  /api/locations/districts/:code/wards
POST /api/orders/quote
POST /api/orders
```

Đơn hàng lưu trong `orders` và `order_items`, có snapshot sản phẩm/địa chỉ/tổng tiền và `Idempotency-Key` chống gửi trùng. Phí vận chuyển mặc định là 0; chưa có cổng thanh toán tự động/webhook. COD luôn bật; QR chỉ bật khi có cấu hình:

```env
LOCATION_API_BASE_URL=https://provinces.open-api.vn/api
PAYMENT_QR_ENABLED=false
PAYMENT_QR_BANK_ID=
PAYMENT_QR_ACCOUNT_NO=
PAYMENT_QR_ACCOUNT_NAME=
PAYMENT_QR_TEMPLATE=compact2
```

## Lưu ý về form và nội dung

Form tư vấn kiểm tra họ tên/số điện thoại và lưu vào MySQL khi XAMPP đang chạy: **chưa gửi email thông báo**. Admin/nhân viên có thể xem và cập nhật trạng thái yêu cầu trong dashboard. Thay email liên hệ mẫu `hello@minhxoang.vn`, lời giới thiệu và bài viết trong `frontend/src/App.jsx` bằng thông tin của bạn. Nội dung sức khỏe trên bản demo chỉ mang tính tham khảo, không thay thế chẩn đoán hoặc điều trị.
