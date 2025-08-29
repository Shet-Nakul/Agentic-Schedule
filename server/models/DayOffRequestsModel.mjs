export default (db) => ({
  createDayOffRequest: ({ employeeId, requestDate, requestTypeId }) => {
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
      "INSERT INTO DayOffRequests (EmployeeID, RequestDate, RequestTypeID) VALUES (?, ?, ?)"
    );
    return stmt.run(
      safe(employeeId),
      safe(requestDate),
      safe(requestTypeId)
    );
  },
  deleteDayOffRequest: (requestId) => {
    const stmt = db.prepare("DELETE FROM DayOffRequests WHERE RequestID = ?");
    return stmt.run(requestId);
  },
  getAllDayOffRequests: () => {
    return db.prepare("SELECT * FROM DayOffRequests").all();
  }
});
