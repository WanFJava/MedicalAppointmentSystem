import api from './axiosConfig';

export const loginApi = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const registerApi = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};
