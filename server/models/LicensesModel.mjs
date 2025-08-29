export default (db) => ({
  createLicense: ({ license_key, issued_at, expires_at, status }) => {
    const safe = (v) => {
      if (
        v === undefined ||
        v === null ||
        typeof v === 'number' ||
        typeof v === 'string' ||
        typeof v === 'bigint'
      ) {
        return v ?? null;
      }
      if (typeof v === 'boolean') {
        return v ? 1 : 0;
      }
      return null;
    };
    const stmt = db.prepare(
      `INSERT INTO licenses (license_key, issued_at, expires_at, status)
       VALUES (?, ?, ?, ?)`
    );
    return stmt.run(
      safe(license_key),
      safe(issued_at),
      safe(expires_at),
      safe(status) || 'active'
    );
  },
  getAllLicenses: () => {
    return db.prepare("SELECT * FROM licenses").all();
  },
  getLicenseById: (license_id) => {
    return db.prepare("SELECT * FROM licenses WHERE license_id = ?").get(license_id);
  },
  deleteLicenses: (licenseIds) => {
    const stmt = db.prepare("DELETE FROM licenses WHERE license_id = ?");
    let deleted = 0;
    for (const id of licenseIds) {
      const result = stmt.run(id);
      deleted += result.changes;
    }
    return deleted;
  }
});
