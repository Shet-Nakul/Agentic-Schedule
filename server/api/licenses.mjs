import LicensesModel from '../models/LicensesModel.mjs';
import os from 'os';
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { DateTime } from 'luxon';

// Create __filename and __dirname equivalents for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const upload = multer();

    // Create a new license (verify license with uploaded files)
    app.post('/licenses', upload.fields([{ name: 'pemFile' }, { name: 'licFile' }]), (req, res) => {
        const pemFile = req.files?.pemFile?.[0];
        const licFile = req.files?.licFile?.[0];
    
        if (!pemFile || !licFile) {
        return res.status(400).json({
            status: "error",
            statusCode: 400,
            success_message: "",
            error_message: "pemFile and licFile are required",
            payload: {}
        });
        }
    
        // Save temp files
        const tempDir = path.join(os.tmpdir(), `license_upload_${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        const pemPath = path.join(tempDir, 'public_key.pem');
        const licPath = path.join(tempDir, 'license.lic');
        fs.writeFileSync(pemPath, pemFile.buffer);
        fs.writeFileSync(licPath, licFile.buffer);
    
        const licenseVerifierBin = path.resolve(__dirname, '../python/dist/license_verifier');
    
        execFile(licenseVerifierBin, [pemPath, licPath], (error, stdout, stderr) => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    
        if (error) {
            console.error('License verifier error:', stderr || error.message);
            return res.status(500).json({
            status: "error",
            statusCode: 500,
            success_message: "",
            error_message: "License verifier failed",
            payload: { stderr }
            });
        }
    
        let result;
        try {
            result = JSON.parse(stdout);
        } catch (e) {
            console.error('Failed to parse license verifier output:', e);
            return res.status(500).json({
            status: "error",
            statusCode: 500,
            success_message: "",
            error_message: "Failed to parse license verifier output",
            payload: { raw_output: stdout }
            });
        }
    
        // Save or update license in DB
        try {
            licensesModel.createOrUpdateLicense({
            start_date: result.start_date,
            end_date: result.end_date,
            region: result.region || 'Asia/Kolkata',
            status: result.status || 'active'
            });
        } catch (e) {
            console.error('Failed to save license:', e);
        }
    
        res.status(201).json({
            status: "success",
            statusCode: 201,
            success_message: result.status === "valid" ? result.message : "",
            error_message: result.status !== "valid" ? result.message : "",
            payload: result
        });
        });
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

    // Delete a single license by ID
    app.delete('/licenses/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Validate license ID
        if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            status: "error",
            statusCode: 400,
            success_message: "",
            error_message: "Invalid license ID",
            payload: {}
        });
        }

        // Delete license from DB
        const deletedCount = licensesModel.deleteLicenses([id]);

        // If license not found
        if (deletedCount === 0) {
        return res.status(404).json({
            status: "error",
            statusCode: 404,
            success_message: "",
            error_message: `No license found with ID ${id}`,
            payload: {}
        });
        }

        // Success response
        res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: `Successfully deleted license with ID ${id}`,
        error_message: "",
        payload: { deletedCount }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete license",
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

    const hasValidActiveLicense = () => {
        const licenses = licensesModel.getAllLicenses();
    
        for (const lic of licenses) {
            const region = lic.region || 'Asia/Kolkata';
            // Current time in license's timezone
            const now = DateTime.now().setZone(region);
            const start = DateTime.fromISO(lic.start_date, { zone: region });
            const end = DateTime.fromISO(lic.end_date, { zone: region }).endOf('day');
        
            // If license is active or valid
            if (lic.status === 'active' || lic.status === 'valid') {
                if (now > end) {
                    // License expired
                    licensesModel.updateLicenseStatus(lic.license_id, 'expired');
                    lic.status = 'expired';
                    continue; // skip expired licenses
                }
        
                if (now >= start && now <= end) {
                    // License is currently valid
                    if (lic.status === 'valid') {
                        licensesModel.updateLicenseStatus(lic.license_id, 'active');
                        lic.status = 'active';
                    }
                    return lic; // return first valid active license
                }
            }
        }
    
        return null; // no valid active license found
    };
    return { hasValidActiveLicense };
};

