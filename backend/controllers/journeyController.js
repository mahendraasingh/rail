const mongoose = require('mongoose');
const Journey = require('../models/Journey');
const Passenger = require('../models/Passenger');
const SwapRequest = require('../models/SwapRequest');
const { getDBStatus } = require('../config/db');
const { analyzeGroupSplit, getBerthTypeFromSeat } = require('../utils/seatUtils');
const { generateCoachSeatMap } = require('../services/seatService');
const { findMatchesForJourney } = require('../services/matchingService');
const { loadDataset, getDatasetStatus, isDatasetJourneyId } = require('../services/datasetService');

// In-Memory store fallback
let inMemoryJourneys = [];
let inMemoryPassengers = [];
let inMemorySwaps = [];

// Helper to safely find a journey by ID
const findJourneyById = async (id) => {
  if (!id) return null;
  const idStr = id.toString();

  if (getDBStatus()) {
    try {
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const doc = await Journey.findById(idStr);
        if (doc) return doc;
      }
      const doc = await Journey.findOne({ _id: idStr });
      if (doc) return doc;
    } catch (err) {
      console.warn('[Journey Lookup Warning]:', err.message);
    }
  }

  return inMemoryJourneys.find((j) => (j._id && j._id.toString() === idStr) || (j.journey_id && j.journey_id.toString() === idStr));
};

// Helper to safely find passengers by journey ID
const findPassengersByJourneyId = async (journeyId) => {
  if (!journeyId) return [];
  const jIdStr = journeyId.toString();

  if (getDBStatus()) {
    try {
      const docs = await Passenger.find({ journeyId: jIdStr });
      if (docs && docs.length > 0) return docs;
    } catch (err) {
      console.warn('[Passenger Lookup Warning]:', err.message);
    }
  }

  return inMemoryPassengers.filter((p) => p.journeyId && p.journeyId.toString() === jIdStr);
};

// Helper to remove legacy 1-Click Demo documents (string _ids like "demo_journey_...")
// that previously triggered "Cast to ObjectId failed" errors on lookup.
let hasPurgedLegacyDemoData = false;
const purgeLegacyDemoData = async () => {
  if (getDBStatus()) {
    try {
      const candidateJourneys = await Journey.find({}).select('_id createdBy').lean();
      const staleIds = candidateJourneys
        .filter(
          (j) =>
            String(j._id || '').startsWith('demo_journey_') ||
            String(j.createdBy || '').startsWith('demo_user')
        )
        .map((j) => String(j._id));

      if (staleIds.length > 0) {
        await Journey.deleteMany({ _id: { $in: staleIds } });
        await Passenger.deleteMany({ journeyId: { $in: staleIds } });
        await SwapRequest.deleteMany({ journeyId: { $in: staleIds } });
        console.log(`[Dataset] Removed ${staleIds.length} legacy demo journey document(s) from MongoDB.`);
      }
    } catch (err) {
      console.warn('[Demo Purge Warning]:', err.message);
    }
  }

  inMemoryJourneys = inMemoryJourneys.filter((j) => !String(j._id || '').startsWith('demo_journey_'));
  inMemoryPassengers = inMemoryPassengers.filter((p) => !String(p.journeyId || '').startsWith('demo_journey_'));
  inMemorySwaps = inMemorySwaps.filter((s) => !String(s.journeyId || '').startsWith('demo_journey_'));
};

// Helper to seed the synthetic dataset into database or memory if not present yet
const ensureDatasetLoaded = async () => {
  try {
    if (!hasPurgedLegacyDemoData) {
      await purgeLegacyDemoData();
      hasPurgedLegacyDemoData = true;
    }

    const datasetResult = await loadDataset();
    if (!datasetResult.success || !datasetResult.data) return;

    const { journeys, passengers } = datasetResult.data;
    if (journeys.length === 0) return;

    if (getDBStatus()) {
      // Seed whenever the dataset journeys are absent (not just when the collection is empty)
      const datasetJourneyCount = await Journey.countDocuments({ createdBy: 'synthetic_dataset_importer' });
      if (datasetJourneyCount === 0) {
        console.log(`[Dataset] Auto-seeding ${journeys.length} journeys and ${passengers.length} passengers into MongoDB...`);

        const journeyDocs = journeys.map((j) => ({
          _id: j._id || j.journey_id,
          pnr: j.pnr,
          trainNumber: j.trainNumber,
          trainName: j.trainName,
          source: j.source,
          destination: j.destination,
          journeyDate: j.journeyDate,
          coach: j.coach,
          createdBy: 'synthetic_dataset_importer',
          status: 'ACTIVE',
        }));
        await Journey.insertMany(journeyDocs, { ordered: false });

        const passengerDocs = passengers.map((p) => ({
          _id: p._id || p.passenger_id,
          journeyId: p.journeyId,
          name: p.name,
          groupId: p.groupId,
          coach: p.coach,
          seatNumber: p.seatNumber,
          berthType: p.berthType,
          ageCategory: p.ageCategory,
          bookingStatus: p.bookingStatus,
          isAvailableForSwap: p.isAvailableForSwap,
        }));
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < passengerDocs.length; i += CHUNK_SIZE) {
          await Passenger.insertMany(passengerDocs.slice(i, i + CHUNK_SIZE), { ordered: false });
        }

        console.log('[Dataset] Auto-seeding to MongoDB complete!');
      }
    }

    if (inMemoryJourneys.length === 0) {
      inMemoryJourneys.push(...journeys);
      inMemoryPassengers.push(...passengers);
    }
  } catch (err) {
    console.warn('[Dataset Init Error]:', err.message);
  }
};

// @desc    Create new journey with initial passengers
// @route   POST /api/journeys
// @access  Private
const createJourney = async (req, res) => {
  try {
    const { pnr, trainNumber, trainName, source, destination, journeyDate, coach, passengers = [] } = req.body;

    if (!pnr || !trainNumber || !trainName || !source || !destination || !journeyDate || !coach) {
      return res.status(400).json({ message: 'Please fill in all required journey fields' });
    }

    const userId = req.user ? (req.user._id || req.user.id) : 'guest_hackathon_user';
    const newJourneyId = 'JNY_' + Date.now();

    if (getDBStatus()) {
      const journey = await Journey.create({
        _id: newJourneyId,
        pnr: pnr.toUpperCase().trim(),
        trainNumber: trainNumber.trim(),
        trainName: trainName.trim(),
        source: source.trim(),
        destination: destination.trim(),
        journeyDate,
        coach: coach.toUpperCase().trim(),
        createdBy: userId,
        status: 'ACTIVE',
      });

      const createdPassengers = [];
      for (let idx = 0; idx < passengers.length; idx++) {
        const p = passengers[idx];
        const seatNum = parseInt(p.seatNumber, 10);
        const berthType = p.berthType || getBerthTypeFromSeat(seatNum);
        const passDoc = await Passenger.create({
          _id: `PASS_${newJourneyId}_${idx + 1}`,
          name: p.name,
          journeyId: newJourneyId,
          userId: userId,
          groupId: p.groupId !== undefined ? p.groupId : (p.isGroup !== false ? `GRP_${journey.pnr}` : null),
          coach: (p.coach || coach).toUpperCase().trim(),
          seatNumber: seatNum,
          berthType,
          ageCategory: p.ageCategory || 'ADULT',
          bookingStatus: p.bookingStatus || 'CNF',
          isAvailableForSwap: p.isAvailableForSwap !== undefined ? p.isAvailableForSwap : true,
        });
        createdPassengers.push(passDoc);
      }

      return res.status(201).json({
        journey,
        passengers: createdPassengers,
      });
    }

    // In-memory fallback
    const newJourney = {
      _id: newJourneyId,
      pnr: pnr.toUpperCase().trim(),
      trainNumber: trainNumber.trim(),
      trainName: trainName.trim(),
      source: source.trim(),
      destination: destination.trim(),
      journeyDate,
      coach: coach.toUpperCase().trim(),
      createdBy: userId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    inMemoryJourneys.unshift(newJourney);

    const createdPassengers = [];
    passengers.forEach((p, idx) => {
      const seatNum = parseInt(p.seatNumber, 10);
      const berthType = p.berthType || getBerthTypeFromSeat(seatNum);
      const passObj = {
        _id: `PASS_${newJourneyId}_${idx + 1}`,
        journeyId: newJourneyId,
        name: p.name,
        userId: userId,
        groupId: p.groupId !== undefined ? p.groupId : (p.isGroup !== false ? `GRP_${newJourney.pnr}` : null),
        coach: (p.coach || coach).toUpperCase().trim(),
        seatNumber: seatNum,
        berthType,
        ageCategory: p.ageCategory || 'ADULT',
        bookingStatus: p.bookingStatus || 'CNF',
        isAvailableForSwap: p.isAvailableForSwap !== undefined ? p.isAvailableForSwap : true,
      };
      inMemoryPassengers.push(passObj);
      createdPassengers.push(passObj);
    });

    return res.status(201).json({
      journey: newJourney,
      passengers: createdPassengers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all journeys for current user
// @route   GET /api/journeys
// @access  Private
const getJourneys = async (req, res) => {
  try {
    await ensureDatasetLoaded();

    if (getDBStatus()) {
      const journeys = await Journey.find({}).sort({ createdAt: -1 });
      if (journeys.length > 0) {
        return res.json(journeys);
      }
    }

    return res.json(inMemoryJourneys);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get journey details by ID with passengers & split analysis
// @route   GET /api/journeys/:id
// @access  Private
const getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureDatasetLoaded();

    const journey = await findJourneyById(id);
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    const journeyIdStr = (journey._id || journey.journey_id || id).toString();
    const passengers = await findPassengersByJourneyId(journeyIdStr);

    let swaps = [];
    if (getDBStatus()) {
      try {
        swaps = await SwapRequest.find({ journeyId: journeyIdStr });
      } catch (_) {}
    }
    if (swaps.length === 0) {
      swaps = inMemorySwaps.filter((s) => s.journeyId && s.journeyId.toString() === journeyIdStr);
    }

    const groupPassengers = passengers.filter((p) => p.groupId);
    const groupSplitInfo = analyzeGroupSplit(groupPassengers);
    // Matches are coach-specific; use only passengers seated in the journey's coach
    const matchesResult = findMatchesForJourney({
      passengers: isDatasetJourneyId(journeyIdStr)
        ? passengers.filter((p) => (p.coach || '').toString().toUpperCase() === (journey.coach || '').toString().toUpperCase())
        : passengers,
      activeSwaps: swaps,
    });

    return res.json({
      journey,
      passengers,
      groupPassengers,
      groupSplitInfo,
      recommendationCount: matchesResult.recommendations.length,
      swaps,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get Coach Seat Map
// @route   GET /api/journeys/:id/seatmap
// @access  Private
const getJourneySeatMap = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureDatasetLoaded();

    const journey = await findJourneyById(id);
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    const journeyIdStr = (journey._id || journey.journey_id || id).toString();
    const passengers = await findPassengersByJourneyId(journeyIdStr);

    let swaps = [];
    if (getDBStatus()) {
      try {
        swaps = await SwapRequest.find({ journeyId: journeyIdStr });
      } catch (_) {}
    }
    if (swaps.length === 0) {
      swaps = inMemorySwaps.filter((s) => s.journeyId && s.journeyId.toString() === journeyIdStr);
    }

    // Matches (and therefore RECOMMENDED seat highlighting) are coach-specific;
    // use only passengers seated in the journey's coach
    const matchesResult = findMatchesForJourney({
      passengers: isDatasetJourneyId(journeyIdStr)
        ? passengers.filter((p) => (p.coach || '').toString().toUpperCase() === (journey.coach || '').toString().toUpperCase())
        : passengers,
      activeSwaps: swaps,
    });
    const recommendedSeats = matchesResult.recommendations.map((r) => ({
      targetSeatNumber: r.target.seatNumber,
      requesterSeatNumber: r.requester.seatNumber,
      matchScore: r.matchScore,
    }));

    const seatMap = generateCoachSeatMap({
      coach: journey.coach || 'B2',
      totalSeats: 72,
      passengers,
      recommendedSeats,
    });

    return res.json({
      journey,
      seatMap,
      groupSplitInfo: seatMap.groupSplitInfo,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Delete Journey
// @route   DELETE /api/journeys/:id
// @access  Private
const deleteJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const idStr = id.toString();
    if (getDBStatus()) {
      try {
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          await Journey.findByIdAndDelete(idStr);
        } else {
          await Journey.deleteOne({ _id: idStr });
        }
        await Passenger.deleteMany({ journeyId: idStr });
        await SwapRequest.deleteMany({ journeyId: idStr });
      } catch (err) {
        console.warn('[Delete Error]:', err.message);
      }
    }

    inMemoryJourneys = inMemoryJourneys.filter((j) => (j._id && j._id.toString() !== idStr) && (j.journey_id && j.journey_id.toString() !== idStr));
    inMemoryPassengers = inMemoryPassengers.filter((p) => p.journeyId && p.journeyId.toString() !== idStr);
    inMemorySwaps = inMemorySwaps.filter((s) => s.journeyId && s.journeyId.toString() !== idStr);

    return res.json({ message: 'Journey removed successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Seed synthetic dataset into application state
// @route   POST /api/dataset/seed
// @access  Public
const seedDatasetJourneys = async (req, res) => {
  try {
    const datasetResult = await loadDataset();
    if (!datasetResult.success || !datasetResult.data) {
      return res.status(400).json(datasetResult);
    }

    const { journeys, passengers } = datasetResult.data;
    const userId = req.user ? req.user._id : 'dataset_importer';

    if (getDBStatus()) {
      try {
        let seededJourneysCount = 0;
        let seededPassengersCount = 0;

        for (const j of journeys) {
          const existing = await Journey.findOne({ pnr: j.pnr });
          if (!existing) {
            const jDoc = await Journey.create({
              pnr: j.pnr,
              trainNumber: j.trainNumber,
              trainName: j.trainName,
              source: j.source,
              destination: j.destination,
              journeyDate: j.journeyDate,
              coach: j.coach,
              createdBy: userId,
              status: 'ACTIVE',
            });
            seededJourneysCount++;

            const jPassengers = passengers.filter((p) => p.journeyId === j.journey_id || p.journeyId === j._id);
            for (const p of jPassengers) {
              await Passenger.create({
                name: p.name,
                journeyId: jDoc._id,
                userId,
                groupId: p.groupId,
                coach: p.coach,
                seatNumber: p.seatNumber,
                berthType: p.berthType,
                ageCategory: p.ageCategory,
                bookingStatus: p.bookingStatus,
                isAvailableForSwap: p.isAvailableForSwap,
              });
              seededPassengersCount++;
            }
          }
        }

        return res.status(201).json({
          success: true,
          message: `Successfully seeded ${seededJourneysCount} new dataset journeys and ${seededPassengersCount} passengers into Database!`,
          summary: datasetResult.data.summary,
        });
      } catch (err) {
        console.warn('DB dataset seed failed, falling back to memory:', err.message);
      }
    }

    // In-memory setup
    let seededJourneysCount = 0;
    let seededPassengersCount = 0;

    for (const j of journeys) {
      const exists = inMemoryJourneys.some((item) => item.pnr === j.pnr || item._id === j._id);
      if (!exists) {
        inMemoryJourneys.unshift(j);
        seededJourneysCount++;

        const jPassengers = passengers.filter((p) => p.journeyId === j.journey_id || p.journeyId === j._id);
        inMemoryPassengers.push(...jPassengers);
        seededPassengersCount += jPassengers.length;
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully loaded and seeded ${seededJourneysCount} synthetic dataset journeys (${seededPassengersCount} passengers) into Memory Store!`,
      totalJourneysInMemory: inMemoryJourneys.length,
      totalPassengersInMemory: inMemoryPassengers.length,
      summary: datasetResult.data.summary,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// In-memory data store getters/setters for use in other controllers
const getInMemoryStore = () => ({
  journeys: inMemoryJourneys,
  passengers: inMemoryPassengers,
  swaps: inMemorySwaps,
});

module.exports = {
  createJourney,
  getJourneys,
  getJourneyById,
  getJourneySeatMap,
  seedDatasetJourneys,
  deleteJourney,
  getInMemoryStore,
  findJourneyById,
};

