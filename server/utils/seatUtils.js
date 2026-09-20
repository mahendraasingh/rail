/**
 * Indian Railways Coach & Seat Utilities
 */

// Standard 3AC / Sleeper (72-berth) Berth Determination
const getBerthTypeFromSeat = (seatNumber) => {
  const num = parseInt(seatNumber, 10);
  if (isNaN(num) || num <= 0) return 'LOWER';
  const rem = num % 8;
  switch (rem) {
    case 1:
    case 4:
      return 'LOWER';
    case 2:
    case 5:
      return 'MIDDLE';
    case 3:
    case 6:
      return 'UPPER';
    case 7:
      return 'SIDE_LOWER';
    case 0: // 8th seat
      return 'SIDE_UPPER';
    default:
      return 'LOWER';
  }
};

// Get Bay/Compartment index (1 to 9 for 72-berth coach)
const getBayNumber = (seatNumber) => {
  const num = parseInt(seatNumber, 10);
  if (isNaN(num) || num <= 0) return 1;
  return Math.floor((num - 1) / 8) + 1;
};

// Calculate physical distance metric between two seats in the same coach
const calculateSeatDistance = (seatA, seatB) => {
  const sA = parseInt(seatA, 10);
  const sB = parseInt(seatB, 10);
  if (isNaN(sA) || isNaN(sB)) return 100;

  const bayA = getBayNumber(sA);
  const bayB = getBayNumber(sB);

  // Bay distance is the major physical separator in a train coach
  const bayDist = Math.abs(bayA - bayB);
  const rawDist = Math.abs(sA - sB);

  return bayDist * 10 + Math.min(rawDist, 8);
};

// Analyze a list of group passengers to detect if they are split
const analyzeGroupSplit = (groupPassengers) => {
  if (!groupPassengers || groupPassengers.length <= 1) {
    return {
      isSplit: false,
      statusMessage: 'Your group is seated together.',
      separatedCount: 0,
      separatedPassengerIds: [],
      clusterBay: groupPassengers && groupPassengers.length === 1 ? getBayNumber(groupPassengers[0].seatNumber) : null,
      maxBaySpan: 0,
      details: [],
    };
  }

  // Calculate bay distribution
  const bayCounts = {};
  const passengerBays = groupPassengers.map((p) => {
    const bay = getBayNumber(p.seatNumber);
    bayCounts[bay] = (bayCounts[bay] || 0) + 1;
    return {
      id: p._id ? p._id.toString() : p.id,
      name: p.name,
      seatNumber: p.seatNumber,
      coach: p.coach,
      bay,
    };
  });

  // Identify the dominant cluster bay (bay with the most members)
  let clusterBay = passengerBays[0].bay;
  let maxInCluster = 0;
  Object.keys(bayCounts).forEach((b) => {
    const bayNum = parseInt(b, 10);
    if (bayCounts[bayNum] > maxInCluster) {
      maxInCluster = bayCounts[bayNum];
      clusterBay = bayNum;
    }
  });

  // Calculate span
  const bays = passengerBays.map((p) => p.bay);
  const minBay = Math.min(...bays);
  const maxBay = Math.max(...bays);
  const maxBaySpan = maxBay - minBay;

  // Members are considered separated if their bay differs by > 0 from clusterBay (or > 1 bay away)
  const separatedMembers = passengerBays.filter((p) => Math.abs(p.bay - clusterBay) >= 1);
  const isSplit = maxBaySpan >= 1 || separatedMembers.length > 0;

  const separatedPassengerIds = separatedMembers.map((p) => p.id);

  let statusMessage = 'Your group is already seated together in the same compartment.';
  if (isSplit) {
    statusMessage = `Your group is currently split across the coach (Bays ${minBay} to ${maxBay}). ${separatedMembers.length} passenger${separatedMembers.length > 1 ? 's are' : ' is'} separated.`;
  }

  return {
    isSplit,
    statusMessage,
    separatedCount: separatedMembers.length,
    separatedPassengerIds,
    clusterBay,
    maxBaySpan,
    dominantBay: clusterBay,
    passengerBays,
  };
};

module.exports = {
  getBerthTypeFromSeat,
  getBayNumber,
  calculateSeatDistance,
  analyzeGroupSplit,
};
