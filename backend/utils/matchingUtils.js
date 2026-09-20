const { getBayNumber, calculateSeatDistance } = require('./seatUtils');

/**
 * Deterministic Compatibility Matching Engine for Hackathon MVP
 */
const calculateMatchScore = ({
  requesterPassenger,
  targetPassenger,
  groupClusterBay,
  allGroupPassengers,
}) => {
  let score = 0;
  const breakdown = [];
  const whyReasons = [];

  // 1. Coach Compatibility (+30 max)
  const isSameCoach = requesterPassenger.coach.toUpperCase() === targetPassenger.coach.toUpperCase();
  if (isSameCoach) {
    score += 30;
    breakdown.push({ factor: 'Same Coach', points: 30 });
    whyReasons.push('✓ Same coach');
  } else {
    breakdown.push({ factor: 'Different Coach', points: 0 });
  }

  // 2. Berth Type Compatibility (+20 max)
  const isSameBerth = requesterPassenger.berthType === targetPassenger.berthType;
  if (isSameBerth) {
    score += 20;
    breakdown.push({ factor: 'Identical Berth Type', points: 20 });
    whyReasons.push(`✓ Exact matching berth (${requesterPassenger.berthType.replace('_', ' ')})`);
  } else {
    // Compatible berth rules (e.g. Lower vs Middle, or Upper vs Side Upper)
    const requesterBerth = requesterPassenger.berthType;
    const targetBerth = targetPassenger.berthType;
    let partialPoints = 12;
    if ((requesterBerth === 'LOWER' && targetBerth === 'MIDDLE') || (requesterBerth === 'MIDDLE' && targetBerth === 'LOWER')) {
      partialPoints = 15;
    }
    score += partialPoints;
    breakdown.push({ factor: 'Compatible Berth Type', points: partialPoints });
    whyReasons.push('✓ Compatible berth category');
  }

  // 3. Proximity / Reduces Group Separation (+30 max)
  const targetBay = getBayNumber(targetPassenger.seatNumber);
  const requesterBay = getBayNumber(requesterPassenger.seatNumber);

  const currentDistanceToCluster = Math.abs(requesterBay - groupClusterBay);
  const newDistanceToCluster = Math.abs(targetBay - groupClusterBay);

  if (newDistanceToCluster === 0) {
    score += 30;
    breakdown.push({ factor: 'Placed in Same Bay as Group', points: 30 });
    whyReasons.push('✓ Brings passenger directly into the family/group compartment');
  } else if (newDistanceToCluster < currentDistanceToCluster) {
    const proximityGain = Math.round(30 * (1 - newDistanceToCluster / Math.max(currentDistanceToCluster, 1)));
    const awarded = Math.max(15, Math.min(28, proximityGain));
    score += awarded;
    breakdown.push({ factor: 'Significantly Closer to Group', points: awarded });
    whyReasons.push('✓ Reduces walking distance and brings group members closer');
  } else {
    breakdown.push({ factor: 'Proximity neutral or minor', points: 5 });
    score += 5;
  }

  // 4. Target Passenger Independence (+10 max)
  // If target passenger has no groupId (solo traveller), higher probability of agreeable voluntary exchange
  const isTargetSolo = !targetPassenger.groupId;
  if (isTargetSolo) {
    score += 10;
    breakdown.push({ factor: 'Target is Solo Passenger', points: 10 });
    whyReasons.push('✓ Passenger is a solo traveller available for voluntary exchange');
  } else {
    score += 4;
    breakdown.push({ factor: 'Target in Group', points: 4 });
  }

  // 5. Age / Special Compatibility (+10 max)
  if (requesterPassenger.ageCategory === 'SENIOR' && targetPassenger.berthType === 'LOWER') {
    score += 10;
    breakdown.push({ factor: 'Senior citizen accessibility match', points: 10 });
    whyReasons.push('✓ Highly beneficial for senior passenger');
  } else {
    score += 10;
    breakdown.push({ factor: 'General Passenger Eligibility', points: 10 });
    whyReasons.push('✓ Validated voluntary exchange compatibility');
  }

  const normalizedScore = Math.min(100, Math.max(10, score));

  return {
    score: normalizedScore,
    breakdown,
    whyReasons,
  };
};

module.exports = {
  calculateMatchScore,
};
