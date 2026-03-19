import Dexie from 'dexie';

export const db = new Dexie('ChatAppLocalDB');

// Define schema
// ++id: auto-incrementing primary key
// [recipient_id+timestamp]: compound index for efficient message retrieval per user
db.version(4).stores({
    messages: '++id, server_id, sender_id, recipient_id, group_id, content, timestamp, [recipient_id+timestamp], [group_id+timestamp]',
    conversations: 'other_user_id, last_message, last_message_time',
    groups: 'id, name, last_message, last_message_time, created_by'
}).upgrade(tx => {
    // Version 4 adds created_by and potentially members to group data
});

// Helper functions for common operations
export const saveLocalMessage = async (msg) => {
    // Check if message with this server_id already exists to prevent duplicates
    if (msg.id && !msg.server_id) msg.server_id = msg.id; // Map server id to server_id field

    if (msg.server_id) {
        const existing = await db.messages.where('server_id').equals(msg.server_id).first();
        if (existing) return existing.id;
    }

    return await db.messages.add({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString()
    });
};

export const bulkSaveLocalMessages = async (messages) => {
    for (const m of messages) {
        const serverId = m.server_id || m.id;
        if (serverId) {
            const existing = await db.messages.where('server_id').equals(serverId).first();
            if (existing) {
                await db.messages.update(existing.id, { ...m, server_id: serverId });
            } else {
                await db.messages.add({ ...m, server_id: serverId, timestamp: m.timestamp || new Date().toISOString() });
            }
        } else {
            await db.messages.add({ ...m, timestamp: m.timestamp || new Date().toISOString() });
        }
    }
};

export const saveLocalGroups = async (groups) => {
    return await db.groups.bulkPut(groups);
};

export const saveLocalGroup = async (group) => {
    return await db.groups.put(group);
};

export const getLocalGroups = async () => {
    return await db.groups.toArray();
};

export const getLocalMessages = async (id, isGroup = false) => {
    if (isGroup) {
        return await db.messages
            .where('group_id')
            .equals(id)
            .sortBy('timestamp');
    } else {
        // For DMs, we need to find messages where the user is either sender or recipient
        // Dexie doesn't support easy OR queries on compound indices without custom collection logic
        // But since we are filtering by "other user", we can filter where:
        // (sender_id == current_user_id AND recipient_id == other_id) OR (sender_id == other_id AND recipient_id == current_user_id)

        // Simplest approach for now: fetch all where recipient_id == other_id OR sender_id == other_id
        // and filter in memory if necessary, OR use a collection.

        return await db.messages
            .filter(m => (m.recipient_id === id || m.sender_id === id) && !m.group_id)
            .sortBy('timestamp');
    }
};

export const saveLocalConversation = async (conv) => {
    return await db.conversations.put(conv);
};

export const getLocalConversations = async () => {
    return await db.conversations.toArray();
};

export const clearLocalData = async () => {
    await db.messages.clear();
    await db.conversations.clear();
    await db.groups.clear();
};

export const deleteLocalGroupData = async (groupId) => {
    await db.groups.delete(groupId);
    await db.messages.where('group_id').equals(groupId).delete();
};
