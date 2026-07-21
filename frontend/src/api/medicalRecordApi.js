import api from './axiosConfig';

export const diagnosePatient = async (appointmentId, doctorId, data) => {
    const response = await api.post(`/medical-records/diagnose/${appointmentId}/doctor/${doctorId}`, data);
    return response.data;
};

export const getMedicalRecordByAppointment = async (appointmentId) => {
    const response = await api.get(`/medical-records/appointment/${appointmentId}`);
    return response.data;
};
