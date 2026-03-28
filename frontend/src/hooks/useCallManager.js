import { useState, useRef, useEffect, useCallback } from 'react';
import usePeerConnection from './usePeerConnection';

export default function useCallManager(user, selectedUser, sendRef, setSelectedUser) {
    const [callType, setCallType] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const callTimeoutRef = useRef(null);

    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const remoteAudio = useRef(null);
    const endCallRef = useRef(null);

    const peer = usePeerConnection({
        onIceCandidate: (candidate) => {
            const s = sendRef.current;
            const target_id = selectedUser?.id || incomingCall?.sender_id;
            if (!s || !target_id) return;
            s({
                type: 'candidate',
                candidate: candidate.candidate,
                sdpMLineIndex: candidate.sdpMLineIndex,
                sdpMid: candidate.sdpMid,
                target_id: target_id,
                sender_id: user.id
            });
        },
        onTrack: (stream) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = stream;
                remoteVideo.current.play?.().catch(e => console.log('Play failed:', e));
            }
            if (remoteAudio.current) {
                try {
                    remoteAudio.current.srcObject = stream;
                    remoteAudio.current.volume = 1.0;
                    remoteAudio.current.muted = false;
                    remoteAudio.current.play?.().catch(err => console.log('Remote audio play failed:', err));
                } catch (err) {
                    console.log('Remote audio play failed:', err);
                }
            }
        }
    });

    const endCall = useCallback(() => {
        // IDEMPOTENCY: If no call is active, don't send anything (stops the loop!)
        if (!isInCall && !incomingCall) return;

        // 1. Capture the target ID BEFORE clearing state
        const target_id = selectedUser?.id || incomingCall?.sender_id;

        // 2. Clear state IMMEDIATELY (prevents double-entry)
        setIsInCall(false);
        setIncomingCall(null);
        setCallType(null);

        // 3. Clear timers and hardware
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }
        if (localVideo.current && localVideo.current.srcObject) {
            localVideo.current.srcObject.getTracks().forEach(track => track.stop());
            localVideo.current.srcObject = null;
        }
        peer.close();

        // 4. Send the signal ONLY ONCE
        const s = sendRef.current;
        if (s && target_id) {
            s({ type: 'call-end', target_id: target_id, sender_id: user.id, call_type: callType });
        }
    }, [user.id, selectedUser, incomingCall, isInCall, callType, sendRef, peer]);

    useEffect(() => {
        endCallRef.current = endCall;
    }, [endCall]);

    const handleCallReject = useCallback(() => {
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

        setIsInCall(false);
        if (localVideo.current && localVideo.current.srcObject) {
            localVideo.current.srcObject.getTracks().forEach(track => track.stop());
        }
        peer.close();
        const typeLabel = callType === 'video' ? 'Video call' : 'Voice call';
        setIncomingCall(null);
        setCallType(null);
        alert(`${typeLabel} rejected by recipient`);
    }, [callType, peer]);

    const startCall = async (type = 'video') => {
        if (!selectedUser) return;
        try {
            setCallType(type);
            setIsInCall(true);

            const constraints = type === 'video'
                ? {
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                }
                : { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (localVideo.current && type === 'video') {
                localVideo.current.srcObject = stream;
            }

            peer.create();
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

            callTimeoutRef.current = setTimeout(() => {
                if (endCallRef.current) endCallRef.current();
                const typeLabel = type === 'video' ? 'Video call' : 'Voice call';

                setTimeout(() => {
                    alert(`${typeLabel} ended - recipient did not answer`);
                }, 100);
            }, 20000);
        } catch (error) {
            console.error('Error starting call:', error);
            setIsInCall(false);
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        try {
            if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
            }

            setIsInCall(true);
            const callTypeToUse = callType || incomingCall.call_type || 'video';
            const constraints = {
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: callTypeToUse === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (localVideo.current && callTypeToUse === 'video') {
                localVideo.current.srcObject = stream;
            }

            peer.create();
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

    const rejectCall = () => {
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

        const s = sendRef.current;
        if (s && incomingCall) {
            s({ type: 'call-reject', target_id: incomingCall.sender_id, sender_id: user.id, call_type: callType });
        }

        setIncomingCall(null);
        setCallType(null);
    };

    const handleOffer = (data) => {
        setCallType(data.call_type || 'video');
        setIncomingCall(data);
    };

    const handleAnswer = async (data) => {
        // Answer received: STOP the timeout timer!
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

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

    const handleCallEnd = useCallback(() => {
        // IDEMPOTENCY: If no call is even active, ignore this signal
        if (!isInCall && !incomingCall) return;

        // Capture the remote user's name BEFORE clearing state
        const other_name = incomingCall?.sender_name || selectedUser?.full_name || 'the other person';

        // Reset state
        setIsInCall(false);
        setIncomingCall(null);
        setCallType(null);

        // Hardware cleanup
        if (localVideo.current && localVideo.current.srcObject) {
            localVideo.current.srcObject.getTracks().forEach(track => track.stop());
            localVideo.current.srcObject = null;
        }
        if (remoteVideo.current) remoteVideo.current.srcObject = null;
        if (remoteAudio.current) remoteAudio.current.srcObject = null;

        // Peer cleanup
        peer.close();

        // Notify user (slightly delayed so UI re-renders first)
        setTimeout(() => {
            alert(`Call ended by ${other_name}`);
        }, 100);
    }, [isInCall, incomingCall, selectedUser, peer]);

    return {
        callType,
        setCallType,
        incomingCall,
        setIncomingCall,
        isInCall,
        setIsInCall,
        localVideo,
        remoteVideo,
        remoteAudio,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        handleOffer,
        handleAnswer,
        handleCandidate,
        handleCallReject,
        handleCallEnd
    };
}
