export default (db) => ({
  createEmployeeSchedule: ({ scheduleId, date, employeeId, shift, working }) => {
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
    const stmt = db.prepare("INSERT INTO EmployeeSchedule (ScheduleID, Date, EmployeeID, Shift, Working) VALUES (?, ?, ?, ?, ?)");
    return stmt.run(
      safe(scheduleId),
      safe(date),
      safe(employeeId),
      safe(shift),
      safe(working)
    );
  },
  getAllEmployeeSchedules: () => {
    return db.prepare("SELECT * FROM EmployeeSchedule").all();
  },
  getEmployeeScheduleById: (scheduleId) => {
    return db.prepare("SELECT * FROM EmployeeSchedule WHERE ScheduleID = ?").get(scheduleId);
  },
  getEmployeeSchedulesByEmployeeId: (employeeId) => {
    return db.prepare("SELECT * FROM EmployeeSchedule WHERE EmployeeID = ?").all(employeeId);
  },
  getEmployeeSchedulesByDate: (date) => {
    return db.prepare("SELECT * FROM EmployeeSchedule WHERE Date = ?").all(date);
  },
  getEmployeeSchedulesByDateRange: (startDate, endDate) => {
    return db.prepare("SELECT * FROM EmployeeSchedule WHERE Date BETWEEN ? AND ?").all(startDate, endDate);
  },
  updateEmployeeSchedule: (scheduleId, { date, employeeId, shift, working }) => {
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
    const stmt = db.prepare("UPDATE EmployeeSchedule SET Date = ?, EmployeeID = ?, Shift = ?, Working = ? WHERE ScheduleID = ?");
    return stmt.run(
      safe(date),
      safe(employeeId),
      safe(shift),
      safe(working),
      scheduleId
    );
  },
  deleteEmployeeSchedule: (scheduleId) => {
    const stmt = db.prepare("DELETE FROM EmployeeSchedule WHERE ScheduleID = ?");
    return stmt.run(scheduleId);
  },
  deleteEmployeeSchedules: (scheduleIds) => {
    const stmt = db.prepare("DELETE FROM EmployeeSchedule WHERE ScheduleID = ?");
    let deleted = 0;
    for (const id of scheduleIds) {
      const result = stmt.run(id);
      deleted += result.changes;
    }
    return { changes: deleted };
  }
});
