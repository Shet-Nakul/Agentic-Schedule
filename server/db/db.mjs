import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(path.dirname(import.meta.url.replace('file://', '')), 'localdb.sqlite');
const schemaPath = path.join(path.dirname(import.meta.url.replace('file://', '')), 'schema.sql');

const db = new Database(dbPath);

const initSchema = () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  if (tables.length === 0) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log("✅ Database schema initialized");
  }
};

initSchema();

export default db;
