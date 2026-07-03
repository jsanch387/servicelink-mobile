/**
 * Compare semver-like strings (`1.0.6`, `1.0.10`). Missing segments treated as zero.
 * @returns {-1 | 0 | 1}
 */
export function compareAppVersions(left, right) {
  const leftParts = String(left ?? '')
    .trim()
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
  const rightParts = String(right ?? '')
    .trim()
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue < rightValue) {
      return -1;
    }
    if (leftValue > rightValue) {
      return 1;
    }
  }

  return 0;
}
