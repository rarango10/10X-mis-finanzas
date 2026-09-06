import { nextId } from "./ledger.js";
import type { Created, Ledger, PersonId, Result } from "./models.js";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function addPerson(ledger: Ledger, name: string): Result<Created<PersonId>> {
  const trimmed = name.trim();
  if (trimmed === "") {
    return { ok: false, error: "El nombre no puede estar vacío" };
  }
  const normalized = normalizeName(name);
  const duplicate = ledger.people.find((person) => normalizeName(person.name) === normalized);
  if (duplicate) {
    return { ok: false, error: `Ya existe una persona con el nombre "${duplicate.name}"` };
  }

  const { id, seq } = nextId(ledger, "p");
  const newLedger: Ledger = {
    ...ledger,
    people: [...ledger.people, { id, name }],
    seq,
  };
  return { ok: true, value: { ledger: newLedger, id } };
}

export function renamePerson(ledger: Ledger, id: PersonId, name: string): Result<Ledger> {
  const person = ledger.people.find((p) => p.id === id);
  if (!person) {
    return { ok: false, error: `No existe una persona con el identificador "${id}"` };
  }

  const trimmed = name.trim();
  if (trimmed === "") {
    return { ok: false, error: "El nombre no puede estar vacío" };
  }
  const normalized = normalizeName(name);
  const duplicate = ledger.people.find(
    (p) => p.id !== id && normalizeName(p.name) === normalized,
  );
  if (duplicate) {
    return { ok: false, error: `Ya existe una persona con el nombre "${duplicate.name}"` };
  }

  return {
    ok: true,
    value: {
      ...ledger,
      people: ledger.people.map((p) => (p.id === id ? { ...p, name } : p)),
    },
  };
}

export function removePerson(ledger: Ledger, id: PersonId): Result<Ledger> {
  const person = ledger.people.find((p) => p.id === id);
  if (!person) {
    return { ok: false, error: `No existe una persona con el identificador "${id}"` };
  }

  const isReferenced =
    ledger.expenses.some((e) => e.paidBy === id || e.participants.includes(id)) ||
    ledger.settlements.some((s) => s.from === id || s.to === id);
  if (isReferenced) {
    return {
      ok: false,
      error: "No se puede eliminar: primero hay que eliminar los gastos y pagos que la referencian",
    };
  }

  return {
    ok: true,
    value: {
      ...ledger,
      people: ledger.people.filter((p) => p.id !== id),
    },
  };
}
