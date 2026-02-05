import React, { useEffect } from 'react';
import { Box, Avatar, Typography, Fab, Paper } from '@mui/material';

export default function CallOverlays({ isInCall, callType, localVideoRef, remoteVideoRef, remoteAudioRef, endCall, incomingCall, acceptCall, rejectCall, selectedUser }) {
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
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'black', zIndex: 1300, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'stretch' }}>
                    {/* Video Container */}
                    <Box sx={{ position: 'relative', flex: 1, display: 'flex', gap: 0, minHeight: 0 }}>
                        <video 
                            ref={remoteVideoRef} 
                            autoPlay 
                            playsInline
                            muted={false}
                            style={{ 
                                flex: 1, 
                                backgroundColor: '#333', 
                                objectFit: 'cover', 
                                width: '100%', 
                                height: '100%',
                                display: 'block'
                            }} 
                        />
                        {/* Hidden audio element for reliable audio playback */}
                        <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            style={{ 
                                width: 200, 
                                height: 150, 
                                position: 'absolute', 
                                bottom: 80, 
                                right: 16, 
                                backgroundColor: '#111', 
                                borderRadius: 8, 
                                objectFit: 'cover', 
                                border: '2px solid white', 
                                zIndex: 10 
                            }} 
                        />
                    </Box>
                    {/* Button Container */}
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2, bgcolor: 'rgba(0,0,0,0.7)' }}>
                        <Fab variant="extended" color="error" onClick={endCall} size="large">End Call</Fab>
                    </Box>
                </Box>
            )}

            {isInCall && callType === 'audio' && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'background.default', zIndex: 1300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                    <Avatar sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: '3rem', mb: 2 }}>{selectedUser?.full_name?.[0]?.toUpperCase()}</Avatar>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>{selectedUser?.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Voice Call in Progress</Typography>
                    <Fab variant="extended" color="error" onClick={endCall}>End Call</Fab>
                </Box>
            )}

            {!isInCall && incomingCall && (
                <Paper sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, zIndex: 1300, border: 1, borderColor: 'primary.main', minWidth: 350, maxWidth: '90vw', boxShadow: 3 }}>
                    <Typography variant="body1" textAlign="center" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>Incoming {callType === 'audio' ? 'Voice' : 'Video'} Call</Typography>
                    <Typography variant="subtitle1" textAlign="center" sx={{ color: 'primary.main' }}>from {selectedUser?.full_name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                        <Fab size="small" color="success" onClick={acceptCall} sx={{ width: 56, height: 56 }}>✓</Fab>
                        <Fab size="small" color="error" onClick={rejectCall} sx={{ width: 56, height: 56 }}>✕</Fab>
                    </Box>
                </Paper>
            )}
        </>
    );
}
