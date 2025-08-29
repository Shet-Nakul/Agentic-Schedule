import DayOffRequestsModel from '../models/DayOffRequestsModel.mjs';

export default (app, db) => {
  const dayOffRequestsModel = DayOffRequestsModel(db);

  // Create one or multiple DayOffRequests
  app.post('/dayoffrequests', async (req, res) => {
    const requests = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    let hasError = false;
    let errorResponse = null;

    for (const reqObj of requests) {
      const { employeeId, requestDate, requestTypeId } = reqObj;
      if (
        employeeId === undefined || employeeId === null ||
        requestDate === undefined || requestDate === null ||
        requestTypeId === undefined || requestTypeId === null
      ) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: "employeeId, requestDate, and requestTypeId are required for each request",
          payload: {}
        };
        break;
      }

      // Foreign key existence check
      const staffExists = db.prepare("SELECT 1 FROM Staff WHERE StaffID = ?").get(employeeId);
      const reqTypeExists = db.prepare("SELECT 1 FROM RequestType WHERE RequestTypeID = ?").get(requestTypeId);
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

      try {
        const result = dayOffRequestsModel.createDayOffRequest({ employeeId, requestDate, requestTypeId });
        results.push(result.lastInsertRowid);
      } catch (err) {
        console.error(err);
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 500,
          success_message: "",
          error_message: "Failed to create day off request",
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
      success_message: "Day off requests created successfully",
      error_message: "",
      payload: { requestIds: results }
    });
  });

  // Delete day off requests by list of RequestID
  app.delete('/dayoffrequests', (req, res) => {
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
        const result = dayOffRequestsModel.deleteDayOffRequest(id);
        deleted += result.changes;
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Day off requests deleted successfully",
        error_message: "",
        payload: { deletedCount: deleted }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete day off requests",
        payload: {}
      });
    }
  });

  // Get all day off requests
  app.get('/dayoffrequests', (req, res) => {
    try {
      const rows = dayOffRequestsModel.getAllDayOffRequests();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Day off requests fetched successfully",
        error_message: "",
        payload: { dayOffRequests: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch day off requests",
        payload: {}
      });
    }
  });
};
