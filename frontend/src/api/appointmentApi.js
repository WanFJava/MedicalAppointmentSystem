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

export const createOpenSchedule = async (data) => {
    const response = await api.post('/schedules/open', data);
    return response.data;
};

export const generateSchedules = async (doctorId, date) => {
    const response = await api.post(`/schedules/generate/${doctorId}?date=${date}`);
    return response.data;
};

export const generateOpenSchedules = async (date) => {
    const response = await api.post(`/schedules/generate-open?date=${date}`);
    return response.data;
};

export const getOpenSchedules = async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/schedules/open', { params });
    return response.data;
};

export const registerDoctorSchedule = async (scheduleId, doctorId) => {
    const response = await api.put(`/schedules/${scheduleId}/register/doctor/${doctorId}`);
    return response.data;
};

export const getAllSchedules = async (date, doctorId) => {
    const params = {};
    if (date) params.date = date;
    if (doctorId) params.doctorId = doctorId;
    const response = await api.get('/schedules', { params });
    return response.data;
};

export const updateScheduleStatus = async (id, status) => {
    const response = await api.put(`/schedules/${id}/status`, {}, { params: { status } });
    return response.data;
};

export const updateScheduleInfo = async (id, data) => {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
};

export const deleteSchedule = async (id) => {
    const response = await api.delete(`/schedules/${id}`);
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

// Queue APIs
export const callNextQueue = async (id) => {
    const response = await api.put(`/appointments/${id}/queue/call`);
    return response.data;
};

export const swapQueue = async (id1, id2) => {
    const response = await api.put(`/appointments/queue/swap?id1=${id1}&id2=${id2}`);
    return response.data;
};

export const skipQueue = async (appointmentId) => {
    const response = await api.put(`/appointments/${appointmentId}/queue/skip`);
    return response.data;
};

export const changeAppointmentSchedule = async (appointmentId, newScheduleId) => {
    const response = await api.put(`/appointments/${appointmentId}/change-schedule?newScheduleId=${newScheduleId}`);
    return response.data;
};
