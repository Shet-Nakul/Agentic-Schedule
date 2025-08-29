import LicensesModel from '../models/LicensesModel.mjs';
import os from 'os';
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;

// Helper to get MAC address (first non-internal, non-empty MAC)
function getMacAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac;
      }
    }
  }
  return 'unknown-mac';
}

function getUniqueMachineIdentifier() {
  const mac = getMacAddress();
  const cpu = os.cpus()[0]?.model || 'unknown-cpu';
  const id = machineIdSync(true);
  return `${id}-${mac}-${cpu}`;
}

export default (app, db) => {
  const licensesModel = LicensesModel(db);

  // Create a new license
  app.post('/licenses', (req, res) => {
    const { license_key, issued_at, expires_at, status } = req.body;
    if (!license_key || !expires_at) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "license_key and expires_at are required",
        payload: {}
      });
    }
    try {
      const result = licensesModel.createLicense({ license_key, issued_at, expires_at, status });
      res.status(201).json({
        status: "success",
        statusCode: 201,
        success_message: "License created successfully",
        error_message: "",
        payload: { license_id: result.lastInsertRowid }
      });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
          status: "error",
          statusCode: 409,
          success_message: "",
          error_message: "License key already exists",
          payload: {}
        });
      }
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to create license",
        payload: {}
      });
    }
  });

  // Get all licenses
  app.get('/licenses', (req, res) => {
    try {
      const rows = licensesModel.getAllLicenses();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Licenses fetched successfully",
        error_message: "",
        payload: { licenses: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch licenses",
        payload: {}
      });
    }
  });

  // Get unique machine identifier
  app.get('/machine-id', (req, res) => {
    try {
      const uniqueId = getUniqueMachineIdentifier();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Machine identifier fetched successfully",
        error_message: "",
        payload: { machineId: uniqueId }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to get machine identifier",
        payload: {}
      });
    }
  });
};

