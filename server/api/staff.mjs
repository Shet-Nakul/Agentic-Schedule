import { Router } from 'express';
import StaffModel from '../models/StaffModel.mjs';

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const staffModel = StaffModel(db);

  /**
   * CREATE Staff (single or multiple) and assign shifts
   * Body example:
   * [
   *   {
   *     "name": "John Doe",
   *     "contractId": 1,
   *     "skills": [1, 2],
   *     "shifts": ["D", "L"]
   *   }
   * ]
   */
  router.post('/staff', (req, res) => {
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

      // Validate Contract using model
      const contractExists = db.prepare("SELECT 1 FROM ContractsDetails WHERE ContractID = ?").get(staff.contractId);
      if (!contractExists) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: `ContractID ${staff.contractId} does not exist`,
          payload: {}
        };
        break;
      }

      // Validate skills if provided
      if (Array.isArray(staff.skills)) {
        for (const skillId of staff.skills) {
          const skillExists = db.prepare("SELECT 1 FROM Skills WHERE SkillID = ?").get(skillId);
          if (!skillExists) {
            hasError = true;
            errorResponse = {
              status: "error",
              statusCode: 400,
              success_message: "",
              error_message: `SkillID ${skillId} does not exist`,
              payload: {}
            };
            break;
          }
        }
        if (hasError) break;
      }

      // Validate shifts if provided
      if (Array.isArray(staff.shifts)) {
        for (const shiftCode of staff.shifts) {
          const shiftExists = db.prepare("SELECT 1 FROM Shifts WHERE ShiftCode = ?").get(shiftCode);
          if (!shiftExists) {
            hasError = true;
            errorResponse = {
              status: "error",
              statusCode: 400,
              success_message: "",
              error_message: `ShiftCode '${shiftCode}' does not exist`,
              payload: {}
            };
            break;
          }
        }
        if (hasError) break;
      }

      try {
        // Use model to create staff with skills and shifts
        const result = staffModel.createStaffWithSkillsAndShifts({
          name: staff.name,
          contractId: staff.contractId,
          skills: staff.skills || [],
          shifts: staff.shifts || []
        });
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

  /**
   * UPDATE Staff by ID (name, contract, skills, shifts)
   * Body example:
   * {
   *   "name": "Jane Doe",
   *   "contractId": 2,
   *   "skills": [1, 3],
   *   "shifts": ["N", "DH"]
   * }
   */
  router.put('/staff/:id', (req, res) => {
    const staffId = req.params.id;
    const { name, contractId, skills, shifts } = req.body;

    try {
      const existing = staffModel.getStaffById(staffId);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Staff not found",
          payload: {}
        });
      }

      // Validate contract if provided
      if (contractId) {
        const contractExists = db.prepare("SELECT 1 FROM ContractsDetails WHERE ContractID = ?").get(contractId);
        if (!contractExists) {
          return res.status(400).json({
            status: "error",
            statusCode: 400,
            success_message: "",
            error_message: `ContractID ${contractId} does not exist`,
            payload: {}
          });
        }
      }

      // Validate skills if provided
      if (Array.isArray(skills)) {
        for (const skillId of skills) {
          const skillExists = db.prepare("SELECT 1 FROM Skills WHERE SkillID = ?").get(skillId);
          if (!skillExists) {
            return res.status(400).json({
              status: "error",
              statusCode: 400,
              success_message: "",
              error_message: `SkillID ${skillId} does not exist`,
              payload: {}
            });
          }
        }
      }

      // Validate shifts if provided
      if (Array.isArray(shifts)) {
        for (const shiftCode of shifts) {
          const shiftExists = db.prepare("SELECT 1 FROM Shifts WHERE ShiftCode = ?").get(shiftCode);
          if (!shiftExists) {
            return res.status(400).json({
              status: "error",
              statusCode: 400,
              success_message: "",
              error_message: `ShiftCode '${shiftCode}' does not exist`,
              payload: {}
            });
          }
        }
      }

      // Use model to update staff with skills and shifts
      staffModel.updateStaffWithSkillsAndShifts(staffId, { name, contractId, skills, shifts });

      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Staff updated successfully",
        error_message: "",
        payload: {}
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to update staff",
        payload: {}
      });
    }
  });

  /**
   * DELETE staff by list of IDs
   */
  router.delete('/staff', (req, res) => {
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
      // Use model to delete staff list
      const result = staffModel.deleteStaffList(staffIds);

      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Staff deleted successfully",
        error_message: "",
        payload: { deletedCount: result.changes }
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

  /**
   * GET all staff
   */
  router.get('/staff', (req, res) => {
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

  /**
   * GET staff by ID with skills and shifts
   */
  router.get('/staff/:id', (req, res) => {
    try {
      // Use model to get staff with skills and shifts
      const staff = staffModel.getStaffWithSkillsAndShifts(req.params.id);
      if (!staff) {
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
        payload: { staff: staff }
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

  app.use(router);
};
