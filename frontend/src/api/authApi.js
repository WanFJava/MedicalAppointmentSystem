import api from './axiosConfig';

export const loginApi = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const registerApi = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const verifyOtpApi = async (email, otpCode) => {
    const response = await api.post('/auth/verify-otp', { email, otpCode });
    return response.data;
};

export const resendOtpApi = async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
};

export const forgotPasswordApi = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const verifyForgotPasswordOtpApi = async (email, otpCode) => {
    const response = await api.post('/auth/verify-forgot-password-otp', { email, otpCode });
    return response.data;
};

export const resetPasswordApi = async (email, otpCode, newPassword) => {
    const response = await api.post('/auth/reset-password', { email, otpCode, newPassword });
    return response.data;
};

export const changePasswordApi = async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
};
