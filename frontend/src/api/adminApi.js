import api from './axiosConfig';

// Dashboard API
export const getDashboardStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

// Specialties API
export const getSpecialties = async () => {
    const response = await api.get('/specialties');
    return response.data;
};

export const createSpecialty = async (data) => {
    const response = await api.post('/specialties', data);
    return response.data;
};

export const updateSpecialty = async (id, data) => {
    const response = await api.put(`/specialties/${id}`, data);
    return response.data;
};

export const deleteSpecialty = async (id) => {
    const response = await api.delete(`/specialties/${id}`);
    return response.data;
};

// Doctors API
export const getDoctors = async () => {
    const response = await api.get('/doctors');
    return response.data;
};

export const getDoctorById = async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
};

export const createDoctor = async (data) => {
    const response = await api.post('/doctors', data);
    return response.data;
};

export const updateDoctor = async (id, data) => {
    const response = await api.put(`/doctors/${id}`, data);
    return response.data;
};

export const deleteDoctor = async (id) => {
    const response = await api.delete(`/doctors/${id}`);
    return response.data;
};

export const getDoctorByUserId = async (userId) => {
    const response = await api.get(`/doctors/user/${userId}`);
    return response.data;
};
