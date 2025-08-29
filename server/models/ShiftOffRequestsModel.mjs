export default (db) => ({
  createShiftOffRequest: ({ employeeId, requestDate, requestTypeId, shift }) => {
    const safe = (v) => {
      if (
        v === undefined ||
        v === null ||
        typeof v === 'number' ||
        typeof v === 'string' ||
        typeof v === 'bigint'
      ) {
        return v ?? null;
      }
      if (typeof v === 'boolean') {
        return v ? 1 : 0;
      }
      return null;
    };
    const stmt = db.prepare(
      "INSERT INTO ShiftOffRequests (EmployeeID, RequestDate, RequestTypeID, Shift) VALUES (?, ?, ?, ?)"
    );
    return stmt.run(
      safe(employeeId),
      safe(requestDate),
      safe(requestTypeId),
      safe(shift)
    );
  },
  deleteShiftOffRequest: (requestId) => {
    const stmt = db.prepare("DELETE FROM ShiftOffRequests WHERE RequestID = ?");
    return stmt.run(requestId);
  },
  getAllShiftOffRequests: () => {
    return db.prepare("SELECT * FROM ShiftOffRequests").all();
  }
});
