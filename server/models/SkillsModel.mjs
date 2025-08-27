export default (db) => ({
  createSkill: (skillName) => {
    const stmt = db.prepare("INSERT INTO Skills (SkillName) VALUES (?)");
    return stmt.run(skillName);
  },
  getAllSkills: () => {
    return db.prepare("SELECT * FROM Skills").all();
  }
});
