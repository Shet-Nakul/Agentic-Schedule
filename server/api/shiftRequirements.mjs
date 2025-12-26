import { Router } from 'express';
import ShiftRequirementsModel from '../models/shiftRequirementsModel.mjs';

export default (app, db, hasActiveLicense) => {
	const router = Router();
	const shiftReqModel = ShiftRequirementsModel(db);

	// Create one or multiple shift requirements
	router.post('/shiftrequirements', (req, res) => {
		const items = Array.isArray(req.body) ? req.body : [req.body];
		const results = [];
		let hasError = false;
		let errorResponse = null;

		for (const it of items) {
			const { dayOfWeek, shift, skillId, preferred } = it;
			if (!dayOfWeek || !shift || !skillId) {
				hasError = true;
				errorResponse = {
					status: "error",
					statusCode: 400,
					success_message: "",
					error_message: "dayOfWeek, shift and skillId are required for each shift requirement",
					payload: {}
				};
				break;
			}
            try {
                const result = shiftReqModel.createShiftRequirement({
                    dayOfWeek,
                    shift,
                    skillId,
                    preferred: preferred === undefined ? null : Number(preferred)
                });
                results.push(result.lastInsertRowid);
            } catch (err) {
				console.error(err);
				hasError = true;
				errorResponse = {
					status: "error",
					statusCode: 500,
					success_message: "",
					error_message: "Failed to create shift requirement",
					payload: {}
				};
				break;
			}
		}

		if (hasError) {
			return res.status(errorResponse.statusCode).json(errorResponse);
		}

		res.status(201).json({
			status: "success",
			statusCode: 201,
			success_message: "Shift requirements created successfully",
			error_message: "",
			payload: { requirementIds: results }
		});
	});

	// Get all shift requirements
	router.get('/shiftrequirements', (req, res) => {
		try {
			const rows = shiftReqModel.getAllShiftRequirements();
			res.status(200).json({
				status: "success",
				statusCode: 200,
				success_message: "Shift requirements fetched successfully",
				error_message: "",
				payload: { shiftRequirements: rows }
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				status: "error",
				statusCode: 500,
				success_message: "",
				error_message: "Failed to fetch shift requirements",
				payload: {}
			});
		}
	});

	// Get shift requirement by ID
	router.get('/shiftrequirements/:id', (req, res) => {
		try {
			const row = shiftReqModel.getShiftRequirementById(req.params.id);
			if (!row) {
				return res.status(404).json({
					status: "error",
					statusCode: 404,
					success_message: "",
					error_message: "Shift requirement not found",
					payload: {}
				});
			}
			res.status(200).json({
				status: "success",
				statusCode: 200,
				success_message: "Shift requirement fetched successfully",
				error_message: "",
				payload: { requirement: row }
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				status: "error",
				statusCode: 500,
				success_message: "",
				error_message: "Failed to fetch shift requirement",
				payload: {}
			});
		}
	});

	// Get shift requirements by day of week
	router.get('/shiftrequirements/day/:dayOfWeek', (req, res) => {
		try {
			const rows = shiftReqModel.getShiftRequirementsByDay(req.params.dayOfWeek);
			res.status(200).json({
				status: "success",
				statusCode: 200,
				success_message: "Shift requirements fetched successfully",
				error_message: "",
				payload: { shiftRequirements: rows }
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				status: "error",
				statusCode: 500,
				success_message: "",
				error_message: "Failed to fetch shift requirements by day",
				payload: {}
			});
		}
	});

	// Update shift requirement by ID
	router.put('/shiftrequirements/:id', (req, res) => {
        const { dayOfWeek, shift, skillId, preferred } = req.body;

		if (!dayOfWeek && !shift && !skillId && preferred === undefined) {
			return res.status(400).json({
				status: "error",
				statusCode: 400,
				success_message: "",
				error_message: "At least one field (dayOfWeek, shift, skillId, preferred) is required for update",
				payload: {}
			});
		}

		try {
			const existing = shiftReqModel.getShiftRequirementById(req.params.id);
			if (!existing) {
				return res.status(404).json({
					status: "error",
					statusCode: 404,
					success_message: "",
					error_message: "Shift requirement not found",
					payload: {}
				});
			}

            const result = shiftReqModel.updateShiftRequirement(req.params.id, {
                dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : existing.DayOfWeek,
                shift: shift !== undefined ? shift : existing.Shift,
                skillId: skillId !== undefined ? skillId : existing.SkillID,
                preferred: preferred !== undefined ? Number(preferred) : existing.Preferred
            });

			if (result.changes === 0) {
				return res.status(404).json({
					status: "error",
					statusCode: 404,
					success_message: "",
					error_message: "Shift requirement not found or no changes made",
					payload: {}
				});
			}

			res.status(200).json({
				status: "success",
				statusCode: 200,
				success_message: "Shift requirement updated successfully",
				error_message: "",
				payload: { requirementId: req.params.id }
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				status: "error",
				statusCode: 500,
				success_message: "",
				error_message: "Failed to update shift requirement",
				payload: {}
			});
		}
	});

	// Delete shift requirement by ID
	router.delete('/shiftrequirements/:id', (req, res) => {
		try {
			const result = shiftReqModel.deleteShiftRequirement(req.params.id);
			if (result.changes === 0) {
				return res.status(404).json({
					status: "error",
					statusCode: 404,
					success_message: "",
					error_message: "Shift requirement not found",
					payload: {}
				});
			}
			res.status(200).json({
				status: "success",
				statusCode: 200,
				success_message: "Shift requirement deleted successfully",
				error_message: "",
				payload: { deletedId: req.params.id }
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				status: "error",
				statusCode: 500,
				success_message: "",
				error_message: "Failed to delete shift requirement",
				payload: {}
			});
		}
	});
    
    // Bulk delete shift requirements
    router.delete('/shiftrequirements', (req, res) => {
        const { requirementIds } = req.body;
        if (!requirementIds || !Array.isArray(requirementIds)) {
            return res.status(400).json({
                status: "error",
                statusCode: 400,
                success_message: "",
                error_message: "requirementIds array is required",
                payload: {}
            });
        }
        
        try {
            const result = shiftReqModel.deleteShiftRequirements(requirementIds);
            res.status(200).json({
                status: "success",
                statusCode: 200,
                success_message: "Shift requirements deleted successfully",
                error_message: "",
                payload: { deletedCount: result.changes }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                status: "error",
                statusCode: 500,
                success_message: "",
                error_message: "Failed to delete shift requirements",
                payload: {}
            });
        }
    });

	app.use(router);
};
