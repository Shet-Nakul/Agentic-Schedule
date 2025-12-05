export default (db) => ({
  /**
   * Get all EventResult rows that match the given EventType
   * @param {string} eventType
   * @returns {Array<Object>}
   */
  getEventResultsByType: (eventType) => {
    const safe = (v) => {
      if (v === undefined || v === null || typeof v === 'number' || typeof v === 'string' || typeof v === 'bigint') {
        return v ?? null;
      }
      if (typeof v === 'boolean') {
        return v ? 1 : 0;
      }
      return null;
    };
    const stmt = db.prepare("SELECT * FROM EventResult WHERE EventType = ? ORDER BY Timestamp DESC");
    return stmt.all(safe(eventType));
  },

  /**
   * Create a new EventResult row
   * @param {Object} param0
   * @param {string} param0.eventType
   * @param {string} param0.message
   * @param {string} param0.eventData
   * @returns {Object} result of stmt.run()
   */
  createEventResult: ({ eventType, message, eventData }) => {
    const safe = (v) => {
      if (v === undefined || v === null || typeof v === 'number' || typeof v === 'string' || typeof v === 'bigint') {
        return v ?? null;
      }
      if (typeof v === 'boolean') {
        return v ? 1 : 0;
      }
      return null;
    };
    const stmt = db.prepare("INSERT INTO EventResult (EventType, Message, EventData) VALUES (?, ?, ?)");
    return stmt.run(safe(eventType), safe(message), safe(eventData));
  },

  /**
   * Delete EventResult rows that match the given EventType
   * @param {string} eventType
   * @returns {Object} result of stmt.run() (contains .changes)
   */
  deleteEventResultsByType: (eventType) => {
    const safe = (v) => {
      if (v === undefined || v === null || typeof v === 'number' || typeof v === 'string' || typeof v === 'bigint') {
        return v ?? null;
      }
      if (typeof v === 'boolean') {
        return v ? 1 : 0;
      }
      return null;
    };
    const stmt = db.prepare("DELETE FROM EventResult WHERE EventType = ?");
    return stmt.run(safe(eventType));
  }
});

