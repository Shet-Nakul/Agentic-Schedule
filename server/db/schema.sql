CREATE TABLE ContractsDetails (
    ContractID INTEGER PRIMARY KEY,
    Description VARCHAR(100),
    SingleAssignmentPerDay BOOLEAN,
    MaxNumAssignments INTEGER,
    MinNumAssignments INTEGER,
    MaxConsecutiveWorkingDays INTEGER,
    MinConsecutiveWorkingDays INTEGER,
    MaxConsecutiveFreeDays INTEGER,
    MinConsecutiveFreeDays INTEGER,
    MaxConsecutiveWorkingWeekends INTEGER,
    MinConsecutiveWorkingWeekends INTEGER,
    MaxWorkingWeekendsInFourWeeks INTEGER,
    WeekendDefinition VARCHAR(50),
    CompleteWeekends BOOLEAN,
    IdenticalShiftTypesDuringWeekend BOOLEAN,
    NoNightShiftBeforeFreeWeekend BOOLEAN,
    AlternativeSkillCategory BOOLEAN,
    UnwantedPatterns TEXT
);

CREATE TABLE Skills (
    SkillID INTEGER PRIMARY KEY AUTOINCREMENT,
    SkillName VARCHAR(50) UNIQUE
);

CREATE TABLE RequestType (
    RequestTypeID INTEGER PRIMARY KEY AUTOINCREMENT,
    RequestTypeName VARCHAR(50),
    RequestTypeDesc VARCHAR(50)
);

CREATE TABLE Staff (
    StaffID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name VARCHAR(100),
    ContractID INTEGER,
    SkillID INTEGER,
    FOREIGN KEY (ContractID) REFERENCES ContractsDetails(ContractID),
    FOREIGN KEY (SkillID) REFERENCES Skills(SkillID)
);

CREATE TABLE DayOffRequests (
    RequestID INTEGER PRIMARY KEY AUTOINCREMENT,
    EmployeeID INTEGER,
    RequestDate DATE,
    RequestTypeID INTEGER,
    FOREIGN KEY (RequestTypeID) REFERENCES RequestType(RequestTypeID),
    FOREIGN KEY (EmployeeID) REFERENCES Staff(StaffID)
);

CREATE TABLE ShiftOffRequests (
    RequestID INTEGER PRIMARY KEY AUTOINCREMENT,
    EmployeeID INTEGER,
    RequestDate DATE,
    RequestTypeID INTEGER,
    Shift VARCHAR(10),
    FOREIGN KEY (EmployeeID) REFERENCES Staff(StaffID),
    FOREIGN KEY (RequestTypeID) REFERENCES RequestType(RequestTypeID)
);

CREATE TABLE ShiftRequirements (
    RequirementID INTEGER PRIMARY KEY AUTOINCREMENT,
    DayOfWeek VARCHAR(20),
    Shift VARCHAR(10),
    SkillID INTEGER,
    Preferred INTEGER,
    FOREIGN KEY (SkillID) REFERENCES Skills(SkillID)
);