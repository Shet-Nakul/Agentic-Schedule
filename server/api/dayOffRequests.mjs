export default (app, db) => {
  // Create a new DayOffRequest
  app.post('/dayoffrequests', (req, res) => {
    const { employeeId, requestDate, requestTypeId } = req.body;
    if (!employeeId || !requestDate || !requestTypeId) {
      return res.status(400).json({ error: "employeeId, requestDate, and requestTypeId are required" });
    }
    try {
      const stmt = db.prepare(
        "INSERT INTO DayOffRequests (EmployeeID, RequestDate, RequestTypeID) VALUES (?, ?, ?)"
      );
      const result = stmt.run(employeeId, requestDate, requestTypeId);
      res.json({ success: true, requestId: result.lastInsertRowid });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create day off request" });
    }
  });
};
