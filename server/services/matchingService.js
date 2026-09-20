const { analyzeGroupSplit, getBayNumber } = require('../utils/seatUtils');
const { calculateMatchScore } = require('../utils/matchingUtils');

/**
 * Matching Engine for Voluntary Railway Seat Swaps
 */
const findMatchesForJourney = ({ passengers = [], activeSwaps = [] }) => {
  const groupPassengers = passengers.filter((p) => p.groupId);
  const otherPassengers = passengers.filter((p) => !p.groupId && p.isAvailableForSwap !== false);

  if (groupPassengers.length <= 1) {
    return {
      groupSplitInfo: {
        isSplit: false,
        statusMessage: 'No group split detected. (Solo or 1 group member)',
        separatedCount: 0,
      },
      recommendations: [],
    };
  }

  const groupSplitInfo = analyzeGroupSplit(groupPassengers);

  // If not split, no swaps needed
  if (!groupSplitInfo.isSplit || groupSplitInfo.separatedPassengerIds.length === 0) {
    return {
      groupSplitInfo,
      recommendations: [],
    };
  }

  // Active swapped seat numbers or passenger IDs to exclude
  const excludedPassengerIds = new Set();
  activeSwaps.forEach((s) => {
    if (s.status === 'ACCEPTED' || s.status === 'PENDING') {
      excludedPassengerIds.add(s.requesterPassengerId.toString());
      excludedPassengerIds.add(s.targetPassengerId.toString());
    }
  });

  const separatedPassengers = groupPassengers.filter((p) => {
    const pId = p._id ? p._id.toString() : p.id;
    return groupSplitInfo.separatedPassengerIds.includes(pId);
  });

  const recommendations = [];

  separatedPassengers.forEach((requester) => {
    const requesterId = requester._id ? requester._id.toString() : requester.id;
    if (excludedPassengerIds.has(requesterId)) return;

    // Evaluate potential candidates
    otherPassengers.forEach((candidate) => {
      const candidateId = candidate._id ? candidate._id.toString() : candidate.id;
      if (excludedPassengerIds.has(candidateId)) return;
      if (candidate.coach !== requester.coach) return; // Must be in same coach for high viability

      const scoreResult = calculateMatchScore({
        requesterPassenger: requester,
        targetPassenger: candidate,
        groupClusterBay: groupSplitInfo.clusterBay,
        allGroupPassengers: groupPassengers,
      });

      // We only recommend if it brings passenger closer or achieves high compatibility
      const requesterBay = getBayNumber(requester.seatNumber);
      const targetBay = getBayNumber(candidate.seatNumber);
      const bringsCloser = Math.abs(targetBay - groupSplitInfo.clusterBay) < Math.abs(requesterBay - groupSplitInfo.clusterBay);

      if (bringsCloser || scoreResult.score >= 70) {
        recommendations.push({
          id: `rec_${requesterId}_${candidateId}`,
          requester: {
            id: requesterId,
            name: requester.name,
            coach: requester.coach,
            seatNumber: requester.seatNumber,
            berthType: requester.berthType,
            ageCategory: requester.ageCategory,
          },
          target: {
            id: candidateId,
            name: candidate.name,
            coach: candidate.coach,
            seatNumber: candidate.seatNumber,
            berthType: candidate.berthType,
            ageCategory: candidate.ageCategory,
          },
          matchScore: scoreResult.score,
          breakdown: scoreResult.breakdown,
          whyReasons: scoreResult.whyReasons,
          targetSeatNumber: candidate.seatNumber,
          requesterSeatNumber: requester.seatNumber,
          bringsCloser,
          targetDistanceReduction: Math.abs(requesterBay - groupSplitInfo.clusterBay) - Math.abs(targetBay - groupSplitInfo.clusterBay),
        });
      }
    });
  });

  // Sort recommendations descending by match score
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return {
    groupSplitInfo,
    recommendations,
  };
};

module.exports = {
  findMatchesForJourney,
};
