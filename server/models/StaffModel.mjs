export default (db) => ({
  createStaff: ({ name, contractId, skillId }) => {
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
    const stmt = db.prepare("INSERT INTO Staff (Name, ContractID) VALUES (?, ?)");
    return stmt.run(
      safe(name),
      safe(contractId)
    );
  },
  getAllStaff: () => {
    return db.prepare("SELECT * FROM Staff").all();
  },
  getStaffById: (id) => {
    return db.prepare("SELECT * FROM Staff WHERE StaffID = ?").get(id);
  },
  updateStaff: (staffId, { name, contractId }) => {
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
    const stmt = db.prepare("UPDATE Staff SET Name = ?, ContractID = ? WHERE StaffID = ?");
    return stmt.run(
      safe(name),
      safe(contractId),
      staffId
    );
  },
  deleteStaff: (staffId) => {
    const stmt = db.prepare("DELETE FROM Staff WHERE StaffID = ?");
    return stmt.run(staffId);
  },
  deleteStaffList: (staffIds) => {
    const stmt = db.prepare("DELETE FROM Staff WHERE StaffID = ?");
    let deleted = 0;
    for (const id of staffIds) {
      const result = stmt.run(id);
      deleted += result.changes;
    }
    return { changes: deleted };
  },
  // Staff Skills operations
  assignSkills: (staffId, skillIds) => {
    const insertSkill = db.prepare("INSERT INTO StaffSkills (StaffID, SkillID) VALUES (?, ?)");
    let assigned = 0;
    for (const skillId of skillIds) {
      try {
        insertSkill.run(staffId, skillId);
        assigned++;
      } catch (err) {
        // Skip if already exists (PRIMARY KEY constraint)
        if (err.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
          throw err;
        }
      }
    }
    return { assigned };
  },
  removeAllSkills: (staffId) => {
    const stmt = db.prepare("DELETE FROM StaffSkills WHERE StaffID = ?");
    return stmt.run(staffId);
  },
  getStaffSkills: (staffId) => {
    return db.prepare(`
      SELECT ss.SkillID, s.SkillName
      FROM StaffSkills ss
      JOIN Skills s ON ss.SkillID = s.SkillID
      WHERE ss.StaffID = ?
    `).all(staffId);
  },
  // Staff Shifts operations
  assignShifts: (staffId, shiftCodes) => {
    const insertShift = db.prepare("INSERT INTO StaffShifts (StaffID, ShiftCode) VALUES (?, ?)");
    let assigned = 0;
    for (const shiftCode of shiftCodes) {
      try {
        insertShift.run(staffId, shiftCode);
        assigned++;
      } catch (err) {
        // Skip if already exists (PRIMARY KEY constraint)
        if (err.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
          throw err;
        }
      }
    }
    return { assigned };
  },
  removeAllShifts: (staffId) => {
    const stmt = db.prepare("DELETE FROM StaffShifts WHERE StaffID = ?");
    return stmt.run(staffId);
  },
  getStaffShifts: (staffId) => {
    return db.prepare("SELECT ShiftCode FROM StaffShifts WHERE StaffID = ?").all(staffId);
  },
  // Combined operations
  createStaffWithSkillsAndShifts: ({ name, contractId, skills = [], shifts = [] }) => {
    // Create staff
    const staffResult = this.createStaff({ name, contractId });
    const staffId = staffResult.lastInsertRowid;
    
    // Assign skills if provided
    if (skills.length > 0) {
      this.assignSkills(staffId, skills);
    }
    
    // Assign shifts if provided
    if (shifts.length > 0) {
      this.assignShifts(staffId, shifts);
    }
    
    return { lastInsertRowid: staffId };
  },
  updateStaffWithSkillsAndShifts: (staffId, { name, contractId, skills, shifts }) => {
    // Update basic staff info
    if (name !== undefined || contractId !== undefined) {
      this.updateStaff(staffId, { name, contractId });
    }
    
    // Update skills if provided
    if (Array.isArray(skills)) {
      this.removeAllSkills(staffId);
      if (skills.length > 0) {
        this.assignSkills(staffId, skills);
      }
    }
    
    // Update shifts if provided
    if (Array.isArray(shifts)) {
      this.removeAllShifts(staffId);
      if (shifts.length > 0) {
        this.assignShifts(staffId, shifts);
      }
    }
    
    return { changes: 1 };
  },
  getStaffWithSkillsAndShifts: (staffId) => {
    const staff = this.getStaffById(staffId);
    if (!staff) return null;
    
    const skills = this.getStaffSkills(staffId);
    const shifts = this.getStaffShifts(staffId);
    
    return {
      ...staff,
      skills: skills.map(s => ({ id: s.SkillID, name: s.SkillName })),
      shifts: shifts.map(s => s.ShiftCode)
    };
  }
});
