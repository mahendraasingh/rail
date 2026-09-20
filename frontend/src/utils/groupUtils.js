/**
 * Shared helpers to derive groups and per-group split info from the API shape.
 *
 * Backend groupSplitInfo (aggregate) = {
 *   isSplit, separatedCount, separatedPassengerIds[], statusMessage,
 *   splitGroupCount, totalGroupCount, perGroup: [ per-group result... ]
 * }
 *
 * Each perGroup entry = { groupId, isSplit, separatedCount, separatedPassengerIds[],
 *                         clusterBay, dominantBay, maxBaySpan, passengerBays[] }
 */

/** Aggregate per-group split entries from an aggregate groupSplitInfo (flat or nested). */
export const getPerGroupSplitInfos = (groupSplitInfo) => {
  if (!groupSplitInfo) return [];
  if (Array.isArray(groupSplitInfo.perGroup)) return groupSplitInfo.perGroup;
  if (Array.isArray(groupSplitInfo.perGroupSplitInfos)) return groupSplitInfo.perGroupSplitInfos;
  return [];
};

/** Find the per-group split result for one groupId. */
export const findGroupSplitInfo = (groupSplitInfo, groupId) => {
  const per = getPerGroupSplitInfos(groupSplitInfo);
  return per.find((g) => g.groupId === groupId) || null;
};

/**
 * Extract distinct groups (with passengers) from a journey detail payload.
 * Each group = { groupId, name, coach, passengers[], splitInfo }
 */
export const extractGroups = (detail) => {
  if (!detail?.passengers) return [];
  const byGroup = new Map();
  detail.passengers.forEach((p) => {
    if (!p.groupId) return;
    if (!byGroup.has(p.groupId)) {
      byGroup.set(p.groupId, {
        groupId: p.groupId,
        name: p.groupId,
        coach: p.coach,
        passengers: [],
      });
    }
    byGroup.get(p.groupId).passengers.push(p);
  });

  const perGroup = getPerGroupSplitInfos(detail.groupSplitInfo);
  const perMap = new Map(perGroup.map((g) => [g.groupId, g]));
  // Aggregate-level single-group info (non-dataset journeys) also carries groupId
  const aggregate = detail.groupSplitInfo?.groupId
    ? [detail.groupSplitInfo]
    : [];

  const groups = Array.from(byGroup.values());
  groups.forEach((g) => {
    g.splitInfo =
      perMap.get(g.groupId) ||
      aggregate.find((a) => a.groupId === g.groupId) ||
      null;
  });
  return groups;
};

/**
 * Seat numbers of the SEPARATED members of a group (from splitInfo ids ↔ passengers).
 * When no per-group splitInfo exists, fall back to the aggregate ids belonging to
 * this group's passengers.
 */
export const getSeparatedSeatNumbers = (group) => {
  if (!group) return [];
  const ids = new Set(
    (group.splitInfo?.separatedPassengerIds || []).map(String)
  );
  const members = (group.passengers || []).filter((p) => ids.has(String(p._id || p.id)));

  if (members.length) {
    return members.map((p) => p.seatNumber);
  }
  // Fallback: aggregate separated ids ∩ group members
  const aggIds = new Set(
    (group.splitInfo?.separatedPassengerIds || group.fallbackSeparatedIds || []).map(String)
  );
  return (group.passengers || [])
    .filter((p) => aggIds.has(String(p._id || p.id)))
    .map((p) => p.seatNumber);
};

/**
 * Group the separated seats into spatial clusters (same or adjacent bay = one cluster).
 * Used for cluster counts and CoachViz connection lines.
 */
export const buildSeatClusters = (separatedSeatNumbers) => {
  const sorted = [...(separatedSeatNumbers || [])].sort((a, b) => a - b);
  const clusters = [];
  let current = [];
  sorted.forEach((n) => {
    if (!current.length || n - current[current.length - 1] <= 4) {
      current.push(n);
    } else {
      clusters.push(current);
      current = [n];
    }
  });
  if (current.length) clusters.push(current);
  return clusters;
};
