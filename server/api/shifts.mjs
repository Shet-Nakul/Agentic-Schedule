import { Router } from 'express';
import ShiftsModel from '../models/ShiftsModel.mjs';

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const shiftsModel = ShiftsModel(db);

  // Create one or multiple shifts
  router.post('/shifts', (req, res) => {
    const shifts = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    let hasError = false;
    let errorResponse = null;

    for (const shift of shifts) {
      if (!shift.shiftName || !shift.shiftCode) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: "ShiftName and ShiftCode are required for each shift",
          payload: {}
        };
        break;
      }

      // Check if shift code already exists
      const existingShift = shiftsModel.getShiftByCode(shift.shiftCode);
      if (existingShift) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 409,
          success_message: "",
          error_message: `Shift with code '${shift.shiftCode}' already exists`,
          payload: {}
        };
        break;
      }

      try {
        const result = shiftsModel.createShift({
          shiftName: shift.shiftName,
          shiftCode: shift.shiftCode,
          startTime: shift.startTime || null,
          endTime: shift.endTime || null
        });
        
        results.push(result.lastInsertRowid);
      } catch (err) {
        console.error(err);
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 500,
          success_message: "",
          error_message: "Failed to create shift",
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
      success_message: "Shifts created successfully",
      error_message: "",
      payload: { shiftIds: results }
    });
  });

  // Get all shifts
  router.get('/shifts', (req, res) => {
    try {
      const rows = shiftsModel.getAllShifts();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shifts fetched successfully",
        error_message: "",
        payload: { shifts: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch shifts",
        payload: {}
      });
    }
  });

  // Get shift by ID
  router.get('/shifts/:id', (req, res) => {
    try {
      const row = shiftsModel.getShiftById(req.params.id);
      if (!row) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Shift not found",
          payload: {}
        });
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shift fetched successfully",
        error_message: "",
        payload: { shift: row }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch shift by ID",
        payload: {}
      });
    }
  });

  // Get shift by code
  router.get('/shifts/code/:code', (req, res) => {
    try {
      const row = shiftsModel.getShiftByCode(req.params.code);
      if (!row) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Shift not found",
          payload: {}
        });
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shift fetched successfully",
        error_message: "",
        payload: { shift: row }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch shift by code",
        payload: {}
      });
    }
  });

  // Get shift by name
  router.get('/shifts/name/:name', (req, res) => {
    try {
      const row = shiftsModel.getShiftByName(req.params.name);
      if (!row) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Shift not found",
          payload: {}
        });
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shift fetched successfully",
        error_message: "",
        payload: { shift: row }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch shift by name",
        payload: {}
      });
    }
  });

  // Update shift by ID
  router.put('/shifts/:id', (req, res) => {
    const { shiftName, shiftCode, startTime, endTime } = req.body;

    if (!shiftName && !shiftCode && !startTime && !endTime) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "At least one field (shiftName, shiftCode, startTime, endTime) is required for update",
        payload: {}
      });
    }

    try {
      // Check if shift exists
      const existingShift = shiftsModel.getShiftById(req.params.id);
      if (!existingShift) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Shift not found",
          payload: {}
        });
      }

      // Check if new shift code conflicts with existing ones (if shiftCode is being updated)
      if (shiftCode && shiftCode !== existingShift.ShiftCode) {
        const conflictingShift = shiftsModel.getShiftByCode(shiftCode);
        if (conflictingShift) {
          return res.status(409).json({
            status: "error",
            statusCode: 409,
            success_message: "",
            error_message: `Shift with code '${shiftCode}' already exists`,
            payload: {}
          });
        }
      }

      const result = shiftsModel.updateShift(req.params.id, {
        shiftName: shiftName || existingShift.ShiftName,
        shiftCode: shiftCode || existingShift.ShiftCode,
        startTime: startTime !== undefined ? startTime : existingShift.StartTime,
        endTime: endTime !== undefined ? endTime : existingShift.EndTime
      });

      if (result.changes === 0) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Shift not found or no changes made",
          payload: {}
        });
      }

      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shift updated successfully",
        error_message: "",
        payload: { shiftId: req.params.id }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to update shift",
        payload: {}
      });
    }
  });

  // Delete shifts by list of ShiftID
  router.delete('/shifts', (req, res) => {
    const { shiftIds } = req.body;
    if (!Array.isArray(shiftIds) || shiftIds.length === 0) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "shiftIds (array) is required",
        payload: {}
      });
    }
    try {
      const result = shiftsModel.deleteShifts(shiftIds);
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shifts deleted successfully",
        error_message: "",
        payload: { deletedCount: result.changes }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete shifts",
        payload: {}
      });
    }
  });

  // Delete single shift by ID
  router.delete('/shifts/:id', (req, res) => {
    try {
      const result = shiftsModel.deleteShift(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Shift not found",
          payload: {}
        });
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shift deleted successfully",
        error_message: "",
        payload: { shiftId: req.params.id }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete shift",
        payload: {}
      });
    }
  });

  app.use(router);
};
