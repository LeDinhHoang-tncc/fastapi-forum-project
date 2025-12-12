from fastapi import FastAPI
from app.database import engine, Base
from app.models import models
from app.database import engine, SessionLocal
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from app.routers import auth, posts, comments, users, votes
from fastapi.middleware.cors import CORSMiddleware


def decay_reputation_job():
    print("--- BẮT ĐẦU QUÉT ĐIỂM UY TÍN ---")
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        for user in users:
            last_post = db.query(models.Post)\
                .filter(models.Post.author_id == user.id)\
                .order_by(models.Post.created_at.desc())\
                .first()
            
            should_penalize = False
            
            if not last_post:
                pass 
            else:
                days_diff = (datetime.utcnow() - last_post.created_at).days
                if days_diff >= 7:
                    should_penalize = True
            
            if should_penalize and user.reputation > 0:
                if user.reputation < 5:
                    user.reputation = 0
                else:
                    user.reputation -= 5
                print(f"User {user.username} bị trừ điểm vì lười đăng bài.")
        
        db.commit()
    except Exception as e:
        print(f"Lỗi khi chạy: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    
    from apscheduler.triggers.cron import CronTrigger
    scheduler.add_job(decay_reputation_job, CronTrigger(hour=0, minute=0))
    
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(users.router)
app.include_router(votes.router)


Base.metadata.create_all(bind=engine)