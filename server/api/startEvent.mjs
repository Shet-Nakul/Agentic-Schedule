import { Router } from 'express';
import SkillsModel from '../models/SkillsModel.mjs';
import fetch from 'node-fetch'; // Ensure node-fetch installed for external API

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const skillsModel = SkillsModel(db);

  router.post('/startEvent', async (req, res) => {
    const { eventName, horizon, start_date, end_date } = req.body;

    // Validate required fields
    if (!eventName || !horizon || !start_date || !end_date) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "eventName, horizon, start_date, and end_date are required",
        payload: {}
      });
    }

    // Validate event name
    const validEventNames = ['staff roster', 'operational schedule'];
    if (!validEventNames.includes(eventName)) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: `Invalid event name. Valid options: ${validEventNames.join(', ')}`,
        payload: {}
      });
    }

    try {
      let eventResult = {};

      if (eventName === 'staff roster') {
        console.log('Triggering staff roster event...');

        // 1. Fetch skills
        const allSkills = skillsModel.getAllSkills();
        const skillsData = allSkills.map(skill => skill.SkillName);

        // 2. Fetch shifts
        const allShifts = db.prepare("SELECT ShiftCode FROM Shifts").all();
        const shiftsData = allShifts.map(s => s.ShiftCode);

        // 3. Fetch employees
        const allStaff = db.prepare("SELECT StaffID, Name, ContractID FROM Staff").all();

        // 3a. Fetch staff skills and map them
        const staffSkillsRows = db.prepare(`
          SELECT ss.StaffID, s.SkillName
          FROM StaffSkills ss
          JOIN Skills s ON ss.SkillID = s.SkillID
        `).all();

        const staffSkillsMap = {};
        staffSkillsRows.forEach(row => {
          if (!staffSkillsMap[row.StaffID]) staffSkillsMap[row.StaffID] = [];
          staffSkillsMap[row.StaffID].push(row.SkillName);
        });

        const employees = allStaff.map(staff => ({
          id: staff.StaffID.toString(),
          contract_id: staff.ContractID !== null ? staff.ContractID.toString() : null,
          name: staff.Name,
          skills: staffSkillsMap[staff.StaffID] || []
        }));

        // 4. Fetch contracts
        const contractRows = db.prepare("SELECT * FROM ContractsDetails").all();
        const wrapField = (value, active = 1, weight = 1) => {
          if (typeof value === 'boolean') value = value ? 'true' : 'false';
          return { active: active.toString(), weight: weight.toString(), value: value !== null ? value.toString() : null };
        };

        const contracts = contractRows.map(c => ({
          id: c.ContractID.toString(),
          description: c.Description,
          single_assignment_per_day: wrapField(c.SingleAssignmentPerDay),
          max_num_assignments: wrapField(c.MaxNumAssignments),
          min_num_assignments: wrapField(c.MinNumAssignments),
          max_consecutive_working_days: wrapField(c.MaxConsecutiveWorkingDays),
          min_consecutive_working_days: wrapField(c.MinConsecutiveWorkingDays),
          max_consecutive_free_days: wrapField(c.MaxConsecutiveFreeDays),
          min_consecutive_free_days: wrapField(c.MinConsecutiveFreeDays),
          max_consecutive_working_weekends: wrapField(c.MaxConsecutiveWorkingWeekends, 0, 0),
          min_consecutive_working_weekends: wrapField(c.MinConsecutiveWorkingWeekends, 0, 0),
          max_working_weekends_in_four_weeks: wrapField(c.MaxWorkingWeekendsInFourWeeks, 0, 0),
          weekend_definition: c.WeekendDefinition,
          complete_weekends: wrapField(c.CompleteWeekends),
          identical_shift_types_during_weekend: wrapField(c.IdenticalShiftTypesDuringWeekend),
          no_night_shift_before_free_weekend: wrapField(c.NoNightShiftBeforeFreeWeekend, 0, 0),
          alternative_skill_category: wrapField(c.AlternativeSkillCategory, 0, 0),
          unwanted_patterns: c.UnwantedPatterns ? c.UnwantedPatterns.split(',') : []
        }));

        // 5. Fetch day off requests
        const dayOffRequestsRows = db.prepare(`
          SELECT d.RequestDate AS date, d.EmployeeID AS employee_id, r.RequestTypeName AS request_type, 1 AS weight
          FROM DayOffRequests d
          JOIN RequestType r ON d.RequestTypeID = r.RequestTypeID
          ORDER BY d.EmployeeID, d.RequestDate
        `).all();

        const dayOffRequests = dayOffRequestsRows.map(r => ({
          date: r.date,
          employee_id: r.employee_id.toString(),
          request_type: r.request_type,
          weight: r.weight.toString()
        }));

        // 6. Fetch shift off requests
        const shiftOffRequestsRows = db.prepare(`
          SELECT s.RequestDate AS date, s.EmployeeID AS employee_id, s.Shift AS shift, r.RequestTypeName AS request_type, 1 AS weight
          FROM ShiftOffRequests s
          JOIN RequestType r ON s.RequestTypeID = r.RequestTypeID
          ORDER BY s.EmployeeID, s.RequestDate, s.Shift
        `).all();

        const shiftOffRequests = shiftOffRequestsRows.map(r => ({
          date: r.date,
          employee_id: r.employee_id.toString(),
          shift: r.shift,
          request_type: r.request_type,
          weight: r.weight.toString()
        }));

        // 7. Fetch requirements
        const requirements = db.prepare(`
          SELECT Date AS date, Shift AS shift, s.SkillName AS skill, Preferred AS preferred
          FROM ShiftRequirements r
          JOIN Skills s ON r.SkillID = s.SkillID
          WHERE Date BETWEEN ? AND ?
          ORDER BY Date, Shift
        `).all(start_date, end_date);

        // 8. Fetch employee schedule history
        const employeeScheduleRows = db.prepare(`
          SELECT Date AS date, EmployeeID AS employee_id, Shift AS shift, Working AS working
          FROM EmployeeSchedule
          ORDER BY Date, EmployeeID
        `).all();

        const history = employeeScheduleRows.map(row => ({
          date: row.date,
          employee_id: row.employee_id.toString(),
          shift: row.shift,
          working: !!row.working
        }));

        // 9. Build payload
        const externalApiPayload = {
          skills: skillsData,
          shifts: shiftsData,
          employee_ids: allStaff.map(e => e.StaffID),
          contract_ids: contractRows.map(c => c.ContractID),
          horizon,
          start_date,
          end_date,
          requirements,
          employees,
          contracts,
          day_off_requests: dayOffRequests,
          shift_off_requests: shiftOffRequests,
          forbidden_patterns: [],
          history
        };

        // 10. Send to external API
        const externalApiResponse = await fetch('http://127.0.0.1:8000/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(externalApiPayload)
        });

        const externalApiData = externalApiResponse.ok ? await externalApiResponse.json() : null;

        eventResult = {
          eventType: 'staff_roster',
          description: 'Staff roster generation and management event',
          action: 'generate_roster',
          dataFetched: { skillsData, shiftsData, employees, contracts, dayOffRequests, shiftOffRequests, requirements },
          externalApiResponse: externalApiData || { error: `External API error with status ${externalApiResponse.status}` }
        };

      } else {
        eventResult = {
          eventType: 'operational_schedule',
          description: 'Operational schedule planning and optimization event',
          action: 'generate_schedule'
        };
      }

      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: `Event '${eventName}' triggered successfully`,
        error_message: "",
        payload: { eventName, timestamp: new Date().toISOString(), eventDetails: eventResult }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to trigger event",
        payload: {}
      });
    }
  });

  app.use(router);
};
