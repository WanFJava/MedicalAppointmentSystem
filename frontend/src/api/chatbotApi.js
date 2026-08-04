import api from './axiosConfig';

export const sendChatbotMessage = async (
    message,
    credentials,
    customerName
) => {
    const response = await api.post('/chatbot/messages', {
        message,
        sessionId: credentials?.sessionId,
        accessToken: credentials?.accessToken,
        customerName
    });
    return response.data;
};
