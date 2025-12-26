import React, { useState } from 'react';
import useEventResults from '../hooks/useEventResults';

/**
 * Example component demonstrating how to use the Event Results socket connection
 * 
 * Features:
 * - Connect once to the socket server
 * - Join rooms by eventType
 * - Receive event results every 2 seconds
 * - Switch between different event types
 * - Leave rooms
 */
const EventResultsViewer = ({ serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001' }) => {
  const [selectedEventType, setSelectedEventType] = useState('staff_roster');
  const [eventTypeInput, setEventTypeInput] = useState('');

  // Initialize socket connection with the selected event type
  const { eventResults, isConnected, error, joinRoom, leaveRoom } = useEventResults(
    serverUrl,
    selectedEventType
  );

  const handleChangeEventType = (newEventType) => {
    if (newEventType.trim()) {
      setSelectedEventType(newEventType.trim());
      setEventTypeInput('');
    }
  };

  const handleJoinAdditionalRoom = () => {
    if (eventTypeInput.trim()) {
      joinRoom(eventTypeInput.trim());
      setEventTypeInput('');
    }
  };

  const handleLeaveRoom = (eventType) => {
    leaveRoom(eventType);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Event Results Live Monitor</h1>

      {/* Connection Status */}
      <div style={{
        padding: '10px',
        marginBottom: '20px',
        backgroundColor: isConnected ? '#90EE90' : '#FFB6C6',
        borderRadius: '5px',
        fontWeight: 'bold'
      }}>
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#FFD700',
          borderRadius: '5px',
          color: '#333'
        }}>
          ⚠️ Error: {error}
        </div>
      )}

      {/* Event Type Selector */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#F0F0F0', borderRadius: '5px' }}>
        <h2>Current Event Type</h2>
        <p>Currently subscribed to: <strong>{selectedEventType}</strong></p>

        <div>
          <input
            type="text"
            placeholder="Enter event type (e.g., LICENSE_CHECK, SHIFT_SWAP)"
            value={eventTypeInput}
            onChange={(e) => setEventTypeInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinAdditionalRoom()}
            style={{
              padding: '8px',
              marginRight: '10px',
              width: '300px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          <button
            onClick={handleJoinAdditionalRoom}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Switch Event Type
          </button>
        </div>
      </div>

      {/* Event Results Display */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#F5F5F5', borderRadius: '5px' }}>
        <h2>Event Results ({eventResults.length})</h2>
        {eventResults.length === 0 ? (
          <p>No event results yet. Waiting for events...</p>
        ) : (
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px'
          }}>
            {eventResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#fff',
                  borderLeft: '4px solid #2196F3',
                  borderRadius: '4px'
                }}
              >
                <strong>Event Type:</strong> {result.EventType}
                <br />
                <strong>Message:</strong> {result.Message}
                <br />
                <strong>Timestamp:</strong> {result.Timestamp}
                <br />
                {result.EventData && (
                  <>
                    <strong>Data:</strong> <pre style={{ margin: '5px 0', backgroundColor: '#f9f9f9', padding: '8px' }}>
                      {typeof result.EventData === 'string'
                        ? result.EventData
                        : JSON.stringify(result.EventData, null, 2)
                      }
                    </pre>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Information */}
      <div style={{ padding: '15px', backgroundColor: '#E8F4F8', borderRadius: '5px' }}>
        <h3>How it Works</h3>
        <ul>
          <li>Connects once to the socket server at <code>{serverUrl}/eventresults</code></li>
          <li>Joins a room based on eventType (e.g., <code>eventType:SCHEDULE_UPDATE</code>)</li>
          <li>Receives event results every 2 seconds automatically</li>
          <li>Change the event type to switch rooms and receive different events</li>
        </ul>

        <h3>Socket Events Reference</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`// Client emits:
socket.emit('join', { eventType: 'SCHEDULE_UPDATE' });
socket.emit('leave', { eventType: 'SCHEDULE_UPDATE' });

// Server emits:
socket.on('joined', (data) => { /* Room joined */ });
socket.on('eventresults', (data) => { 
  /* { eventType: string, data: Array, timestamp: string } */
});
socket.on('error', (errorData) => { /* Error occurred */ });
socket.on('left', (data) => { /* Room left */ });`}
        </pre>
      </div>
    </div>
  );
};

export default EventResultsViewer;
