import { useEffect, useState } from 'react';
import api from '../api';
import '../App.css';
import { Link } from 'react-router-dom';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const MAX_TITLE_LENGTH = 200;
  const MAX_CONTENT_LENGTH = 5000;

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

  const checkLoginStatus = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await api.get('/users/me');
        console.log("User Info:", response.data); 
        setUser(response.data);
      } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
        localStorage.removeItem('access_token');
        setUser(null);
      }
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/posts/create', {
        title: newTitle,
        content: newContent
      });
      alert("Đăng bài thành công!");
      setShowModal(false);
      setNewTitle("");    
      setNewContent("");
      fetchPosts();     
    } catch (error) {
      alert("Lỗi khi đăng bài: " + (error.response?.data?.detail || "Không rõ"));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);
      alert("Xóa bài viết thành công!");
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error("Lỗi xóa bài:", error);
      alert("Không thể xóa bài viết: " + (error.response?.data?.detail || "Lỗi không xác định"));
    }
  };

  const handleTogglePin = async (post) => {
    const action = post.is_pinned ? "unpin" : "pin";
    const confirmMessage = post.is_pinned 
        ? "Bạn muốn bỏ ghim bài viết này?" 
        : "Bạn muốn ghim bài viết này lên đầu?";

    if (!window.confirm(confirmMessage)) return;

    try {
        await api.put(`/posts/${action}/${post.id}`);
        alert(post.is_pinned ? "Đã bỏ ghim!" : "Đã ghim bài viết!");
        fetchPosts();
    } catch (error) {
        console.error("Lỗi ghim bài:", error);
        alert("Lỗi: " + (error.response?.data?.detail || "Không thể thực hiện hành động"));
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  const handleVote = async (postId) => {
    if (!user) {
      alert("Bạn cần đăng nhập để thực hiện hành động này!");
      return;
    }

    try {
      await api.post(`/posts/${postId}/vote`);
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const isVotedNow = !post.has_voted;
          return {
            ...post,
            has_voted: isVotedNow,
            vote_count: isVotedNow ? post.vote_count + 1 : post.vote_count - 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error("Lỗi vote:", error);
      alert("Có lỗi xảy ra khi bình chọn.");
    }
  };

  useEffect(() => {
    fetchPosts();
    checkLoginStatus();
  }, []);

    const formatTimeAgo = (dateString) => {
        if (!dateString) return "";
    
        const dateValue = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    
        const now = new Date();
        const postedDate = new Date(dateValue);
        
        const diffInMs = now - postedDate; 
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMinutes < 1) return "Vừa xong";
        else if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        else if (diffInHours < 24) return `${diffInHours} giờ trước`;
        else if (diffInDays < 7) return `${diffInDays} ngày trước`;
        else return postedDate.toLocaleDateString('vi-VN');
    };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="navbar-content">
          <h1 className="logo">Diễn Đàn Sinh Viên</h1>
          <div className="nav-actions">
            {user ? (
              <div className="user-menu">
                <span className="welcome-text">
                   Xin chào, <strong>{user.display_name}</strong>
                </span>
                
                <button 
                  className="btn-primary" 
                  onClick={() => setShowModal(true)}
                  style={{marginLeft: '10px', marginRight: '10px'}}>
                  Viết bài
                </button>

                <button className="btn-primary" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="btn-primary">Đăng nhập</button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Tạo bài viết mới</h2>
            <form onSubmit={handleCreatePost}>
                <div style={{ marginBottom: '10px' }}>
                    <input 
                      className="input-title"
                      type="text" 
                      placeholder="Tiêu đề bài viết..." 
                      value={newTitle}
                      maxLength={MAX_TITLE_LENGTH} 
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      style={{ width: '100%', marginBottom: '5px' }} 
                    />
                    <div style={{ 
                        textAlign: 'right', 
                        fontSize: '12px', 
                        color: newTitle.length >= MAX_TITLE_LENGTH ? 'red' : '#666' 
                    }}>
                      {newTitle.length} / {MAX_TITLE_LENGTH} ký tự
                </div>
              </div>

                <div style={{ marginBottom: '10px' }}>
                  <textarea 
                    className="input-content"
                    placeholder="Bạn đang nghĩ gì?" 
                    rows="5"
                    value={newContent}
                    maxLength={MAX_CONTENT_LENGTH} 
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    style={{ width: '100%', marginBottom: '5px' }}
                  ></textarea>

                  <div style={{ 
                      textAlign: 'right', 
                      fontSize: '12px', 
                      color: newContent.length >= MAX_CONTENT_LENGTH ? 'red' : '#666' 
                  }}>
                    {newContent.length} / {MAX_CONTENT_LENGTH} ký tự
                  </div>
                </div>
                <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                    <button type="submit" className="btn-primary">Đăng ngay</button>
                </div>
            </form>
          </div>
        </div>
      )}

      <main className="feed-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <article key={post.id} className="post-card">
                <h3 className="post-title">
                    {post.is_pinned && <span title="Bài viết đã ghim" style={{ marginRight: '8px' }}>📌</span>}
                    {post.title}
                </h3>
                <div className="post-meta">
                  <span>Đăng bởi <strong className="author-name">{post.author_name}</strong>                    
                  <span 
                        title="Điểm uy tín" 
                        style={{ 
                            marginLeft: '8px', 
                            color: '#ffffffff',
                            fontWeight: 'bold', 
                            fontSize: '0.9em',
                            backgroundColor: '#e6ffa2ff', 
                            padding: '2px 6px',
                            borderRadius: '4px'
                        }}
                    >
                       ★ {post.reputation}
                    </span></span>
                  <span className="separator">•</span>
                  <span>{formatTimeAgo(post.created_at)}</span>
                </div>
                <hr className="divider"/>
                <div className="post-body">
                  <p className="post-content">{post.content}</p>
                </div>
                <div className="post-footer">
                  <button 
                        className={`action-btn ${post.has_voted ? 'liked' : ''}`} 
                        onClick={() => handleVote(post.id)}
                        style={{ 
                            color: post.has_voted ? '#2563eb' : 'inherit',
                            fontWeight: post.has_voted ? 'bold' : 'normal'
                        }}>
                        {post.has_voted ? 'Đã thích' : 'Thích'} ({post.vote_count || 0})
                    </button>
                  <button className="action-btn">Bình luận</button>
                </div>
                    <div className="admin-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '10px', marginTop: `10px` }}>
                        {user && user.role === "admin" && (
                            <button 
                                className="action-btn" 
                                onClick={() => handleTogglePin(post)}
                                style={{ color: post.is_pinned ? '#d97706' : '#059669', fontWeight: 'bold' }}
                            >
                                {post.is_pinned ? "Bỏ ghim" : "Ghim bài"}
                            </button>
                        )}

                        {user && (user.id === post.author_id || user.role === "admin") && (
                            <button className="action-btn delete-btn" onClick={() => handleDeletePost(post.id)} style={{ color: 'red' }}>
                                Xóa bài
                            </button>
                        )}
                    </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;