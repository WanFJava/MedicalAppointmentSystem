import api from './axiosConfig';

// Schedule API
export const createSchedule = async (doctorId, data) => {
    const response = await api.post(`/schedules/doctor/${doctorId}`, data);
    return response.data;
};

export const getDoctorSchedules = async (doctorId, date) => {
    const response = await api.get(`/schedules/doctor/${doctorId}?date=${date}`);
    return response.data;
};

export const getAvailableSchedules = async (doctorId, date) => {
    const url = date 
        ? `/schedules/available/doctor/${doctorId}?date=${date}`
        : `/schedules/available/doctor/${doctorId}`;
    const response = await api.get(url);
    return response.data;
};

export const generateSchedules = async (doctorId, date) => {
    const response = await api.post(`/schedules/generate/${doctorId}?date=${date}`);
    return response.data;
};

export const updateScheduleStatus = async (id, status) => {
    const response = await api.put(`/schedules/${id}/status`, {}, { params: { status } });
    return response.data;
};

// Appointment API
export const bookAppointment = async (patientId, data) => {
    const response = await api.post(`/appointments/book/${patientId}`, data);
    return response.data;
};

export const getPatientAppointments = async (patientId) => {
    const response = await api.get(`/appointments/patient/${patientId}`);
    return response.data;
};

export const getDoctorAppointments = async (doctorId) => {
    const response = await api.get(`/appointments/doctor/${doctorId}`);
    return response.data;
};

export const getAllAppointments = async () => {
    const response = await api.get('/appointments');
    return response.data;
};

export const updateAppointmentStatus = async (id, status) => {
    const response = await api.put(`/appointments/${id}/status`, {}, { params: { status } });
    return response.data;
};

export const deleteAppointment = async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
};
