import { Router } from 'express';
import ShiftOffRequestsModel from '../models/ShiftOffRequestsModel.mjs';

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const shiftOffRequestsModel = ShiftOffRequestsModel(db);

  // Create one or multiple ShiftOffRequests
  router.post('/shiftoffrequests', (req, res) => {
    const requests = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    let hasError = false;
    let errorResponse = null;

    for (const reqObj of requests) {
      const { employeeId, requestDate, requestTypeId, shift } = reqObj;
      if (
        employeeId === undefined || employeeId === null ||
        requestDate === undefined || requestDate === null ||
        requestTypeId === undefined || requestTypeId === null ||
        shift === undefined || shift === null
      ) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: "employeeId, requestDate, requestTypeId, and shift are required for each request",
          payload: {}
        };
        break;
      }
      // Foreign key existence checks
      const staffExists = db.prepare("SELECT 1 FROM Staff WHERE StaffID = ?").get(employeeId);
      if (!staffExists) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: `Staff with ID ${employeeId} does not exist`,
          payload: {}
        };
        break;
      }
      const reqTypeExists = db.prepare("SELECT 1 FROM RequestType WHERE RequestTypeID = ?").get(requestTypeId);
      if (!reqTypeExists) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: `RequestType with ID ${requestTypeId} does not exist`,
          payload: {}
        };
        break;
      }
      const shiftExists = db.prepare("SELECT 1 FROM Shifts WHERE ShiftCode = ?").get(shift);
      if (!shiftExists) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: `ShiftCode '${shift}' does not exist`,
          payload: {}
        };
        break;
      }
      try {
        const result = shiftOffRequestsModel.createShiftOffRequest({ employeeId, requestDate, requestTypeId, shift });
        results.push(result.lastInsertRowid);
      } catch (err) {
        console.error(err);
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 500,
          success_message: "",
          error_message: "Failed to create shift off request",
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
      success_message: "Shift off requests created successfully",
      error_message: "",
      payload: { requestIds: results }
    });
  });

  // Delete shift off requests by list of RequestID
  router.delete('/shiftoffrequests', (req, res) => {
    const { requestIds } = req.body;
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "requestIds (array) is required",
        payload: {}
      });
    }
    try {
      let deleted = 0;
      for (const id of requestIds) {
        const result = shiftOffRequestsModel.deleteShiftOffRequest(id);
        deleted += result.changes;
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shift off requests deleted successfully",
        error_message: "",
        payload: { deletedCount: deleted }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete shift off requests",
        payload: {}
      });
    }
  });

  // Get all shift off requests
  router.get('/shiftoffrequests', (req, res) => {
    try {
      const rows = shiftOffRequestsModel.getAllShiftOffRequests();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Shift off requests fetched successfully",
        error_message: "",
        payload: { shiftOffRequests: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch shift off requests",
        payload: {}
      });
    }
  });

  app.use(router);
};
