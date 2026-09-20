const { analyzeGroupSplits, getBayNumber } = require('../utils/seatUtils');
const { calculateMatchScore } = require('../utils/matchingUtils');

/**
 * Matching Engine for Voluntary Railway Seat Swaps
 *
 * - Each travelling group is analyzed independently (its own cluster bay).
 * - A passenger is "separated" only if they are far from THEIR OWN group's bay.
 * - Swap candidates include solo travellers AND willing members of OTHER
 *   groups (isAvailableForSwap !== false), same coach only.
 */
const findMatchesForJourney = ({ passengers = [], activeSwaps = [] }) => {
  const groupPassengers = passengers.filter((p) => p.groupId);

  if (groupPassengers.length <= 1) {
    return {
      groupSplitInfo: {
        isSplit: false,
        statusMessage: 'No group split detected. (Solo or 1 group member)',
        separatedCount: 0,
        separatedPassengerIds: [],
        splitGroupCount: 0,
        totalGroupCount: groupPassengers.length,
        clusterBay: null,
      },
      recommendations: [],
    };
  }

  const groupSplitInfo = analyzeGroupSplits(groupPassengers);

  if (!groupSplitInfo.isSplit || groupSplitInfo.separatedPassengerIds.length === 0) {
    return {
      groupSplitInfo,
      recommendations: [],
    };
  }

  // Per-group cluster bays and separated-member sets
  const clusterBayByGroup = new Map();
  groupSplitInfo.perGroup.forEach((g) => {
    if (g.isSplit) clusterBayByGroup.set(String(g.groupId), g.clusterBay);
  });
  const separatedIdSet = new Set(groupSplitInfo.separatedPassengerIds);

  // Active swapped seat numbers or passenger IDs to exclude
  const excludedPassengerIds = new Set();
  activeSwaps.forEach((s) => {
    if (s.status === 'ACCEPTED' || s.status === 'PENDING') {
      excludedPassengerIds.add(s.requesterPassengerId.toString());
      excludedPassengerIds.add(s.targetPassengerId.toString());
    }
  });

  const passengerId = (p) => (p._id ? p._id.toString() : p.id);

  // Separated requesters: split-group members away from their own cluster bay
  const separatedPassengers = groupPassengers.filter(
    (p) => separatedIdSet.has(passengerId(p)) && clusterBayByGroup.has(String(p.groupId))
  );

  // Candidates: willing passengers in a DIFFERENT group, or solo travellers.
  // Same coach is enforced later per requester.
  const candidatePool = passengers.filter((p) => {
    if (excludedPassengerIds.has(passengerId(p))) return false;
    if (p.isAvailableForSwap === false) return false;
    if (!p.groupId) return true; // solo traveller
    // Group member: must be willing AND from another (non-requester) group,
    // and must NOT themselves be a separated member of their own group.
    const gKey = String(p.groupId);
    return (
      clusterBayByGroup.has(gKey) === false &&
      !separatedIdSet.has(passengerId(p)) &&
      p.groupId !== undefined
    );
  });

  const recommendations = [];

  separatedPassengers.forEach((requester) => {
    const requesterId = passengerId(requester);
    if (excludedPassengerIds.has(requesterId)) return;

    const requesterGroupKey = String(requester.groupId);
    const groupClusterBay = clusterBayByGroup.get(requesterGroupKey);
    const requesterBay = getBayNumber(requester.seatNumber);

    candidatePool.forEach((candidate) => {
      const candidateId = passengerId(candidate);
      // Never match with own group members
      if (candidate.groupId && String(candidate.groupId) === requesterGroupKey) return;
      if (candidateId === requesterId) return;
      if (candidate.coach !== requester.coach) return; // Must be in same coach for high viability

      const scoreResult = calculateMatchScore({
        requesterPassenger: requester,
        targetPassenger: candidate,
        groupClusterBay,
        allGroupPassengers: groupPassengers,
      });

      const targetBay = getBayNumber(candidate.seatNumber);
      const bringsCloser =
        Math.abs(targetBay - groupClusterBay) < Math.abs(requesterBay - groupClusterBay);

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
          targetDistanceReduction:
            Math.abs(requesterBay - groupClusterBay) - Math.abs(targetBay - groupClusterBay),
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
