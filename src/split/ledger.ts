import type { Ledger } from "./models.js";

export function createLedger(): Ledger {
  return { people: [], expenses: [], settlements: [], seq: 0 };
}

export function nextId(ledger: Ledger, prefix: string): { id: string; seq: number } {
  const seq = ledger.seq + 1;
  return { id: `${prefix}-${seq}`, seq };
}
