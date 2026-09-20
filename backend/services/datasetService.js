const fs = require('fs');
const path = require('path');
const { getDBStatus } = require('../config/db');

const UPLOADS_DIR = path.join(__dirname, '..', 'dataset', 'uploads');

// Parse cache: the relational dataset has 50k+ rows, so avoid re-parsing on every request.
// Cache is invalidated automatically whenever the uploaded files change.
let datasetCache = null;
let datasetCacheSignature = '';

const getUploadsSignature = () => {
  try {
    return fs
      .readdirSync(UPLOADS_DIR)
      .filter((f) => f.endsWith('.csv') || f.endsWith('.json'))
      .map((f) => {
        const st = fs.statSync(path.join(UPLOADS_DIR, f));
        return `${f}:${st.mtimeMs}`;
      })
      .sort()
      .join('|');
  } catch (_) {
    return '';
  }
};

/**
 * Simple CSV parser helper
 */
const parseCSV = (content) => {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Handle quotes if any, simple split works for standard CSV
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }
  return rows;
};

/**
 * Get current dataset status
 */
const getDatasetStatus = () => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return {
        available: false,
        message: 'No dataset directory found.',
        files: [],
      };
    }

    const files = fs.readdirSync(UPLOADS_DIR).filter((f) => f !== '.gitkeep' && !f.startsWith('.'));

    if (files.length === 0) {
      return {
        available: false,
        message: 'No dataset uploaded. Please generate or upload a synthetic railway dataset.',
        files: [],
      };
    }

    const csvFiles = files.filter((f) => f.endsWith('.csv'));
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    return {
      available: true,
      message: `Found ${files.length} synthetic dataset file(s) (${csvFiles.length} CSVs, ${jsonFiles.length} JSONs) in dataset/uploads.`,
      files,
      csvCount: csvFiles.length,
      jsonCount: jsonFiles.length,
    };
  } catch (error) {
    return {
      available: false,
      message: `Dataset detection error: ${error.message}`,
      files: [],
    };
  }
};

/**
 * Load and parse relational synthetic railway dataset from dataset/uploads/
 */
const loadDataset = async () => {
  const signature = getUploadsSignature();
  if (datasetCache && signature === datasetCacheSignature) {
    return datasetCache;
  }

  const status = getDatasetStatus();
  if (!status.available) {
    return {
      success: false,
      message: status.message,
      data: { journeys: [], passengers: [], summary: null },
    };
  }

  try {
    // Check if full relational CSV dataset exists
    const journeysPath = path.join(UPLOADS_DIR, 'journeys.csv');
    const trainsPath = path.join(UPLOADS_DIR, 'trains.csv');
    const stationsPath = path.join(UPLOADS_DIR, 'stations.csv');
    const bookingsPath = path.join(UPLOADS_DIR, 'bookings.csv');
    const passengersPath = path.join(UPLOADS_DIR, 'passengers.csv');
    const assignmentsPath = path.join(UPLOADS_DIR, 'seat_assignments.csv');
    const preferencesPath = path.join(UPLOADS_DIR, 'passenger_preferences.csv');
    const eligibilityPath = path.join(UPLOADS_DIR, 'exchange_eligibility.csv');
    const scenariosPath = path.join(UPLOADS_DIR, 'scenario_labels.csv');

    let loadedJourneys = [];
    let loadedPassengers = [];
    let scenarioLabels = [];
    let summaryData = null;

    if (fs.existsSync(journeysPath) && fs.existsSync(passengersPath)) {
      // Relational CSV dataset loading
      const trainsRows = fs.existsSync(trainsPath) ? parseCSV(fs.readFileSync(trainsPath, 'utf-8')) : [];
      const stationsRows = fs.existsSync(stationsPath) ? parseCSV(fs.readFileSync(stationsPath, 'utf-8')) : [];
      const journeysRows = parseCSV(fs.readFileSync(journeysPath, 'utf-8'));
      const bookingsRows = fs.existsSync(bookingsPath) ? parseCSV(fs.readFileSync(bookingsPath, 'utf-8')) : [];
      const passengersRows = parseCSV(fs.readFileSync(passengersPath, 'utf-8'));
      const assignmentsRows = fs.existsSync(assignmentsPath) ? parseCSV(fs.readFileSync(assignmentsPath, 'utf-8')) : [];
      const preferencesRows = fs.existsSync(preferencesPath) ? parseCSV(fs.readFileSync(preferencesPath, 'utf-8')) : [];
      const eligibilityRows = fs.existsSync(eligibilityPath) ? parseCSV(fs.readFileSync(eligibilityPath, 'utf-8')) : [];

      if (fs.existsSync(scenariosPath)) {
        scenarioLabels = parseCSV(fs.readFileSync(scenariosPath, 'utf-8'));
      }

      const summaryPath = path.join(UPLOADS_DIR, 'dataset_summary.json');
      if (fs.existsSync(summaryPath)) {
        try {
          summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
        } catch (_) {}
      }

      // The app renders ONE coach per journey (default 72-berth map), so each
      // journey's default coach must be its busiest assigned coach.
      const coachLoadByJourney = new Map();
      assignmentsRows.forEach((a) => {
        if (a.assignment_status && a.assignment_status !== 'ACTIVE') return;
        const perCoach = coachLoadByJourney.get(a.journey_id) || new Map();
        perCoach.set(a.coach_number, (perCoach.get(a.coach_number) || 0) + 1);
        coachLoadByJourney.set(a.journey_id, perCoach);
      });
      const busiestCoachFor = (journeyId) => {
        const perCoach = coachLoadByJourney.get(journeyId);
        if (!perCoach || perCoach.size === 0) return 'B2';
        let best = 'B2';
        let bestCount = -1;
        perCoach.forEach((count, coachNumber) => {
          if (count > bestCount) {
            bestCount = count;
            best = coachNumber;
          }
        });
        return best;
      };

      // Actual passenger count per group id (dataset rows include everyone).
      const groupSizeById = new Map();
      passengersRows.forEach((p) => {
        if (p.group_id) {
          groupSizeById.set(p.group_id, (groupSizeById.get(p.group_id) || 0) + 1);
        }
      });

      // Build indexing maps for fast lookup
      const trainMap = new Map();
      trainsRows.forEach((t) => trainMap.set(t.train_id, t));

      const stationMap = new Map();
      stationsRows.forEach((s) => stationMap.set(s.station_code, s));

      const bookingMap = new Map();
      bookingsRows.forEach((b) => bookingMap.set(b.booking_id, b));

      const assignmentMap = new Map();
      assignmentsRows.forEach((a) => {
        if (a.assignment_status === 'ACTIVE' || !a.assignment_status) {
          assignmentMap.set(a.passenger_id, a);
        }
      });

      const preferenceMap = new Map();
      preferencesRows.forEach((p) => preferenceMap.set(p.passenger_id, p));

      const eligibilityMap = new Map();
      eligibilityRows.forEach((e) => eligibilityMap.set(e.passenger_id, e));

      // Build Journeys
      journeysRows.forEach((j) => {
        const train = trainMap.get(j.train_id) || {};
        const originCode = j.origin_station_code || train.origin_station_code || 'NDLS';
        const destCode = j.destination_station_code || train.destination_station_code || 'CDG';

        const originStation = stationMap.get(originCode);
        const destStation = stationMap.get(destCode);

        const sourceName = originStation ? `${originStation.station_name} (${originCode})` : originCode;
        const destName = destStation ? `${destStation.station_name} (${destCode})` : destCode;

        loadedJourneys.push({
          _id: j.journey_id,
          journey_id: j.journey_id,
          pnr: `84${j.journey_id.replace(/\D/g, '').padStart(8, '0')}`,
          trainNumber: train.train_number || '12011',
          trainName: train.train_name || 'Railway Express',
          source: sourceName,
          destination: destName,
          journeyDate: j.journey_date || '2026-09-25',
          coach: busiestCoachFor(j.journey_id),
          status: j.journey_status || 'ACTIVE',
          createdBy: 'synthetic_dataset_importer',
        });
      });

      // Build Passengers
      passengersRows.forEach((p) => {
        const assignment = assignmentMap.get(p.passenger_id);
        const preference = preferenceMap.get(p.passenger_id);
        const eligibility = eligibilityMap.get(p.passenger_id);

        if (assignment) {
          const willing = preference
            ? preference.willing_to_exchange.toLowerCase() === 'true'
            : eligibility
            ? eligibility.eligible.toLowerCase() === 'true'
            : true;

          loadedPassengers.push({
            _id: p.passenger_id,
            passenger_id: p.passenger_id,
            journeyId: p.journey_id,
            name: p.full_name || p.name,
            // Single-passenger groups are genuine solo travellers: they must be
            // available as voluntary swap candidates (no groupId).
            groupId: p.group_id && groupSizeById.get(p.group_id) > 1 ? p.group_id : null,
            coach: assignment.coach_number || 'B2',
            seatNumber: parseInt(assignment.seat_number, 10),
            berthType: assignment.berth_type || 'LOWER',
            ageCategory: p.passenger_type || (parseInt(p.age, 10) >= 60 ? 'SENIOR' : 'ADULT'),
            bookingStatus: p.booking_status === 'CONFIRMED' ? 'CNF' : p.booking_status,
            isAvailableForSwap: willing,
          });
        }
      });
    } else {
      // Generic JSON / simple CSV fallback loader
      for (const filename of status.files) {
        const filePath = path.join(UPLOADS_DIR, filename);
        const ext = path.extname(filename).toLowerCase();
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (ext === '.json') {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              parsed.forEach((item) => {
                if (item.pnr || item.trainNumber) loadedJourneys.push(normalizeJourney(item));
                else if (item.name && item.seatNumber) loadedPassengers.push(normalizePassenger(item));
              });
            } else if (typeof parsed === 'object') {
              if (Array.isArray(parsed.journeys)) parsed.journeys.forEach((j) => loadedJourneys.push(normalizeJourney(j)));
              if (Array.isArray(parsed.passengers)) parsed.passengers.forEach((p) => loadedPassengers.push(normalizePassenger(p)));
            }
          }
        } catch (err) {
          console.warn(`[DatasetService] Could not parse file ${filename}: ${err.message}`);
        }
      }
    }

    const result = {
      success: true,
      message: `Successfully loaded ${loadedJourneys.length} journeys, ${loadedPassengers.length} confirmed passengers, and ${scenarioLabels.length} scenarios from synthetic dataset.`,
      data: {
        journeys: loadedJourneys,
        passengers: loadedPassengers,
        scenarios: scenarioLabels,
        summary: summaryData,
      },
    };

    datasetCache = result;
    datasetCacheSignature = signature;
    return result;
  } catch (error) {
    return {
      success: false,
      message: `Error parsing dataset: ${error.message}`,
      data: { journeys: [], passengers: [], summary: null },
    };
  }
};

/**
 * Dataset journeys use deterministic string ids (J000001, ...). Used to scope
 * coach-aware behavior to dataset journeys only.
 */
const isDatasetJourneyId = (id) => /^J\d{6,}$/.test(String(id || ''));

// Normalizer fallbacks
const normalizeJourney = (j) => ({
  _id: j.journey_id || j._id || 'j_' + Date.now(),
  pnr: j.pnr || 'PNR' + Math.floor(1000000000 + Math.random() * 9000000000),
  trainNumber: j.trainNumber || j.train_number || '12011',
  trainName: j.trainName || j.train_name || 'Shatabdi Express',
  source: j.source || 'New Delhi (NDLS)',
  destination: j.destination || 'Chandigarh (CDG)',
  journeyDate: j.journeyDate || j.journey_date || '2026-09-25',
  coach: (j.coach || 'B2').toUpperCase(),
  status: 'ACTIVE',
  createdBy: 'synthetic_dataset_importer',
});

const normalizePassenger = (p) => ({
  _id: p.passenger_id || p._id || 'p_' + Date.now(),
  journeyId: p.journeyId || p.journey_id,
  name: p.name || p.full_name,
  coach: (p.coach || 'B2').toUpperCase(),
  seatNumber: parseInt(p.seatNumber || p.seat_number, 10),
  berthType: p.berthType || p.berth_type || 'LOWER',
  groupId: p.groupId || p.group_id || null,
  ageCategory: p.ageCategory || p.passenger_type || 'ADULT',
  bookingStatus: p.bookingStatus || p.booking_status || 'CNF',
  isAvailableForSwap: p.isAvailableForSwap !== undefined ? p.isAvailableForSwap : true,
});

module.exports = {
  getDatasetStatus,
  loadDataset,
  isDatasetJourneyId,
};
