# Website CLB AI — Trường THPT Tân Phước Khánh

## Cấu trúc: mục lục và trang chủ đề riêng
Không còn gộp toàn bộ bài học vào một trang dài. Các trang hub là mục lục dạng thẻ:
- `guide.html` — Bách khoa AI; mỗi mục mở trang chủ đề độc lập.
- `coding.html` — Coding Lab; mỗi kỹ năng/dự án có trang riêng.
- `models.html` — mục lục Models & Provider, API và tài liệu liên quan.

Các trang học độc lập bao gồm AI cơ bản, AI tạo sinh, prompt, học cùng AI, chatbot, agent, OpenCode, API/API key, ứng dụng đời sống, machine learning, dự án AI ở trường, kiểm chứng, an toàn, liêm chính; Web Dev, Python, debug, GitHub, AI coding, lộ trình và dự án Taskboard.

## Công cụ thực hành chạy tại trình duyệt
- `prompt-lab.html`: tạo prompt cục bộ, không gửi nội dung lên máy chủ.
- `code-playground.html`: thử HTML/CSS/JavaScript trong sandbox cục bộ.
- `demo-chatbot.html`: FAQ chatbot theo kịch bản, không gọi API.
- `ml-lab.html`: mô phỏng k-nearest neighbors bằng dữ liệu giả lập.
- `agent-sandbox.html`: thử luồng đề xuất/phê duyệt, không có hành động thật.
- `ai-chat.html`: chat text/ảnh với NVIDIA NIM DeepSeek V4.1 Flash qua Cloudflare Pages Function.
- `functions/api/chat.js`: endpoint backend `/api/chat`; NVIDIA key chỉ nằm trong encrypted Cloudflare Pages Secret `NVIDIA_API_KEY`.
- `taskboard.html`: taskboard cục bộ dùng localStorage; không đồng bộ nhóm.

## Tệp chính
- `index.html`: trang chủ
- `about.html`: giới thiệu CLB
- `activities.html`: hoạt động minh họa; chưa phải lịch sự kiện đã xác nhận
- `projects.html`: hướng dự án
- `news.html`: thông báo/lịch chính thức
- `join.html`: tham gia; form đăng ký cần cấu hình trước khi dùng thật
- `models-guide.html`: hướng dẫn chọn mô hình
- `providers.html`: provider, tài liệu chính thức và nút tìm video theo chủ đề
- `site.css`, `common.js`: giao diện/chức năng dùng chung
- `site-config.js`: link Google Form, lịch, liên hệ và trạng thái tuyển
- `assets/`: logo trường và hình minh họa; giữ nguyên cấu trúc khi tải lên

## Trước khi công bố
Mở `site-config.js` và cập nhật `googleFormUrl`, `officialContact`, `clubSchedule`, `recruitmentStatus` bằng thông tin đã được CLB/nhà trường xác nhận. Chỉ thu thập dữ liệu cần thiết; xin phép nhà trường và thông báo rõ mục đích sử dụng. Thử Google Form trước khi chia sẻ rộng rãi.

Các công cụ demo không kết nối API thật. Không đưa API key vào HTML, JavaScript chạy trên trình duyệt hoặc repository. Kết nối model thật cần backend/Worker, secrets, giới hạn chi phí/tần suất và phê duyệt của người phụ trách.

## Bật chat AI thật trên Cloudflare Pages (NVIDIA NIM)
1. Tạo/đăng nhập tài khoản NVIDIA Developer, mở trang model [DeepSeek V4.1 Flash](https://build.nvidia.com/deepseek-ai/deepseek-v4.1-flash) và tạo API key theo hướng dẫn NVIDIA. Trang NVIDIA hiện đánh dấu Free Endpoint là available; quota, giới hạn và điều kiện có thể thay đổi, nên không xem đây là dịch vụ miễn phí vô hạn.
2. Deploy toàn bộ repository lên Cloudflare Pages (GitHub Pages thuần không chạy thư mục `functions/`).
3. Trong Cloudflare Dashboard → **Workers & Pages** → Pages project → **Settings → Variables and Secrets → Add**. Tên: `NVIDIA_API_KEY`; dán key và chọn **Encrypt** để lưu thành Secret. Không gửi key cho người khác, không đặt vào HTML/JS/GitHub. Tài liệu: https://developers.cloudflare.com/pages/functions/bindings/
4. Redeploy dự án để Function nhận Secret. Mở `ai-chat.html`, thử câu hỏi; có thể chọn ảnh JPEG/PNG/WebP để thử tính năng vision.
5. Trước khi quảng bá công khai, cấu hình rate limiting/Turnstile, theo dõi quota, giới hạn request và xin duyệt của nhà trường. Không dùng dữ liệu học sinh nhạy cảm.
6. Endpoint hiện đặt giới hạn ảnh/ký tự và đầu ra để tránh request quá lớn; đây không thay thế rate limiting/anti-bot ở Cloudflare. Xóa/rotate secret nếu nghi bị lộ.

## Cập nhật GitHub Pages
1. Giải nén ZIP.
2. Tải toàn bộ file/thư mục bên trong lên thư mục gốc repository, cùng cấp với `index.html`; giữ nguyên thư mục `assets/`.
3. Commit changes. GitHub Pages tự triển khai lại nếu đã bật Pages.

## Cloudflare Pages
Kết nối repository GitHub vào Cloudflare Pages. Chọn framework `None`, build command để trống, output directory `.`. Đây là website HTML tĩnh; không dùng thiết lập Worker yêu cầu `wrangler deploy` trừ khi bạn chủ động xây backend riêng.
