import { DateTime } from 'luxon';
export default (db) => ({
  createOrUpdateLicense: ({ start_date, end_date, region, status }) => {
    const tz = region || 'Asia/Kolkata';

    // Convert DD-MM-YYYY to ISO string in the given timezone
    const startISO = DateTime.fromFormat(start_date, 'dd-MM-yyyy', { zone: tz }).toISO();
    const endISO = DateTime.fromFormat(end_date, 'dd-MM-yyyy', { zone: tz }).endOf('day').toISO();

    const now = DateTime.now().setZone(tz).toISO();

    // Check if a license already exists with same start/end dates
    const existing = db.prepare(
      "SELECT * FROM licenses WHERE start_date = ? AND end_date = ?"
    ).get(startISO, endISO);

    if (existing) {
      // Update existing record
      const stmt = db.prepare(
        `UPDATE licenses
         SET region = ?, status = ?, created_at = ?
         WHERE license_id = ?`
      );
      return stmt.run(region, status || 'active', now, existing.license_id);
    } else {
      // Insert new license
      const stmt = db.prepare(
        `INSERT INTO licenses (start_date, end_date, region, status, created_at)
         VALUES (?, ?, ?, ?, ?)`
      );
      return stmt.run(startISO, endISO, region, status || 'active', now);
    }
  },

  getAllLicenses: () => db.prepare("SELECT * FROM licenses").all(),
  updateLicenseStatus: (license_id, newStatus) => {
    const stmt = db.prepare("UPDATE licenses SET status = ? WHERE license_id = ?");
    return stmt.run(newStatus, license_id);
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
