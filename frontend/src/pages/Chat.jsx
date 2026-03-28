import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Drawer, useTheme, useMediaQuery } from '@mui/material';
import useConversations from '../hooks/useConversations';
import ChatHeader from '../components/ChatHeader';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import CallOverlays from '../components/CallOverlays';
import EmptyChatState from '../components/EmptyChatState';
import useWebSocket from '../hooks/useWebSocket';
import useChatManager from '../hooks/useChatManager';
import useCallManager from '../hooks/useCallManager';
import { deleteLocalConversationData } from '../db/db';

const styles = {
    chatPageContainer: {
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default'
    },
    sidebarDesktop: {
        display: { xs: 'none', md: 'flex' }
    },
    drawer: {
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': { width: 300 }
    },
    mainChatArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        // bgcolor: '#0b141a',
        position: 'relative',
        background: 'radial-gradient(circle at 15% 50%, rgba(14, 170, 136, 0.1), transparent 25%), radial-gradient(circle at 85% 30%, rgba(12, 160, 42, 0.15), transparent 25%)',
        bgcolor: 'background.default',
    }
};

export default function Chat() {
    const { user, logout, api } = useAuth();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [copiedEmail, setCopiedEmail] = useState(null);

    const { conversations, setConversations, saveAllConversations } = useConversations();

    const {
        messages,
        contacts,
        groups,
        setGroups,
        addGroup,
        input,
        setInput,
        replyTo,
        setReplyTo,
        handleChatMessage,
        sendMessage,
        loadLocalMessagesForUser,
        addMember,
        removeMember,
        groupLeave,
        unreads,
        userStatuses,
        setUserStatuses
    } = useChatManager(user, api, setConversations, selectedUser);

    useEffect(() => {
        if (selectedUser?.isGroup && groups) {
            const exists = groups.find(g => g.id === selectedUser.id);
            if (!exists) {
                // If we get kicked out of a group, auto-kick our UI from lingering inside it!
                setSelectedUser(null);
            }
        }
    }, [groups, selectedUser]);

    useEffect(() => {
        if (selectedUser) {
            loadLocalMessagesForUser(selectedUser.id, selectedUser.isGroup);
        }
    }, [selectedUser, loadLocalMessagesForUser]);

    useEffect(() => {
        if (conversations && conversations.length > 0) {
            const initialStatuses = {};
            conversations.forEach(c => {
                if (c.other_user_id) {
                    initialStatuses[c.other_user_id] = {
                        is_online: c.is_online || false,
                        last_seen: c.last_seen
                    };
                }
            });
            setUserStatuses(prev => ({ ...initialStatuses, ...prev }));
        }
    }, [conversations, setUserStatuses]);

    const sendRef = useRef(null);
    const { send } = useWebSocket(user?.id, (data) => {
        if (!data) return;
        // Relay all messages to chat manager (handles chat, user_status, pong, etc.)
        handleChatMessage(data);

        // Still handle signaling and specific UI logic here if needed
        if (data.type === 'offer' || data.type === 'voice-offer') {
            callManager.handleOffer(data);
        } else if (data.type === 'answer' || data.type === 'voice-answer') {
            callManager.handleAnswer(data);
        } else if (data.type === 'candidate') {
            callManager.handleCandidate(data);
        } else if (data.type === 'call-end') {
            callManager.handleCallEnd();
        } else if (data.type === 'call-reject') {
            callManager.handleCallReject();
        }
    });

    useEffect(() => { sendRef.current = send; }, [send]);

    const callManager = useCallManager(user, selectedUser, sendRef, setSelectedUser);

    const handleSendMessage = (e) => {
        e.preventDefault();
        sendMessage(selectedUser, send);
    };

    const handleEmojiClick = (event) => {
        setInput(prev => prev + event.emoji);
    };

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);

    const handleEmojiButtonClick = (event) => {
        setEmojiAnchorEl(event.currentTarget);
        setShowEmojiPicker(!showEmojiPicker);
    };

    const handleEmojiClose = () => {
        setShowEmojiPicker(false);
        setEmojiAnchorEl(null);
    };

    const handleLogout = async () => {
        logout();
    };

    const copyEmailToClipboard = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const handleDeleteConversation = async (convId, otherUserId) => {
        try {
            await api.delete(`/api/chat/conversations/${otherUserId}`);
            setConversations(prev => prev.filter(c => c.other_user_id !== otherUserId));

            // Delete localized db logs
            await deleteLocalConversationData(otherUserId);

            if (selectedUser && selectedUser.id === otherUserId && !selectedUser.isGroup) {
                setSelectedUser(null);
            }
        } catch (err) {
            console.error("Failed to delete conversation", err);
            alert("Failed to delete chat.");
        }
    };

    return (
        <Box sx={styles.chatPageContainer}>
            <Box sx={styles.sidebarDesktop}>
                <Sidebar
                    user={user}
                    conversations={conversations}
                    groups={groups}
                    onSelect={setSelectedUser}
                    onLogout={handleLogout}
                    copiedEmail={copiedEmail}
                    onCopy={copyEmailToClipboard}
                    unreads={unreads}
                    userStatuses={userStatuses}
                    onGroupCreated={(g) => { addGroup(g); setSelectedUser({ ...g, isGroup: true }); }}
                    onDeleteConversation={handleDeleteConversation}
                />
            </Box>

            <Drawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={styles.drawer}
            >
                <Sidebar
                    user={user}
                    conversations={conversations}
                    groups={groups}
                    onSelect={(u) => { setSelectedUser(u); setMobileOpen(false); }}
                    onLogout={() => { handleLogout(); setMobileOpen(false); }}
                    copiedEmail={copiedEmail}
                    onCopy={copyEmailToClipboard}
                    unreads={unreads}
                    userStatuses={userStatuses}
                    onClose={() => setMobileOpen(false)}
                    onGroupCreated={(g) => { addGroup(g); setSelectedUser({ ...g, isGroup: true }); }}
                    onDeleteConversation={handleDeleteConversation}
                />
            </Drawer>

            <Box sx={styles.mainChatArea}>
                {selectedUser ? (
                    <>
                        <ChatHeader
                            user={user}
                            selectedUser={selectedUser}
                            userStatus={userStatuses[selectedUser.id]}
                            startCall={callManager.startCall}
                            startVoiceCall={() => callManager.startCall('audio')}
                            copiedEmail={copiedEmail}
                            onCopy={copyEmailToClipboard}
                            onSidebarToggle={() => setMobileOpen(true)}
                            onAddMember={async (groupId, info) => {
                                const updated = await addMember(groupId, info);
                                setSelectedUser({ ...updated, isGroup: true });
                            }}
                            onRemoveMember={async (groupId, userId) => {
                                const updated = await removeMember(groupId, userId);
                                setSelectedUser({ ...updated, isGroup: true });
                            }}
                            onLeaveGroup={async (id) => {
                                try {
                                    await groupLeave(id);
                                    setSelectedUser(null);
                                } catch (err) {
                                    alert("Failed to leave group");
                                }
                            }}
                        />

                        <MessageList
                            messages={messages[selectedUser.isGroup ? `group_${selectedUser.id}` : selectedUser.id] || []}
                            selectedUser={selectedUser}
                            onReplyClick={setReplyTo}
                        />

                        <MessageInput
                            input={input}
                            setInput={setInput}
                            replyTo={replyTo}
                            onCancelReply={() => setReplyTo(null)}
                            onSend={handleSendMessage}
                            onEmojiClick={handleEmojiClick}
                            showEmojiPicker={showEmojiPicker}
                            emojiAnchorEl={emojiAnchorEl}
                            handleEmojiButtonClick={handleEmojiButtonClick}
                            handleEmojiClose={handleEmojiClose}
                        />

                        <CallOverlays
                            user={user}
                            isInCall={callManager.isInCall}
                            callType={callManager.callType}
                            localVideoRef={callManager.localVideo}
                            remoteVideoRef={callManager.remoteVideo}
                            remoteAudioRef={callManager.remoteAudio}
                            endCall={callManager.endCall}
                            incomingCall={callManager.incomingCall}
                            acceptCall={callManager.acceptCall}
                            rejectCall={callManager.rejectCall}
                            selectedUser={selectedUser}
                        />
                    </>
                ) : (
                    <EmptyChatState onSidebarToggle={() => setMobileOpen(true)} />
                )}
            </Box>
        </Box>
    );
}
