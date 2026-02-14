import { useState, useEffect, useCallback } from 'react';
import { getGroups } from '../services/groupService';

export default function useChatManager(user, api, setConversations) {
    const [messages, setMessages] = useState({});
    const [contacts, setContacts] = useState({});
    const [groups, setGroups] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!user) return;
        const loadGroups = async () => {
            try {
                const res = await getGroups();
                setGroups(Array.isArray(res) ? res : []);
            } catch (err) {
                console.error("Failed to load groups", err);
                setGroups([]);
            }
        };
        loadGroups();
    }, [user]);

    const handleChatMessage = useCallback((data) => {
        // Skip echo of own messages to avoid duplication (already added optimistically in sendMessage)
        if (data.sender_id === user.id) return;

        setMessages(prev => {
            const otherId = data.sender_id === user.id ? data.recipient_id : data.sender_id;
            const newMsg = {
                ...data,
                isMine: data.sender_id === user.id,
                sender_name: data.sender_name || 'Unknown'
            };
            const listKey = data.group_id ? `group_${data.group_id}` : otherId;
            const list = prev[listKey] || [];
            return { ...prev, [listKey]: [...list, newMsg] };
        });

        if (data.sender_id !== user.id) {
            setContacts(prev => ({
                ...prev,
                [data.sender_id]: {
                    name: data.sender_name || 'Unknown',
                    email: data.sender_email || '',
                    id: data.sender_id
                }
            }));

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
                    return [{
                        other_user_id: data.sender_id,
                        other_user_name: data.sender_name || 'Unknown',
                        other_user_email: data.sender_email || '',
                        last_message: data.content,
                        last_message_time: data.timestamp
                    }, ...prev];
                }
            });
        }
    }, [user.id, setConversations]);

    const sendMessage = (selectedUser, send) => {
        if (!input || !selectedUser) return;

        const msg = {
            type: 'chat',
            content: input,
            sender_id: user.id,
            sender_name: user.full_name || user.name,
            sender_email: user.email,
            recipient_id: selectedUser.isGroup ? null : selectedUser.id,
            group_id: selectedUser.isGroup ? selectedUser.id : null,
            target_id: selectedUser.isGroup ? null : selectedUser.id,
            timestamp: new Date().toISOString()
        };

        if (send) send(msg);

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
                    return [{
                        other_user_id: selectedUser.id,
                        other_user_name: selectedUser.full_name,
                        other_user_email: selectedUser.email,
                        last_message: input,
                        last_message_time: msg.timestamp
                    }, ...prev];
                }
            });
        }

        setMessages(prev => {
            const listKey = selectedUser.isGroup ? `group_${selectedUser.id}` : selectedUser.id;
            const list = prev[listKey] || [];
            return { ...prev, [listKey]: [...list, { ...msg, isMine: true }] };
        });
        setInput('');
    };

    return {
        messages,
        contacts,
        groups,
        setGroups,
        input,
        setInput,
        handleChatMessage,
        sendMessage
    };
}
