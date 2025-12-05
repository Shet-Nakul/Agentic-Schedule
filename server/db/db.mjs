import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'localdb.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);

// Ensure foreign keys are enforced
db.pragma('foreign_keys = ON');

const initSchema = () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  if (tables.length === 0) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log("✅ Database schema initialized");
  }
};

// Ensure required indexes exist even if schema already present
const ensureIndexes = () => {
  try {
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_code_unique ON Shifts(ShiftCode)");
  } catch (e) {
    console.error('Failed to ensure unique index on Shifts(ShiftCode):', e);
  }
};

initSchema();
ensureIndexes();

export default db;
