export default (db) => ({
  createRequestType: ({ RequestTypeName, RequestTypeDesc }) => {
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
      "INSERT INTO RequestType (RequestTypeName, RequestTypeDesc) VALUES (?, ?)"
    );
    return stmt.run(
      safe(RequestTypeName),
      safe(RequestTypeDesc)
    );
  },
  getAllRequestTypes: () => {
    return db.prepare("SELECT * FROM RequestType").all();
  },
  deleteRequestTypes: (requestTypeIds) => {
    const stmt = db.prepare("DELETE FROM RequestType WHERE RequestTypeID = ?");
    let deleted = 0;
    for (const id of requestTypeIds) {
      const result = stmt.run(id);
      deleted += result.changes;
    }
    return deleted;
  }
});
