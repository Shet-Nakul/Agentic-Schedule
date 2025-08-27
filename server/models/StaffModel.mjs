export default (db) => ({
  createStaff: ({ name, contractId, skillId }) => {
    const stmt = db.prepare("INSERT INTO Staff (Name, ContractID, SkillID) VALUES (?, ?, ?)");
    return stmt.run(name, contractId, skillId || null);
  },
  getAllStaff: () => {
    return db.prepare("SELECT * FROM Staff").all();
  },
  getStaffById: (id) => {
    return db.prepare("SELECT * FROM Staff WHERE StaffID = ?").get(id);
  }
});
