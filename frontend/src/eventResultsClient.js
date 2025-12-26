/**
 * Vanilla JavaScript Client Example for Event Results Socket
 * 
 * This example shows how to connect to the event results socket
 * and join rooms based on eventType to receive real-time updates.
 * 
 * Usage in HTML:
 * <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
 * <script src="eventResultsClient.js"></script>
 */

class EventResultsClient {
  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.currentRoom = null;
    this.eventResults = [];
    this.listeners = {
      connected: [],
      disconnected: [],
      eventresults: [],
      error: [],
      joined: [],
      left: []
    };
  }

  /**
   * Connect to the event results socket once
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to the /eventresults namespace
        this.socket = io(`${this.serverUrl}/eventresults`, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('Connected to event results socket');
          this._emit('connected');
          resolve();
        });

        this.socket.on('joined', (data) => {
          console.log('Joined room:', data);
          this.currentRoom = data.room;
          this._emit('joined', data);
        });

        this.socket.on('eventresults', (data) => {
          console.log('Received event results:', data);
          this.eventResults = data.data || [];
          this._emit('eventresults', data);
        });

        this.socket.on('left', (data) => {
          console.log('Left room:', data);
          this.currentRoom = null;
          this.eventResults = [];
          this._emit('left', data);
        });

        this.socket.on('error', (errorData) => {
          console.error('Socket error:', errorData);
          this._emit('error', errorData);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from event results socket');
          this.currentRoom = null;
          this.eventResults = [];
          this._emit('disconnected');
        });

        this.socket.on('connect_error', (err) => {
          console.error('Connection error:', err);
          this._emit('error', { message: err.message });
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Join a room by eventType
   * After joining, you'll receive updates every 2 seconds
   * @param {string} eventType - The event type to subscribe to
   */
  joinRoom(eventType) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`Joining room for eventType: ${eventType}`);
    this.socket.emit('join', { eventType });
    return true;
  }

  /**
   * Leave the current room
   * @param {string} eventType - The event type to unsubscribe from
   */
  leaveRoom(eventType) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`Leaving room for eventType: ${eventType}`);
    this.socket.emit('leave', { eventType });
    return true;
  }

  /**
   * Disconnect from the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Register a listener for socket events
   * @param {string} event - Event name ('connected', 'disconnected', 'eventresults', 'error', 'joined', 'left')
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Remove a listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Get the current event results
   * @returns {Array<Object>}
   */
  getEventResults() {
    return this.eventResults;
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Get the current room name
   * @returns {string|null}
   */
  getCurrentRoom() {
    return this.currentRoom;
  }

  // Private method to emit listener callbacks
  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// ============================================
// EXAMPLE USAGE
// ============================================

// Initialize the client
const eventClient = new EventResultsClient('http://localhost:3001');

// Connect to the socket
eventClient.connect()
  .then(() => {
    console.log('Successfully connected to the server');

    // Join a room for SCHEDULE_UPDATE events
    eventClient.joinRoom('SCHEDULE_UPDATE');
  })
  .catch((err) => {
    console.error('Failed to connect:', err);
  });

// Listen for event results (emitted every 2 seconds)
eventClient.on('eventresults', (data) => {
  console.log('Event results received:', data);
  // Update your UI with the event results
  displayEventResults(data.data);
});

// Listen for errors
eventClient.on('error', (errorData) => {
  console.error('Error occurred:', errorData.message);
});

// Listen for room join confirmation
eventClient.on('joined', (data) => {
  console.log('Successfully joined:', data.room);
});

// Listen for connection status
eventClient.on('connected', () => {
  console.log('Socket connected!');
});

eventClient.on('disconnected', () => {
  console.log('Socket disconnected!');
});

// Function to display event results in the UI
function displayEventResults(results) {
  const container = document.getElementById('eventResultsContainer');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = '<p>No event results yet...</p>';
    return;
  }

  container.innerHTML = results.map((result, index) => `
    <div class="event-result" style="
      padding: 10px;
      margin: 10px 0;
      background-color: #fff;
      border-left: 4px solid #2196F3;
      border-radius: 4px;
    ">
      <strong>Event Type:</strong> ${result.EventType}<br/>
      <strong>Message:</strong> ${result.Message}<br/>
      <strong>Timestamp:</strong> ${result.Timestamp}<br/>
      ${result.EventData ? `
        <strong>Data:</strong><br/>
        <pre style="background-color: #f9f9f9; padding: 8px; overflow: auto;">
          ${typeof result.EventData === 'string' ? result.EventData : JSON.stringify(JSON.parse(result.EventData), null, 2)}
        </pre>
      ` : ''}
    </div>
  `).join('');
}

// Example: Switch to a different event type
function switchEventType(newEventType) {
  if (eventClient.isConnected()) {
    eventClient.joinRoom(newEventType);
  }
}

// Example: Disconnect when leaving the page
window.addEventListener('beforeunload', () => {
  eventClient.disconnect();
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventResultsClient;
}
