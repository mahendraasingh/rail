const express = require('express');
const router = express.Router();
const { getDatasetStatus, loadDataset } = require('../services/datasetService');

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

module.exports = router;
