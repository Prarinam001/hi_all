import api from './api';

export const createGroup = async (name, member_emails) => {
    const res = await api.post('/api/chat/groups', { name, member_emails });
    return res.data;
};

export const getGroups = async () => {
    const res = await api.get('/api/chat/groups');
    return res.data;
};

export const addMemberToGroup = async (groupId, email) => {
    const res = await api.post(`/api/chat/groups/${groupId}/members`, { email });
    return res.data;
};

export const leaveGroup = async (groupId) => {
    const res = await api.delete(`/api/chat/groups/${groupId}`);
    return res.data;
};
