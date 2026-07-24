import axiosConfig from './axiosConfig';

export const createFeedback = async (feedbackData) => {
    const response = await axiosConfig.post('/feedbacks', feedbackData);
    return response.data;
};

export const getFeedbackByAppointment = async (appointmentId) => {
    try {
        const response = await axiosConfig.get(`/feedbacks/appointment/${appointmentId}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        throw error;
    }
};

export const getFeedbacksByDoctor = async (doctorId) => {
    const response = await axiosConfig.get(`/feedbacks/doctor/${doctorId}`);
    return response.data;
};
