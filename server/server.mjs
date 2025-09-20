import express from 'express';
import cors from 'cors';
import db from './db/db.mjs';
import staffApi from './api/staff.mjs';
import contractsApi from './api/contracts.mjs';
import skillsApi from './api/skills.mjs';
import dayOffRequestsApi from './api/dayOffRequests.mjs';
import shiftOffRequestsApi from './api/shiftOffRequests.mjs';
import licensesApi from './api/licenses.mjs';
import requestTypeApi from './api/requestType.mjs';
import startEventApi from './api/startEvent.mjs';
import employeeScheduleApi from './api/employeeSchedule.mjs';
import shiftsApi from './api/shifts.mjs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Simple health check route
app.get('/', (req, res) => {
  res.send('✅ Server is running and DB is connected!');
});

// Initialize licenses API first so we can access the helper
const licenses = licensesApi(app, db);
const { hasValidActiveLicense } = licenses;

// Initialize other APIs
staffApi(app, db, hasValidActiveLicense);
contractsApi(app, db, hasValidActiveLicense);
skillsApi(app, db, hasValidActiveLicense);
dayOffRequestsApi(app, db, hasValidActiveLicense);
shiftOffRequestsApi(app, db, hasValidActiveLicense);
requestTypeApi(app, db, hasValidActiveLicense);
startEventApi(app, db, hasValidActiveLicense);
employeeScheduleApi(app, db, hasValidActiveLicense);
shiftsApi(app, db, hasValidActiveLicense);

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
