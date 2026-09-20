const express = require('express');
const router = express.Router();
const { getDatasetStatus, loadDataset } = require('../services/datasetService');
const { seedDatasetJourneys } = require('../controllers/journeyController');

// @desc    Get dataset status
// @route   GET /api/dataset/status
// @access  Public
router.get('/status', (req, res) => {
  const status = getDatasetStatus();
  res.json(status);
});

// @desc    Load synthetic dataset
// @route   POST /api/dataset/load
// @access  Public
router.post('/load', async (req, res) => {
  const result = await loadDataset();
  res.json(result);
});

// @desc    Seed synthetic dataset into active application state
// @route   POST /api/dataset/seed
// @access  Public
router.post('/seed', seedDatasetJourneys);

module.exports = router;

