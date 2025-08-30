import { Router } from 'express';
import SkillsModel from '../models/SkillsModel.mjs';

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const skillsModel = SkillsModel(db);

  // Create one or multiple skills
  router.post('/skills', (req, res) => {
    const skillsList = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    let hasError = false;
    let errorResponse = null;

    for (const skill of skillsList) {
      if (!skill.skillName) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: "SkillName is required for each skill",
          payload: {}
        };
        break;
      }
      try {
        const result = skillsModel.createSkill(skill.skillName);
        results.push(result.lastInsertRowid);
      } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          hasError = true;
          errorResponse = {
            status: "error",
            statusCode: 409,
            success_message: "",
            error_message: "Skill already exists",
            payload: {}
          };
        } else {
          console.error(err);
          hasError = true;
          errorResponse = {
            status: "error",
            statusCode: 500,
            success_message: "",
            error_message: "Failed to create skill",
            payload: {}
          };
        }
        break;
      }
    }

    if (hasError) {
      return res.status(errorResponse.statusCode).json(errorResponse);
    }

    res.status(201).json({
      status: "success",
      statusCode: 201,
      success_message: "Skills created successfully",
      error_message: "",
      payload: { skillIds: results }
    });
  });

  // Delete skills by list of SkillID
  router.delete('/skills', (req, res) => {
    const { skillIds } = req.body;
    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "skillIds (array) is required",
        payload: {}
      });
    }
    try {
      const stmt = db.prepare("DELETE FROM Skills WHERE SkillID = ?");
      let deleted = 0;
      for (const id of skillIds) {
        const result = stmt.run(id);
        deleted += result.changes;
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Skills deleted successfully",
        error_message: "",
        payload: { deletedCount: deleted }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete skills",
        payload: {}
      });
    }
  });

  // Get all skills
  router.get('/skills', (req, res) => {
    try {
      const rows = skillsModel.getAllSkills();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Skills fetched successfully",
        error_message: "",
        payload: { skills: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch skills",
        payload: {}
      });
    }
  });

  // Get skill by ID
  router.get('/skills/:id', (req, res) => {
    try {
      const row = skillsModel.getSkillById(req.params.id);
      if (!row) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Skill not found",
          payload: {}
        });
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Skill fetched successfully",
        error_message: "",
        payload: { skill: row }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch skill by ID",
        payload: {}
      });
    }
  });

  app.use(router);
};