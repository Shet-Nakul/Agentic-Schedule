export default (app, db) => {
  // Create a new ShiftOffRequest
  app.post('/shiftoffrequests', (req, res) => {
    const { employeeId, requestDate, requestTypeId, shift } = req.body;
    if (!employeeId || !requestDate || !requestTypeId || !shift) {
      return res.status(400).json({ error: "employeeId, requestDate, requestTypeId, and shift are required" });
    }
    try {
      const stmt = db.prepare(
        "INSERT INTO ShiftOffRequests (EmployeeID, RequestDate, RequestTypeID, Shift) VALUES (?, ?, ?, ?)"
      );
      const result = stmt.run(employeeId, requestDate, requestTypeId, shift);
      res.json({ success: true, requestId: result.lastInsertRowid });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create shift off request" });
    }
  });
};
