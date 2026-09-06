import { nextId } from "./ledger.js";
import type { Created, ExpenseId, IsoDate, Ledger, PersonId, Result } from "./models.js";

export interface NewExpense {
  amountCents: number;
  paidBy: PersonId;
  participants: PersonId[];
  date: IsoDate;
  description?: string;
}

export function addExpense(
  ledger: Ledger,
  input: NewExpense,
  today: IsoDate,
): Result<Created<ExpenseId>> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, error: "El monto del gasto debe ser mayor a 0" };
  }
  if (input.participants.length === 0) {
    return { ok: false, error: "El gasto debe tener al menos un participante" };
  }

  const personIds = new Set(ledger.people.map((p) => p.id));
  const missing = [input.paidBy, ...input.participants].find((id) => !personIds.has(id));
  if (missing) {
    return { ok: false, error: `No existe una persona con el identificador "${missing}"` };
  }

  const seen = new Set<PersonId>();
  const repeated = input.participants.find((id) => {
    if (seen.has(id)) return true;
    seen.add(id);
    return false;
  });
  if (repeated) {
    return { ok: false, error: `El participante "${repeated}" está repetido` };
  }

  if (input.date > today) {
    return { ok: false, error: "La fecha del gasto no puede ser posterior a hoy" };
  }

  const { id, seq } = nextId(ledger, "e");
  const newLedger: Ledger = {
    ...ledger,
    expenses: [...ledger.expenses, { id, ...input }],
    seq,
  };
  return { ok: true, value: { ledger: newLedger, id } };
}

export function removeExpense(ledger: Ledger, id: ExpenseId): Result<Ledger> {
  const exists = ledger.expenses.some((e) => e.id === id);
  if (!exists) {
    return { ok: false, error: `No existe un gasto con el identificador "${id}"` };
  }

  return {
    ok: true,
    value: {
      ...ledger,
      expenses: ledger.expenses.filter((e) => e.id !== id),
    },
  };
}
