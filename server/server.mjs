import express from 'express';
import cors from 'cors';
import db from './db/db.mjs';
import staffApi from './api/staff.mjs';
import contractsApi from './api/contracts.mjs';
import skillsApi from './api/skills.mjs';
import dayOffRequestsApi from './api/dayOffRequests.mjs';
import shiftOffRequestsApi from './api/shiftOffRequests.mjs';
import licensesApi from './api/licenses.mjs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

const app = express();
app.use(express.json());
app.use(cors());

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Simple health check route
app.get('/', (req, res) => {
  res.send('✅ Server is running and DB is connected!');
});

staffApi(app, db);
contractsApi(app, db);
skillsApi(app, db);
dayOffRequestsApi(app, db);
shiftOffRequestsApi(app, db);
licensesApi(app, db);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});