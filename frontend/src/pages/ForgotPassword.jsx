import React, { useState } from 'react';
import { forgotPasswordApi, verifyForgotPasswordOtpApi, resetPasswordApi } from '../api/authApi';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await forgotPasswordApi(email);
            setSuccess('Mã OTP đã được gửi đến email của bạn.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi gửi yêu cầu quên mật khẩu');
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
            await verifyForgotPasswordOtpApi(email, otpCode);
            setSuccess('Xác minh thành công. Vui lòng nhập mật khẩu mới.');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Mã OTP không hợp lệ');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await resetPasswordApi(email, otpCode, newPassword);
            setSuccess('Đặt lại mật khẩu thành công! Đang chuyển hướng đến đăng nhập...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi đặt lại mật khẩu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Quên mật khẩu</h2>
                <p>
                    {step === 1 && 'Nhập email của bạn để lấy lại mật khẩu'}
                    {step === 2 && 'Nhập mã OTP được gửi đến email của bạn'}
                    {step === 3 && 'Tạo mật khẩu mới cho tài khoản của bạn'}
                </p>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {step === 1 && (
                    <form onSubmit={handleEmailSubmit}>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập email đã đăng ký"
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
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
                            {isLoading ? 'Đang xác minh...' : 'Xác minh OTP'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                        </button>
                    </form>
                )}
                
                <div className="auth-footer">
                    <Link to="/login">Quay lại đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
