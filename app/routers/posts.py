from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session, joinedload
from app.database import SessionLocal, get_db
from app.models.models import Post, User, Vote
from app.utils.security import create_access_token
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import func, case, exists, or_



from app.utils.security import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/posts", tags=["Posts"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class PostCreate(BaseModel):
    title: str
    content: str

def get_current_user_optional(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            return None
        return db.query(User).filter(User.username == username).first()
    except:
        return None

@router.get("/")
def get_posts(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None, 
    db: Session = Depends(get_db),
    token: Optional[str] = Header(None, alias="Authorization")
):
    current_user_id = None
    if token:
        try:
            scheme, _, param = token.partition(" ")
            actual_token = param if scheme.lower() == 'bearer' else token
            
            payload = jwt.decode(actual_token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            user = db.query(User).filter(User.username == username).first()
            if user:
                current_user_id = user.id
        except:
            pass 

    search_filter = True
    if search:
        search_term = f"%{search}%"
        search_filter = or_(
            Post.title.ilike(search_term),
            Post.content.ilike(search_term)
        )

    pinned_posts = []
    if skip == 0:
        pinned_posts = (
            db.query(Post)
            .join(Post.author)
            .filter(Post.is_pinned == True) 
            .filter(search_filter) 
            .order_by(Post.created_at.desc())
            .all()
        )

    regular_posts = (
        db.query(Post)
        .join(Post.author)
        .filter(Post.is_pinned == False)
        .filter(search_filter)
        .options(joinedload(Post.author))
        .order_by(
            func.date(Post.created_at).desc(),    
            case((User.role == "admin", 1), else_=0).desc(), 
            User.reputation.desc(),                
            Post.created_at.desc()               
        )
        .offset(skip) 
        .limit(limit) 
        .all()
    )

    posts = pinned_posts + regular_posts

    results = []
    for post in posts:
        author_name = "Người dùng ẩn"
        if post.author:
            author_name = post.author.display_name or post.author.username

        vote_count = db.query(Vote).filter(Vote.post_id == post.id).count()
        
        has_voted = False
        if current_user_id:
            has_voted = db.query(exists().where(
                Vote.post_id == post.id,
                Vote.user_id == current_user_id
            )).scalar()

        results.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "created_at": post.created_at,
            "author_id": post.author_id,
            "author_name": author_name,
            "reputation": post.author.reputation if post.author else 0,
            "is_pinned": post.is_pinned,
            "vote_count": vote_count,  
            "has_voted": has_voted     
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
def create_post(
    post: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if len(post.title) > 200:
        raise HTTPException(status_code=400, detail="Tiêu đề quá dài (tối đa 200 ký tự)")
    if len(post.title) < 2:
        raise HTTPException(status_code=400, detail="Tiêu đề quá ngắn")
    if len(post.content) > 5000:
        raise HTTPException(status_code=400, detail="Nội dung bài viết quá dài (tối đa 5000 ký tự)")
    
    new_post = Post(
        title=post.title,
        content=post.content,
        author_id=current_user.id
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return {"message": "Đăng bài thành công", "id": new_post.id}

@router.delete("/{post_id}")
def delete_post(
    post_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Bạn không có quyền xóa bài viết này")
    
    db.delete(post)
    db.commit()

    return {"message": "Xóa bài viết thành công"}

@router.get("/{post_id}")
def get_post_detail(post_id: int, db: Session = Depends(get_db)):

    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
        
    return post

@router.post("/{post_id}/vote")
def vote_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    vote_query = db.query(Vote).filter(
        Vote.post_id == post_id, 
        Vote.user_id == current_user.id
    )
    found_vote = vote_query.first()

    if found_vote:
        db.delete(found_vote)
        
        if post.author.reputation is None:
            post.author.reputation = 0
        
        post.author.reputation -= 1  
        
        db.commit()
        return {"message": "Đã bỏ bình chọn"}
        
    else:
        new_vote = Vote(post_id=post_id, user_id=current_user.id)
        db.add(new_vote)
        
        if post.author.reputation is None:
            post.author.reputation = 0
            
        post.author.reputation += 1
        
        db.commit()
        return {"message": "Đã bình chọn thành công"}

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
