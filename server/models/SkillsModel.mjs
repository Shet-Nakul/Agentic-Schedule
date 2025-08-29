export default (db) => ({
  createSkill: (skillName) => {
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
    const stmt = db.prepare("INSERT INTO Skills (SkillName) VALUES (?)");
    return stmt.run(safe(skillName));
  },
  getAllSkills: () => {
    return db.prepare("SELECT * FROM Skills").all();
  },
  getSkillById: (id) => {
    return db.prepare("SELECT * FROM Skills WHERE SkillID = ?").get(id);
  }
});
