from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import User
from app.schemas import UserCreate 
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ĐĂNG KÝ ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_input: UserCreate, db: Session = Depends(get_db)): 
    
    user_exists = db.query(User).filter(User.username == user_input.username).first()
    if user_exists:
        raise HTTPException(
            status_code=400, 
            detail="Tên đăng nhập đã tồn tại"
        )

    new_user = User(
        username=user_input.username,
        password=hash_password(user_input.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Đăng ký thành công", "user_id": new_user.id}

# --- ĐĂNG NHẬP ---
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Sai tên đăng nhập hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username, "id": user.id})

    return {"access_token": access_token, "token_type": "bearer"}