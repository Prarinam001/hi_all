import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import UserSearch from '../components/UserSearch';
import { Box, Paper, Typography, Avatar, IconButton, Drawer, useTheme, useMediaQuery } from '@mui/material';
import useConversations from '../hooks/useConversations';
import ChatHeader from '../components/ChatHeader';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import CallOverlays from '../components/CallOverlays';
import useWebSocket from '../hooks/useWebSocket';
import usePeerConnection from '../hooks/usePeerConnection';
import { Menu } from 'lucide-react';
import AppLogo from '../components/AppLogo';
import { getGroups } from '../services/groupService';

export default function Chat() {
    const { user, logout, api } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    // websocket and peer connection are handled by hooks
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState({}); // { userId: [msgs] }
    const [contacts, setContacts] = useState({}); // { userId: { name, email } }
    const [groups, setGroups] = useState([]);
    const { conversations, setConversations, fetchConversations, saveAllConversations } = useConversations();
    const [input, setInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [callType, setCallType] = useState(null); // 'video' or 'audio'
    const [copiedEmail, setCopiedEmail] = useState(null); // Track which email was copied
    const callTimeoutRef = useRef(null);

    // Video Call State
    const [incomingCall, setIncomingCall] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const remoteAudio = useRef(null);

    // WebSocket message handler uses a ref to avoid stale closures
    const wsMessageRef = useRef(null);
    const { send } = useWebSocket(user?.id, (data) => {
        if (wsMessageRef.current) wsMessageRef.current(data);
    });

    // sendRef for use inside peer connection callbacks
    const sendRef = useRef(null);
    useEffect(() => { sendRef.current = send; }, [send]);

    useEffect(() => {
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

    useEffect(() => {
        wsMessageRef.current = async (data) => {
            if (!data) return;
            if (data.type === 'chat') {
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

                // Track contact information and update conversations locally
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
            } else if (data.type === 'offer' || data.type === 'voice-offer') {
                handleOffer(data);
            } else if (data.type === 'answer' || data.type === 'voice-answer') {
                handleAnswer(data);
            } else if (data.type === 'candidate') {
                handleCandidate(data);
            } else if (data.type === 'call-end') {
                endCall();
            } else if (data.type === 'call-reject') {
                handleCallReject();
            }
        };
    }, [user, setConversations]);
    // Peer connection hook (onTrack will set remote video)
    const peer = usePeerConnection({
        onIceCandidate: (candidate) => {
            const s = sendRef.current;
            if (!s || !selectedUser) return;
            s({
                type: 'candidate',
                candidate: candidate.candidate,
                sdpMLineIndex: candidate.sdpMLineIndex,
                sdpMid: candidate.sdpMid,
                target_id: selectedUser.id,
                sender_id: user.id
            });
        },
        onTrack: (stream) => {
            console.log('onTrack callback in Chat, stream:', stream, 'has tracks:', stream?.getTracks?.());
            const audioTracks = stream?.getAudioTracks?.() || [];
            const videoTracks = stream?.getVideoTracks?.() || [];
            console.log('Audio tracks:', audioTracks.length, 'Video tracks:', videoTracks.length);
            if (remoteVideo.current) {
                console.log('Setting remote video srcObject');
                remoteVideo.current.srcObject = stream;
                // Force play
                remoteVideo.current.play?.().catch(e => console.log('Play failed:', e));
            } else {
                console.warn('remoteVideo.current is null');
            }

            // Also attach stream to audio element to ensure audio playback
            if (remoteAudio.current) {
                console.log('Setting remote audio srcObject and playing');
                try {
                    remoteAudio.current.srcObject = stream;
                    remoteAudio.current.volume = 1.0;
                    remoteAudio.current.muted = false;
                    remoteAudio.current.play?.().catch(err => console.log('Remote audio play failed:', err));
                } catch (err) {
                    console.log('Remote audio play failed:', err);
                }
            } else {
                console.warn('remoteAudio.current is null');
            }
        }
    });

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input || !selectedUser) return;

        const msg = {
            type: 'chat',
            content: input,
            sender_id: user.id,
            sender_name: user.full_name || user.name,
            sender_email: user.email,
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

        const s = sendRef.current;
        if (s) s(msg);

        // Track contact information when sending a message
        setContacts(prev => ({
            ...prev,
            [selectedUser.id]: {
                name: selectedUser.full_name,
                email: selectedUser.email,
                id: selectedUser.id
            }
        }));

        // Update conversations list - add or update conversation
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

        // Optimistic update
        setMessages(prev => {
            const listKey = selectedUser.isGroup ? `group_${selectedUser.id}` : selectedUser.id;
            const list = prev[listKey] || [];
            return { ...prev, [listKey]: [...list, { ...msg, isMine: true }] };
        });
        setInput('');
    };

    const startCall = async (type = 'video') => {
        if (!selectedUser) return;
        try {
            setCallType(type);
            setIsInCall(true);

            // Get media constraints based on call type
            const constraints = type === 'video'
                ? {
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                }
                : {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Got user media - audio tracks:', stream.getAudioTracks().length, 'video tracks:', stream.getVideoTracks().length);
            if (localVideo.current && type === 'video') {
                localVideo.current.srcObject = stream;
            }

            const pc = peer.create();
            // attach local tracks
            peer.addLocalStream(stream);

            const offer = await peer.createOffer();

            const offerType = type === 'video' ? 'offer' : 'voice-offer';
            const s = sendRef.current;
            if (s) s({
                type: offerType,
                offer: { type: offer.type, sdp: offer.sdp },
                target_id: selectedUser.id,
                sender_id: user.id,
                sender_name: user.full_name,
                call_type: type
            });

            // Set 30-second timeout for call response
            callTimeoutRef.current = setTimeout(() => {
                console.log('Call timeout - no response from recipient');
                endCall();
                const typeLabel = type === 'video' ? 'Video call' : 'Voice call';
                alert(`${typeLabel} ended - recipient did not answer`);
            }, 30000);
        } catch (error) {
            console.error('Error starting call:', error);
            setIsInCall(false);
        }
    };

    const startVoiceCall = async () => {
        await startCall('audio');
    };

    const handleOffer = async (data) => {
        setCallType(data.call_type || 'video');
        setIncomingCall(data);
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        try {
            // Clear the timeout if caller had set one
            if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
            }

            setIsInCall(true);

            // Always request audio, video only if video call
            const callTypeToUse = callType || incomingCall.call_type || 'video';
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: callTypeToUse === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (localVideo.current && callTypeToUse === 'video') {
                localVideo.current.srcObject = stream;
            }

            const pc = peer.create();
            peer.addLocalStream(stream);

            await peer.setRemoteDescription(incomingCall.offer);

            const answer = await peer.createAnswer();

            const answerType = (callTypeToUse === 'video') ? 'answer' : 'voice-answer';
            const s = sendRef.current;
            if (s) s({
                type: answerType,
                answer: { type: answer.type, sdp: answer.sdp },
                target_id: incomingCall.sender_id,
                sender_id: user.id,
                sender_name: user.full_name
            });

            // Set selected user to incoming caller
            if (!selectedUser) {
                setSelectedUser({
                    id: incomingCall.sender_id,
                    full_name: incomingCall.sender_name || 'Unknown',
                    email: ''
                });
            }
            setIncomingCall(null);
        } catch (error) {
            console.error('Error accepting call:', error);
            setIsInCall(false);
        }
    };

    const handleAnswer = async (data) => {
        try {
            if (data.answer && data.answer.sdp) {
                await peer.setRemoteDescription(data.answer);
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    };

    const handleCandidate = async (data) => {
        try {
            if (data.candidate) {
                const candidateInit = {
                    candidate: data.candidate,
                    sdpMLineIndex: data.sdpMLineIndex,
                    sdpMid: data.sdpMid
                };
                await peer.addIceCandidate(candidateInit);
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    };

    const endCall = () => {
        // Clear any pending timeouts
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

        // Send call-end message to the other user
        const s = sendRef.current;
        if (s && selectedUser) {
            s({ type: 'call-end', target_id: selectedUser.id, sender_id: user.id, call_type: callType });
        }

        setIsInCall(false);
        setCallType(null);
        if (localVideo.current && localVideo.current.srcObject) {
            localVideo.current.srcObject.getTracks().forEach(track => track.stop());
        }
        peer.close();
        setIncomingCall(null);
    };

    const rejectCall = () => {
        // Clear any pending timeouts
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

        // Send rejection message to the caller
        const s = sendRef.current;
        if (s && incomingCall) {
            s({ type: 'call-reject', target_id: incomingCall.sender_id, sender_id: user.id, call_type: callType });
        }

        setIncomingCall(null);
        setCallType(null);
    };

    const handleCallReject = () => {
        // Clear timeout on rejection
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

        setIsInCall(false);
        const typeLabel = callType === 'video' ? 'Video call' : 'Voice call';
        if (localVideo.current && localVideo.current.srcObject) {
            localVideo.current.srcObject.getTracks().forEach(track => track.stop());
        }
        peer.close();
        setIncomingCall(null);
        setCallType(null);
        alert(`${typeLabel} rejected by recipient`);
    };

    const handleEmojiClick = (event) => {
        setInput(prev => prev + event.emoji);
    };

    const handleEmojiButtonClick = (event) => {
        setEmojiAnchorEl(event.currentTarget);
        setShowEmojiPicker(!showEmojiPicker);
    };

    const handleEmojiClose = () => {
        setShowEmojiPicker(false);
        setEmojiAnchorEl(null);
    };

    const handleLogout = async () => {
        // Save all conversations before logout using the conversations hook
        try {
            await saveAllConversations(messages, contacts);
        } catch (err) {
            console.error('Error saving conversations on logout:', err);
        }
        // Then logout
        logout();
    };

    const copyEmailToClipboard = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const EmailTooltip = ({ email, children }) => (
        <Tooltip
            title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{email}</Typography>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            copyEmailToClipboard(email);
                        }}
                        sx={{ color: 'white', p: 0.5 }}
                    >
                        {copiedEmail === email ? <Check size={16} /> : <Copy size={16} />}
                    </IconButton>
                </Box>
            }
            arrow
        >
            {children}
        </Tooltip>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
            {/* Sidebar - permanent on md+, drawer on xs */}
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Sidebar user={user} conversations={conversations} groups={groups} onSelect={setSelectedUser} onLogout={handleLogout} copiedEmail={copiedEmail} onCopy={copyEmailToClipboard} onGroupCreated={(g) => { setGroups(prev => [...prev, g]); setSelectedUser({ ...g, isGroup: true }); }} />
            </Box>

            <Drawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 300 } }}
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

            {/* Main Chat Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#0b141a', position: 'relative' }}>
                {selectedUser ? (
                    <>
                        <ChatHeader user={user} selectedUser={selectedUser} startCall={startCall} startVoiceCall={startVoiceCall} copiedEmail={copiedEmail} onCopy={copyEmailToClipboard} onSidebarToggle={() => setMobileOpen(true)} />

                        <MessageList messages={messages[selectedUser.isGroup ? `group_${selectedUser.id}` : selectedUser.id] || []} selectedUser={selectedUser} />

                        <MessageInput
                            input={input}
                            setInput={setInput}
                            onSend={sendMessage}
                            onEmojiClick={handleEmojiClick}
                            showEmojiPicker={showEmojiPicker}
                            emojiAnchorEl={emojiAnchorEl}
                            handleEmojiButtonClick={handleEmojiButtonClick}
                            handleEmojiClose={handleEmojiClose}
                        />

                        <CallOverlays
                            isInCall={isInCall}
                            callType={callType}
                            localVideoRef={localVideo}
                            remoteVideoRef={remoteVideo}
                            remoteAudioRef={remoteAudio}
                            endCall={endCall}
                            incomingCall={incomingCall}
                            acceptCall={acceptCall}
                            rejectCall={rejectCall}
                            selectedUser={selectedUser}
                        />
                    </>
                ) : (
                    <>
                        {/* Mobile header with menu button when no user selected */}
                        <Box sx={{ height: 64, bgcolor: 'background.paper', display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'space-between', px: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <AppLogo size={40} />
                            <IconButton onClick={() => setMobileOpen(true)} aria-label="Open conversations">
                                <Menu />
                            </IconButton>
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Select a user to start chatting</Typography>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
