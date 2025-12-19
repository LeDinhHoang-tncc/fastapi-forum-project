from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel 
from typing import Optional
from app.database import get_db
from app.models.models import Comment, Post, User, Vote 
from app.routers.posts import get_current_user
from sqlalchemy import exists 
from app.utils.security import SECRET_KEY, ALGORITHM 
from jose import jwt

router = APIRouter(prefix="/comments", tags=["Comments"])

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentUpdate(BaseModel):
    content: str

@router.put("/{comment_id}/pin")
def toggle_pin_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Bình luận không tồn tại")
    
    post = comment.post
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền ghim bình luận này")

    comment.is_pinned = not comment.is_pinned
    db.commit()
    
    action = "đã ghim" if comment.is_pinned else "đã bỏ ghim"
    return {"message": f"Bình luận {action}", "is_pinned": comment.is_pinned}

@router.put("/{comment_id}")
def update_comment(
    comment_id: int,
    data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Bình luận không tồn tại")

    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền sửa bình luận này")

    comment.content = data.content
    db.commit()

    return {"message": "Cập nhật bình luận thành công"}

@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Bình luận không tồn tại")

    post = db.query(Post).filter(Post.id == comment.post_id).first()

    is_comment_owner = comment.author_id == current_user.id
    is_post_owner = post and post.author_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_comment_owner or is_post_owner or is_admin):
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa bình luận này")

    if post and post.comment_count > 0:
        post.comment_count -= 1

    comment.is_deleted = True

    db.commit()

    return {"message": "Đã xóa bình luận"}


@router.get("/{post_id}")
def get_comments(
    post_id: int, 
    db: Session = Depends(get_db),
    token: Optional[str] = Header(None, alias="Authorization")
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    
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

    comments = db.query(Comment).filter(Comment.post_id == post_id).all()
    
    result = []
    for c in comments:
        author = db.query(User).filter(User.id == c.author_id).first()
        vote_count = db.query(Vote).filter(Vote.comment_id == c.id).count()
        
        has_voted = False
        if current_user_id:
            has_voted = db.query(exists().where(
                Vote.comment_id == c.id,
                Vote.user_id == current_user_id
            )).scalar()

        result.append({
            "id": c.id,
            "content": c.content,
            "author_display_name": author.display_name if author else "Unknown",
            "created_at": c.created_at,
            "author_id": c.author_id,
            "parent_id": c.parent_id,
            "vote_count": vote_count,  
            "has_voted": has_voted,
            "is_pinned": c.is_pinned,
            "badge": get_badge(post.author.reputation) if post.author else None,
            "is_deleted": c.is_deleted
        })
    result.sort(key=lambda x: (x['is_pinned'], x['vote_count'], x['created_at']), reverse=True)
    
    return result

@router.post("/{comment_id}/vote")
def vote_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Bình luận không tồn tại")

    vote_query = db.query(Vote).filter(
        Vote.comment_id == comment_id, 
        Vote.user_id == current_user.id
    )
    found_vote = vote_query.first()

    if found_vote:
        db.delete(found_vote)
        if comment.author.reputation is None: comment.author.reputation = 0
        comment.author.reputation -= 1  
        db.commit()
        return {"message": "Đã bỏ thích", "vote_count": -1}
    else:
        new_vote = Vote(comment_id=comment_id, user_id=current_user.id)
        db.add(new_vote)
        if comment.author.reputation is None: comment.author.reputation = 0
        comment.author.reputation += 1 
        db.commit()
        return {"message": "Đã thích", "vote_count": 1}

@router.post("/create/{post_id}")
def create_comment(
    post_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    if data.parent_id:
        parent = db.query(Comment).filter(Comment.id == data.parent_id).first()
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=400, detail="Bình luận cha không hợp lệ")

    new_comment = Comment(
        content=data.content,
        author_id=current_user.id,
        post_id=post_id,
        parent_id=data.parent_id
    )

    db.add(new_comment)

    if post.comment_count is None:
        post.comment_count = 0
    post.comment_count += 1

    db.commit()
    db.refresh(new_comment)

    return {
        "message": "Tạo bình luận thành công",
        "comment_id": new_comment.id
    }

def get_badge(reputation: int):
    if reputation >= 100:
        return {"name": "Chuyên gia", "color": "#ff4500"}
    elif reputation >= 50:
        return {"name": "Mới nổi", "color": "#8a2be2"}
    elif reputation >= 1:
        return {"name": "Tích cực", "color": "#2ecc71"}
    return None