from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.routers.posts import get_current_user
from app.utils.security import hash_password 

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "reputation": current_user.reputation,
        "is_banned": current_user.is_banned
    }

@router.get("/{user_id}")
def read_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    
    return {
        "id": user.id,
        "username": user.username,
        "reputation": user.reputation,
    }

@router.put("/change-password")
def change_password(
    new_password: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    hashed_pw = hash_password(new_password)
    
    current_user.password = hashed_pw 
    
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}