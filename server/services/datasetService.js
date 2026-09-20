const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'dataset', 'uploads');

/**
 * Dataset Service for detecting, validating and loading synthetic railway datasets
 */
const getDatasetStatus = () => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return {
        available: false,
        message: 'No dataset uploaded. Please upload a synthetic railway dataset.',
        files: [],
      };
    }

    const files = fs.readdirSync(UPLOADS_DIR).filter((f) => f !== '.gitkeep' && !f.startsWith('.'));

    if (files.length === 0) {
      return {
        available: false,
        message: 'No dataset uploaded. Please upload a synthetic railway dataset.',
        files: [],
      };
    }

    return {
      available: true,
      message: `Found ${files.length} synthetic dataset file(s) in dataset/uploads.`,
      files,
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
 * Load and parse dataset files from dataset/uploads directory
 */
const loadDataset = async () => {
  const status = getDatasetStatus();
  if (!status.available) {
    return {
      success: false,
      message: status.message,
      data: { journeys: [], passengers: [] },
    };
  }

  const loadedJourneys = [];
  const loadedPassengers = [];

  for (const filename of status.files) {
    const filePath = path.join(UPLOADS_DIR, filename);
    const ext = path.extname(filename).toLowerCase();

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      if (ext === '.json') {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Could be an array of journeys or passengers
          parsed.forEach((item) => {
            if (item.pnr || item.trainNumber) {
              loadedJourneys.push(normalizeJourney(item));
            } else if (item.name && item.seatNumber) {
              loadedPassengers.push(normalizePassenger(item));
            }
          });
        } else if (typeof parsed === 'object') {
          if (Array.isArray(parsed.journeys)) {
            parsed.journeys.forEach((j) => loadedJourneys.push(normalizeJourney(j)));
          }
          if (Array.isArray(parsed.passengers)) {
            parsed.passengers.forEach((p) => loadedPassengers.push(normalizePassenger(p)));
          }
        }
      } else if (ext === '.csv') {
        const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim());
            const row = {};
            headers.forEach((h, idx) => {
              row[h] = values[idx] || '';
            });

            if (row.pnr || row.trainnumber || row.train_number) {
              loadedJourneys.push(normalizeJourneyFromCsv(row));
            } else if (row.name && (row.seatnumber || row.seat_number)) {
              loadedPassengers.push(normalizePassengerFromCsv(row));
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[DatasetService] Could not parse file ${filename}: ${err.message}`);
    }
  }

  return {
    success: true,
    message: `Successfully loaded ${loadedJourneys.length} journeys and ${loadedPassengers.length} passengers from dataset.`,
    data: {
      journeys: loadedJourneys,
      passengers: loadedPassengers,
    },
  };
};

// Normalizers
const normalizeJourney = (j) => ({
  pnr: j.pnr || 'PNR' + Math.floor(1000000000 + Math.random() * 9000000000),
  trainNumber: j.trainNumber || j.train_number || '12011',
  trainName: j.trainName || j.train_name || 'Shatabdi Express',
  source: j.source || 'New Delhi (NDLS)',
  destination: j.destination || 'Chandigarh (CDG)',
  journeyDate: j.journeyDate || j.journey_date || '2026-09-21',
  coach: (j.coach || 'B2').toUpperCase(),
  status: 'ACTIVE',
});

const normalizePassenger = (p) => ({
  name: p.name,
  coach: (p.coach || 'B2').toUpperCase(),
  seatNumber: parseInt(p.seatNumber || p.seat_number, 10),
  berthType: p.berthType || p.berth_type || 'LOWER',
  groupId: p.groupId || p.group_id || null,
  ageCategory: p.ageCategory || p.age_category || 'ADULT',
  bookingStatus: p.bookingStatus || p.booking_status || 'CNF',
  isAvailableForSwap: p.isAvailableForSwap !== undefined ? p.isAvailableForSwap : true,
});

const normalizeJourneyFromCsv = (row) => ({
  pnr: row.pnr || 'PNR' + Math.floor(1000000000 + Math.random() * 9000000000),
  trainNumber: row.trainnumber || row.train_number || '12011',
  trainName: row.trainname || row.train_name || 'Express',
  source: row.source || 'Station A',
  destination: row.destination || 'Station B',
  journeyDate: row.journeydate || row.journey_date || '2026-09-21',
  coach: (row.coach || 'B2').toUpperCase(),
  status: 'ACTIVE',
});

const normalizePassengerFromCsv = (row) => ({
  name: row.name,
  coach: (row.coach || 'B2').toUpperCase(),
  seatNumber: parseInt(row.seatnumber || row.seat_number, 10),
  berthType: row.berthtype || row.berth_type || 'LOWER',
  groupId: row.groupid || row.group_id || null,
  ageCategory: row.agecategory || row.age_category || 'ADULT',
  bookingStatus: row.bookingstatus || row.booking_status || 'CNF',
  isAvailableForSwap: true,
});

module.exports = {
  getDatasetStatus,
  loadDataset,
};
