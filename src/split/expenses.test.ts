import { describe, expect, it } from "vitest";
import { createLedger } from "./ledger.js";
import { addPerson } from "./people.js";
import { addExpense, removeExpense } from "./expenses.js";
import type { NewExpense } from "./expenses.js";

function twoPeopleLedger() {
  const withAna = addPerson(createLedger(), "Ana");
  if (!withAna.ok) throw new Error("expected ok");
  const withBeto = addPerson(withAna.value.ledger, "Beto");
  if (!withBeto.ok) throw new Error("expected ok");
  return { ledger: withBeto.value.ledger, anaId: withAna.value.id, betoId: withBeto.value.id };
}

describe("addExpense", () => {
  it("guarda un gasto válido con id propio", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const input: NewExpense = {
      amountCents: 1000,
      paidBy: anaId,
      participants: [anaId, betoId],
      date: "2026-09-05",
    };

    const result = addExpense(ledger, input, "2026-09-05");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBeTruthy();
    const stored = result.value.ledger.expenses.find((e) => e.id === result.value.id);
    expect(stored).toEqual({ id: result.value.id, ...input });
  });

  it("acepta un gasto cuyo pagador no figura entre los participantes", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 600, paidBy: anaId, participants: [betoId], date: "2026-09-05" },
      "2026-09-05",
    );

    expect(result.ok).toBe(true);
  });

  it("guarda un gasto sin descripción", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [anaId, betoId], date: "2026-09-05" },
      "2026-09-05",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ledger.expenses[0]?.description).toBeUndefined();
  });

  it("guarda un gasto con descripción", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      {
        amountCents: 500,
        paidBy: anaId,
        participants: [anaId, betoId],
        date: "2026-09-05",
        description: "Supermercado",
      },
      "2026-09-05",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ledger.expenses[0]?.description).toBe("Supermercado");
  });

  it("no modifica el ledger recibido", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [anaId, betoId], date: "2026-09-05" },
      "2026-09-05",
    );
    expect(ledger.expenses).toEqual([]);
  });

  it("rechaza un monto menor o igual a 0", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 0, paidBy: anaId, participants: [anaId, betoId], date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
  });

  it("rechaza una lista de participantes vacía", () => {
    const { ledger, anaId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [], date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
  });

  it("rechaza un participante repetido", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [anaId, betoId, anaId], date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
  });

  it("rechaza un pagador inexistente y lo menciona en el error", () => {
    const { ledger, betoId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 500, paidBy: "p-404", participants: [betoId], date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("p-404");
  });

  it("rechaza un participante inexistente y lo menciona en el error", () => {
    const { ledger, anaId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [anaId, "p-404"], date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("p-404");
  });

  it("rechaza una fecha posterior a today", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [anaId, betoId], date: "2026-09-06" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
  });

  it("acepta una fecha igual a today", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [anaId, betoId], date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(true);
  });
});

describe("removeExpense", () => {
  it("rechaza la eliminación de un gasto inexistente y lo menciona en el error", () => {
    const { ledger } = twoPeopleLedger();

    const result = removeExpense(ledger, "e-404");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("e-404");
  });

  it("no cambia el ledger cuando la eliminación se rechaza", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const added = addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [anaId, betoId], date: "2026-09-05" },
      "2026-09-05",
    );
    if (!added.ok) throw new Error("expected ok");

    removeExpense(added.value.ledger, "e-404");

    expect(added.value.ledger.expenses).toHaveLength(1);
  });

  it("no reutiliza el identificador de un gasto eliminado", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const first = addExpense(
      ledger,
      { amountCents: 500, paidBy: anaId, participants: [anaId, betoId], date: "2026-09-05" },
      "2026-09-05",
    );
    if (!first.ok) throw new Error("expected ok");

    const removed = removeExpense(first.value.ledger, first.value.id);
    if (!removed.ok) throw new Error("expected ok");

    const second = addExpense(
      removed.value,
      { amountCents: 500, paidBy: anaId, participants: [anaId, betoId], date: "2026-09-05" },
      "2026-09-05",
    );
    if (!second.ok) throw new Error("expected ok");

    expect(second.value.id).not.toBe(first.value.id);
  });
});
