import SkillsModel from '../models/SkillsModel.mjs';

export default (app, db) => {
  const skillsModel = SkillsModel(db);

  // Create a new skill
  app.post('/skills', (req, res) => {
    const { skillName } = req.body;
    if (!skillName) {
      return res.status(400).json({ error: "SkillName is required" });
    }
    try {
      const result = skillsModel.createSkill(skillName);
      res.json({ success: true, skillId: result.lastInsertRowid });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: "Skill already exists" });
      }
      console.error(err);
      res.status(500).json({ error: "Failed to create skill" });
    }
  });

  // Get all skills
  app.get('/skills', (req, res) => {
    try {
      const rows = skillsModel.getAllSkills();
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });
};