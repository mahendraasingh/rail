const express = require('express');
const router = express.Router();
const {
  createJourney,
  getJourneys,
  getJourneyById,
  getJourneySeatMap,
  seedDemoJourney,
  deleteJourney,
} = require('../controllers/journeyController');
const { getJourneyMatches } = require('../controllers/swapController');
const { protect } = require('../middleware/authMiddleware');

router.post('/demo-seed', seedDemoJourney);
router.route('/').post(protect, createJourney).get(protect, getJourneys);
router.route('/:id').get(protect, getJourneyById).delete(protect, deleteJourney);
router.get('/:id/seatmap', protect, getJourneySeatMap);
router.get('/:journeyId/matches', protect, getJourneyMatches);

module.exports = router;
