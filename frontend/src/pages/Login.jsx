import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { loginApi } from '../api/authApi';
import { Link } from 'react-router-dom';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const data = await loginApi(email, password);
            login(data, rememberMe);
        } catch (err) {
            setError(err.response?.data?.message || 'Email hoặc mật khẩu không hợp lệ');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Chào mừng trở lại</h2>
                <p>Đăng nhập vào tài khoản Smart Clinic của bạn</p>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu của bạn"
                        />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#4b5563' }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ width: 'auto' }}
                            />
                            Ghi nhớ tôi
                        </label>
                        <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary-color)' }}>Quên mật khẩu?</Link>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
                <div className="auth-footer" style={{ marginTop: '1rem' }}>
                    Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
