const express = require('express');
const router = express.Router();
const {
  createSwapRequest,
  getReceivedSwaps,
  getSentSwaps,
  getSwapsByJourney,
  acceptSwap,
  rejectSwap,
  cancelSwap,
  getNotifications,
} = require('../controllers/swapController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createSwapRequest);
router.get('/received', protect, getReceivedSwaps);
router.get('/sent', protect, getSentSwaps);
router.get('/notifications', protect, getNotifications);
router.get('/journey/:journeyId', protect, getSwapsByJourney);
router.post('/:id/accept', protect, acceptSwap);
router.post('/:id/reject', protect, rejectSwap);
router.post('/:id/cancel', protect, cancelSwap);

module.exports = router;
