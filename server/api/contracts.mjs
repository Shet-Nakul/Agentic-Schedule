import { Router } from 'express';
import ContractsModel from '../models/ContractsModel.mjs';

export default (app, db) => {
  const router = Router();
  const contractsModel = ContractsModel(db);

  // Create a new contract
  router.post('/contracts', (req, res) => {
    const contract = req.body;
    if (!contract.ContractID || !contract.Description) {
      return res.status(400).json({ error: "ContractID and Description are required" });
    }
    try {
      contractsModel.createContract(contract);
      res.json({ success: true, ContractID: contract.ContractID });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  // Get all contracts
  router.get('/contracts', (req, res) => {
    try {
      const rows = contractsModel.getAllContracts();
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.use(router);
};