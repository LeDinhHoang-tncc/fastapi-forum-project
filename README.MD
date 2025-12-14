# FastAPI Forum Project

Dự án **Forum / Diễn đàn mã nguồn mở** xây dựng bằng **FastAPI (Backend)** và **React + Vite (Frontend)**, sử dụng **PostgreSQL** làm cơ sở dữ liệu.

---

## Công nghệ sử dụng

### Backend

* **Python 3.9+**
* **FastAPI**
* **SQLAlchemy**
* **PostgreSQL**
* **JWT Authentication**
* **Uvicorn**

### Frontend

* **React**
* **Vite**
* **Axios**

---

## Tính năng chính

* Đăng ký / Đăng nhập (JWT)
* Tạo, sửa, xóa bài viết (CRUD)
* Bình luận & trả lời bình luận (nested comments)
* Sửa / xóa / ghim bình luận theo phân quyền
* Phân quyền: người dùng thường / chủ bài viết / admin

---

## Yêu cầu hệ thống

* Python **>= 3.9**
* Node.js **>= 18**
* PostgreSQL **>= 13**
* Git

---

## Cài đặt dự án

### 1️.Clone repository

```bash
git clone <repository-url>
cd fastapi-forum-project
```

---

### 2️.Backend setup (FastAPI)

### Tạo CSDL

Vào PostgreSQL tạo Database `forum_db`

#### Tạo môi trường ảo 

```bash
python -m venv venv
```

Kích hoạt môi trường ảo:

* **Windows**

```bash
venv\Scripts\activate
```

* **macOS / Linux**

```bash
source venv/bin/activate
```

---

#### Cài đặt thư viện backend

```bash
pip install -r requirements.txt
```

---

#### Cấu hình môi trường

Tạo file `.env` (hoặc chỉnh trong `database.py`):

```env
DATABASE_URL=postgresql://username:password@localhost:5432/forum_db
SECRET_KEY=SUPER_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

#### Chạy backend

```bash
uvicorn app.main:app --reload
```

📌 Backend chạy tại: **[http://localhost:8000](http://localhost:8000)**
📌 API docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 3️.Frontend setup (React)

Mở **terminal mới**:

```bash
cd frontend
npm install
npm run dev
```

📌 Frontend chạy tại: **[http://localhost:5173](http://localhost:5173)**

---

## Cơ sở dữ liệu

* Sử dụng PostgreSQL
* Các bảng chính:

  * users
  * posts
  * comments
  * votes

> Nếu bạn thay đổi model, hãy migrate hoặc cập nhật DB tương ứng.

---

## Cập nhật thư viện

Sau khi cài hoặc nâng cấp thư viện:

```bash
pip freeze > requirements.txt
```

---

## Đóng góp

Dự án là **mã nguồn mở**, mọi đóng góp đều được hoan nghênh:

* Fork project
* Tạo branch mới
* Commit rõ ràng
* Tạo Pull Request

---

## Giấy phép

Dự án được phát hành theo giấy phép **MIT License**.

---

## Liên hệ

Nếu bạn có câu hỏi hoặc góp ý, hãy mở **Issue** hoặc **Pull Request**.

Nếu thấy dự án hữu ích, đừng quên **star repository** nhé!
