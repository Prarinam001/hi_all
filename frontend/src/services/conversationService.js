import api from './api';

export const getConversations = async () => {
    const res = await api.get('/api/chat/conversations', { withCredentials: true });
    return res.data;
};

export const saveConversation = async (other_user_id, last_message) => {
    return api.post('/api/chat/conversations', { other_user_id, last_message }, { withCredentials: true });
};

export const saveConversationsBatch = async (conversations) => {
    // conversations: [{ other_user_id, last_message }]
    const results = [];
    for (const conv of conversations) {
        try {
            const res = await saveConversation(conv.other_user_id, conv.last_message);
            results.push(res.data);
        } catch (err) {
            console.error('Failed saving conversation', conv, err);
        }
    }
    return results;
};
