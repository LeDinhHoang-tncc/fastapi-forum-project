from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.routers.posts import get_current_user
from app.utils.security import hash_password 
from pydantic import BaseModel


router = APIRouter(prefix="/users", tags=["Users"])

class UserRoleUpdate(BaseModel):
    role: str

@router.get("/")
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không phải admin")

    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,    
        "display_name": current_user.display_name, 
        "email": current_user.email,
        "reputation": current_user.reputation,  
        "role": current_user.role,                
        "is_banned": current_user.is_banned
    }

@router.get("/{user_id}")
def read_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại")

    return {
        "display_name": user.display_name,
        "reputation": user.reputation,
        "is_banned": user.is_banned
    }

@router.put("/change-password")
def change_password(
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu quá ngắn")

    current_user.password = hash_password(new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}

@router.put("/update-profile")
def update_profile(
    display_name: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    current_user.display_name = display_name

    db.commit()
    return {"message": "Cập nhật thông tin thành công"}

@router.get("/all")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không phải admin")

    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "display_name": u.display_name,
            "role": u.role,
            "is_banned": u.is_banned
        }
        for u in users
    ]

@router.put("/ban/{user_id}")
def ban_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không phải admin")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại")

    user.is_banned = True
    db.commit()

    return {"message": f"Đã ban user {user.username}"}

@router.put("/unban/{user_id}")
def unban_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không phải admin")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại")

    user.is_banned = False
    db.commit()

    return {"message": f"Đã unban user {user.username}"}

@router.put("/{user_id}/role")
def update_user_role(
    user_id: int, 
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện hành động này")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại")
    
    if user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Không thể tự thay đổi quyền của chính mình")

    if role_data.role not in ["admin", "member"]:
        raise HTTPException(status_code=400, detail="Role không hợp lệ")

    user.role = role_data.role
    db.commit()

    return {"message": f"Đã cập nhật user {user.username} thành {user.role}"}