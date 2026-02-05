import React from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AppLogo from '../components/AppLogo';

export default function Home() {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
            <Container maxWidth="md">
                <Paper elevation={8} sx={{ p: { xs: 3, md: 6 }, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4 }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                <AppLogo size={64} />
                            </Box>

                            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                Hi! ALL — Video Calling & Chat
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Connect with friends and family like never before! Chat instantly, make crystal-clear video 
                                calls, and not saving your chat history. Say hello, share your day, and stay close to the people you care about—
                                all in one beautiful app.
                            </Typography>

                            <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>What you can do</Typography>
                                <ul>
                                    <li>Send instant messages and see when others are typing</li>
                                    <li>Make high-quality video and voice calls right in your browser</li>
                                    <li>Quickly find friends and start conversations</li>
                                    <li>Invite people by email if they're not on the app yet</li>
                                    <li>Works smoothly on both mobile phones and desktop</li>
                                </ul>
                            </Box>
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: 360 }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Box sx={{ position: 'relative', width: 300, height: 300 }}>
                                {/* Floating chat bubble */}
                                <Box sx={{ position: 'absolute', left: 0, top: 20, width: 140, height: 120, bgcolor: 'primary.main', borderRadius: 3, boxShadow: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transform: 'rotate(-6deg)', animation: 'float 4s ease-in-out infinite' }}>
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </Box>

                                {/* Floating video camera */}
                                <Box sx={{ position: 'absolute', right: 0, bottom: 30, width: 140, height: 120, bgcolor: 'secondary.main', borderRadius: 3, boxShadow: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transform: 'rotate(6deg)', animation: 'float 5s ease-in-out infinite', animationDelay: '200ms' }}>
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23 7l-7 5v-4L23 7zM1 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </Box>

                                <Box component="style">{`@keyframes float { 0% { transform: translateY(0) } 50% { transform: translateY(-12px) } 100% { transform: translateY(0) } }`}</Box>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
