from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db
from app.models.models import Post, User
from app.utils.security import create_access_token
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from typing import List
from sqlalchemy.orm import joinedload

from app.utils.security import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/posts", tags=["Posts"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.get("/")
def get_posts(
    skip: int = 0, 
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    posts = (
    db.query(Post)
    .options(joinedload(Post.author))
    .order_by(Post.is_pinned.desc(), Post.created_at.desc())
    .offset(skip)
    .limit(limit)
    .all()
)
    results = []
    for post in posts:
        author_name = "Người dùng ẩn"
        if post.author:
            if post.author.display_name:
                author_name = post.author.display_name
            else:
                author_name = post.author.username

        results.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "created_at": post.created_at,
            "author_id": post.author_id,
            "author_name": author_name,
            "reputation": post.author.reputation if post.author else 0
        })
        
    return results

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


@router.get("/{post_id}")
def get_post_detail(post_id: int, db: Session = Depends(get_db)):

    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
        
    return post

@router.put("/pin/{post_id}")
def pin_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không phải admin")

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    post.is_pinned = True
    db.commit()

    return {"message": f"Ghim bài viết {post.title} thành công"}

@router.put("/unpin/{post_id}")
def unpin_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không phải admin")

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    post.is_pinned = False
    db.commit()

    return {"message": f"Bỏ ghim bài viết {post.title} thành công"}
