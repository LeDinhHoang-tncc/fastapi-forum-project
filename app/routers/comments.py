from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Comment, Post, User
from app.routers.posts import get_current_user

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.post("/create/{post_id}")
def create_comment(
    post_id: int, 
    content: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    
    if not content.strip():
        raise HTTPException(status_code=400, detail="Nội dung không được để trống")

    new_comment = Comment(
        content=content,
        post_id=post_id,
        author_id=current_user.id
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return {"message": "Bình luận thành công", "id": new_comment.id}

@router.get("/{post_id}")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    
    comments = db.query(Comment).filter(Comment.post_id == post_id)\
        .order_by(Comment.created_at.desc()).all()
    
    result = []
    for c in comments:
        author = db.query(User).filter(User.id == c.author_id).first()

        result.append({
            "id": c.id,
            "content": c.content,
            "author_display_name": author.display_name if author else "Unknown",
            "created_at": c.created_at,
        })

    return result
