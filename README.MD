# FastAPI Forum Project

Dự án diễn đàn đơn giản sử dụng FastAPI và PostgreSQL.

## Tính năng
- Đăng ký / Đăng nhập 
- Tạo bài viết (CRUD)
- Comment (Đang phát triển)

## Cài đặt
1. Clone dự án.
2. Cài thư viện: `pip install -r requirements.txt`.
3. Cấu hình Database trong `database.py`.
4. Chạy server: `uvicorn app.main:app`.

# Mỗi khi thực hiện thay đổi môi trường
`pip freeze > requirements.txt`