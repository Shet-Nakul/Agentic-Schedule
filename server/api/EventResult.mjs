import { Router } from 'express';
import EventResultModel from '../models/EventResultModel.mjs';

export default (app, db, hasActiveLicense) => {
  const router = Router();
  const eventModel = EventResultModel(db);

  // GET /eventresults?type=TYPE   or   GET /eventresults/type/:type
  router.get('/eventresults', (req, res) => {
    const { type } = req.query;
    if (!type) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        success_message: '',
        error_message: 'Query parameter "type" is required',
        payload: {}
      });
    }

    try {
      const rows = eventModel.getEventResultsByType(type);
      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        success_message: 'Event results fetched successfully',
        error_message: '',
        payload: { events: rows }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: 'error',
        statusCode: 500,
        success_message: '',
        error_message: 'Failed to fetch event results',
        payload: {}
      });
    }
  });

  router.get('/eventresults/type/:type', (req, res) => {
    const { type } = req.params;
    try {
      const rows = eventModel.getEventResultsByType(type);
      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        success_message: 'Event results fetched successfully',
        error_message: '',
        payload: { events: rows }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: 'error',
        statusCode: 500,
        success_message: '',
        error_message: 'Failed to fetch event results',
        payload: {}
      });
    }
  });

  app.use(router);
};
