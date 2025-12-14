import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';   
import Login from './pages/Login'; 
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;