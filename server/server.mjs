import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import db from './db/db.mjs';

import staffApi from './api/staff.mjs';
import contractsApi from './api/contracts.mjs';
import skillsApi from './api/skills.mjs';
import dayOffRequestsApi from './api/dayOffRequests.mjs';
import shiftOffRequestsApi from './api/shiftOffRequests.mjs';
import licensesApi from './api/licenses.mjs';
import requestTypeApi from './api/requestType.mjs';
import startEventApi from './api/startEvent.mjs';
import shiftRequirementsApi from './api/shiftRequirements.mjs';
import employeeScheduleApi from './api/employeeSchedule.mjs';
import shiftsApi from './api/shifts.mjs';

import registerEventSocket from './sockets/eventresults.socket.mjs';

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

// --------------------------------------------------
// File path utilities
// --------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// --------------------------------------------------
// EXPRESS APP
// --------------------------------------------------
const app = express();
app.use(express.json());
app.use(cors());

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/', (req, res) => {
  res.send('Server is running and DB is connected!');
});

// --------------------------------------------------
// LICENSE API (must load first to get helper)
// --------------------------------------------------
const licenses = licensesApi(app, db);
const { hasValidActiveLicense } = licenses;

// --------------------------------------------------
// Load all REST APIs
// --------------------------------------------------
staffApi(app, db, hasValidActiveLicense);
contractsApi(app, db, hasValidActiveLicense);
skillsApi(app, db, hasValidActiveLicense);
dayOffRequestsApi(app, db, hasValidActiveLicense);
shiftOffRequestsApi(app, db, hasValidActiveLicense);
requestTypeApi(app, db, hasValidActiveLicense);
// startEventApi moved below to access io
employeeScheduleApi(app, db, hasValidActiveLicense);
shiftsApi(app, db, hasValidActiveLicense);
shiftRequirementsApi(app, db, hasValidActiveLicense);


// --------------------------------------------------
// SOCKET.IO SERVER
// --------------------------------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Initialize startEventApi with io
startEventApi(app, db, hasValidActiveLicense, io);

// Attach eventresults socket namespace
registerEventSocket(io, db);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
const PORT = 3001;

server.listen(PORT, () => {
  console.log(`Server + Socket running at http://localhost:${PORT}`);
});
