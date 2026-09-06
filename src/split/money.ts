export function splitEqually(totalCents: number, parts: number): number[] {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}
