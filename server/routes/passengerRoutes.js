const express = require('express');
const router = express.Router();
const {
  addPassenger,
  getPassengersByJourney,
  updatePassenger,
} = require('../controllers/passengerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addPassenger);
router.get('/journey/:journeyId', protect, getPassengersByJourney);
router.patch('/:id', protect, updatePassenger);

module.exports = router;
