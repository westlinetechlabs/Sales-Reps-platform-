/**
 * Calculate commission based on project value (GHS).
 *
 * GHS 100–300   → GHS 20
 * GHS 301–600   → GHS 35
 * GHS 601–1000  → GHS 50
 * Above GHS 1000 → GHS 65
 * Below GHS 100  → GHS 0
 */
export function calculateCommission(projectValue: number): number {
  if (projectValue < 100) return 0;
  if (projectValue <= 300) return 20;
  if (projectValue <= 600) return 35;
  if (projectValue <= 1000) return 50;
  return 65;
}
