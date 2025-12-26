export default (db) => ({
	createShiftRequirement: ({ dayOfWeek, shift, skillId, preferred }) => {
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
			"INSERT INTO ShiftRequirements (DayOfWeek, Shift, SkillID, Preferred) VALUES (?, ?, ?, ?)"
		);
		return stmt.run(safe(dayOfWeek), safe(shift), safe(skillId), safe(preferred));
	},

	getAllShiftRequirements: () => {
		return db.prepare("SELECT * FROM ShiftRequirements").all();
	},

	getShiftRequirementById: (id) => {
		return db.prepare("SELECT * FROM ShiftRequirements WHERE RequirementID = ?").get(id);
	},

	getShiftRequirementsByDay: (dayOfWeek) => {
		return db.prepare("SELECT * FROM ShiftRequirements WHERE DayOfWeek = ?").all(dayOfWeek);
	},

	updateShiftRequirement: (id, { dayOfWeek, shift, skillId, preferred }) => {
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
			"UPDATE ShiftRequirements SET DayOfWeek = ?, Shift = ?, SkillID = ?, Preferred = ? WHERE RequirementID = ?"
		);
		return stmt.run(safe(dayOfWeek), safe(shift), safe(skillId), safe(preferred), id);
	},

	deleteShiftRequirement: (id) => {
		const stmt = db.prepare("DELETE FROM ShiftRequirements WHERE RequirementID = ?");
		return stmt.run(id);
	},

	deleteShiftRequirements: (ids) => {
		const stmt = db.prepare("DELETE FROM ShiftRequirements WHERE RequirementID = ?");
		let deleted = 0;
		for (const id of ids) {
			const result = stmt.run(id);
			deleted += result.changes;
		}
		return { changes: deleted };
	}
});
