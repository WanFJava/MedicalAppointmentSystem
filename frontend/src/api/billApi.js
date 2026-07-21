import api from './axiosConfig';

export const generateBill = async (appointmentId) => {
    const response = await api.post(`/bills/generate/${appointmentId}`);
    return response.data;
};

export const payBill = async (billId) => {
    const response = await api.put(`/bills/${billId}/pay`);
    return response.data;
};

export const getBillByAppointment = async (appointmentId) => {
    const response = await api.get(`/bills/appointment/${appointmentId}`);
    return response.data;
};
