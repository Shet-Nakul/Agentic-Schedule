import { Router } from 'express';
import ContractsModel from '../models/ContractsModel.mjs';

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const contractsModel = ContractsModel(db);

  // Create one or multiple contracts
  router.post('/contracts', (req, res) => {
    const contracts = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    let hasError = false;
    let errorResponse = null;

    for (const contract of contracts) {
      if (!contract.ContractID || !contract.Description) {
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 400,
          success_message: "",
          error_message: "ContractID and Description are required for each contract",
          payload: {}
        };
        break;
      }
      try {
        contractsModel.createContract(contract);
        results.push(contract.ContractID);
      } catch (err) {
        console.error(err);
        hasError = true;
        errorResponse = {
          status: "error",
          statusCode: 500,
          success_message: "",
          error_message: "Failed to create contract",
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
      success_message: "Contracts created successfully",
      error_message: "",
      payload: { contractIds: results }
    });
  });

  // Delete contracts by list of ContractID
  router.delete('/contracts', (req, res) => {
    const { contractIds } = req.body;
    if (!Array.isArray(contractIds) || contractIds.length === 0) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        success_message: "",
        error_message: "contractIds (array) is required",
        payload: {}
      });
    }
    try {
      const stmt = db.prepare("DELETE FROM ContractsDetails WHERE ContractID = ?");
      let deleted = 0;
      for (const id of contractIds) {
        const result = stmt.run(id);
        deleted += result.changes;
      }
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Contracts deleted successfully",
        error_message: "",
        payload: { deletedCount: deleted }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to delete contracts",
        payload: {}
      });
    }
  });

  // Get all contracts
  router.get('/contracts', (req, res) => {
    try {
      const rows = contractsModel.getAllContracts();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Contracts fetched successfully",
        error_message: "",
        payload: { contracts: rows }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to fetch contracts",
        payload: {}
      });
    }
  });

  // Update contract by ID
  router.put('/contracts/:id', (req, res) => {
    const contractId = req.params.id;
    try {
      const existing = contractsModel.getContractById(contractId);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Contract not found",
          payload: {}
        });
      }

      // Merge existing with provided fields; ignore ContractID changes
      const updated = {
        ContractID: existing.ContractID,
        Description: req.body.Description ?? existing.Description,
        SingleAssignmentPerDay: req.body.SingleAssignmentPerDay ?? existing.SingleAssignmentPerDay,
        MaxNumAssignments: req.body.MaxNumAssignments ?? existing.MaxNumAssignments,
        MinNumAssignments: req.body.MinNumAssignments ?? existing.MinNumAssignments,
        MaxConsecutiveWorkingDays: req.body.MaxConsecutiveWorkingDays ?? existing.MaxConsecutiveWorkingDays,
        MinConsecutiveWorkingDays: req.body.MinConsecutiveWorkingDays ?? existing.MinConsecutiveWorkingDays,
        MaxConsecutiveFreeDays: req.body.MaxConsecutiveFreeDays ?? existing.MaxConsecutiveFreeDays,
        MinConsecutiveFreeDays: req.body.MinConsecutiveFreeDays ?? existing.MinConsecutiveFreeDays,
        MaxConsecutiveWorkingWeekends: req.body.MaxConsecutiveWorkingWeekends ?? existing.MaxConsecutiveWorkingWeekends,
        MinConsecutiveWorkingWeekends: req.body.MinConsecutiveWorkingWeekends ?? existing.MinConsecutiveWorkingWeekends,
        MaxWorkingWeekendsInFourWeeks: req.body.MaxWorkingWeekendsInFourWeeks ?? existing.MaxWorkingWeekendsInFourWeeks,
        WeekendDefinition: req.body.WeekendDefinition ?? existing.WeekendDefinition,
        CompleteWeekends: req.body.CompleteWeekends ?? existing.CompleteWeekends,
        IdenticalShiftTypesDuringWeekend: req.body.IdenticalShiftTypesDuringWeekend ?? existing.IdenticalShiftTypesDuringWeekend,
        NoNightShiftBeforeFreeWeekend: req.body.NoNightShiftBeforeFreeWeekend ?? existing.NoNightShiftBeforeFreeWeekend,
        AlternativeSkillCategory: req.body.AlternativeSkillCategory ?? existing.AlternativeSkillCategory,
        UnwantedPatterns: req.body.UnwantedPatterns ?? existing.UnwantedPatterns,
      };

      const result = contractsModel.updateContract(contractId, updated);
      if (result.changes === 0) {
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          success_message: "",
          error_message: "Contract not found or no changes made",
          payload: {}
        });
      }

      res.status(200).json({
        status: "success",
        statusCode: 200,
        success_message: "Contract updated successfully",
        error_message: "",
        payload: { contractId }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        statusCode: 500,
        success_message: "",
        error_message: "Failed to update contract",
        payload: {}
      });
    }
  });

  app.use(router);
};
