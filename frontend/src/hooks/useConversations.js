import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as conversationService from '../services/conversationService';

export default function useConversations() {
    const { api } = useAuth();
    const [conversations, setConversations] = useState([]);

    const fetchConversations = useCallback(async () => {
        try {
            const list = await conversationService.getConversations();
            setConversations(list);
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        }
    }, [api]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const saveAllConversations = useCallback(async (messages, contacts) => {
        try {
            const conversationsToSave = [];
            Object.entries(messages).forEach(([userId, msgList]) => {
                if (msgList.length > 0) {
                    const lastMsg = msgList[msgList.length - 1];
                    const otherUserId = parseInt(userId);
                    conversationsToSave.push({
                        other_user_id: otherUserId,
                        last_message: lastMsg.content
                    });
                }
            });

            await conversationService.saveConversationsBatch(conversationsToSave);
            return conversationsToSave.length;
        } catch (error) {
            console.error('Error saving all conversations', error);
            return 0;
        }
    }, []);

    return {
        conversations,
        setConversations,
        fetchConversations,
        saveAllConversations
    };
}
