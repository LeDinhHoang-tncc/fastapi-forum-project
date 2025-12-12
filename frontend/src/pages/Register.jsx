import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      await api.post('/auth/register', { 
        username: username, 
        password: password,
        email: email,              
        display_name: displayName 
      });
      
      alert('Đăng ký thành công! Hãy đăng nhập.');
      navigate('/login'); 
    } catch (error) {
      console.error(error.response); 
      
      if (error.response?.status === 422) {
        alert("Dữ liệu nhập không hợp lệ (Ví dụ: Email sai, tên quá ngắn...)");
      } else {
        const msg = error.response?.data?.detail || "Đăng ký thất bại";
        alert(msg);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Đăng Ký Tài Khoản</h2>
        <form onSubmit={handleRegister}>
          <input 
            type="text" 
            placeholder="Tên đăng nhập *" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="Tên hiển thị (VD: Nguyễn Văn A)" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <input 
            type="email" 
            placeholder="Email (VD: sinhvien@example.com)" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input 
            type="password" 
            placeholder="Mật khẩu *" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input 
            type="password" 
            placeholder="Nhập lại mật khẩu *" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary full-width">Đăng ký</button>
        </form>
        <p className="auth-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;