export default (db) => ({
  createShift: ({ shiftName, shiftCode, startTime, endTime }) => {
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
    const stmt = db.prepare("INSERT INTO Shifts (ShiftName, ShiftCode, StartTime, EndTime) VALUES (?, ?, ?, ?)");
    return stmt.run(
      safe(shiftName),
      safe(shiftCode),
      safe(startTime),
      safe(endTime)
    );
  },
  getAllShifts: () => {
    return db.prepare("SELECT * FROM Shifts").all();
  },
  getShiftById: (shiftId) => {
    return db.prepare("SELECT * FROM Shifts WHERE ShiftID = ?").get(shiftId);
  },
  getShiftByCode: (shiftCode) => {
    return db.prepare("SELECT * FROM Shifts WHERE ShiftCode = ?").get(shiftCode);
  },
  getShiftByName: (shiftName) => {
    return db.prepare("SELECT * FROM Shifts WHERE ShiftName = ?").get(shiftName);
  },
  updateShift: (shiftId, { shiftName, shiftCode, startTime, endTime }) => {
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
    const stmt = db.prepare("UPDATE Shifts SET ShiftName = ?, ShiftCode = ?, StartTime = ?, EndTime = ? WHERE ShiftID = ?");
    return stmt.run(
      safe(shiftName),
      safe(shiftCode),
      safe(startTime),
      safe(endTime),
      shiftId
    );
  },
  deleteShift: (shiftId) => {
    const stmt = db.prepare("DELETE FROM Shifts WHERE ShiftID = ?");
    return stmt.run(shiftId);
  },
  deleteShifts: (shiftIds) => {
    const stmt = db.prepare("DELETE FROM Shifts WHERE ShiftID = ?");
    let deleted = 0;
    for (const id of shiftIds) {
      const result = stmt.run(id);
      deleted += result.changes;
    }
    return { changes: deleted };
  }
});
