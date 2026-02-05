import { useRef, useEffect } from 'react';

export default function usePeerConnection({ onIceCandidate, onTrack } = {}) {
    const pcRef = useRef(null);
    const onTrackRef = useRef(onTrack);
    const onIceCandidateRef = useRef(onIceCandidate);

    // Update refs when callbacks change
    useEffect(() => {
        onTrackRef.current = onTrack;
    }, [onTrack]);

    useEffect(() => {
        onIceCandidateRef.current = onIceCandidate;
    }, [onIceCandidate]);

    const create = (iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]) => {
        // Only create if it doesn't already exist
        if (pcRef.current) {
            console.log('Peer connection already exists, returning existing');
            return pcRef.current;
        }

        console.log('Creating new peer connection');
        const pc = new RTCPeerConnection({ iceServers });

        pc.onicecandidate = (event) => {
            if (event.candidate && onIceCandidateRef.current) {
                onIceCandidateRef.current(event.candidate);
            }
        };

        pc.ontrack = (event) => {
            console.log('ontrack event', event, 'track:', event.track, 'streams:', event.streams);
            if (onTrackRef.current) {
                // Use the stream directly, or create from tracks if needed
                const stream = event.streams?.[0] || new MediaStream([event.track]);
                console.log('Passing stream to callback:', stream, 'tracks:', stream?.getTracks?.());
                onTrackRef.current(stream);
            }
        };

        pcRef.current = pc;
        return pc;
    };

    const addLocalStream = (stream) => {
        if (!pcRef.current) create();
        const audioTracks = stream.getAudioTracks();
        const videoTracks = stream.getVideoTracks();
        console.log('Adding local stream - audio tracks:', audioTracks.length, 'video tracks:', videoTracks.length);
        stream.getTracks().forEach(track => {
            console.log('Adding track:', track.kind, track.id);
            pcRef.current.addTrack(track, stream);
        });
    };

    const setRemoteDescription = async (desc) => {
        if (!pcRef.current) create();
        await pcRef.current.setRemoteDescription(desc);
    };

    const createOffer = async () => {
        if (!pcRef.current) create();
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        return offer;
    };

    const createAnswer = async () => {
        if (!pcRef.current) create();
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        return answer;
    };

    const addIceCandidate = async (candidate) => {
        if (pcRef.current) {
            try {
                await pcRef.current.addIceCandidate(candidate);
            } catch (err) {
                console.error('Failed addIceCandidate', err);
            }
        }
    };

    const close = () => {
        if (pcRef.current) {
            try { pcRef.current.close(); } catch (e) {}
            pcRef.current = null;
        }
    };

    return {
        pcRef,
        create,
        addLocalStream,
        setRemoteDescription,
        createOffer,
        createAnswer,
        addIceCandidate,
        close
    };
}
