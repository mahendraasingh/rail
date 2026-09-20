const mongoose = require('mongoose');
const SwapRequest = require('../models/SwapRequest');
const Passenger = require('../models/Passenger');
const Journey = require('../models/Journey');
const { getDBStatus } = require('../config/db');
const { findMatchesForJourney } = require('../services/matchingService');
const { getInMemoryStore } = require('./journeyController');

// Helper to safely find passenger by ID
const findPassengerById = async (id) => {
  if (!id) return null;
  const idStr = id.toString();
  if (getDBStatus()) {
    try {
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const doc = await Passenger.findById(idStr);
        if (doc) return doc;
      }
      const doc = await Passenger.findOne({ _id: idStr });
      if (doc) return doc;
    } catch (err) {
      console.warn('[Passenger Lookup Warning]:', err.message);
    }
  }
  const store = getInMemoryStore();
  return store.passengers.find((p) => p._id && p._id.toString() === idStr);
};

// Helper to safely find swap by ID
const findSwapById = async (id) => {
  if (!id) return null;
  const idStr = id.toString();
  if (getDBStatus()) {
    try {
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const doc = await SwapRequest.findById(idStr);
        if (doc) return doc;
      }
      const doc = await SwapRequest.findOne({ _id: idStr });
      if (doc) return doc;
    } catch (err) {
      console.warn('[Swap Lookup Warning]:', err.message);
    }
  }
  const store = getInMemoryStore();
  return store.swaps.find((s) => s._id && s._id.toString() === idStr);
};

// @desc    Get match recommendations for a journey
// @route   GET /api/journeys/:journeyId/matches
// @access  Private
const getJourneyMatches = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const jIdStr = journeyId.toString();
    let passengers = [];
    let swaps = [];

    if (getDBStatus()) {
      try {
        passengers = await Passenger.find({ journeyId: jIdStr });
        swaps = await SwapRequest.find({ journeyId: jIdStr });
      } catch (err) {
        console.warn('[Match Passenger lookup warning]:', err.message);
      }
    }

    if (passengers.length === 0) {
      const store = getInMemoryStore();
      passengers = store.passengers.filter((p) => p.journeyId && p.journeyId.toString() === jIdStr);
      swaps = store.swaps.filter((s) => s.journeyId && s.journeyId.toString() === jIdStr);
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

    const requester = await findPassengerById(requesterPassengerId);
    const target = await findPassengerById(targetPassengerId);

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

    const newSwapId = 'SWAP_' + Date.now();

    if (getDBStatus()) {
      try {
        const swap = await SwapRequest.create({
          _id: newSwapId,
          journeyId: journeyId.toString(),
          requesterPassengerId: requesterPassengerId.toString(),
          targetPassengerId: targetPassengerId.toString(),
          requesterSeat,
          targetSeat,
          reason: reason || 'Travelling with group members and looking to sit closer together.',
          matchScore: matchScore || 85,
          status: 'PENDING',
        });

        return res.status(201).json(swap);
      } catch (err) {
        console.warn('[DB swap create failed, falling back to memory]:', err.message);
      }
    }

    // In-memory store
    const store = getInMemoryStore();
    const newSwap = {
      _id: newSwapId,
      journeyId: journeyId.toString(),
      requesterPassengerId: requesterPassengerId.toString(),
      targetPassengerId: targetPassengerId.toString(),
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
      try {
        swaps = await SwapRequest.find({ status: { $in: ['PENDING', 'ACCEPTED', 'REJECTED'] } })
          .sort({ createdAt: -1 });
        if (swaps.length > 0) return res.json(swaps);
      } catch (_) {}
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
      try {
        swaps = await SwapRequest.find({})
          .sort({ createdAt: -1 });
        if (swaps.length > 0) return res.json(swaps);
      } catch (_) {}
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
    const jIdStr = journeyId.toString();

    if (getDBStatus()) {
      try {
        const swaps = await SwapRequest.find({ journeyId: jIdStr })
          .sort({ createdAt: -1 });
        if (swaps.length > 0) return res.json(swaps);
      } catch (_) {}
    }

    const store = getInMemoryStore();
    const swaps = store.swaps.filter((s) => s.journeyId && s.journeyId.toString() === jIdStr);
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
    const idStr = id.toString();
    let swap = await findSwapById(idStr);

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swap.status === 'ACCEPTED') {
      return res.status(400).json({ message: 'Swap request has already been accepted' });
    }

    // Exchange seats between requester and target passenger
    const reqPassengerId = (swap.requesterPassengerId?._id || swap.requesterPassengerId).toString();
    const tgtPassengerId = (swap.targetPassengerId?._id || swap.targetPassengerId).toString();

    const requester = await findPassengerById(reqPassengerId);
    const target = await findPassengerById(tgtPassengerId);

    if (requester && target) {
      const tempSeat = requester.seatNumber;
      const tempBerth = requester.berthType;

      requester.seatNumber = target.seatNumber;
      requester.berthType = target.berthType;

      target.seatNumber = tempSeat;
      target.berthType = tempBerth;

      if (getDBStatus() && typeof requester.save === 'function') {
        await requester.save();
        await target.save();
      }
    }

    swap.status = 'ACCEPTED';
    if (getDBStatus() && typeof swap.save === 'function') {
      await swap.save();
    } else {
      swap.updatedAt = new Date().toISOString();
    }

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
    const idStr = id.toString();
    const swap = await findSwapById(idStr);

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    swap.status = 'REJECTED';
    if (getDBStatus() && typeof swap.save === 'function') {
      await swap.save();
    } else {
      swap.updatedAt = new Date().toISOString();
    }

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
    const idStr = id.toString();
    const swap = await findSwapById(idStr);

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    swap.status = 'CANCELLED';
    if (getDBStatus() && typeof swap.save === 'function') {
      await swap.save();
    } else {
      swap.updatedAt = new Date().toISOString();
    }

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
