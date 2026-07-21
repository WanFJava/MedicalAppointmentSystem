import api from './axiosConfig';

export const getPatientProfile = async (userId) => {
    const response = await api.get(`/patients/profile/${userId}`);
    return response.data;
};

export const updatePatientProfile = async (userId, data) => {
    const response = await api.put(`/patients/profile/${userId}`, data);
    return response.data;
};
