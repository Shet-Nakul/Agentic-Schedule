import { Router } from 'express';
import EmployeeScheduleModel from '../models/EmployeeScheduleModel.mjs';
import { v4 as uuidv4 } from 'uuid';

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const employeeScheduleModel = EmployeeScheduleModel(db);

  // Create one or multiple employee schedules
  router.post('/employeeSchedule', (req, res) => {
    const schedules = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    let hasError = false;
    let errorResponse = null;
  
    // Generate one UUID per request
    const batchId = uuidv4();
  
    for (const schedule of schedules) {
      if (!schedule.date || schedule.employee_id === undefined) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: "Date and EmployeeID are required for each schedule",
          payload: {}
        };
        break;
      }
  
      // Foreign key existence check
      const employeeExists = db.prepare("SELECT 1 FROM Staff WHERE StaffID = ?").get(schedule.employee_id);
      if (!employeeExists) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: `Employee with ID ${schedule.employee_id} does not exist`,
          payload: {}
        };
        break;
      }
  
      try {
        // Save schedule with shared batchId
        employeeScheduleModel.createEmployeeSchedule({
          scheduleId: batchId, // same for all in this request
          date: schedule.date,
          employeeId: schedule.employee_id,
          shift: schedule.shift || null,
          working: schedule.working !== undefined ? schedule.working : false
        });
  
        results.push(schedule.employee_id);
      } catch (err) {
        console.error(err);
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 500,
          success_message: "",
          error_message: "Failed to create employee schedule",
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
      success_message: "Employee schedules created successfully",
      error_message: "",
      payload: { batchId, employeeIds: results }
    });
  });
  
  // Delete employee schedules by list of ScheduleID
  router.delete('/employeeSchedule', (req, res) => {
    const { scheduleIds } = req.body;
    if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "scheduleIds (array) is required",
        payload: {}
      });
    }
    try {
      const result = employeeScheduleModel.deleteEmployeeSchedules(scheduleIds);
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Employee schedules deleted successfully",
        error_message: "",
        payload: { deletedCount: result.changes }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete employee schedules",
        payload: {}
      });
    }
  });

  // Get all employee schedules
  router.get('/employeeSchedule', (req, res) => {
    try {
      const rows = employeeScheduleModel.getAllEmployeeSchedules();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Employee schedules fetched successfully",
        error_message: "",
        payload: { schedules: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch employee schedules",
        payload: {}
      });
    }
  });

  // Get employee schedule by ID
  router.get('/employeeSchedule/:id', (req, res) => {
    try {
      const row = employeeScheduleModel.getEmployeeScheduleById(req.params.id);
      if (!row) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Employee schedule not found",
          payload: {}
        });
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Employee schedule fetched successfully",
        error_message: "",
        payload: { schedule: row }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch employee schedule by ID",
        payload: {}
      });
    }
  });

  // Get employee schedules by employee ID
  router.get('/employeeSchedule/employee/:employeeId', (req, res) => {
    try {
      const rows = employeeScheduleModel.getEmployeeSchedulesByEmployeeId(req.params.employeeId);
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Employee schedules fetched successfully",
        error_message: "",
        payload: { schedules: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch employee schedules by employee ID",
        payload: {}
      });
    }
  });

  // Get employee schedules by date
  router.get('/employeeSchedule/date/:date', (req, res) => {
    try {
      const rows = employeeScheduleModel.getEmployeeSchedulesByDate(req.params.date);
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Employee schedules fetched successfully",
        error_message: "",
        payload: { schedules: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch employee schedules by date",
        payload: {}
      });
    }
  });

  // Get employee schedules by date range
  router.get('/employeeSchedule/date-range/:startDate/:endDate', (req, res) => {
    try {
      const rows = employeeScheduleModel.getEmployeeSchedulesByDateRange(req.params.startDate, req.params.endDate);
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Employee schedules fetched successfully",
        error_message: "",
        payload: { schedules: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch employee schedules by date range",
        payload: {}
      });
    }
  });

  app.use(router);
};
