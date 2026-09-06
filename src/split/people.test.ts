import { describe, expect, it } from "vitest";
import { createLedger } from "./ledger.js";
import { addPerson, removePerson, renamePerson } from "./people.js";
import type { Ledger } from "./models.js";

describe("addPerson", () => {
  it("agrega la persona con un id propio y devuelve el ledger nuevo", () => {
    const ledger = createLedger();
    const result = addPerson(ledger, "Ana");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ledger.people).toHaveLength(1);
    expect(result.value.ledger.people[0]).toEqual({ id: result.value.id, name: "Ana" });
    expect(result.value.id).toBeTruthy();
  });

  it("no modifica el ledger recibido", () => {
    const ledger = createLedger();
    addPerson(ledger, "Ana");
    expect(ledger.people).toEqual([]);
  });

  it("dos altas seguidas reciben identificadores distintos", () => {
    const ledger = createLedger();
    const first = addPerson(ledger, "Ana");
    if (!first.ok) throw new Error("expected ok");
    const second = addPerson(first.value.ledger, "Beto");
    if (!second.ok) throw new Error("expected ok");

    expect(first.value.id).not.toBe(second.value.id);
    expect(second.value.ledger.people).toHaveLength(2);
  });

  it("rechaza un nombre vacío o compuesto solo por espacios", () => {
    const ledger = createLedger();
    const result = addPerson(ledger, "   ");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/no puede estar vacío/i);
  });

  it("rechaza un nombre duplicado sin distinguir mayúsculas ni espacios al borde", () => {
    const ledger = createLedger();
    const first = addPerson(ledger, "Ana");
    if (!first.ok) throw new Error("expected ok");

    const result = addPerson(first.value.ledger, "  ana  ");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeTruthy();
  });

  it("no cambia el ledger cuando el alta se rechaza", () => {
    const ledger = createLedger();
    const first = addPerson(ledger, "Ana");
    if (!first.ok) throw new Error("expected ok");
    const ledgerWithAna = first.value.ledger;

    addPerson(ledgerWithAna, "");
    addPerson(ledgerWithAna, "ana");

    expect(ledgerWithAna.people).toHaveLength(1);
  });
});

describe("renamePerson", () => {
  it("cambia el nombre de la persona indicada y devuelve el ledger nuevo", () => {
    const created = addPerson(createLedger(), "Ana");
    if (!created.ok) throw new Error("expected ok");

    const result = renamePerson(created.value.ledger, created.value.id, "Anita");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const person = result.value.people.find((p) => p.id === created.value.id);
    expect(person).toEqual({ id: created.value.id, name: "Anita" });
  });

  it("los gastos y pagos existentes siguen apuntando al mismo id tras el renombre", () => {
    const created = addPerson(createLedger(), "Ana");
    if (!created.ok) throw new Error("expected ok");
    const anaId = created.value.id;
    const ledgerWithExpense: Ledger = {
      ...created.value.ledger,
      expenses: [
        {
          id: "e-99",
          amountCents: 100,
          paidBy: anaId,
          participants: [anaId],
          date: "2026-01-01",
        },
      ],
    };

    const result = renamePerson(ledgerWithExpense, anaId, "Anita");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.expenses[0]?.paidBy).toBe(anaId);
    expect(result.value.expenses[0]?.participants).toEqual([anaId]);
  });

  it("rechaza el renombre con nombre vacío", () => {
    const created = addPerson(createLedger(), "Ana");
    if (!created.ok) throw new Error("expected ok");

    const result = renamePerson(created.value.ledger, created.value.id, "");

    expect(result.ok).toBe(false);
  });

  it("rechaza el renombre con un nombre duplicado con otra persona", () => {
    const withAna = addPerson(createLedger(), "Ana");
    if (!withAna.ok) throw new Error("expected ok");
    const withBeto = addPerson(withAna.value.ledger, "Beto");
    if (!withBeto.ok) throw new Error("expected ok");

    const result = renamePerson(withBeto.value.ledger, withBeto.value.id, "ANA");

    expect(result.ok).toBe(false);
  });

  it("permite renombrar a alguien con su propio nombre actual", () => {
    const created = addPerson(createLedger(), "Ana");
    if (!created.ok) throw new Error("expected ok");

    const result = renamePerson(created.value.ledger, created.value.id, "Ana");

    expect(result.ok).toBe(true);
  });

  it("rechaza el renombre de un identificador inexistente y lo menciona en el error", () => {
    const ledger = createLedger();

    const result = renamePerson(ledger, "p-404", "Nueva");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("p-404");
  });
});

describe("removePerson", () => {
  it("quita a la persona sin gastos ni pagos y no toca al resto", () => {
    const withAna = addPerson(createLedger(), "Ana");
    if (!withAna.ok) throw new Error("expected ok");
    const withBeto = addPerson(withAna.value.ledger, "Beto");
    if (!withBeto.ok) throw new Error("expected ok");

    const result = removePerson(withBeto.value.ledger, withBeto.value.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.people).toEqual([{ id: withAna.value.id, name: "Ana" }]);
  });

  it("rechaza la baja de una persona que participa en un gasto", () => {
    const withAna = addPerson(createLedger(), "Ana");
    if (!withAna.ok) throw new Error("expected ok");
    const anaId = withAna.value.id;
    const ledgerWithExpense: Ledger = {
      ...withAna.value.ledger,
      expenses: [
        {
          id: "e-1",
          amountCents: 100,
          paidBy: anaId,
          participants: [anaId],
          date: "2026-01-01",
        },
      ],
    };

    const result = removePerson(ledgerWithExpense, anaId);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/eliminar/i);
  });

  it("rechaza la baja de una persona que figura en un pago", () => {
    const withAna = addPerson(createLedger(), "Ana");
    if (!withAna.ok) throw new Error("expected ok");
    const withBeto = addPerson(withAna.value.ledger, "Beto");
    if (!withBeto.ok) throw new Error("expected ok");
    const anaId = withAna.value.id;
    const betoId = withBeto.value.id;
    const ledgerWithSettlement: Ledger = {
      ...withBeto.value.ledger,
      settlements: [{ id: "s-1", amountCents: 100, from: anaId, to: betoId, date: "2026-01-01" }],
    };

    const result = removePerson(ledgerWithSettlement, betoId);

    expect(result.ok).toBe(false);
  });

  it("rechaza la baja de un identificador inexistente y lo menciona en el error", () => {
    const ledger = createLedger();

    const result = removePerson(ledger, "p-404");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("p-404");
  });
});
