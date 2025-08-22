const express = require('express');
const cors = require('cors');
const db = require('./db/db');   // This will init your schema

const app = express();
app.use(express.json());
app.use(cors());

// Simple health check route
app.get('/', (req, res) => {
  res.send('✅ Server is running and DB is connected!');
});

require('./api/staff')(app, db);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
