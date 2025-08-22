const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'localdb.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

// open or create database
const db = new Database(dbPath);

// Initialize schema if empty
const initSchema = () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  if (tables.length === 0) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log("✅ Database schema initialized");
  }
};

initSchema();

module.exports = db;
