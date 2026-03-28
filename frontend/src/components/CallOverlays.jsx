import React, { useEffect } from 'react';
import { Box, Avatar, Typography, Fab, Paper } from '@mui/material';

const styles = {
    overlayContainer: {
        position: 'absolute',
        inset: 0,
        bgcolor: 'black',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'stretch'
    },
    videoContainer: {
        position: 'relative',
        flex: 1,
        display: 'flex',
        gap: 0,
        minHeight: 0
    },
    remoteVideo: {
        flex: 1,
        backgroundColor: '#333',
        objectFit: 'cover',
        width: '100%',
        height: '100%',
        display: 'block'
    },
    localVideoContainer: {
        position: 'absolute',
        bottom: 80,
        right: 16,
        width: 200,
        height: 150,
        borderRadius: 8,
        border: '2px solid white',
        overflow: 'hidden',
        zIndex: 10,
        backgroundColor: '#111',
    },
    localVideo: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
    },
    nameLabel: {
        position: 'absolute',
        top: 16,
        left: 16,
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '4px 12px',
        borderRadius: 4,
        zIndex: 20,
        fontWeight: 'bold',
    },
    localNameLabel: {
        position: 'absolute',
        top: 8,
        left: 8,
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '2px 8px',
        borderRadius: 4,
        zIndex: 20,
        fontSize: '0.75rem',
        fontWeight: 'bold',
    },
    buttonContainer: {
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'rgba(0,0,0,0.7)'
    },
    audioCallContainer: {
        position: 'absolute',
        inset: 0,
        bgcolor: 'background.default',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4
    },
    audioAvatar: {
        width: 120,
        height: 120,
        bgcolor: 'primary.main',
        fontSize: '3rem',
        mb: 2
    },
    incomingCallPaper: {
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        zIndex: 1300,
        border: 1,
        borderColor: 'primary.main',
        minWidth: 350,
        maxWidth: '90vw',
        boxShadow: 3
    },
    fabContainer: {
        display: 'flex',
        gap: 1.5,
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%'
    }
};

export default function CallOverlays({ user, isInCall, callType, localVideoRef, remoteVideoRef, remoteAudioRef, endCall, incomingCall, acceptCall, rejectCall, selectedUser }) {
    useEffect(() => {
        if (remoteVideoRef?.current) {
            const video = remoteVideoRef.current;
            video.volume = 1.0; // Ensure volume is at max
            video.muted = false; // Ensure not muted
            const handlePlay = () => console.log('Remote video playing, volume:', video.volume, 'muted:', video.muted);
            const handleLoadStart = () => console.log('Remote video load started');
            const handleCanPlay = () => console.log('Remote video can play');
            video.addEventListener('play', handlePlay);
            video.addEventListener('loadstart', handleLoadStart);
            video.addEventListener('canplay', handleCanPlay);
            return () => {
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('loadstart', handleLoadStart);
                video.removeEventListener('canplay', handleCanPlay);
            };
        }
    }, [remoteVideoRef]);

    return (
        <>
            {isInCall && callType === 'video' && (
                <Box sx={styles.overlayContainer}>
                    {/* Video Container */}
                    <Box sx={styles.videoContainer}>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            muted={false}
                            style={styles.remoteVideo}
                        />
                        <Typography sx={styles.nameLabel}>
                            {selectedUser?.name || selectedUser?.full_name || 'Unknown'}
                        </Typography>
                        {/* Hidden audio element for reliable audio playback */}
                        <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
                        
                        <Box sx={styles.localVideoContainer}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={styles.localVideo}
                            />
                            <Typography sx={styles.localNameLabel}>
                                {user?.name || user?.full_name || 'You'}
                            </Typography>
                        </Box>
                    </Box>
                    {/* Button Container */}
                    <Box sx={styles.buttonContainer}>
                        <Fab variant="extended" color="error" onClick={endCall} size="large">End Call</Fab>
                    </Box>
                </Box>
            )}

            {isInCall && callType === 'audio' && (
                <Box sx={styles.audioCallContainer}>
                    <Avatar sx={styles.audioAvatar}>{selectedUser?.full_name?.[0]?.toUpperCase()}</Avatar>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>{selectedUser?.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Voice Call in Progress</Typography>
                    <Fab variant="extended" color="error" onClick={endCall}>End Call</Fab>
                </Box>
            )}

            {!isInCall && incomingCall && (
                <Paper sx={styles.incomingCallPaper}>
                    <Typography variant="body1" textAlign="center" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>Incoming {callType === 'audio' ? 'Voice' : 'Video'} Call</Typography>
                    <Typography variant="subtitle1" textAlign="center" sx={{ color: 'primary.main' }}>
                        from {incomingCall?.sender_name || 'Unknown'}
                    </Typography>
                    <Box sx={styles.fabContainer}>
                        <Fab size="small" color="success" onClick={acceptCall} sx={{ width: 56, height: 56 }}>✓</Fab>
                        <Fab size="small" color="error" onClick={rejectCall} sx={{ width: 56, height: 56 }}>✕</Fab>
                    </Box>
                </Paper>
            )}
        </>
    );
}
