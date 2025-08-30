import { Router } from 'express';
import RequestTypeModel from '../models/RequestTypeModel.mjs';

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const requestTypeModel = RequestTypeModel(db);

  // Create one or multiple request types
  router.post('/requesttype', (req, res) => {
    const types = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    let hasError = false;
    let errorResponse = null;

    for (const type of types) {
      if (!type.RequestTypeName) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: "RequestTypeName is required for each request type",
          payload: {}
        };
        break;
      }
      try {
        const result = requestTypeModel.createRequestType(type);
        results.push(result.lastInsertRowid);
      } catch (err) {
        console.error(err);
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 500,
          success_message: "",
          error_message: "Failed to create request type",
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
      success_message: "Request types created successfully",
      error_message: "",
      payload: { requestTypeIds: results }
    });
  });

  // Get all request types
  router.get('/requesttype', (req, res) => {
    try {
      const rows = requestTypeModel.getAllRequestTypes();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Request types fetched successfully",
        error_message: "",
        payload: { requestTypes: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch request types",
        payload: {}
      });
    }
  });

  // Get request type by ID (ordered after get all)
  router.get('/requesttype/:id', (req, res) => {
    try {
      const row = requestTypeModel.getAllRequestTypes().find(rt => rt.RequestTypeID == req.params.id);
      if (!row) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "RequestType not found",
          payload: {}
        });
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "RequestType fetched successfully",
        error_message: "",
        payload: { requestType: row }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch request type by ID",
        payload: {}
      });
    }
  });

  // Delete request types by list of RequestTypeID
  router.delete('/requesttype', (req, res) => {
    const { requestTypeIds } = req.body;
    if (!Array.isArray(requestTypeIds) || requestTypeIds.length === 0) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "requestTypeIds (array) is required",
        payload: {}
      });
    }
    try {
      const deleted = requestTypeModel.deleteRequestTypes(requestTypeIds);
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Request types deleted successfully",
        error_message: "",
        payload: { deletedCount: deleted }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete request types",
        payload: {}
      });
    }
  });

  app.use(router);
};
