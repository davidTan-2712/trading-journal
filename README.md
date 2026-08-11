# Nhật Ký 365 Ngày

Web app cá nhân — không phụ thuộc Notion. Dữ liệu lưu ngay trên trình duyệt của bạn (localStorage).

## Cách đưa web này lên mạng — miễn phí, ~10 phút

### Bước 1: Tạo tài khoản GitHub
1. Vào https://github.com/signup
2. Đăng ký bằng email, đặt username, mật khẩu

### Bước 2: Tạo repository mới
1. Sau khi đăng nhập, bấm nút **+** góc trên phải → **New repository**
2. Đặt tên: `trading-journal`
3. Để **Public**, KHÔNG tick "Add a README" (vì đã có sẵn)
4. Bấm **Create repository**

### Bước 3: Tải toàn bộ file lên
1. Ở trang repository vừa tạo, bấm **uploading an existing file**
2. Kéo thả TOÀN BỘ file và thư mục trong gói này vào (giữ nguyên cấu trúc thư mục `src/`)
3. Bấm **Commit changes**

### Bước 4: Tạo tài khoản Vercel & deploy
1. Vào https://vercel.com/signup → chọn **Continue with GitHub**
2. Sau khi đăng nhập, bấm **Add New... → Project**
3. Chọn repo `trading-journal` vừa tạo → bấm **Import**
4. Vercel tự nhận diện đây là project Vite — không cần chỉnh gì, bấm **Deploy**
5. Đợi khoảng 1 phút, bạn sẽ có 1 link dạng `trading-journal-xxxx.vercel.app` — đó là web riêng của bạn

### Bước 5: Dùng như app trên điện thoại
- Mở link đó bằng Safari (iPhone) hoặc Chrome (Android)
- Bấm **Chia sẻ → Thêm vào MH chính** (iPhone) hoặc **Menu → Cài đặt ứng dụng** (Android)
- Icon sẽ nằm ngay trên màn hình chính như 1 app thật

## Muốn cập nhật giao diện sau này?
Quay lại chat với Claude, nhờ chỉnh sửa `src/App.jsx`, rồi upload lại đúng file đó lên GitHub (vào repo → mở file → bấm biểu tượng bút chì để sửa, hoặc xoá file cũ và tải file mới lên). Vercel sẽ tự động deploy lại sau vài giây.
