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
        bgcolor: '#0b141a',
        position: 'relative'
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
        input,
        setInput,
        handleChatMessage,
        sendMessage
    } = useChatManager(user, api, setConversations);

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
        try {
            await saveAllConversations(messages, contacts);
        } catch (err) {
            console.error('Error saving conversations on logout:', err);
        }
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
                    onGroupCreated={(g) => { setGroups(prev => [...prev, g]); setSelectedUser({ ...g, isGroup: true }); }}
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
                    onClose={() => setMobileOpen(false)}
                    onGroupCreated={(g) => {
                        setGroups(prev => [...prev, g]);
                        setSelectedUser({ ...g, isGroup: true });
                    }}
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
