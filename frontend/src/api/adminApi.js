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

export const updateDoctorStatus = async (id, status) => {
    const response = await api.put(`/doctors/${id}/status?status=${status}`);
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

// Users API
export const getUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const createUser = async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
};

export const lockUser = async (id) => {
    const response = await api.put(`/admin/users/${id}/lock`);
    return response.data;
};

// File Upload API
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    // Use the raw api instance because this endpoint might not be prefixed with /admin
    // The endpoint is /api/upload but our axios instance might have /api as baseURL
    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
