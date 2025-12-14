from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship, backref
from datetime import datetime

from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(200), nullable=False)
    reputation = Column(Integer, default=0)
    is_banned = Column(Boolean, default=False)
    role = Column(String(50), default="member")
    email = Column(String, unique=True, nullable=True)
    display_name = Column(String, nullable=True)


    posts = relationship("Post", back_populates="author")
    comments = relationship("Comment", back_populates="author")
    votes = relationship("Vote", back_populates="user")


class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_pinned = Column(Boolean, default=False)
    comment_count = Column(Integer, default=0)

    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post")
    votes = relationship("Vote", back_populates="post")


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    is_pinned = Column(Boolean, default=False) 
    is_deleted = Column(Boolean, default=False)

    

    replies = relationship("Comment", backref=backref('parent', remote_side=[id]))
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    votes = relationship("Vote", back_populates="comment")


class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vote_type = Column(Integer, default=1) 
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)

    user = relationship("User", back_populates="votes")
    post = relationship("Post", back_populates="votes")
    comment = relationship("Comment", back_populates="votes")
