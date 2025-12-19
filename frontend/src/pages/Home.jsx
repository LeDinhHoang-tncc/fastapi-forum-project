import { useEffect, useState, useRef } from 'react';
import api from '../api';
import '../App.css';
import { Link } from 'react-router-dom';

const Badge = ({ badge }) => {
    if (!badge) return null;
    return (
        <span style={{
            backgroundColor: badge.color,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            marginLeft: '5px',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px'
        }}>
            {badge.name}
        </span>
    );
};
const menuButtonStyle = {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#1c1e21',
    display: 'block',
    transition: 'background 0.2s',
    hover: { backgroundColor: '#f2f2f2' }
};

const menuItemStyle = {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1c1e21',
    cursor: 'pointer',
    transition: 'background 0.2s'
};
const dropdownStyles = {
    menuContainer: { position: 'relative', display: 'inline-block' },
    menuBtn: { border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#65676b', fontWeight: 'bold', fontSize: '16px' },
    dropdownContent: {
        position: 'absolute',
        right: 0,
        top: '100%',
        backgroundColor: 'white',
        minWidth: '150px',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        zIndex: 100,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    },
    dropdownItem: {
        padding: '10px 15px',
        border: 'none',
        background: 'white',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '13px',
        color: '#333'
    }
};
const CommentItem = ({ comment, onReply, onVote, onPin, onEdit, onDelete, postAuthorId, currentUserId, isAdmin, onBan }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showMenu, setShowMenu] = useState(false); 
    const menuRef = useRef(null); 
    

    const isOwner = currentUserId === comment.author_id; 
    const isPostAuthor = currentUserId === postAuthorId; 
    const canDelete = isOwner || isPostAuthor ; 
    const canPin = isPostAuthor ;

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const handleSaveEdit = () => {
        if (editContent.trim() !== "") {
            onEdit(comment.id, editContent);
            setIsEditing(false);
        }
    };

    const isDeleted = comment.is_deleted;

    return (
        <div style={{ 
            marginTop: '12px', 
            display: 'flex', 
            gap: '10px',
            opacity: isDeleted ? 0.6 : 1 
        }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#666', flexShrink: 0 }}>
                {comment.author_display_name?.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ 
                    backgroundColor: isDeleted ? '#f0f2f5' : (comment.is_pinned ? '#f0f9ff' : '#f0f2f5'), padding: '8px 12px', borderRadius: '12px',position: 'relative', border: comment.is_pinned ? '1px solid #bae6fd' : 'none'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                                {comment.author_display_name || comment.author_name}
                                <Badge badge={comment.badge}/>
                                {isAdmin && (
                                    <span style={{ color: 'red', fontSize: '11px', marginLeft: '5px' }}>
                                        (ID: {comment.author_id})
                                    </span>
                                )}
                            </span>
                                {comment.is_pinned && <span style={{ marginLeft: '6px', fontSize: '11px', color: '#e11d48' }}>📌 Đã ghim</span>}
                        </div>
                        {(isOwner || isPostAuthor || isAdmin) && (
                            <div style={dropdownStyles.menuContainer} ref={menuRef}>
                                <button style={dropdownStyles.menuBtn} onClick={() => setShowMenu(!showMenu)}>
                                    •••
                                </button>
                                {showMenu && (
                                    <div style={dropdownStyles.dropdownContent}>
                                        {canPin && (
                                            <button style={dropdownStyles.dropdownItem} onClick={() => { onPin(comment.id); setShowMenu(false); }}>
                                                {comment.is_pinned ? "Bỏ ghim" : "Ghim"}
                                            </button>
                                        )}
                                        {isOwner && (
                                            <button style={dropdownStyles.dropdownItem} onClick={() => { onEdit(comment); setShowMenu(false); }}>
                                                Chỉnh sửa
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button style={{...dropdownStyles.dropdownItem, color: 'red'}} onClick={() => { onDelete(comment.id); setShowMenu(false); }}>
                                                Xóa
                                            </button>
                                        )}
                                        {isAdmin && !isOwner && (
                                            <button 
                                                style={{...dropdownStyles.dropdownItem, color: '#d9534f', borderTop: '1px solid #eee', fontWeight: 'bold'}} 
                                                onClick={() => {
                                                    onBan(comment.author_id, comment.author_name);
                                                    setShowMenu(false);
                                                }}>
                                                Ban User
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div style={{ marginTop: '8px' }}>
                            <textarea 
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '60px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setIsEditing(false)} style={{ fontSize: '11px', padding: '4px 8px', cursor: 'pointer', border:'none', background:'none', color:'#666' }}>Hủy</button>
                                <button onClick={handleSaveEdit} style={{ fontSize: '11px', padding: '4px 12px', cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Lưu</button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ 
                            margin: '2px 0 0 0', 
                            fontSize: '14px', 
                            lineHeight: '1.4', 
                            color: isDeleted ? '#999' : '#1a1a1a',
                            fontStyle: isDeleted ? 'italic' : 'normal'
                        }}>
                            {isDeleted ? "Bình luận này đã bị xóa." : comment.content}
                        </p>
                    )}
                </div>
                {!isDeleted && (
                    <div style={{ display: 'flex', gap: '12px', marginLeft: '12px', marginTop: '4px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#65676b' }}>
                            {formatTimeAgo(comment.created_at)}
                        </span>
                        
                        <button 
                            onClick={() => onVote(comment.id)}
                            style={{ 
                                background: 'none', border: 'none', 
                                color: comment.has_voted ? '#2563eb' : '#65676b',
                                cursor: 'pointer', 
                                fontSize: '11px', fontWeight: 'bold',
                                padding: '0'
                            }}
                        >
                            Thích {comment.vote_count > 0 && `(${comment.vote_count})`}
                        </button>

                        <button 
                            onClick={() => onReply(comment)}
                            style={{ 
                                background: 'none', border: 'none', 
                                color: '#65676b', cursor: 'pointer', 
                                fontSize: '11px', fontWeight: 'bold',
                                padding: '0'
                            }}
                        >
                            Phản hồi
                        </button>
                    </div>
                )}

                {comment.children && comment.children.length > 0 && (
                     <div style={{ marginTop: '5px', marginLeft: '10px' }}>
                        <button 
                            onClick={() => setShowReplies(!showReplies)}
                            style={{
                                background: 'none', border: 'none',
                                color: '#65676b', cursor: 'pointer',
                                fontSize: '12px', fontWeight: '600',
                                padding: '0', display: 'flex', alignItems: 'center', gap: '5px'
                            }}>
                            {showReplies ? "▲ Ẩn bớt" : `↪ Xem ${comment.children.length} câu trả lời`}
                        </button>
                    </div>
                )}

                {showReplies && comment.children && comment.children.length > 0 && (
                    <div className="replies-list">
                        {comment.children.map(child => (
                            <CommentItem 
                                key={child.id} 
                                comment={child} 
                                onReply={onReply} 
                                onVote={onVote}
                                onPin={onPin}
                                isAdmin={isAdmin} 
                                onBan={onBan}
                                onEdit={onEdit}       
                                onDelete={onDelete}   
                                postAuthorId={postAuthorId}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

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

function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);
    const [user, setUser] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); 
    const [appliedSearch, setAppliedSearch] = useState("");
    const [activeCommentPostId, setActiveCommentPostId] = useState(null); 
    const [postComments, setPostComments] = useState({}); 
    const [commentContent, setCommentContent] = useState("");
    const [currentPostForComment, setCurrentPostForComment] = useState(null); 
    const [commentsTree, setCommentsTree] = useState([]);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); 
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const MAX_TITLE_LENGTH = 200;
    const MAX_CONTENT_LENGTH = 5000;
    const [page, setPage] = useState(1);
    const [activeMenuPostId, setActiveMenuPostId] = useState(null);
    const postMenuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (postMenuRef.current && !postMenuRef.current.contains(event.target)) {
                setActiveMenuPostId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            alert("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            await api.put(`/users/change-password?new_password=${encodeURIComponent(newPassword)}`);
            
            alert("Đổi mật khẩu thành công!");
            setShowPasswordModal(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.detail || "Không thể đổi mật khẩu"));
        }
    };

    const fetchPosts = async () => {
        setLoading(true); 
        try {
            const limit = 10;
            const skip = (page - 1) * limit; 
            
            let url = `/posts/?skip=${skip}&limit=${limit}`;
            if (appliedSearch) {
                url += `&search=${encodeURIComponent(appliedSearch)}`;
            }

            const response = await api.get(url);
            setPosts(response.data);
        } catch (error) {
            console.error("Lỗi:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (userId, username) => {
        if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn KHÓA tài khoản của thành viên "${username}"?\nThành viên này sẽ không thể đăng nhập được nữa.`)) {
            return;
        }

        try {
            await api.put(`/users/ban/${userId}`);
            alert(`Đã khóa tài khoản thành viên ${username} thành công.`);
            fetchPosts();
        } catch (error) {
            console.error("Lỗi ban user:", error);
            alert("Lỗi: " + (error.response?.data?.detail || "Không thể thực hiện hành động"));
        }
        setActiveMenuPostId(null);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); 
        setAppliedSearch(searchTerm); 
    };

    const openCreateModal = () => {
        setIsEditingPost(false);
        setNewTitle("");
        setNewContent("");
        setShowModal(true);
    };

    const openEditModal = (post) => {
        setIsEditingPost(true);
        setEditingPostId(post.id);
        setNewTitle(post.title);
        setNewContent(post.content);
        setShowModal(true);
        setActiveMenuPostId(null); 
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditingPost) {
                await api.put(`/posts/${editingPostId}`, {
                    title: newTitle,
                    content: newContent
                });
                alert("Cập nhật bài viết thành công!");
                
                setPosts(posts.map(p => 
                    p.id === editingPostId ? { ...p, title: newTitle, content: newContent } : p
                ));
            } else {
                await api.post('/posts/create', {
                    title: newTitle,
                    content: newContent
                });
                alert("Đăng bài thành công!");
                setPage(1);
                fetchPosts(); 
            }
            setShowModal(false);
            setNewTitle("");    
            setNewContent("");    
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.detail || "Không rõ"));
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
        setPage(1);
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
        setActiveMenuPostId(null);
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

    const fetchComments = async (postId) => {
        try {
            const response = await api.get(`/comments/${postId}`);
            setPostComments(prev => ({
                ...prev,
                [postId]: response.data
            }));
        } catch (error) {
            console.error("Lỗi tải bình luận:", error);
        }
    };

    const toggleComments = (postId) => {
        if (activeCommentPostId === postId) {
            setActiveCommentPostId(null); 
        } else {
            setActiveCommentPostId(postId);
            fetchComments(postId); 
        }
    };

    const handleSubmitComment = async (e, postId) => {
        e.preventDefault();
        if (!user) {
            alert("Vui lòng đăng nhập để bình luận!");
            return;
        }
        if (!commentContent.trim()) return;

        try {
            await api.post(`/comments/create/${postId}`, {
                content: commentContent
            });
            
            setCommentContent("");
            fetchComments(postId);
        } catch (error) {
            console.error("Lỗi gửi bình luận:", error);
            alert("Không thể gửi bình luận.");
        }
    };

    const handleEditComment = async (commentId, newContent) => {
        try {
            await api.put(`/comments/${commentId}`, { content: newContent });
            
            const updateEditNode = (nodes) => {
                return nodes.map(node => {
                    if (node.id === commentId) {
                        return { ...node, content: newContent };
                    }
                    if (node.children) {
                        return { ...node, children: updateEditNode(node.children) };
                    }
                    return node;
                });
            };
            setCommentsTree(prev => updateEditNode(prev));
        } catch (error) {
            console.error("Lỗi sửa comment:", error);
            alert("Không thể sửa bình luận: " + (error.response?.data?.detail || "Lỗi server"));
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;

        try {
            await api.delete(`/comments/${commentId}`);

            const deleteNode = (nodes) => {
                return nodes.filter(node => node.id !== commentId).map(node => {
                    if (node.children) {
                        return { ...node, children: deleteNode(node.children) };
                    }
                    return node;
                });
            };
            
            setCommentsTree(prev => deleteNode(prev));
            
            setPosts(prevPosts => prevPosts.map(post => {
                if (post.id === currentPostForComment?.id) {
                    return { ...post, comment_count: Math.max(0, (post.comment_count || 0) - 1) };
                }
                return post;
            }));

        } catch (error) {
            console.error("Lỗi xóa comment:", error);
            alert("Không thể xóa bình luận.");
        }
    };

    const handleCommentVote = async (commentId) => {
        if (!user) {
            alert("Bạn cần đăng nhập để thích bình luận!");
            return;
        }

        try {
            await api.post(`/comments/${commentId}/vote`);
            
            const updateCommentTree = (nodes) => {
                return nodes.map(node => {
                    if (node.id === commentId) {
                        const isVoted = !node.has_voted;
                        return {
                            ...node,
                            has_voted: isVoted,
                            vote_count: isVoted ? (node.vote_count || 0) + 1 : (node.vote_count || 0) - 1
                        };
                    }
                    if (node.children) {
                        return { ...node, children: updateCommentTree(node.children) };
                    }
                    return node;
                });
            };
            
            setCommentsTree(prevTree => updateCommentTree(prevTree));

        } catch (error) {
            console.error("Lỗi vote comment:", error);
            alert("Không thể thực hiện hành động này.");
        }
    };

    const handlePinComment = async (commentId) => {
        try {
            await api.put(`/comments/${commentId}/pin`);
            
            const updatePinStatus = (nodes) => {
                return nodes.map(node => {
                    if (node.id === commentId) {
                        return { ...node, is_pinned: !node.is_pinned };
                    }
                    if (node.children) {
                        return { ...node, children: updatePinStatus(node.children) };
                    }
                    return node;
                });
            };
            
            setCommentsTree(prevTree => sortComments(updatePinStatus(prevTree)));

        } catch (error) {
            console.error("Lỗi ghim comment:", error);
            alert("Lỗi: " + (error.response?.data?.detail || "Không thể thực hiện hành động"));
        }
    };

    const sortNodes = (nodes) => {
        return nodes.sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
            if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count;
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }

    const sortComments = (nodes) => {
        let sorted = sortNodes([...nodes]);
        sorted.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.children = sortComments(node.children);
            }
        });
        return sorted;
    }

    const buildCommentTree = (comments) => {
        const map = {};
        const roots = [];
        
        comments.forEach(c => {
            map[c.id] = { ...c, children: [] };
        });

        comments.forEach(c => {
            if (c.parent_id && map[c.parent_id]) {
                map[c.parent_id].children.push(map[c.id]);
            } else {
                roots.push(map[c.id]);
            }
        });
    
        return sortComments(roots); 
    };

    const openCommentModal = async (post) => {
        setCurrentPostForComment(post);
        setShowCommentModal(true);
        setReplyingTo(null); 
        
        try {
            const response = await api.get(`/comments/${post.id}`);
            const tree = buildCommentTree(response.data);
            setCommentsTree(tree);
        } catch (error) {
            console.error("Lỗi tải comment:", error);
        }
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("Vui lòng đăng nhập để thực hiện chức năng này!");
            return;
        }
        if (!commentContent.trim()) return;

        try {
            await api.post(`/comments/create/${currentPostForComment.id}`, {
                content: commentContent,
                parent_id: replyingTo ? replyingTo.id : null 
            });

            setCommentContent("");
            setReplyingTo(null); 
            
            const response = await api.get(`/comments/${currentPostForComment.id}`);
            setCommentsTree(buildCommentTree(response.data));
            
            setPosts(prevPosts => prevPosts.map(post => {
                if (post.id === currentPostForComment.id) {
                    return {
                        ...post,
                        comment_count: (post.comment_count || 0) + 1
                    };
                }
                return post;
            }));

        } catch (error) {
            console.error("Lỗi gửi bình luận:", error);
            
            if (error.response && error.response.status === 401) {
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                handleLogout(); 
            } else {
                alert("Lỗi gửi bình luận: " + (error.response?.data?.detail || "Lỗi không xác định"));
            }
        }
    };

    useEffect(() => {
        fetchPosts();
        checkLoginStatus();
    }, [page, appliedSearch]);

    return (
        <div className="app-container">
            <header className="navbar" style={{ padding: '0 20px', height: '65px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div className="navbar-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <h1 className="logo" style={{ fontSize: '24px', color: '#2563eb', margin: 0 }}>Diễn Đàn Sinh Viên</h1>
                    <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {user ? (
                            <>
                                <button 
                                    className="btn-primary" 
                                    onClick={() => setShowModal(true)}
                                    style={{ padding: '8px 16px', borderRadius: '20px', fontWeight: '600' }}
                                >
                                    + Viết bài
                                </button>
                                <div style={{ position: 'relative' }} ref={userMenuRef}>
                                    <div 
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',padding: '5px 10px',borderRadius: '8px',backgroundColor: showUserMenu ? '#f0f2f5' : 'transparent',transition: '0.2s'}}>
                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {user.display_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: '500', color: '#333' }}>{user.display_name}</span>
                                        <span style={{ fontSize: '10px' }}>{showUserMenu ? '▲' : '▼'}</span>
                                    </div>
                                    {showUserMenu && (
                                        <div style={{position: 'absolute',right: 0,top: '110%',width: '220px',backgroundColor: 'white',borderRadius: '12px',boxShadow: '0 4px 20px rgba(0,0,0,0.15)',zIndex: 1000,overflow: 'hidden',padding: '8px 0'}}>
                                            <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee', marginBottom: '5px' }}>
                                                <div style={{ fontSize: '12px', color: '#65676b' }}>Tài khoản</div>
                                                <div style={{ fontWeight: 'bold', truncate: 'true' }}>{user.email}</div>
                                            </div>

                                            {user.role === 'admin' && (
                                                <Link to="/admin" style={{ textDecoration: 'none' }} onClick={() => setShowUserMenu(false)}>
                                                    <div style={menuItemStyle}>Trang Quản Trị</div>
                                                </Link>
                                            )}
                                            <button 
                                                onClick={() => { setShowPasswordModal(true); setShowUserMenu(false); }}
                                                style={menuButtonStyle}>
                                                Đổi mật khẩu
                                            </button>

                                            <div style={{ borderTop: '1px solid #eee', margin: '5px 0' }}></div>
                                            
                                            <button 
                                                onClick={() => { handleLogout(); setShowUserMenu(false); }}
                                                style={{ ...menuButtonStyle, color: '#dc3545' }}>
                                                Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link to="/login">
                                <button className="btn-primary" style={{ padding: '8px 20px', borderRadius: '20px' }}>Đăng nhập</button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h2>Đổi mật khẩu</h2>
                        <form onSubmit={handleChangePassword}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Mật khẩu mới:</label>
                                <input 
                                    className="input-title"
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Tối thiểu 6 ký tự"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Xác nhận mật khẩu:</label>
                                <input className="input-title"type="password" value={confirmPassword}onChange={(e) => setConfirmPassword(e.target.value)}requiredplaceholder="Nhập lại mật khẩu mới"style={{ width: '100%' }}/>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => {
                                    setShowPasswordModal(false);
                                    setNewPassword("");
                                    setConfirmPassword("");
                                }}>Hủy</button>
                                <button type="submit" className="btn-primary">Cập nhật</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{isEditingPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h2>
                        <form onSubmit={handlePostSubmit}>
                            <div style={{ marginBottom: '10px' }}>
                                <input className="input-title"type="text" placeholder="Tiêu đề bài viết..." value={newTitle}maxLength={MAX_TITLE_LENGTH} onChange={(e) => setNewTitle(e.target.value)}requiredstyle={{ width: '100%', marginBottom: '5px' }}/>
                                <div style={{ textAlign: 'right', fontSize: '12px', color: newTitle.length >= MAX_TITLE_LENGTH ? 'red' : '#666' }}>
                                    {newTitle.length} / {MAX_TITLE_LENGTH}
                                </div>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <textarea className="input-content"placeholder="Nội dung..." rows="5"value={newContent}maxLength={MAX_CONTENT_LENGTH} onChange={(e) => setNewContent(e.target.value)}requiredstyle={{ width: '100%', marginBottom: '5px' }}
                                ></textarea>
                                <div style={{ textAlign: 'right', fontSize: '12px', color: newContent.length >= MAX_CONTENT_LENGTH ? 'red' : '#666' }}>
                                    {newContent.length} / {MAX_CONTENT_LENGTH}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="btn-primary">{isEditingPost ? "Lưu thay đổi" : "Đăng ngay"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <main className="feed-container">
                <div className="search-container" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm bài viết..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}/>
                        <button type="submit" className="btn-primary">
                            Tìm kiếm
                        </button>
                        {appliedSearch && (
                            <button type="button" className="btn-secondary"onClick={() => { setSearchTerm(""); setAppliedSearch(""); setPage(1);}}>
                                Xóa lọc
                            </button>
                        )}
                    </form>
                </div>
                {loading ? <div className="loading">Đang tải...</div> : (
                    <div className="post-list">
                        {posts.map((post) => {
                            const isAuthor = user && user.id === post.author_id;
                            const isAdmin = user && user.role === "admin";
                            const canEdit = isAuthor;
                            const canDelete = isAuthor || isAdmin;
                            const canPin = isAdmin;
                            const showPostMenu = canEdit || canDelete || canPin;

                            return (
                                <article key={post.id} className="post-card" style={{ position: 'relative' }}>
                                    
                                    {showPostMenu && (
                                        <div style={{ position: 'absolute', top: '15px', right: '15px' }} ref={activeMenuPostId === post.id ? postMenuRef : null}>
                                            <button 
                                                onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)} 
                                                style={dropdownStyles.menuBtn}
                                            >•••</button>
                                            
                                            {activeMenuPostId === post.id && (
                                                <div style={dropdownStyles.dropdownContent}>
                                                    {canPin && (
                                                        <button style={dropdownStyles.dropdownItem} onClick={() => handleTogglePin(post)}>
                                                            {post.is_pinned ? "Bỏ ghim" : "Ghim bài"}
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button style={dropdownStyles.dropdownItem} onClick={() => openEditModal(post)}>
                                                            Sửa bài
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button style={{...dropdownStyles.dropdownItem, color: 'red'}} onClick={() => handleDeletePost(post.id)}>
                                                            Xóa bài
                                                        </button>
                                                    )}
                                                    {isAdmin && user.id !== post.author_id && (
                                                    <button 
                                                            style={{...dropdownStyles.dropdownItem, color: '#d9534f', borderTop: '1px solid #eee'}} 
                                                            onClick={() => handleBanUser(post.author_id, post.author_name)}>
                                                            Ban người đăng
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <h3 className="post-title" style={{ paddingRight: '40px' }}> 
                                        {post.is_pinned && <span title="Bài viết đã ghim" style={{ marginRight: '8px' }}>📌</span>}
                                        {post.title}
                                    </h3>
                                    
                                    <div className="post-meta">
                                        <span>Đăng bởi <strong className="author-name">{post.author_name}</strong>

                                            <Badge badge={post.badge}/>
                                        </span>
                                        <span className="separator">•</span>
                                        <span>{formatTimeAgo(post.created_at)}</span>
                                        {user && user.role === 'admin' && (
                                            <>
                                            <span style={{ marginLeft: '8px', color: '#000', fontWeight: 'bold', fontSize: '0.9em', backgroundColor: '#e6ffa2', padding: '2px 6px', borderRadius: '4px' }}>
                                                ★ {post.reputation}  
                                            </span>
                                            <span style={{ color: 'red', fontSize: '12px', marginLeft: '8px', background: '#ffebee', padding: '2px 5px', borderRadius: '4px' }}>
                                                ID: {post.author_id}
                                            </span>
                                            </>
                                        )}
                                    </div>
                                    <hr className="divider"/>
                                    <div className="post-body">
                                        <p className="post-content">{post.content}</p>
                                    </div>
                                    <div className="post-footer">
                                        <button className={`action-btn ${post.has_voted ? 'liked' : ''}`} onClick={() => handleVote(post.id)} style={{ color: post.has_voted ? '#2563eb' : 'inherit', fontWeight: post.has_voted ? 'bold' : 'normal' }}>
                                            {post.has_voted ? 'Đã thích' : 'Thích'} {post.vote_count || 0}
                                        </button>
                                        <button className="action-btn" onClick={() => openCommentModal(post)}>
                                            Bình luận {post.comment_count || 0} 
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
            <div className="pagination-container">
                <button 
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>

                <span className="pagination-info">{page}</span>

                <button 
                    className="pagination-btn"
                    disabled={posts.length < 10}
                    onClick={() => setPage(page + 1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
            {showCommentModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>Bình luận</h2>
                            <button onClick={() => setShowCommentModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>✕</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }}>
                            {commentsTree.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>Chưa có bình luận nào.</p>
                            ) : (
                                commentsTree.map(comment => (
                                    <CommentItem 
                                        key={comment.id} 
                                        comment={comment} 
                                        isAdmin={user && user.role === 'admin'} 
                                        onBan={handleBanUser}
                                        onReply={(c) => setReplyingTo(c)}
                                        onVote={handleCommentVote} 
                                        onPin={handlePinComment}
                                        onEdit={handleEditComment}
                                        onDelete={handleDeleteComment}
                                        postAuthorId={currentPostForComment?.author_id}
                                        currentUserId={user?.id}
                                    />
                                ))
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            {replyingTo && (
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', background: '#f0f2f5', padding: '5px 10px', borderRadius: '4px' }}>
                                    <span>Đang trả lời: <strong>{replyingTo.author_display_name}</strong></span>
                                    <button onClick={() => setReplyingTo(null)} style={{ border: 'none', background: 'none', color: '#666', cursor: 'pointer' }}>✕</button>
                                </div>
                            )}
                            <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder={replyingTo ? "Nhập câu trả lời..." : "Viết bình luận..."}
                                    style={{ flex: 1, padding: '10px 12px', borderRadius: '20px', border: '1px solid #ddd', background: '#f0f2f5', outline: 'none' }}
                                />
                                <button type="submit" className="btn-primary" style={{ borderRadius: '20px', padding: '8px 16px' }}>Gửi</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default Home;