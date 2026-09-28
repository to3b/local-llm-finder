export function fitLabel(quality) {
  if (!Number.isFinite(quality)) return 'Unknown';
  if (quality >= 94) return 'Excellent';
  if (quality >= 88) return 'Very strong';
  if (quality >= 80) return 'Strong';
  if (quality >= 70) return 'Good';
  return 'Fair';
}

export function fitDelta(difference) {
  if (!Number.isFinite(difference)) return 'Unknown';
  if (difference >= 4) return 'Stronger';
  if (difference <= -4) return 'Weaker';
  return 'Similar';
}

// Joint #1 is intentionally strict: the ranking score must be effectively tied
// and the internal task-fit input must be within one point.
export function isTopTie(item, top) {
  return !!item && !!top &&
    Number.isFinite(item.rank) && Number.isFinite(top.rank) &&
    Number.isFinite(item.quality) && Number.isFinite(top.quality) &&
    Math.abs(item.rank - top.rank) <= .003 &&
    Math.abs(item.quality - top.quality) <= 1;
}
