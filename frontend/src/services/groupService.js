import api from './api';

export const createGroup = async (name, member_emails) => {
    const res = await api.post('/api/chat/groups', { name, member_emails }, { withCredentials: true });
    return res.data;
};

export const getGroups = async () => {
    const res = await api.get('/api/chat/groups', { withCredentials: true });
    return res.data;
};

export const addMemberToGroup = async (groupId, email) => {
    const res = await api.post(`/api/chat/groups/${groupId}/members`, { email }, { withCredentials: true });
    return res.data;
};

export const leaveGroup = async (groupId) => {
    const res = await api.delete(`/api/chat/groups/${groupId}`, { withCredentials: true });
    return res.data;
};

export const removeGroupMember = async (groupId, userId) => {
    const res = await api.delete(`/api/chat/groups/${groupId}/members/${userId}`, { withCredentials: true });
    return res.data;
};
