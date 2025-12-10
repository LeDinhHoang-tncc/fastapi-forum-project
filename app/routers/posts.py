from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db
from app.models.models import Post, User
from app.utils.security import create_access_token
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from typing import List

from app.utils.security import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/posts", tags=["Posts"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")



def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if username is None:
            raise HTTPException(status_code=401, detail="Mã thông báo không hợp lệ")

        user = db.query(User).filter(User.username == username).first()

        if not user:
            raise HTTPException(status_code=401, detail="Người dùng không tìm thấy")

        if user.is_banned:
            raise HTTPException(status_code=403, detail="Người dùng bị cấm")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Mã thông báo không hợp lệ")


@router.post("/create")
def create_post(title: str, content: str,
                db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):

    if len(title) < 2:
        raise HTTPException(status_code=400, detail="Tiêu đề quá ngắn")

    new_post = Post(
        title=title,
        content=content,
        author_id=current_user.id
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return {
        "message": "Post created",
        "post": {
            "id": new_post.id,
            "title": new_post.title,
            "author": current_user.username,
            "created_at": new_post.created_at
        }
    }

@router.get("/")
def get_posts(
    skip: int = 0, 
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts

@router.get("/{post_id}")
def get_post_detail(post_id: int, db: Session = Depends(get_db)):

    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
        
    return post