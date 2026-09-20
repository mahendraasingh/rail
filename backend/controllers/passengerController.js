const mongoose = require('mongoose');
const Passenger = require('../models/Passenger');
const { getDBStatus } = require('../config/db');
const { getBerthTypeFromSeat } = require('../utils/seatUtils');
const { getInMemoryStore } = require('./journeyController');

// @desc    Add passenger to journey
// @route   POST /api/passengers
// @access  Private
const addPassenger = async (req, res) => {
  try {
    const { journeyId, name, coach, seatNumber, berthType, groupId, ageCategory, bookingStatus, isAvailableForSwap } = req.body;

    if (!journeyId || !name || !coach || seatNumber === undefined) {
      return res.status(400).json({ message: 'Missing required passenger fields' });
    }

    const seatNum = parseInt(seatNumber, 10);
    const resolvedBerth = berthType || getBerthTypeFromSeat(seatNum);
    const jIdStr = journeyId.toString();
    const newPassengerId = 'PASS_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    if (getDBStatus()) {
      const passenger = await Passenger.create({
        _id: newPassengerId,
        journeyId: jIdStr,
        name,
        coach: coach.toUpperCase().trim(),
        seatNumber: seatNum,
        berthType: resolvedBerth,
        groupId: groupId || null,
        ageCategory: ageCategory || 'ADULT',
        bookingStatus: bookingStatus || 'CNF',
        isAvailableForSwap: isAvailableForSwap !== undefined ? isAvailableForSwap : true,
      });
      return res.status(201).json(passenger);
    }

    // In-Memory store
    const store = getInMemoryStore();
    const newPassenger = {
      _id: newPassengerId,
      journeyId: jIdStr,
      name,
      coach: coach.toUpperCase().trim(),
      seatNumber: seatNum,
      berthType: resolvedBerth,
      groupId: groupId || null,
      ageCategory: ageCategory || 'ADULT',
      bookingStatus: bookingStatus || 'CNF',
      isAvailableForSwap: isAvailableForSwap !== undefined ? isAvailableForSwap : true,
    };
    store.passengers.push(newPassenger);

    return res.status(201).json(newPassenger);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get passengers for a journey
// @route   GET /api/journeys/:journeyId/passengers
// @access  Private
const getPassengersByJourney = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const jIdStr = journeyId.toString();

    if (getDBStatus()) {
      try {
        const passengers = await Passenger.find({ journeyId: jIdStr }).sort({ seatNumber: 1 });
        if (passengers.length > 0) return res.json(passengers);
      } catch (err) {
        console.warn('[Passenger fetch error]:', err.message);
      }
    }

    const store = getInMemoryStore();
    const passengers = store.passengers.filter((p) => p.journeyId && p.journeyId.toString() === jIdStr);
    return res.json(passengers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update passenger details / seat
// @route   PATCH /api/passengers/:id
// @access  Private
const updatePassenger = async (req, res) => {
  try {
    const { id } = req.params;
    const idStr = id.toString();
    const updates = req.body;

    if (updates.seatNumber) {
      updates.seatNumber = parseInt(updates.seatNumber, 10);
      if (!updates.berthType) {
        updates.berthType = getBerthTypeFromSeat(updates.seatNumber);
      }
    }

    if (getDBStatus()) {
      try {
        let passenger = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          passenger = await Passenger.findByIdAndUpdate(idStr, updates, { new: true });
        } else {
          passenger = await Passenger.findOneAndUpdate({ _id: idStr }, updates, { new: true });
        }
        if (passenger) return res.json(passenger);
      } catch (err) {
        console.warn('[Passenger update warning]:', err.message);
      }
    }

    const store = getInMemoryStore();
    const passenger = store.passengers.find((p) => p._id && p._id.toString() === idStr);
    if (!passenger) {
      return res.status(404).json({ message: 'Passenger not found' });
    }

    Object.assign(passenger, updates);
    return res.json(passenger);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addPassenger,
  getPassengersByJourney,
  updatePassenger,
};

