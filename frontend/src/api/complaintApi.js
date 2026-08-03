import api from './axiosConfig';

export const createComplaint = async (patientUserId, complaintDto) => {
    const response = await api.post(`/complaints/patient/${patientUserId}`, complaintDto);
    return response.data;
};

export const getMyComplaints = async (patientUserId) => {
    const response = await api.get(`/complaints/patient/${patientUserId}`);
    return response.data;
};

export const getAllComplaints = async () => {
    const response = await api.get('/complaints');
    return response.data;
};

export const resolveComplaint = async (id, resolvedByUserId, resolutionNote) => {
    const response = await api.put(`/complaints/${id}/resolve?resolvedByUserId=${resolvedByUserId}`, { resolutionNote });
    return response.data;
};
