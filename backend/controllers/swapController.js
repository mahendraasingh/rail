const SwapRequest = require('../models/SwapRequest');
const Passenger = require('../models/Passenger');
const Journey = require('../models/Journey');
const { getDBStatus } = require('../config/db');
const { findMatchesForJourney } = require('../services/matchingService');
const { getInMemoryStore } = require('./journeyController');

// @desc    Get match recommendations for a journey
// @route   GET /api/journeys/:journeyId/matches
// @access  Private
const getJourneyMatches = async (req, res) => {
  try {
    const { journeyId } = req.params;
    let passengers = [];
    let swaps = [];

    if (getDBStatus()) {
      passengers = await Passenger.find({ journeyId });
      swaps = await SwapRequest.find({ journeyId });
    }

    if (passengers.length === 0) {
      const store = getInMemoryStore();
      passengers = store.passengers.filter((p) => p.journeyId.toString() === journeyId);
      swaps = store.swaps.filter((s) => s.journeyId.toString() === journeyId);
    }

    const matchesResult = findMatchesForJourney({ passengers, activeSwaps: swaps });

    return res.json(matchesResult);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Initiate a voluntary seat exchange request
// @route   POST /api/swaps
// @access  Private
const createSwapRequest = async (req, res) => {
  try {
    const { journeyId, requesterPassengerId, targetPassengerId, reason, matchScore } = req.body;

    if (!journeyId || !requesterPassengerId || !targetPassengerId) {
      return res.status(400).json({ message: 'Missing required swap request parameters' });
    }

    let requester = null;
    let target = null;

    if (getDBStatus()) {
      requester = await Passenger.findById(requesterPassengerId);
      target = await Passenger.findById(targetPassengerId);
    }

    if (!requester || !target) {
      const store = getInMemoryStore();
      requester = requester || store.passengers.find((p) => p._id.toString() === requesterPassengerId.toString());
      target = target || store.passengers.find((p) => p._id.toString() === targetPassengerId.toString());
    }

    if (!requester || !target) {
      return res.status(404).json({ message: 'Requester or Target passenger not found' });
    }

    const requesterSeat = {
      coach: requester.coach,
      seatNumber: requester.seatNumber,
      berthType: requester.berthType,
    };

    const targetSeat = {
      coach: target.coach,
      seatNumber: target.seatNumber,
      berthType: target.berthType,
    };

    if (getDBStatus()) {
      const swap = await SwapRequest.create({
        journeyId,
        requesterPassengerId,
        targetPassengerId,
        requesterSeat,
        targetSeat,
        reason: reason || 'Travelling with group members and looking to sit closer together.',
        matchScore: matchScore || 85,
        status: 'PENDING',
      });

      return res.status(201).json(swap);
    }

    // In-memory store
    const store = getInMemoryStore();
    const newSwap = {
      _id: 'swap_' + Date.now(),
      journeyId,
      requesterPassengerId,
      targetPassengerId,
      requesterPassenger: requester,
      targetPassenger: target,
      requesterSeat,
      targetSeat,
      reason: reason || 'Travelling with group members and looking to sit closer together.',
      matchScore: matchScore || 85,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.swaps.unshift(newSwap);

    return res.status(201).json(newSwap);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get swaps received (for target passengers)
// @route   GET /api/swaps/received
// @access  Private
const getReceivedSwaps = async (req, res) => {
  try {
    let swaps = [];
    if (getDBStatus()) {
      swaps = await SwapRequest.find({ status: { $in: ['PENDING', 'ACCEPTED', 'REJECTED'] } })
        .populate('journeyId')
        .populate('requesterPassengerId')
        .populate('targetPassengerId')
        .sort({ createdAt: -1 });
      return res.json(swaps);
    }

    const store = getInMemoryStore();
    return res.json(store.swaps);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get swaps sent (by requesters)
// @route   GET /api/swaps/sent
// @access  Private
const getSentSwaps = async (req, res) => {
  try {
    let swaps = [];
    if (getDBStatus()) {
      swaps = await SwapRequest.find({})
        .populate('journeyId')
        .populate('requesterPassengerId')
        .populate('targetPassengerId')
        .sort({ createdAt: -1 });
      return res.json(swaps);
    }

    const store = getInMemoryStore();
    return res.json(store.swaps);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get swaps for a specific journey
// @route   GET /api/swaps/journey/:journeyId
// @access  Private
const getSwapsByJourney = async (req, res) => {
  try {
    const { journeyId } = req.params;
    if (getDBStatus()) {
      const swaps = await SwapRequest.find({ journeyId })
        .populate('requesterPassengerId')
        .populate('targetPassengerId')
        .sort({ createdAt: -1 });
      if (swaps.length > 0) return res.json(swaps);
    }

    const store = getInMemoryStore();
    const swaps = store.swaps.filter((s) => s.journeyId.toString() === journeyId);
    return res.json(swaps);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a voluntary seat swap request (Exchanges seats in application state)
// @route   POST /api/swaps/:id/accept
// @access  Private
const acceptSwap = async (req, res) => {
  try {
    const { id } = req.params;
    let swap = null;

    if (getDBStatus()) {
      swap = await SwapRequest.findById(id);
    }

    const store = getInMemoryStore();
    if (!swap) {
      swap = store.swaps.find((s) => s._id.toString() === id);
    }

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swap.status === 'ACCEPTED') {
      return res.status(400).json({ message: 'Swap request has already been accepted' });
    }

    // Exchange seats between requester and target passenger
    const reqPassengerId = swap.requesterPassengerId._id || swap.requesterPassengerId;
    const tgtPassengerId = swap.targetPassengerId._id || swap.targetPassengerId;

    if (getDBStatus()) {
      const requester = await Passenger.findById(reqPassengerId);
      const target = await Passenger.findById(tgtPassengerId);

      if (requester && target) {
        const tempSeat = requester.seatNumber;
        const tempBerth = requester.berthType;

        requester.seatNumber = target.seatNumber;
        requester.berthType = target.berthType;
        await requester.save();

        target.seatNumber = tempSeat;
        target.berthType = tempBerth;
        await target.save();
      }

      swap.status = 'ACCEPTED';
      await swap.save();

      return res.json({
        message: 'Exchange Confirmed! Seats have been rearranged in application journey state.',
        swap,
        arrangement: {
          requester: { id: reqPassengerId, newSeat: requester?.seatNumber, newBerth: requester?.berthType },
          target: { id: tgtPassengerId, newSeat: target?.seatNumber, newBerth: target?.berthType },
        },
        disclaimer: 'This confirmation represents the agreed exchange within RailTogether. It does not automatically modify an official railway reservation.',
      });
    }

    // In-memory swap execution
    const requester = store.passengers.find((p) => p._id.toString() === reqPassengerId.toString());
    const target = store.passengers.find((p) => p._id.toString() === tgtPassengerId.toString());

    if (requester && target) {
      const tempSeat = requester.seatNumber;
      const tempBerth = requester.berthType;

      requester.seatNumber = target.seatNumber;
      requester.berthType = target.berthType;

      target.seatNumber = tempSeat;
      target.berthType = tempBerth;
    }

    swap.status = 'ACCEPTED';
    swap.updatedAt = new Date().toISOString();

    return res.json({
      message: 'Exchange Confirmed! Seats have been rearranged in application journey state.',
      swap,
      arrangement: {
        requester: { id: reqPassengerId, newSeat: requester?.seatNumber, newBerth: requester?.berthType },
        target: { id: tgtPassengerId, newSeat: target?.seatNumber, newBerth: target?.berthType },
      },
      disclaimer: 'This confirmation represents the agreed exchange within RailTogether. It does not automatically modify an official railway reservation.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a voluntary seat swap request
// @route   POST /api/swaps/:id/reject
// @access  Private
const rejectSwap = async (req, res) => {
  try {
    const { id } = req.params;
    let swap = null;

    if (getDBStatus()) {
      swap = await SwapRequest.findById(id);
      if (swap) {
        swap.status = 'REJECTED';
        await swap.save();
        return res.json({ message: 'Exchange request declined.', swap });
      }
    }

    const store = getInMemoryStore();
    swap = store.swaps.find((s) => s._id.toString() === id);
    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    swap.status = 'REJECTED';
    swap.updatedAt = new Date().toISOString();

    return res.json({ message: 'Exchange request declined.', swap });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a voluntary seat swap request
// @route   POST /api/swaps/:id/cancel
// @access  Private
const cancelSwap = async (req, res) => {
  try {
    const { id } = req.params;
    let swap = null;

    if (getDBStatus()) {
      swap = await SwapRequest.findById(id);
      if (swap) {
        swap.status = 'CANCELLED';
        await swap.save();
        return res.json({ message: 'Exchange request cancelled.', swap });
      }
    }

    const store = getInMemoryStore();
    swap = store.swaps.find((s) => s._id.toString() === id);
    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    swap.status = 'CANCELLED';
    swap.updatedAt = new Date().toISOString();

    return res.json({ message: 'Exchange request cancelled.', swap });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get user notifications
// @route   GET /api/swaps/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = [
      {
        id: 'notif_1',
        title: 'Group Separation Alert',
        message: 'Your group on 12011 Shatabdi Express is split across Bays 4 and 8. 2 exchange opportunities found.',
        type: 'ALERT',
        timestamp: 'Just now',
        read: false,
      },
      {
        id: 'notif_2',
        title: 'High Compatibility Match Found',
        message: 'Rahul Sharma (B2-45) matches Sunita Sharma (B2-57) with a 91/100 compatibility score.',
        type: 'MATCH',
        timestamp: '5m ago',
        read: false,
      },
      {
        id: 'notif_3',
        title: 'Seat Exchange Policy Reminder',
        message: 'All exchanges are voluntary and consent-based. RailTogether assists in coordination.',
        type: 'INFO',
        timestamp: '1h ago',
        read: true,
      },
    ];

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getJourneyMatches,
  createSwapRequest,
  getReceivedSwaps,
  getSentSwaps,
  getSwapsByJourney,
  acceptSwap,
  rejectSwap,
  cancelSwap,
  getNotifications,
};
