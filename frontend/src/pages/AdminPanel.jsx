import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            alert("Không thể tải danh sách thành viên. Bạn có phải là Admin không?");
            navigate('/');
        }
    };

    const removeAccents = (str) => {
        if (!str) return "";
        return str.normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/đ/g, "d").replace(/Đ/g, "D")
                  .toLowerCase();
    };

    const handleToggleBan = async (user) => {
        const action = user.is_banned ? 'unban' : 'ban';
        const confirmMsg = user.is_banned 
            ? `Mở khóa cho ${user.display_name}?` 
            : `CẢNH BÁO: Ban thành viên ${user.display_name}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.put(`/users/${action}/${user.id}`);
            setUsers(users.map(u => 
                u.id === user.id ? { ...u, is_banned: !u.is_banned } : u
            ));
        } catch (error) {
            alert("Lỗi khi cập nhật trạng thái: " + error.response?.data?.detail);
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => 
                u.id === userId ? { ...u, role: newRole } : u
            ));
            alert("Đã cập nhật quyền thành công!");
        } catch (error) {
            alert("Lỗi đổi quyền: " + error.response?.data?.detail);
            fetchUsers(); 
        }
    };

const filteredUsers = users.filter(user => {
        const searchRaw = searchTerm.toLowerCase().trim(); 
        const searchNoAccent = removeAccents(searchTerm); 

        const id = user.id.toString();
        const username = user.username ? user.username.toLowerCase() : "";
        const email = user.email ? user.email.toLowerCase() : "";
        const role = user.role ? user.role.toLowerCase() : "";
        
        const displayName = user.display_name ? user.display_name.toLowerCase() : "";
        const displayNameNoAccent = removeAccents(user.display_name);

        return (
            id.includes(searchRaw) ||                       
            username.includes(searchRaw) ||                  
            email.includes(searchRaw) ||                    
            role === searchRaw ||                         
            displayName.includes(searchRaw) ||         
            displayNameNoAccent.includes(searchNoAccent)   
        );
    });

    if (loading) return <div style={{padding: '20px'}}>Đang tải dữ liệu...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Admin Dashboard - Quản Lý Thành Viên</h2>
                <button onClick={() => navigate('/')} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    Về trang chủ
                </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, username hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: '1px solid #ccc'
                    }}
                />
            </div>

            <div style={{ overflowX: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                    <thead style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Thành viên</th>
                            <th style={thStyle}>Điểm uy tín</th>
                            <th style={thStyle}>Vai trò</th>
                            <th style={thStyle}>Trạng thái</th>
                            <th style={thStyle}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tdStyle}>#{user.id}</td>
                                <td style={tdStyle}>
                                    <strong>{user.display_name || user.username}</strong><br/>
                                    <span style={{fontSize: '12px', color: '#666'}}>@{user.username}</span>
                                    {user.email && <div style={{fontSize: '12px', color: '#888'}}>{user.email}</div>}
                                </td>
                                <td style={tdStyle} align="center">
                                    <span style={{ fontWeight: 'bold', color: user.reputation < 0 ? 'red' : 'green' }}>
                                        {user.reputation}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <select 
                                        value={user.role}
                                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                        style={{ padding: '5px', borderRadius: '4px' }}
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td style={tdStyle} align="center">
                                    {user.is_banned ? (
                                        <span style={{ background: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                            BANNED
                                        </span>
                                    ) : (
                                        <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                            ACTIVE
                                        </span>
                                    )}
                                </td>
                                <td style={tdStyle} align="center">
                                    <button 
                                        onClick={() => handleToggleBan(user)}
                                        style={{
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            backgroundColor: user.is_banned ? '#4caf50' : '#f44336',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '13px'
                                        }}
                                    >
                                        {user.is_banned ? "Mở khóa" : " Ban"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        Không tìm thấy thành viên nào.
                    </div>
                )}
            </div>
        </div>
    );
};

const thStyle = { padding: '12px 15px', textAlign: 'left', fontWeight: '600', color: '#444' };
const tdStyle = { padding: '12px 15px', verticalAlign: 'middle' };

export default AdminPanel;