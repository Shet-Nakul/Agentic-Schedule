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
    const stmt = db.prepare("INSERT INTO Staff (Name, ContractID, SkillID) VALUES (?, ?, ?)");
    return stmt.run(
      safe(name),
      safe(contractId),
      safe(skillId)
    );
  },
  getAllStaff: () => {
    return db.prepare("SELECT * FROM Staff").all();
  },
  getStaffById: (id) => {
    return db.prepare("SELECT * FROM Staff WHERE StaffID = ?").get(id);
  }
});
