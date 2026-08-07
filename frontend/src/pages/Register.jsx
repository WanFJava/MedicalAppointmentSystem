import React, { useState } from 'react';
import { registerApi, verifyOtpApi, resendOtpApi } from '../api/authApi';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: ''
    });
    const [otpCode, setOtpCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await registerApi(formData);
            setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.');
            setStep(2); // Move to OTP step
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await verifyOtpApi(formData.email, otpCode);
            setSuccess('Xác minh thành công! Đang chuyển hướng đến trang đăng nhập...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Xác minh OTP thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await resendOtpApi(formData.email);
            setSuccess('Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Gửi lại OTP thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{step === 1 ? 'Tạo tài khoản' : 'Xác minh OTP'}</h2>
                <p>{step === 1 ? 'Tham gia Smart Clinic ngay hôm nay' : `Nhập mã 6 số được gửi đến ${formData.email}`}</p>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {step === 1 ? (
                    <form onSubmit={handleRegisterSubmit}>
                        <div className="form-group">
                            <label>Họ và tên</label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ban@example.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </div>
                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Số điện thoại của bạn"
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit}>
                        <div className="form-group">
                            <label>Mã OTP</label>
                            <input
                                type="text"
                                required
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="Nhập mã 6 số"
                                maxLength="6"
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Đang xác minh...' : 'Xác minh'}
                        </button>
                        <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <button 
                                type="button" 
                                className="btn-secondary" 
                                onClick={handleResendOtp}
                                disabled={isLoading}
                                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Gửi lại mã OTP
                            </button>
                        </div>
                    </form>
                )}
                
                {step === 1 && (
                    <div className="auth-footer">
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
