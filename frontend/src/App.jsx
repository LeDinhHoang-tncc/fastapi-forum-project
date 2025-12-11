import { useEffect, useState } from 'react';
import api from './api';
import './App.css';

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts/');
      setPosts(response.data);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postedDate = new Date(dateString);
    
    const diffInMs = now - postedDate; 
    
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);

    if (diffInMinutes < 1) {
      return "Vừa xong";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const options = { 
        hour: '2-digit', 
        minute: '2-digit', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      };
      return postedDate.toLocaleDateString('vi-VN', options);
    }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="navbar-content">
          <h1 className="logo">Diễn Đàn Sinh Viên</h1>
          <div className="nav-actions">
            <button className="btn-primary">Đăng nhập</button>
          </div>
        </div>
      </header>

      <main className="feed-container">
        {loading ? (
          <div className="loading">Đang tải danh sách bài viết...</div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <article key={post.id} className="post-card">
                
                <h3 className="post-title">{post.title}</h3>

                <div className="post-meta">
                  <span>
                    Đăng bởi <strong className="author-name">{post.author_name}</strong>
                  </span>
                  <span className="separator">•</span>
                  <span>
                    {formatTimeAgo(post.created_at)}
                  </span>
                </div>

                <hr className="divider"/>

                <div className="post-body">
                  <p className="post-content">{post.content}</p>
                </div>

                <div className="post-footer">
                  <button className="action-btn">Thích</button>
                  <button className="action-btn">Bình luận</button>
                </div>

              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;