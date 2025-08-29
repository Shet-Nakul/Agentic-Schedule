import StaffModel from '../models/StaffModel.mjs';

export default (app, db) => {
  const staffModel = StaffModel(db);

  // Create one or multiple staff members
  app.post('/staff', (req, res) => {
    const staffList = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    let hasError = false;
    let errorResponse = null;

    for (const staff of staffList) {
      if (!staff.name || !staff.contractId) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: "Name and ContractID are required for each staff",
          payload: {}
        };
        break;
      }

      // Foreign key existence check
      const contractExists = db.prepare("SELECT 1 FROM ContractsDetails WHERE ContractID = ?").get(staff.contractId);
      let skillExists = true;
      if (staff.skillId !== undefined && staff.skillId !== null) {
        skillExists = db.prepare("SELECT 1 FROM Skills WHERE SkillID = ?").get(staff.skillId);
      }
      if (!contractExists) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: `Contract with ID ${staff.contractId} does not exist`,
          payload: {}
        };
        break;
      }
      if (staff.skillId !== undefined && staff.skillId !== null && !skillExists) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: `Skill with ID ${staff.skillId} does not exist`,
          payload: {}
        };
        break;
      }

      try {
        const result = staffModel.createStaff(staff);
        results.push(result.lastInsertRowid);
      } catch (err) {
        console.error(err);
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 500,
          success_message: "",
          error_message: "Failed to create staff",
          payload: {}
        };
        break;
      }
    }

    if (hasError) {
      return res.status(errorResponse.statusCode).json(errorResponse);
    }

    res.status(201).json({
      status: "success",
      statusCode: 201,
      success_message: "Staff created successfully",
      error_message: "",
      payload: { staffIds: results }
    });
  });

  // Delete staff by list of StaffID
  app.delete('/staff', (req, res) => {
    const { staffIds } = req.body;
    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "staffIds (array) is required",
        payload: {}
      });
    }
    try {
      const stmt = db.prepare("DELETE FROM Staff WHERE StaffID = ?");
      let deleted = 0;
      for (const id of staffIds) {
        const result = stmt.run(id);
        deleted += result.changes;
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Staff deleted successfully",
        error_message: "",
        payload: { deletedCount: deleted }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete staff",
        payload: {}
      });
    }
  });

  app.get('/staff', (req, res) => {
    try {
      const rows = staffModel.getAllStaff();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Staff fetched successfully",
        error_message: "",
        payload: { staff: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch staff",
        payload: {}
      });
    }
  });

  app.get('/staff/:id', (req, res) => {
    try {
      const row = staffModel.getStaffById(req.params.id);
      if (!row) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Staff not found",
          payload: {}
        });
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Staff fetched successfully",
        error_message: "",
        payload: { staff: row }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch staff by ID",
        payload: {}
      });
    }
  });
};