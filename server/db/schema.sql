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
    FOREIGN KEY (ContractID) REFERENCES ContractsDetails(ContractID)
);

CREATE TABLE StaffSkills (
    StaffID INTEGER,
    SkillID INTEGER,
    PRIMARY KEY (StaffID, SkillID),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID),
    FOREIGN KEY (SkillID) REFERENCES Skills(SkillID)
);

CREATE TABLE StaffShifts (
    StaffID INTEGER,
    ShiftCode VARCHAR(10),
    PRIMARY KEY (StaffID, ShiftCode),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID),
    FOREIGN KEY (ShiftCode) REFERENCES Shifts(ShiftCode)
);

CREATE TABLE DayOffRequests (
    RequestID INTEGER PRIMARY KEY AUTOINCREMENT,
    EmployeeID INTEGER,
    RequestDate DATE,
    RequestTypeID INTEGER,
    FOREIGN KEY (RequestTypeID) REFERENCES RequestType(RequestTypeID),
    FOREIGN KEY (EmployeeID) REFERENCES Staff(StaffID)
);

CREATE TABLE Shifts (
    ShiftID INTEGER PRIMARY KEY AUTOINCREMENT,
    ShiftName VARCHAR(50),    -- e.g., Morning, Evening, Night
    ShiftCode VARCHAR(10),    -- e.g., D, L, N, DH, DL, DN, etc.
    StartTime TIME,           -- e.g., 09:00
    EndTime TIME              -- e.g., 17:00
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

CREATE TABLE licenses (
    license_id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_date TEXT NOT NULL,       -- License start date (e.g., "01-09-2025")
    end_date TEXT NOT NULL,         -- License expiry date
    region TEXT DEFAULT 'Asia/Kolkata',  -- Time zone
    status TEXT DEFAULT 'active',   -- active, expired, invalid, etc.
    created_at TEXT DEFAULT (datetime('now'))  -- Record creation timestamp
);

-- Create index on created_at for faster queries by creation date
CREATE INDEX idx_licenses_created_at ON licenses(created_at);

-- Create index on end_date for faster queries by expiry date
CREATE INDEX idx_licenses_end_date ON licenses(end_date);

CREATE TABLE EmployeeSchedule (
    ScheduleID TEXT PRIMARY KEY,      -- UUID comes from backend
    Date DATE NOT NULL,
    EmployeeID INTEGER NOT NULL,
    Shift VARCHAR(10),
    Working BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (EmployeeID) REFERENCES Staff(StaffID)
);