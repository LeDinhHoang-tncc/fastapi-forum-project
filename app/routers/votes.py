from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Vote, Post, User
from app.routers.posts import get_current_user

router = APIRouter(prefix="/votes", tags=["Vote"])

@router.post("/{post_id}", status_code=status.HTTP_201_CREATED)
def vote(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    post_author = db.query(User).filter(User.id == post.author_id).first()

    vote_query = db.query(Vote).filter(Vote.post_id == post_id, Vote.user_id == current_user.id)
    found_vote = vote_query.first()

    if found_vote:
        vote_query.delete(synchronize_session=False)
        
        if post_author and post.author_id != current_user.id:
            post_author.reputation -= 1
        
        db.commit()
        return {"message": "Đã bỏ like"}

    else:
        if post.author_id == current_user.id:
             new_vote = Vote(post_id=post_id, user_id=current_user.id)
             db.add(new_vote)
             db.commit()
             return {"message": "Đã like (Không cộng điểm cho bài viết của chính bạn)"}

        new_vote = Vote(post_id=post_id, user_id=current_user.id)
        db.add(new_vote)
        
        if post_author:
            post_author.reputation += 1
            
        db.commit()
        return {"message": "Đã like thành công"}