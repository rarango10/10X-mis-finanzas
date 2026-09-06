import { nextId } from "./ledger.js";
import type { Created, IsoDate, Ledger, PersonId, Result, SettlementId } from "./models.js";

export interface NewSettlement {
  amountCents: number;
  from: PersonId;
  to: PersonId;
  date: IsoDate;
}

export function addSettlement(
  ledger: Ledger,
  input: NewSettlement,
  today: IsoDate,
): Result<Created<SettlementId>> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, error: "El monto del pago debe ser mayor a 0" };
  }
  if (input.from === input.to) {
    return { ok: false, error: "Quien paga y quien recibe no pueden ser la misma persona" };
  }

  const personIds = new Set(ledger.people.map((p) => p.id));
  const missing = [input.from, input.to].find((id) => !personIds.has(id));
  if (missing) {
    return { ok: false, error: `No existe una persona con el identificador "${missing}"` };
  }

  if (input.date > today) {
    return { ok: false, error: "La fecha del pago no puede ser posterior a hoy" };
  }

  const { id, seq } = nextId(ledger, "s");
  const newLedger: Ledger = {
    ...ledger,
    settlements: [...ledger.settlements, { id, ...input }],
    seq,
  };
  return { ok: true, value: { ledger: newLedger, id } };
}

export function removeSettlement(ledger: Ledger, id: SettlementId): Result<Ledger> {
  const exists = ledger.settlements.some((s) => s.id === id);
  if (!exists) {
    return { ok: false, error: `No existe un pago con el identificador "${id}"` };
  }

  return {
    ok: true,
    value: {
      ...ledger,
      settlements: ledger.settlements.filter((s) => s.id !== id),
    },
  };
}
