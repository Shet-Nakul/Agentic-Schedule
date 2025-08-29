import { Router } from 'express';
import ContractsModel from '../models/ContractsModel.mjs';

export default (app, db) => {
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

  app.use(router);
};