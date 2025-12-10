from fastapi import FastAPI
from app.database import engine, Base
from app.models import models
from app.routers import auth
from app.routers import auth, posts
from app.routers import comments


app = FastAPI()


Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(comments.router)