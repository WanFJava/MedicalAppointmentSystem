import api from './axiosConfig';

const customerHeaders = (accessToken) => ({
    'X-Chat-Token': accessToken
});

export const createCustomerLiveChat = async ({ customerName, initialMessage }) => {
    const response = await api.post('/live-chat/customer/sessions', {
        customerName,
        initialMessage
    });
    return response.data;
};

export const getCustomerLiveChat = async (sessionId, accessToken) => {
    const response = await api.get(`/live-chat/customer/sessions/${sessionId}`, {
        headers: customerHeaders(accessToken)
    });
    return response.data;
};

export const sendCustomerLiveChatMessage = async (
    sessionId,
    accessToken,
    content
) => {
    const response = await api.post(
        `/live-chat/customer/sessions/${sessionId}/messages`,
        { content },
        { headers: customerHeaders(accessToken) }
    );
    return response.data;
};

export const closeCustomerLiveChat = async (sessionId, accessToken) => {
    const response = await api.put(
        `/live-chat/customer/sessions/${sessionId}/close`,
        {},
        { headers: customerHeaders(accessToken) }
    );
    return response.data;
};

export const getReceptionistLiveChats = async (includeClosed = false) => {
    const response = await api.get('/live-chat/receptionist/sessions', {
        params: { includeClosed }
    });
    return response.data;
};

export const getReceptionistLiveChat = async (sessionId) => {
    const response = await api.get(
        `/live-chat/receptionist/sessions/${sessionId}`
    );
    return response.data;
};

export const claimReceptionistLiveChat = async (sessionId) => {
    const response = await api.put(
        `/live-chat/receptionist/sessions/${sessionId}/claim`
    );
    return response.data;
};

export const sendReceptionistLiveChatMessage = async (sessionId, content) => {
    const response = await api.post(
        `/live-chat/receptionist/sessions/${sessionId}/messages`,
        { content }
    );
    return response.data;
};

export const closeReceptionistLiveChat = async (sessionId) => {
    const response = await api.put(
        `/live-chat/receptionist/sessions/${sessionId}/close`
    );
    return response.data;
};
