import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { changePasswordApi } from '../api/authApi';
import { Key } from 'lucide-react';

const ChangePassword = () => {
    const { logout } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
            return;
        }

        try {
            setLoading(true);
            setMessage({ type: '', text: '' });
            await changePasswordApi(formData.currentPassword, formData.newPassword);
            setMessage({ type: 'success', text: 'Đổi mật khẩu thành công! Yêu cầu đăng nhập lại...' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Đổi mật khẩu thất bại.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', marginTop: '2rem' }}>
            <div style={{ backgroundColor: '#fff1f2', padding: '1.5rem 2rem', borderBottom: '1px solid #fecdd3' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#881337' }}>
                    <Key size={28} color="#e11d48" /> Đổi mật khẩu
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#9f1239', fontSize: '0.95rem' }}>Đảm bảo tài khoản của bạn luôn được bảo mật bằng một mật khẩu mạnh.</p>
            </div>

            <div style={{ padding: '2rem' }}>
                {message.text && (
                    <div style={{
                        padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: message.type === 'success' ? '#065f46' : '#991b1b',
                        border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem', maxWidth: '600px' }}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Key size={16} color="#64748b" /> Mật khẩu hiện tại
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                className="form-control"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Mật khẩu mới
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                className="form-control"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-control"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ padding: '0.75rem 2rem', fontSize: '1rem', backgroundColor: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Key size={18} /> {loading ? 'Đang xử lý...' : 'Cập nhật Mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
