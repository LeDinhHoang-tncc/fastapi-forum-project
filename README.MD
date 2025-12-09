# Cài đặt các thư viện
pip install -r requirements.txt
# Mỗi khi thực hiện thay đổi môi trường
pip freeze > requirements.txt

Bước 1: chuẩn bị 
#Cài đặt python
#Cài đặt VSCode
#Cài đặt PostgreSQL
#Vào pgAdmin > Database > Create > đặt tên "forum_db"
#Cấu hình [DATABASE_URL] trong database.py cho đúng
#Chạy sever, đứng ngoài thư mục app chạy terminal : uvicorn app.main:app

#Cài đặt driver cho PostgreSQL
pip install psycopg2-binary

#Cài đặt các thư viện
pip install sqlalchemy
pip install fastapi sqlalchemy psycopg2-binary uvicorn
pip install bcrypt==3.2.0
pip install python-multipart
