const { getBerthTypeFromSeat, getBayNumber, analyzeGroupSplit } = require('../utils/seatUtils');

/**
 * Service to generate coach layout representation and seat map annotations
 */
const generateCoachSeatMap = ({ coach = 'B2', totalSeats = 72, passengers = [], recommendedSeats = [] }) => {
  const passengerMap = new Map();
  passengers.forEach((p) => {
    passengerMap.set(p.seatNumber, p);
  });

  const recommendedSeatNumbers = new Set(recommendedSeats.map((r) => r.targetSeatNumber));

  // Determine group split details
  const groupPassengers = passengers.filter((p) => p.groupId);
  const groupSplitInfo = analyzeGroupSplit(groupPassengers);
  const separatedIdSet = new Set(groupSplitInfo.separatedPassengerIds);

  const bays = [];
  const totalBays = Math.ceil(totalSeats / 8);

  for (let bayIdx = 1; bayIdx <= totalBays; bayIdx++) {
    const startSeat = (bayIdx - 1) * 8 + 1;
    const endSeat = Math.min(bayIdx * 8, totalSeats);

    const mainCabinSeats = [];
    const sideCabinSeats = [];

    for (let seatNum = startSeat; seatNum <= endSeat; seatNum++) {
      const berthType = getBerthTypeFromSeat(seatNum);
      const occupant = passengerMap.get(seatNum) || null;

      let category = 'EMPTY'; // 'GROUP', 'SEPARATED_GROUP', 'RECOMMENDED', 'OTHER', 'EMPTY'
      if (occupant) {
        if (occupant.groupId) {
          const occupantId = occupant._id ? occupant._id.toString() : occupant.id;
          if (separatedIdSet.has(occupantId)) {
            category = 'SEPARATED_GROUP';
          } else {
            category = 'GROUP';
          }
        } else {
          category = 'OTHER';
        }
      }

      if (category !== 'GROUP' && category !== 'SEPARATED_GROUP' && recommendedSeatNumbers.has(seatNum)) {
        category = 'RECOMMENDED';
      }

      const seatObj = {
        seatNumber: seatNum,
        berthType,
        bay: bayIdx,
        occupant: occupant
          ? {
              id: occupant._id ? occupant._id.toString() : occupant.id,
              name: occupant.name,
              groupId: occupant.groupId,
              ageCategory: occupant.ageCategory,
              bookingStatus: occupant.bookingStatus,
            }
          : null,
        category,
        isGroup: category === 'GROUP' || category === 'SEPARATED_GROUP',
        isSeparated: category === 'SEPARATED_GROUP',
        isRecommended: category === 'RECOMMENDED',
      };

      if (berthType === 'SIDE_LOWER' || berthType === 'SIDE_UPPER') {
        sideCabinSeats.push(seatObj);
      } else {
        mainCabinSeats.push(seatObj);
      }
    }

    bays.push({
      bayNumber: bayIdx,
      mainCabinSeats,
      sideCabinSeats,
      isClusterBay: groupSplitInfo.clusterBay === bayIdx,
    });
  }

  return {
    coach,
    totalSeats,
    groupSplitInfo,
    bays,
    passengerCount: passengers.length,
  };
};

module.exports = {
  generateCoachSeatMap,
};
