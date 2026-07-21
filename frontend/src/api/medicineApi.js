import api from './axiosConfig';

export const getAllMedicines = async () => {
    const response = await api.get('/medicines');
    return response.data;
};

export const getMedicineById = async (id) => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
};

export const createMedicine = async (data) => {
    const response = await api.post('/medicines', data);
    return response.data;
};

export const updateMedicine = async (id, data) => {
    const response = await api.put(`/medicines/${id}`, data);
    return response.data;
};

export const deleteMedicine = async (id) => {
    const response = await api.delete(`/medicines/${id}`);
    return response.data;
};
