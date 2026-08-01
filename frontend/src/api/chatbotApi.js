import api from './axiosConfig';

export const sendChatbotMessage = async (message) => {
    const response = await api.post('/chatbot/messages', { message });
    return response.data;
};
