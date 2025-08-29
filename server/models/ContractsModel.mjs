export default (db) => ({
  createContract: (contract) => {
    // Only allow SQLite-supported types: number, string, bigint, buffer, or null
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

    const stmt = db.prepare(`
      INSERT INTO ContractsDetails (
        ContractID, Description, SingleAssignmentPerDay, MaxNumAssignments, MinNumAssignments,
        MaxConsecutiveWorkingDays, MinConsecutiveWorkingDays, MaxConsecutiveFreeDays, MinConsecutiveFreeDays,
        MaxConsecutiveWorkingWeekends, MinConsecutiveWorkingWeekends, MaxWorkingWeekendsInFourWeeks,
        WeekendDefinition, CompleteWeekends, IdenticalShiftTypesDuringWeekend, NoNightShiftBeforeFreeWeekend,
        AlternativeSkillCategory, UnwantedPatterns
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      safe(contract.ContractID),
      safe(contract.Description),
      safe(contract.SingleAssignmentPerDay),
      safe(contract.MaxNumAssignments),
      safe(contract.MinNumAssignments),
      safe(contract.MaxConsecutiveWorkingDays),
      safe(contract.MinConsecutiveWorkingDays),
      safe(contract.MaxConsecutiveFreeDays),
      safe(contract.MinConsecutiveFreeDays),
      safe(contract.MaxConsecutiveWorkingWeekends),
      safe(contract.MinConsecutiveWorkingWeekends),
      safe(contract.MaxWorkingWeekendsInFourWeeks),
      safe(contract.WeekendDefinition),
      safe(contract.CompleteWeekends),
      safe(contract.IdenticalShiftTypesDuringWeekend),
      safe(contract.NoNightShiftBeforeFreeWeekend),
      safe(contract.AlternativeSkillCategory),
      safe(contract.UnwantedPatterns)
    );
  },
  getAllContracts: () => {
    return db.prepare("SELECT * FROM ContractsDetails").all();
  }
});
