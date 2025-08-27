export default (db) => ({
  createContract: (contract) => {
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
      contract.ContractID, contract.Description, contract.SingleAssignmentPerDay, contract.MaxNumAssignments, contract.MinNumAssignments,
      contract.MaxConsecutiveWorkingDays, contract.MinConsecutiveWorkingDays, contract.MaxConsecutiveFreeDays, contract.MinConsecutiveFreeDays,
      contract.MaxConsecutiveWorkingWeekends, contract.MinConsecutiveWorkingWeekends, contract.MaxWorkingWeekendsInFourWeeks,
      contract.WeekendDefinition, contract.CompleteWeekends, contract.IdenticalShiftTypesDuringWeekend, contract.NoNightShiftBeforeFreeWeekend,
      contract.AlternativeSkillCategory, contract.UnwantedPatterns
    );
  },
  getAllContracts: () => {
    return db.prepare("SELECT * FROM ContractsDetails").all();
  }
});
