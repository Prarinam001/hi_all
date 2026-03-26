import { useEffect, useRef, useState } from 'react';

// Simple WebSocket hook with auto-reconnect and send helper
// now accepts `enabled` (boolean) to control whether to actually connect
export default function useWebSocket(userId, onMessage, enabled = true) {
    const wsRef = useRef(null);
    const reconnectRef = useRef(0);
    const [readyState, setReadyState] = useState(null);
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!userId || !enabled) return; // only connect when enabled

        let mounted = true;

        const connect = () => {
            const wsBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL.replace(/^http/, 'ws');
            const socket = new WebSocket(`${wsBaseUrl}/api/chat/ws/${userId}`);
            wsRef.current = socket;

            socket.onopen = () => {
                reconnectRef.current = 0;
                setReadyState(socket.readyState);
                //console.log('WS connected', userId);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessageRef.current && onMessageRef.current(data);
                } catch (err) {
                    console.error('Invalid WS message', err);
                }
            };

            socket.onclose = (event) => {
                //console.log('WS closed', { code: event.code, reason: event.reason, wasClean: event.wasClean, userId });
                setReadyState(WebSocket.CLOSED);
                if (!mounted) return;
                if (!userId || !enabled) return; // don't reconnect if disabled or no userId
                const delay = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current++));
                //console.log(`WS closed, reconnecting in ${delay}ms`);
                setTimeout(connect, delay);
            };

            socket.onerror = (err) => {
                console.error('WS error', err);
            };
        };

        connect();

        return () => {
            mounted = false;
            if (wsRef.current) {
                try { wsRef.current.close(); } catch (e) {}
            }
        };
    }, [userId, enabled]);

    const send = (payload) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn('WS not open, cannot send');
            return false;
        }
        ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
        return true;
    };

    return { ws: wsRef.current, send, readyState };
}