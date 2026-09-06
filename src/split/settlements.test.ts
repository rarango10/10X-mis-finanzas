import { describe, expect, it } from "vitest";
import { createLedger } from "./ledger.js";
import { addPerson } from "./people.js";
import { addSettlement, removeSettlement } from "./settlements.js";
import type { NewSettlement } from "./settlements.js";

function twoPeopleLedger() {
  const withAna = addPerson(createLedger(), "Ana");
  if (!withAna.ok) throw new Error("expected ok");
  const withBeto = addPerson(withAna.value.ledger, "Beto");
  if (!withBeto.ok) throw new Error("expected ok");
  return { ledger: withBeto.value.ledger, anaId: withAna.value.id, betoId: withBeto.value.id };
}

describe("addSettlement", () => {
  it("guarda un pago válido con id propio", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const input: NewSettlement = {
      amountCents: 500,
      from: anaId,
      to: betoId,
      date: "2026-09-05",
    };

    const result = addSettlement(ledger, input, "2026-09-05");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBeTruthy();
    const stored = result.value.ledger.settlements.find((s) => s.id === result.value.id);
    expect(stored).toEqual({ id: result.value.id, ...input });
  });

  it("no modifica el ledger recibido", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    addSettlement(ledger, { amountCents: 500, from: anaId, to: betoId, date: "2026-09-05" }, "2026-09-05");
    expect(ledger.settlements).toEqual([]);
  });

  it("rechaza un monto menor o igual a 0", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addSettlement(
      ledger,
      { amountCents: -100, from: anaId, to: betoId, date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
  });

  it("rechaza un pago de una persona a sí misma", () => {
    const { ledger, anaId } = twoPeopleLedger();
    const result = addSettlement(
      ledger,
      { amountCents: 500, from: anaId, to: anaId, date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
  });

  it("rechaza un 'from' inexistente y lo menciona en el error", () => {
    const { ledger, betoId } = twoPeopleLedger();
    const result = addSettlement(
      ledger,
      { amountCents: 500, from: "p-404", to: betoId, date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("p-404");
  });

  it("rechaza un 'to' inexistente y lo menciona en el error", () => {
    const { ledger, anaId } = twoPeopleLedger();
    const result = addSettlement(
      ledger,
      { amountCents: 500, from: anaId, to: "p-404", date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("p-404");
  });

  it("rechaza una fecha posterior a today", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addSettlement(
      ledger,
      { amountCents: 500, from: anaId, to: betoId, date: "2026-09-06" },
      "2026-09-05",
    );
    expect(result.ok).toBe(false);
  });

  it("acepta una fecha igual a today", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const result = addSettlement(
      ledger,
      { amountCents: 500, from: anaId, to: betoId, date: "2026-09-05" },
      "2026-09-05",
    );
    expect(result.ok).toBe(true);
  });
});

describe("removeSettlement", () => {
  it("rechaza la eliminación de un pago inexistente y lo menciona en el error", () => {
    const { ledger } = twoPeopleLedger();

    const result = removeSettlement(ledger, "s-404");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("s-404");
  });

  it("no cambia el ledger cuando la eliminación se rechaza", () => {
    const { ledger, anaId, betoId } = twoPeopleLedger();
    const added = addSettlement(
      ledger,
      { amountCents: 500, from: anaId, to: betoId, date: "2026-09-05" },
      "2026-09-05",
    );
    if (!added.ok) throw new Error("expected ok");

    removeSettlement(added.value.ledger, "s-404");

    expect(added.value.ledger.settlements).toHaveLength(1);
  });
});
