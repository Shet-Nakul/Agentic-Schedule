module.exports = (app, db) => {

  app.post('/staff', (req, res) => {
    const { name, contractId } = req.body;

    if (!name || !contractId) {
      return res.status(400).json({ error: "Name and ContractID are required" });
    }

    try {
      const stmt = db.prepare("INSERT INTO Staff (Name, ContractID) VALUES (?, ?)");
      const result = stmt.run(name, contractId);

      res.json({ success: true, staffId: result.lastInsertRowid });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create staff" });
    }
  });

  // Get all staff
  app.get('/staff', (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM Staff").all();
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });
};
