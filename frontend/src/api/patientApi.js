import api from './axiosConfig';

export const getPatientProfile = async (userId) => {
    const response = await api.get(`/patients/profile/${userId}`);
    return response.data;
};

export const getAllPatients = async () => {
    const response = await api.get('/patients');
    return response.data;
};

export const createPatient = async (data) => {
    const response = await api.post('/patients', data);
    return response.data;
};

export const updatePatientProfile = async (userId, data) => {
    const response = await api.put(`/patients/profile/${userId}`, data);
    return response.data;
};

export const getFavoriteDoctors = async (userId) => {
    const response = await api.get(`/patients/${userId}/favorites`);
    return response.data;
};

export const addFavoriteDoctor = async (userId, doctorId) => {
    const response = await api.post(`/patients/${userId}/favorites/${doctorId}`);
    return response.data;
};

export const removeFavoriteDoctor = async (userId, doctorId) => {
    const response = await api.delete(`/patients/${userId}/favorites/${doctorId}`);
    return response.data;
};
