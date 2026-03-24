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
        handleChatMessage,
        sendMessage,
        loadLocalMessagesForUser,
        addMember,
        groupLeave,
        unreads
    } = useChatManager(user, api, setConversations, selectedUser);

    useEffect(() => {
        if (selectedUser) {
            loadLocalMessagesForUser(selectedUser.id, selectedUser.isGroup);
        }
    }, [selectedUser, loadLocalMessagesForUser]);

    const sendRef = useRef(null);
    const { send } = useWebSocket(user?.id, (data) => {
        if (!data) return;
        if (data.type === 'chat') {
            handleChatMessage(data);
        } else if (data.type === 'offer' || data.type === 'voice-offer') {
            callManager.handleOffer(data);
        } else if (data.type === 'answer' || data.type === 'voice-answer') {
            callManager.handleAnswer(data);
        } else if (data.type === 'candidate') {
            callManager.handleCandidate(data);
        } else if (data.type === 'call-end') {
            callManager.endCall();
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
                    onGroupCreated={(g) => { addGroup(g); setSelectedUser({ ...g, isGroup: true }); }}
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
                    onClose={() => setMobileOpen(false)}
                    onGroupCreated={(g) => { addGroup(g); setSelectedUser({ ...g, isGroup: true }); }}
                />
            </Drawer>

            <Box sx={styles.mainChatArea}>
                {selectedUser ? (
                    <>
                        <ChatHeader
                            user={user}
                            selectedUser={selectedUser}
                            startCall={callManager.startCall}
                            startVoiceCall={() => callManager.startCall('audio')}
                            copiedEmail={copiedEmail}
                            onCopy={copyEmailToClipboard}
                            onSidebarToggle={() => setMobileOpen(true)}
                            onAddMember={addMember}
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
                        />

                        <MessageInput
                            input={input}
                            setInput={setInput}
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
