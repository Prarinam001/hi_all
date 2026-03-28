import { useState, useEffect, useCallback, useRef } from 'react';
import { getGroups, addMemberToGroup, leaveGroup, removeGroupMember } from '../services/groupService';
import { saveLocalMessage, getLocalMessages, bulkSaveLocalMessages, saveLocalGroups, getLocalGroups, saveLocalGroup, saveLocalConversation, deleteLocalGroupData } from '../db/db';

export default function useChatManager(user, api, setConversations, selectedUser) {
    const [messages, setMessages] = useState({});
    const [contacts, setContacts] = useState({});
    const [groups, setGroups] = useState([]);
    const [input, setInput] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [userStatuses, setUserStatuses] = useState({});
    const [unreads, setUnreads] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(`unreads_${user?.id}`) || '{}');
        } catch { return {}; }
    });

    // Helper to add messages to state while ensuring order and no duplicates
    const upsertMessages = useCallback((listKey, newMessages) => {
        setMessages(prev => {
            const currentList = prev[listKey] || [];
            const merged = [...currentList];
            
            const toAdd = Array.isArray(newMessages) ? newMessages : [newMessages];
            
            for (const msg of toAdd) {
                // Check if message already exists by ID (server or local)
                const msgId = msg.id || msg.server_id;
                const existingIdx = merged.findIndex(m => (m.id || m.server_id) === msgId);
                
                if (existingIdx >= 0) {
                    // Update existing
                    merged[existingIdx] = { ...merged[existingIdx], ...msg };
                } else {
                    // Add new
                    merged.push(msg);
                }
            }
            
            // Sort by timestamp
            merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            return { ...prev, [listKey]: merged };
        });
    }, []);

    useEffect(() => {
        if (selectedUser) {
            const listKey = selectedUser.isGroup ? `group_${selectedUser.id}` : selectedUser.id;
            setUnreads(prev => {
                if (!prev[listKey]) return prev;
                const next = { ...prev };
                delete next[listKey];
                localStorage.setItem(`unreads_${user?.id}`, JSON.stringify(next));
                return next;
            });
        }
    }, [selectedUser, user?.id]);

    useEffect(() => {
        if (!user) return;
        const loadAndSyncGroups = async () => {
            // 1. Load from local first
            const localGroups = await getLocalGroups();
            if (localGroups.length > 0) {
                setGroups(localGroups);
            }

            // 2. Sync from server
            try {
                const res = await getGroups();
                if (Array.isArray(res)) {
                    setGroups(res);
                    await saveLocalGroups(res);
                }
            } catch (err) {
                console.error("Failed to load/sync groups", err);
            }
        };
        loadAndSyncGroups();
    }, [user]);

    // Load local messages and sync with server
    const loadLocalMessagesForUser = useCallback(async (userId, isGroup = false) => {
        if (!userId) return;
        const listKey = isGroup ? `group_${userId}` : userId;

        // 1. Load from local first for instant UI
        const localMsgs = await getLocalMessages(userId, isGroup);
        if (localMsgs && localMsgs.length > 0) {
            // Ensure strictly sorted by actual date comparison after load
            const sorted = [...localMsgs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setMessages(prev => ({
                ...prev,
                [listKey]: sorted.map(m => ({ ...m, isMine: m.sender_id === user.id }))
            }));
        }

        // 2. Background sync from server (DISABLED for local-first)
        /*
        try {
            const params = isGroup ? { group_id: userId } : { other_id: userId };
            const res = await api.get('/api/chat/messages', { params });
            const serverMsgs = res.data;

            if (serverMsgs && serverMsgs.length > 0) {
                // Save all server messages to local DB (Dexie.bulkPut handles updates/duplicates if IDs match)
                await bulkSaveLocalMessages(serverMsgs);

                // Update state with fresh data
                setMessages(prev => ({
                    ...prev,
                    [listKey]: serverMsgs.map(m => ({
                        ...m,
                        isMine: m.sender_id === user.id,
                        sender_name: m.sender_name || (m.sender_id === user.id ? (user.full_name || user.name) : 'Unknown')
                    }))
                }));
            }
        } catch (err) {
            console.error("Failed to sync messages from server", err);
        }
        */
    }, [user, api]);

    const handleChatMessage = useCallback((data) => {
        // Filter out WebRTC signaling messages
        const signalingTypes = ['offer', 'answer', 'candidate', 'call-reject', 'call-end', 'voice-offer', 'voice-answer'];
        if (signalingTypes.includes(data.type)) return;

        const isSystem = data.content && data.content.startsWith('__SYSTEM__:');
        
        // Skip echo of own normal messages to avoid duplication (already added optimistically in sendMessage)
        if (data.sender_id === user.id && !isSystem) return;

        // Automatically ACK received messages to remove from backend DB
        if (data.id && api && !data.skipAck) {
            api.post('/api/chat/messages/ack', { message_ids: [data.id] }).catch(err => console.error("ACK failed", err));
        }

        if (data.removed_user_id === user.id && data.group_id) {
            deleteLocalGroupData(data.group_id);
            setGroups(prev => prev.filter(g => g.id !== data.group_id));
            return;
        }

        if (data.type === 'user_status') {
            setUserStatuses(prev => ({
                ...prev,
                [data.user_id]: {
                    is_online: data.is_online,
                    last_seen: data.last_seen
                }
            }));
            return;
        }

        if (data.type === 'pong') return; // Heartbeat response

        const otherId = data.sender_id === user.id ? data.recipient_id : data.sender_id;
        const newMsg = {
            ...data,
            isMine: data.sender_id === user.id,
            sender_name: data.sender_name || (data.sender_id === user.id ? (user.full_name || user.name) : 'Unknown')
        };
        const listKey = data.group_id ? `group_${data.group_id}` : otherId;
        
        // Use upsertMessages to handle sorting and deduplication
        upsertMessages(listKey, newMsg);

        // Save to Local DB
        saveLocalMessage(newMsg).catch(err => console.error("Failed to save message locally", err));

        const currentSelectedKey = selectedUser ? (selectedUser.isGroup ? `group_${selectedUser.id}` : selectedUser.id) : null;
        if (listKey !== currentSelectedKey) {
            setUnreads(prev => {
                const next = { ...prev, [listKey]: true };
                localStorage.setItem(`unreads_${user?.id}`, JSON.stringify(next));
                return next;
            });
        }

        if (data.group_id) {
            setGroups(prev => {
                const exists = prev.find(g => g.id === data.group_id);
                if (!exists) {
                    // Group doesn't exist in local state, fetch all groups to update
                    api.get('/api/chat/groups').then(res => {
                        if (Array.isArray(res.data)) {
                            // Update groups state
                            setGroups(res.data);
                            // Also save to local DB
                            saveLocalGroups(res.data).catch(e => console.error("Failed to save local groups", e));
                        }
                    }).catch(err => console.error("Failed to fetch new group for message", err));
                }
                return prev;
            });
        }

        if (data.sender_id !== user.id) {
            setContacts(prev => ({
                ...prev,
                [data.sender_id]: {
                    name: data.sender_name || 'Unknown',
                    email: data.sender_email || '',
                    id: data.sender_id
                }
            }));

            if (!data.group_id) {
                setConversations(prev => {
                    const existingIdx = prev.findIndex(c => c.other_user_id === data.sender_id);
                    if (existingIdx >= 0) {
                        const updated = [...prev];
                        updated[existingIdx] = {
                            ...updated[existingIdx],
                            last_message: data.content,
                            last_message_time: data.timestamp
                        };
                        return updated;
                    } else {
                        const newConv = {
                            other_user_id: data.sender_id,
                            other_user_name: data.sender_name || (data.sender_id === user.id ? (user.full_name || user.name) : 'Unknown'),
                            other_user_email: data.sender_email || '',
                            other_user_phone_number: data.sender_phone_number || '',
                            last_message: data.content,
                            last_message_time: data.timestamp
                        };
                        return [newConv, ...prev];
                    }
                });

                setUserStatuses(prev => ({
                    ...prev,
                    [data.sender_id]: {
                        is_online: data.is_online !== undefined ? data.is_online : true,
                        last_seen: data.last_seen
                    }
                }));
            }

            // Update local DB outside of the state setter
            const updateLocalDB = async () => {
                const otherId = data.sender_id;
                const conversation = {
                    other_user_id: otherId,
                    other_user_name: data.sender_name || (data.sender_id === user.id ? (user.full_name || user.name) : 'Unknown'),
                    other_user_email: data.sender_email || '',
                    other_user_phone_number: data.sender_phone_number || '',
                    last_message: data.content,
                    last_message_time: data.timestamp
                };
                await saveLocalConversation(conversation).catch(err => console.error("Failed to save conversation locally", err));
            };
            // Only update local DB and conversations list for direct messages
            if (!data.group_id) {
                updateLocalDB();
            }
        }
    }, [user.id, setConversations, api, setGroups, selectedUser]);

    const syncedUserRef = useRef(null);

    useEffect(() => {
        if (!user || !api || !handleChatMessage) return;
        if (syncedUserRef.current === user.id) return;

        const syncOfflineMessages = async () => {
            try {
                const res = await api.get('/api/chat/messages/sync');
                const serverMsgs = res.data;
                if (serverMsgs && serverMsgs.length > 0) {
                    for (const msg of serverMsgs) {
                        // Map server_id to id and prevent duplicate individual ACKs
                        handleChatMessage({ ...msg, id: msg.server_id, skipAck: true });
                    }
                    const messageIds = serverMsgs.map(m => m.server_id).filter(id => id != null);
                    if (messageIds.length > 0) {
                        await api.post('/api/chat/messages/ack', { message_ids: messageIds });
                    }
                }
            } catch (err) {
                console.error("Failed to sync offline messages", err);
            }
        };

        syncedUserRef.current = user.id;
        syncOfflineMessages();
    }, [user, api, handleChatMessage]);

    const sendMessage = (selectedUser, send) => {
        if (!input || !selectedUser) return;

        const msg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9), // Temp ID to prevent replacement
            type: 'chat',
            content: input,
            sender_id: user.id,
            sender_name: user.full_name || user.name,
            sender_email: user.email,
            sender_phone_number: user.phone_number || '',
            recipient_id: selectedUser.isGroup ? null : selectedUser.id,
            group_id: selectedUser.isGroup ? selectedUser.id : null,
            target_id: selectedUser.isGroup ? null : selectedUser.id,
            timestamp: (new Date(Date.now() - new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, -1),
            reply_to_id: replyTo ? (typeof replyTo.id === 'number' ? replyTo.id : (replyTo.server_id || null)) : null,
            reply_to_content: replyTo ? replyTo.content : null,
            reply_to_sender: replyTo ? (replyTo.sender_name || (replyTo.isMine ? (user.full_name || user.name) : 'Unknown')) : null
        };

        if (send) send(msg);

        // Save to Local DB
        saveLocalMessage(msg).catch(err => console.error("Failed to save own message locally", err));

        setContacts(prev => ({
            ...prev,
            [selectedUser.id]: {
                name: selectedUser.full_name,
                email: selectedUser.email,
                id: selectedUser.id
            }
        }));

        if (!selectedUser.isGroup) {
            setConversations(prev => {
                const existingIdx = prev.findIndex(c => c.other_user_id === selectedUser.id);
                if (existingIdx >= 0) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        last_message: input,
                        last_message_time: msg.timestamp
                    };
                    return updated;
                } else {
                    const newConv = {
                        other_user_id: selectedUser.id,
                        other_user_name: selectedUser.full_name,
                        other_user_email: selectedUser.email,
                        other_user_phone_number: selectedUser.phone_number || '',
                        last_message: input,
                        last_message_time: msg.timestamp
                    };
                    return [newConv, ...prev];
                }
            });

            const updateLocalDB = async () => {
                const conversation = {
                    other_user_id: selectedUser.id,
                    other_user_name: selectedUser.full_name,
                    other_user_email: selectedUser.email,
                    other_user_phone_number: selectedUser.phone_number || '',
                    last_message: input,
                    last_message_time: msg.timestamp
                };
                await saveLocalConversation(conversation).catch(err => console.error("Failed to save conversation locally", err));
            };
            updateLocalDB();
        }

        const listKey = selectedUser.isGroup ? `group_${selectedUser.id}` : selectedUser.id;
        // Use upsertMessages to handle sorting and deduplication
        upsertMessages(listKey, { ...msg, isMine: true });

        setInput('');
        setReplyTo(null);
    };

    const addGroup = useCallback(async (newGroup) => {
        setGroups(prev => [...prev, newGroup]);
        await saveLocalGroup(newGroup).catch(err => console.error("Failed to save new group locally", err));
    }, []);

    const addMember = useCallback(async (groupId, data) => {
        try {
            const updatedGroup = await addMemberToGroup(groupId, data);
            setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
            await saveLocalGroup(updatedGroup);
            return updatedGroup;
        } catch (err) {
            console.error("Failed to add member", err);
            throw err;
        }
    }, []);

    const removeMember = useCallback(async (groupId, userId) => {
        try {
            const updatedGroup = await removeGroupMember(groupId, userId);
            setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
            await saveLocalGroup(updatedGroup);
            return updatedGroup;
        } catch (err) {
            console.error("Failed to remove member", err);
            throw err;
        }
    }, []);

    const groupLeave = useCallback(async (groupId) => {
        try {
            await leaveGroup(groupId);
            setGroups(prev => prev.filter(g => g.id !== groupId));
            await deleteLocalGroupData(groupId);
        } catch (err) {
            console.error("Failed to leave group", err);
            throw err;
        }
    }, []);

    return {
        messages,
        contacts,
        groups,
        setGroups,
        addGroup,
        addMember,
        removeMember,
        groupLeave,
        input,
        setInput,
        replyTo,
        setReplyTo,
        handleChatMessage,
        sendMessage,
        loadLocalMessagesForUser,
        unreads,
        userStatuses,
        setUserStatuses
    };
}
