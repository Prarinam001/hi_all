import React from 'react';
import { Box, Button, Container, Typography, Stack, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { MessageSquare, Video, Search, Users, Smartphone, ArrowRight } from 'lucide-react';
import AppLogo from '../components/AppLogo';

const styles = {
    mainContainer: {
        minHeight: 'calc(100vh - 72px)', // Assuming header is around 72px
        display: 'flex',
        alignItems: 'center',
        background: 'radial-gradient(circle at 15% 50%, rgba(14, 170, 136, 0.1), transparent 25%), radial-gradient(circle at 85% 30%, rgba(12, 160, 42, 0.15), transparent 25%)',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 8, md: 0 }
    },
    // Floating background elements
    orb1: {
        position: 'absolute',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,170,136,0.15) 0%, rgba(0,0,0,0) 70%)',
        top: '-10%',
        left: '-10%',
        animation: 'drift 20s infinite alternate ease-in-out',
        zIndex: 0
    },
    orb2: {
        position: 'absolute',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(12,160,42,0.1) 0%, rgba(0,0,0,0) 70%)',
        bottom: '-20%',
        right: '-10%',
        animation: 'drift 25s infinite alternate-reverse ease-in-out',
        zIndex: 0
    },
    contentWrapper: {
        position: 'relative',
        zIndex: 1
    },
    heroBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: '50px',
        bgcolor: 'rgba(14, 170, 136, 0.1)',
        border: '1px solid rgba(14, 170, 136, 0.3)',
        color: 'primary.main',
        mb: 3,
        fontWeight: 600,
        fontSize: '0.875rem',
        animation: 'fadeInUp 0.8s ease-out'
    },
    title: {
        fontWeight: 800,
        mb: 2.5,
        fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
        lineHeight: 1.1,
        background: 'linear-gradient(90deg, #fff 0%, #e9edef 50%, #0eaa88 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'fadeInUp 1s ease-out 0.2s both'
    },
    description: {
        fontSize: { xs: '1.1rem', md: '1.25rem' },
        color: 'text.secondary',
        mb: 4,
        maxWidth: 540,
        lineHeight: 1.6,
        animation: 'fadeInUp 1s ease-out 0.4s both'
    },
    ctaButton: {
        px: 4,
        py: 1.5,
        borderRadius: '12px',
        fontSize: '1.1rem',
        textTransform: 'none',
        fontWeight: 'bold',
        animation: 'fadeInUp 1s ease-out 0.6s both',
        boxShadow: '0 8px 16px rgba(14, 170, 136, 0.25)',
        transition: 'all 0.3s',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 20px rgba(14, 170, 136, 0.4)',
        }
    },
    featuresGrid: {
        mt: 6,
        animation: 'fadeInUp 1s ease-out 0.8s both',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        mb: 3
    },
    featureIconBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 48,
        height: 48,
        borderRadius: '12px',
        bgcolor: 'rgba(14, 170, 136, 0.1)',
        color: 'primary.main',
        '& svg': {
            width: 24,
            height: 24
        }
    },
    // Right side Illustration
    illustrationContainer: {
        position: 'relative',
        width: '100%',
        height: { xs: 300, md: 500 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 1.5s ease-out'
    },
    glassCardMain: {
        position: 'absolute',
        // left: 0,
        // right: 0,
        // marginLeft: 'auto',
        // marginRight: 'auto',
        left: '50%',
        // marginLeft: '-100px',
        marginLeft: { xs: 'calc(10% + 10px)', md: '-100px' },
        width: 280,
        height: 332,
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 24px 40px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        animation: 'floatSlow 6s ease-in-out infinite'
    },
    glassCardSmall1: {
        position: 'absolute',
        width: 160,
        height: 100,
        borderRadius: '16px',
        background: 'rgba(14, 170, 136, 0.15)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(14, 170, 136, 0.3)',
        // right: { xs: 10, md: -20 },
        left: { xs: 'calc(50% + 140px)', md: 'calc(50% + 10px)' },
        top: { xs: 20, md: 60 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'primary.main',
        boxShadow: '0 16px 32px rgba(0, 0, 0, 0.2)',
        animation: 'floatFast 4s ease-in-out infinite',
        animationDelay: '1s'
    },
    glassCardSmall2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: 'rgba(12, 160, 42, 0.15)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(12, 160, 42, 0.3)',
        left: { xs: 0, md: -40 },
        bottom: { xs: 20, md: 80 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'secondary.main',
        boxShadow: '0 16px 32px rgba(0, 0, 0, 0.2)',
        animation: 'floatMedium 5s ease-in-out infinite',
        animationDelay: '0.5s'
    }
};

const FEATURES = [
    { icon: <MessageSquare />, title: "Instant Messaging", desc: "Real-time chat with typing indicators and read receipts." },
    { icon: <Video />, title: "Crystal Clear Calls", desc: "High-quality video and voice calls right in your browser." },
    { icon: <Users />, title: "Group Conversations", desc: "Create groups and stay connected with your community." }
];

export default function Home() {
    return (
        <Box sx={styles.mainContainer}>
            {/* Background Animations */}
            <Box sx={styles.orb1} />
            <Box sx={styles.orb2} />

            <Container maxWidth="lg" sx={styles.contentWrapper}>
                <Grid container spacing={4} alignItems="center">
                    {/* Left Column - Content */}
                    <Grid item xs={12} md={6}>
                        <Box sx={styles.heroBadge}>
                            ✨ The New Way to Connect
                        </Box>

                        <Typography variant="h1" sx={styles.title}>
                            Chat & Video Calling, Simplified.
                        </Typography>

                        <Typography sx={styles.description}>
                            Connect with friends and family like never before.
                            Share your day, make crystal-clear video calls, and stay close to the people you care about --all in one beautiful app.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, mb: 4, animation: 'fadeInUp 1s ease-out 0.6s both' }}>
                            <Button
                                variant="contained"
                                size="large"
                                component={RouterLink}
                                to="/signup"
                                sx={styles.ctaButton}
                                endIcon={<ArrowRight />}
                            >
                                Get Started for Free
                            </Button>
                        </Box>

                        <Box sx={styles.featuresGrid}>
                            {FEATURES.map((feature, idx) => (
                                <Box key={idx} sx={styles.featureItem} style={{ animationDelay: `${0.8 + idx * 0.1}s` }}>
                                    <Box sx={styles.featureIconBox}>
                                        {feature.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {feature.desc}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Grid>

                    {/* Right Column - Illustration */}
                    <Grid item xs={12} md={6}>
                        <Box sx={styles.illustrationContainer}>
                            <Box sx={styles.glassCardMain}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <AppLogo size={32} />
                                    {/* <Typography variant="h6" ml={1} fontWeight="bold">Hi! ALL</Typography> */}
                                </Box>
                                {/* Chat skeleton */}
                                <Stack spacing={2}>
                                    <Box sx={{ width: '80%', p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '12px 12px 12px 2px' }} />
                                    <Box sx={{ width: '60%', p: 1.5, bgcolor: 'primary.main', borderRadius: '12px 12px 2px 12px', alignSelf: 'flex-end' }} />
                                    <Box sx={{ width: '70%', p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '12px 12px 12px 2px' }} />
                                </Stack>
                            </Box>

                            <Box sx={styles.glassCardSmall1}>
                                <MessageSquare size={40} />
                            </Box>

                            <Box sx={styles.glassCardSmall2}>
                                <Video size={48} />
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Global Keyframes for this page */}
            <Box component="style">
                {`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes drift {
                        from { transform: translate(0, 0); }
                        to { transform: translate(50px, 30px); }
                    }
                    @keyframes floatSlow {
                        0% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-15px) rotate(1deg); }
                        100% { transform: translateY(0px) rotate(0deg); }
                    }
                    @keyframes floatMedium {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                        100% { transform: translateY(0px); }
                    }
                    @keyframes floatFast {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-12px); }
                        100% { transform: translateY(0px); }
                    }
                `}
            </Box>
        </Box>
    );
}
