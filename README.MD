# FastAPI Forum Project

Dự án diễn đàn đơn giản sử dụng FastAPI và PostgreSQL.

## Tính năng
- Đăng ký / Đăng nhập 
- Tạo bài viết (CRUD)
- Comment (Đang phát triển)

## Cài đặt
1. Clone dự án.
2. Cài thư viện: `pip install -r requirements.txt`> `uvicorn app.main:app`.
3. Mở Terminal thứ 2.
4. Cài đặt Frontend: `cd frontend` > `npm install` > `npm run dev`.
5. Mở website truy cập: `http://localhost:5173/`

## Mỗi khi thực hiện thay đổi môi trường
`pip freeze > requirements.txt`