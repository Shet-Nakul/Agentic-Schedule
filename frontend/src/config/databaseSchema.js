// Database schema configuration for Agentic Schedule
export const DATABASE_SCHEMA = {
  Staff: {
    tableName: 'Staff',
    columns: [
      { name: 'StaffID', type: 'INT', primaryKey: true, autoIncrement: true, example: 1 },
      { name: 'Name', type: 'VARCHAR(100)', required: true, example: 'Alice Johnson' },
      { name: 'ContractID', type: 'INT', foreignKey: 'ContractsDetails(ContractID)', required: true, example: 1 },
      { name: 'SkillID', type: 'INT', foreignKey: 'Skills(SkillID)', example: 2 },
      { name: 'Skills', type: 'TEXT', example: "['Nurse','HeadNurse']" }
    ],
    description: 'Staff members with their contracts and skills'
  },
  ContractsDetails: {
    tableName: 'ContractsDetails',
    columns: [
      { name: 'ContractID', type: 'INT', primaryKey: true, required: true, example: 1001 },
      { name: 'Description', type: 'VARCHAR(100)', required: true, example: 'Full-time 40h/week' },
      { name: 'SingleAssignmentPerDay', type: 'BOOLEAN', example: true },
      { name: 'MaxNumAssignments', type: 'INT', example: 5 },
      { name: 'MinNumAssignments', type: 'INT', example: 1 },
      { name: 'MaxConsecutiveWorkingDays', type: 'INT', example: 6 },
      { name: 'MinConsecutiveWorkingDays', type: 'INT', example: 3 },
      { name: 'MaxConsecutiveFreeDays', type: 'INT', example: 3 },
      { name: 'MinConsecutiveFreeDays', type: 'INT', example: 1 },
      { name: 'MaxConsecutiveWorkingWeekends', type: 'INT', example: 2 },
      { name: 'MinConsecutiveWorkingWeekends', type: 'INT', example: 0 },
      { name: 'MaxWorkingWeekendsInFourWeeks', type: 'INT', example: 2 },
      { name: 'WeekendDefinition', type: 'VARCHAR(50)', example: 'Saturday-Sunday' },
      { name: 'CompleteWeekends', type: 'BOOLEAN', example: false },
      { name: 'IdenticalShiftTypesDuringWeekend', type: 'BOOLEAN', example: false },
      { name: 'NoNightShiftBeforeFreeWeekend', type: 'BOOLEAN', example: true },
      { name: 'AlternativeSkillCategory', type: 'BOOLEAN', example: false },
      { name: 'UnwantedPatterns', type: 'TEXT', example: 'No consecutive nights' }
    ],
    description: 'Contract details and constraints'
  },
  Skills: {
    tableName: 'Skills',
    columns: [
      { name: 'SkillID', type: 'INT', primaryKey: true, autoIncrement: true, example: 1 },
      { name: 'SkillName', type: 'VARCHAR(50)', required: true, unique: true, example: 'Nurse' }
    ],
    description: 'Available skills for staff members'
  },
  DayOffRequests: {
    tableName: 'DayOffRequests',
    columns: [
      { name: 'RequestID', type: 'INT', primaryKey: true, autoIncrement: true, example: 1 },
      { name: 'EmployeeID', type: 'INT', foreignKey: 'Staff(StaffID)', required: true, example: 1 },
      { name: 'RequestDate', type: 'DATE', required: true, example: '2025-01-15' },
      { name: 'RequestTypeID', type: 'INT', foreignKey: 'RequestType(RequestTypeID)', required: true, example: 2 }
    ],
    description: 'Day off requests from employees'
  },
  RequestType: {
    tableName: 'RequestType',
    columns: [
      { name: 'RequestTypeID', type: 'INT', primaryKey: true, autoIncrement: true, example: 1 },
      { name: 'RequestTypeName', type: 'VARCHAR(50)', required: true, example: 'Vacation' },
      { name: 'RequestTypeDesc', type: 'VARCHAR(50)', example: 'Annual leave' }
    ],
    description: 'Types of requests (vacation, sick leave, etc.)'
  },
  ShiftOffRequests: {
    tableName: 'ShiftOffRequests',
    columns: [
      { name: 'RequestID', type: 'INT', primaryKey: true, autoIncrement: true, example: 1 },
      { name: 'EmployeeID', type: 'INT', foreignKey: 'Staff(StaffID)', required: true, example: 1 },
      { name: 'RequestDate', type: 'DATE', required: true, example: '2025-02-01' },
      { name: 'RequestTypeID', type: 'INT', foreignKey: 'RequestType(RequestTypeID)', required: true, example: 2 },
      { name: 'Shift', type: 'VARCHAR(10)', required: true, example: 'N' }
    ],
    description: 'Shift off requests from employees'
  },
  Shifts: {
    tableName: 'Shifts',
    columns: [
      { name: 'ShiftID', type: 'INT', primaryKey: true, autoIncrement: true, example: 1 },
      { name: 'ShiftName', type: 'VARCHAR(50)', required: true, example: 'Night Shift' },
      { name: 'ShiftCode', type: 'VARCHAR(10)', required: true, example: 'N' },
      { name: 'StartTime', type: 'TIME', example: '22:00' },
      { name: 'EndTime', type: 'TIME', example: '06:00' }
    ],
    description: 'Shift definitions with codes and times'
  },
  ShiftRequirements: {
    tableName: 'ShiftRequirements',
    columns: [
      { name: 'RequirementID', type: 'INT', primaryKey: true, autoIncrement: true, example: 1 },
      { name: 'DayOfWeek', type: 'VARCHAR(20)', required: true, example: 'Monday' },
      { name: 'Shift', type: 'VARCHAR(10)', required: true, example: 'D' },
      { name: 'SkillID', type: 'INT', foreignKey: 'Skills(SkillID)', required: true, example: 3 },
      { name: 'Preferred', type: 'INT', example: 4 }
    ],
    description: 'Shift requirements for different days and skills'
  }
};

// Helper function to get column names for a table
export const getTableColumns = (tableName) => {
  const table = DATABASE_SCHEMA[tableName];
  return table ? table.columns.map(col => col.name) : [];
};

// Helper function to get all table names
export const getTableNames = () => {
  return Object.keys(DATABASE_SCHEMA);
};

// Helper function to validate column headers against schema
export const validateHeaders = (headers, tableName) => {
  const expectedColumns = getTableColumns(tableName);
  const validation = {
    valid: [],
    missing: [],
    extra: []
  };

  headers.forEach(header => {
    if (expectedColumns.includes(header)) {
      validation.valid.push(header);
    } else {
      validation.extra.push(header);
    }
  });

  expectedColumns.forEach(column => {
    if (!headers.includes(column)) {
      validation.missing.push(column);
    }
  });

  return validation;
};
