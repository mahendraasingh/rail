const Journey = require('../models/Journey');
const Passenger = require('../models/Passenger');
const SwapRequest = require('../models/SwapRequest');
const { getDBStatus } = require('../config/db');
const { analyzeGroupSplit, getBerthTypeFromSeat } = require('../utils/seatUtils');
const { generateCoachSeatMap } = require('../services/seatService');
const { findMatchesForJourney } = require('../services/matchingService');
const { loadDataset, getDatasetStatus } = require('../services/datasetService');

// In-Memory store fallback
let inMemoryJourneys = [];
let inMemoryPassengers = [];
let inMemorySwaps = [];

// Helper to seed initial demo data in-memory or mongo
const getDemoDataPayload = (userId) => {
  const journeyId = 'demo_journey_' + Date.now();
  const journey = {
    _id: journeyId,
    pnr: '8493027156',
    trainNumber: '12011',
    trainName: 'Kalka Shatabdi Express',
    source: 'New Delhi (NDLS)',
    destination: 'Chandigarh (CDG)',
    journeyDate: '2026-09-21',
    coach: 'B2',
    createdBy: userId || 'demo_user_1',
    status: 'ACTIVE',
  };

  const passengers = [
    // Group Members (Travelling together as family)
    {
      _id: 'p_grp_1',
      journeyId: journeyId,
      name: 'Mahendra (Self)',
      groupId: 'GRP_FAMILY_849',
      coach: 'B2',
      seatNumber: 31,
      berthType: 'UPPER',
      ageCategory: 'ADULT',
      bookingStatus: 'CNF',
      isAvailableForSwap: false,
    },
    {
      _id: 'p_grp_2',
      journeyId: journeyId,
      name: 'Father (Rajesh)',
      groupId: 'GRP_FAMILY_849',
      coach: 'B2',
      seatNumber: 32,
      berthType: 'SIDE_UPPER',
      ageCategory: 'SENIOR',
      bookingStatus: 'CNF',
      isAvailableForSwap: false,
    },
    {
      _id: 'p_grp_3',
      journeyId: journeyId,
      name: 'Mother (Sunita)',
      groupId: 'GRP_FAMILY_849',
      coach: 'B2',
      seatNumber: 57,
      berthType: 'LOWER',
      ageCategory: 'SENIOR',
      bookingStatus: 'CNF',
      isAvailableForSwap: true,
    },
    {
      _id: 'p_grp_4',
      journeyId: journeyId,
      name: 'Sister (Pooja)',
      groupId: 'GRP_FAMILY_849',
      coach: 'B2',
      seatNumber: 58,
      berthType: 'MIDDLE',
      ageCategory: 'ADULT',
      bookingStatus: 'CNF',
      isAvailableForSwap: true,
    },
    // Potential voluntary exchange passengers
    {
      _id: 'p_target_1',
      journeyId: journeyId,
      name: 'Rahul Sharma',
      groupId: null, // Solo traveller in Bay 6
      coach: 'B2',
      seatNumber: 45,
      berthType: 'LOWER',
      ageCategory: 'ADULT',
      bookingStatus: 'CNF',
      isAvailableForSwap: true,
    },
    {
      _id: 'p_target_2',
      journeyId: journeyId,
      name: 'Ananya Verma',
      groupId: null,
      coach: 'B2',
      seatNumber: 46,
      berthType: 'MIDDLE',
      ageCategory: 'ADULT',
      bookingStatus: 'CNF',
      isAvailableForSwap: true,
    },
    {
      _id: 'p_target_3',
      journeyId: journeyId,
      name: 'Amit Patel',
      groupId: null,
      coach: 'B2',
      seatNumber: 60,
      berthType: 'UPPER',
      ageCategory: 'ADULT',
      bookingStatus: 'CNF',
      isAvailableForSwap: true,
    },
    // Other coach passengers to populate realistic seat map
    {
      _id: 'p_other_1',
      journeyId: journeyId,
      name: 'Kavita Singh',
      groupId: null,
      coach: 'B2',
      seatNumber: 1,
      berthType: 'LOWER',
      ageCategory: 'ADULT',
      bookingStatus: 'CNF',
      isAvailableForSwap: true,
    },
    {
      _id: 'p_other_2',
      journeyId: journeyId,
      name: 'Vikas Gupta',
      groupId: null,
      coach: 'B2',
      seatNumber: 2,
      berthType: 'MIDDLE',
      ageCategory: 'ADULT',
      bookingStatus: 'CNF',
      isAvailableForSwap: true,
    },
  ];

  return { journey, passengers };
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

    const userId = req.user ? req.user._id : 'guest_hackathon_user';

    if (getDBStatus()) {
      const journey = await Journey.create({
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
      for (const p of passengers) {
        const seatNum = parseInt(p.seatNumber, 10);
        const berthType = p.berthType || getBerthTypeFromSeat(seatNum);
        const passDoc = await Passenger.create({
          name: p.name,
          journeyId: journey._id,
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
    const journeyId = 'journey_' + Date.now();
    const newJourney = {
      _id: journeyId,
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
        _id: `pass_${journeyId}_${idx + 1}`,
        journeyId: journeyId,
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
    const userId = req.user ? req.user._id : null;

    if (getDBStatus()) {
      const journeys = await Journey.find({}).sort({ createdAt: -1 });
      return res.json(journeys);
    }

    // If in-memory is empty, initialize with default demo journey
    if (inMemoryJourneys.length === 0) {
      const { journey, passengers } = getDemoDataPayload(userId);
      inMemoryJourneys.push(journey);
      inMemoryPassengers.push(...passengers);
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

    let journey = null;
    let passengers = [];
    let swaps = [];

    if (getDBStatus()) {
      journey = await Journey.findById(id);
      if (!journey) {
        // Check in memory in case seeded there
        journey = inMemoryJourneys.find((j) => j._id.toString() === id);
      }
      if (journey) {
        passengers = await Passenger.find({ journeyId: journey._id });
        if (passengers.length === 0) {
          passengers = inMemoryPassengers.filter((p) => p.journeyId.toString() === id);
        }
        swaps = await SwapRequest.find({ journeyId: journey._id });
      }
    } else {
      journey = inMemoryJourneys.find((j) => j._id.toString() === id);
      if (journey) {
        passengers = inMemoryPassengers.filter((p) => p.journeyId.toString() === id);
        swaps = inMemorySwaps.filter((s) => s.journeyId.toString() === id);
      }
    }

    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    const groupPassengers = passengers.filter((p) => p.groupId);
    const groupSplitInfo = analyzeGroupSplit(groupPassengers);
    const matchesResult = findMatchesForJourney({ passengers, activeSwaps: swaps });

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
    let journey = null;
    let passengers = [];
    let swaps = [];

    if (getDBStatus()) {
      journey = await Journey.findById(id);
      if (!journey) journey = inMemoryJourneys.find((j) => j._id.toString() === id);
      if (journey) {
        passengers = await Passenger.find({ journeyId: journey._id });
        if (passengers.length === 0) passengers = inMemoryPassengers.filter((p) => p.journeyId.toString() === id);
        swaps = await SwapRequest.find({ journeyId: journey._id });
      }
    } else {
      journey = inMemoryJourneys.find((j) => j._id.toString() === id);
      if (journey) {
        passengers = inMemoryPassengers.filter((p) => p.journeyId.toString() === id);
        swaps = inMemorySwaps.filter((s) => s.journeyId.toString() === id);
      }
    }

    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    const matchesResult = findMatchesForJourney({ passengers, activeSwaps: swaps });
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

// @desc    Seed the 1-Click Hackathon Demo Journey
// @route   POST /api/journeys/demo-seed
// @access  Public
const seedDemoJourney = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo_user_1';
    const { journey, passengers } = getDemoDataPayload(userId);

    // Save in DB if available
    if (getDBStatus()) {
      try {
        const jDoc = await Journey.create({
          pnr: journey.pnr,
          trainNumber: journey.trainNumber,
          trainName: journey.trainName,
          source: journey.source,
          destination: journey.destination,
          journeyDate: journey.journeyDate,
          coach: journey.coach,
          createdBy: userId,
          status: 'ACTIVE',
        });

        const createdPassengers = [];
        for (const p of passengers) {
          const passDoc = await Passenger.create({
            name: p.name,
            journeyId: jDoc._id,
            userId: userId,
            groupId: p.groupId,
            coach: p.coach,
            seatNumber: p.seatNumber,
            berthType: p.berthType,
            ageCategory: p.ageCategory,
            bookingStatus: p.bookingStatus,
            isAvailableForSwap: p.isAvailableForSwap,
          });
          createdPassengers.push(passDoc);
        }

        return res.status(201).json({
          message: 'Hackathon Demo Journey successfully initialized in Database!',
          journey: jDoc,
          passengers: createdPassengers,
        });
      } catch (err) {
        console.warn('DB seed failed, falling back to memory:', err.message);
      }
    }

    // In-memory setup
    inMemoryJourneys = inMemoryJourneys.filter((j) => j.pnr !== journey.pnr);
    inMemoryPassengers = inMemoryPassengers.filter((p) => p.journeyId !== journey._id);
    inMemorySwaps = inMemorySwaps.filter((s) => s.journeyId !== journey._id);

    inMemoryJourneys.unshift(journey);
    inMemoryPassengers.push(...passengers);

    return res.status(201).json({
      message: 'Hackathon Demo Journey successfully initialized in Memory!',
      journey,
      passengers,
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
    if (getDBStatus()) {
      await Journey.findByIdAndDelete(id);
      await Passenger.deleteMany({ journeyId: id });
      await SwapRequest.deleteMany({ journeyId: id });
    }

    inMemoryJourneys = inMemoryJourneys.filter((j) => j._id.toString() !== id);
    inMemoryPassengers = inMemoryPassengers.filter((p) => p.journeyId.toString() !== id);
    inMemorySwaps = inMemorySwaps.filter((s) => s.journeyId.toString() !== id);

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
  seedDemoJourney,
  seedDatasetJourneys,
  deleteJourney,
  getInMemoryStore,
};

