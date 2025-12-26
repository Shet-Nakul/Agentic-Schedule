import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

/**
 * Hook to connect to the event results socket and join rooms by eventType
 * @param {string} serverUrl - The server URL (e.g., 'http://localhost:3001')
 * @param {string} eventType - The event type to subscribe to (e.g., 'SCHEDULE_UPDATE')
 * @returns {Object} { eventResults, isConnected, error, joinRoom, leaveRoom }
 */
export const useEventResults = (serverUrl, eventType) => {
  const [eventResults, setEventResults] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!serverUrl || !eventType) return;

    // Connect to the /eventresults namespace
    const socket = io(`${serverUrl}/eventresults`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to event results socket');
      setIsConnected(true);
      setError(null);

      // Join the room for this eventType
      socket.emit('join', { eventType });
    });

    socket.on('joined', (data) => {
      console.log('Joined room:', data);
    });

    socket.on('eventresults', (data) => {
      console.log('Received event results:', data);
      setEventResults(data.data || []);
    });

    socket.on('error', (errorData) => {
      console.error('Socket error:', errorData);
      setError(errorData.message);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from event results socket');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(err.message);
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverUrl, eventType]);

  const joinRoom = (newEventType) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join', { eventType: newEventType });
    }
  };

  const leaveRoom = (roomEventType) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave', { eventType: roomEventType });
    }
  };

  return {
    eventResults,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    socket: socketRef.current,
  };
};

export default useEventResults;
