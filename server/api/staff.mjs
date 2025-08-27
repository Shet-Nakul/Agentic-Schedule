import StaffModel from '../models/StaffModel.mjs';

export default (app, db) => {
  const staffModel = StaffModel(db);

  app.post('/staff', (req, res) => {
    const { name, contractId, skillId } = req.body;

    if (!name || !contractId) {
      return res.status(400).json({ error: "Name and ContractID are required" });
    }

    try {
      const result = staffModel.createStaff({ name, contractId, skillId });
      res.json({ success: true, staffId: result.lastInsertRowid });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create staff" });
    }
  });

  // Get all staff
  app.get('/staff', (req, res) => {
    try {
      const rows = staffModel.getAllStaff();
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  // Get staff by ID
  app.get('/staff/:id', (req, res) => {
    try {
      const row = staffModel.getStaffById(req.params.id);
      if (!row) return res.status(404).json({ error: "Staff not found" });
      res.json(row);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch staff by ID" });
    }
  });
};