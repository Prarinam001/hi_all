import { useEffect, useRef, useState, useCallback } from 'react';

// Simple WebSocket hook with auto-reconnect and send helper
export default function useWebSocket(userId, onMessage) {
    const wsRef = useRef(null);
    const reconnectRef = useRef(0);
    const [readyState, setReadyState] = useState(null);
    const onMessageRef = useRef(onMessage);

    // Update the ref when onMessage changes, but don't trigger reconnect
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!userId) return;

        let mounted = true;

        const connect = () => {
            const socket = new WebSocket(`ws://localhost:8000/ws/${userId}`);
            wsRef.current = socket;

            socket.onopen = () => {
                reconnectRef.current = 0;
                setReadyState(socket.readyState);
                console.log('WS connected');
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessageRef.current && onMessageRef.current(data);
                } catch (err) {
                    console.error('Invalid WS message', err);
                }
            };

            socket.onclose = () => {
                setReadyState(WebSocket.CLOSED);
                if (!mounted) return;
                // exponential backoff
                const delay = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current++));
                console.log(`WS closed, reconnecting in ${delay}ms`);
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
    }, [userId]);

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
