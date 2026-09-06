import { describe, expect, it } from "vitest";
import { createLedger } from "./ledger.js";
import { addPerson } from "./people.js";
import { addExpense, removeExpense } from "./expenses.js";
import { addSettlement, removeSettlement } from "./settlements.js";
import { computeBalances, suggestTransfers } from "./balance.js";
import type { Ledger } from "./models.js";

function build(...names: string[]) {
  let ledger = createLedger();
  const ids: string[] = [];
  for (const name of names) {
    const result = addPerson(ledger, name);
    if (!result.ok) throw new Error("expected ok");
    ledger = result.value.ledger;
    ids.push(result.value.id);
  }
  return { ledger, ids };
}

describe("computeBalances", () => {
  it("devuelve un saldo por cada persona, en cero cuando no tiene entradas", () => {
    const { ledger } = build("Ana", "Beto", "Caro");

    const balances = computeBalances(ledger);

    expect(balances).toHaveLength(3);
    expect(balances.every((b) => b.amountCents === 0)).toBe(true);
  });

  it("devuelve una lista vacía sobre un ledger recién creado", () => {
    expect(computeBalances(createLedger())).toEqual([]);
  });

  it("respeta el orden de ledger.people", () => {
    const { ledger, ids } = build("Ana", "Beto", "Caro");
    const balances = computeBalances(ledger);
    expect(balances.map((b) => b.personId)).toEqual(ids);
  });

  it("calcula el saldo restando a lo que cada uno puso lo que le tocaba", () => {
    const { ledger, ids } = build("Ana", "Beto", "Caro");
    const [anaId, betoId, caroId] = ids;
    const ledgerWithExpense: Ledger = {
      ...ledger,
      expenses: [
        {
          id: "e-1",
          amountCents: 900,
          paidBy: anaId!,
          participants: [anaId!, betoId!, caroId!],
          date: "2026-09-05",
        },
      ],
    };

    const balances = computeBalances(ledgerWithExpense);

    expect(balances.find((b) => b.personId === anaId)?.amountCents).toBe(600);
    expect(balances.find((b) => b.personId === betoId)?.amountCents).toBe(-300);
    expect(balances.find((b) => b.personId === caroId)?.amountCents).toBe(-300);
  });

  it("mantiene la suma de los saldos exactamente en cero con sobrantes y pagos mezclados", () => {
    const { ledger, ids } = build("Ana", "Beto", "Caro");
    const [anaId, betoId, caroId] = ids;
    const ledgerWithData: Ledger = {
      ...ledger,
      expenses: [
        {
          id: "e-1",
          amountCents: 1000,
          paidBy: anaId!,
          participants: [anaId!, betoId!, caroId!],
          date: "2026-09-05",
        },
      ],
      settlements: [{ id: "s-1", amountCents: 100, from: betoId!, to: anaId!, date: "2026-09-05" }],
    };

    const balances = computeBalances(ledgerWithData);

    const total = balances.reduce((sum, b) => sum + b.amountCents, 0);
    expect(total).toBe(0);
  });

  it("no asigna ninguna parte a quien pagó un gasto sin participar", () => {
    const { ledger, ids } = build("Ana", "Beto", "Caro");
    const [anaId, betoId, caroId] = ids;
    const ledgerWithExpense: Ledger = {
      ...ledger,
      expenses: [
        {
          id: "e-1",
          amountCents: 600,
          paidBy: anaId!,
          participants: [betoId!, caroId!],
          date: "2026-09-05",
        },
      ],
    };

    const balances = computeBalances(ledgerWithExpense);

    expect(balances.find((b) => b.personId === anaId)?.amountCents).toBe(600);
    expect(balances.find((b) => b.personId === betoId)?.amountCents).toBe(-300);
    expect(balances.find((b) => b.personId === caroId)?.amountCents).toBe(-300);
  });

  it("acepta un pago que supera la deuda y deja el saldo a favor de quien pagó", () => {
    const { ledger, ids } = build("Ana", "Beto");
    const [anaId, betoId] = ids;
    const ledgerWithDebt: Ledger = {
      ...ledger,
      expenses: [
        {
          id: "e-1",
          amountCents: 600,
          paidBy: anaId!,
          participants: [anaId!, betoId!],
          date: "2026-09-05",
        },
      ],
    };
    const settlementResult = addSettlement(
      ledgerWithDebt,
      { amountCents: 500, from: betoId!, to: anaId!, date: "2026-09-05" },
      "2026-09-05",
    );
    if (!settlementResult.ok) throw new Error("expected ok");

    const balances = computeBalances(settlementResult.value.ledger);

    expect(balances.find((b) => b.personId === betoId)?.amountCents).toBe(200);
    expect(balances.find((b) => b.personId === anaId)?.amountCents).toBe(-200);
  });

  it("eliminar un gasto recalcula los saldos como si nunca se hubiera registrado", () => {
    const { ledger, ids } = build("Ana", "Beto");
    const [anaId, betoId] = ids;
    const before = computeBalances(ledger);

    const added = addExpense(
      ledger,
      { amountCents: 900, paidBy: anaId!, participants: [anaId!, betoId!], date: "2026-09-05" },
      "2026-09-05",
    );
    if (!added.ok) throw new Error("expected ok");

    const removed = removeExpense(added.value.ledger, added.value.id);
    if (!removed.ok) throw new Error("expected ok");

    expect(computeBalances(removed.value)).toEqual(before);
  });

  it("eliminar un pago recalcula los saldos como si nunca se hubiera registrado", () => {
    const { ledger, ids } = build("Ana", "Beto");
    const [anaId, betoId] = ids;
    const before = computeBalances(ledger);

    const added = addSettlement(
      ledger,
      { amountCents: 500, from: anaId!, to: betoId!, date: "2026-09-05" },
      "2026-09-05",
    );
    if (!added.ok) throw new Error("expected ok");

    const removed = removeSettlement(added.value.ledger, added.value.id);
    if (!removed.ok) throw new Error("expected ok");

    expect(computeBalances(removed.value)).toEqual(before);
  });
});

describe("suggestTransfers", () => {
  it("devuelve una lista vacía cuando todas las personas tienen saldo cero", () => {
    const { ids } = build("Ana", "Beto", "Caro");
    const balances = ids.map((personId) => ({ personId, amountCents: 0 }));

    expect(suggestTransfers(balances)).toEqual([]);
  });

  it("devuelve una lista vacía sobre una lista de saldos vacía", () => {
    expect(suggestTransfers([])).toEqual([]);
  });

  it("sugiere transferencias del mayor deudor al mayor acreedor, con montos positivos y sin que nadie pague y cobre a la vez", () => {
    const { ids } = build("Ana", "Beto", "Caro", "Dana");
    const [anaId, betoId, caroId, danaId] = ids;
    const balances = [
      { personId: anaId!, amountCents: -500 },
      { personId: betoId!, amountCents: 300 },
      { personId: caroId!, amountCents: -100 },
      { personId: danaId!, amountCents: 300 },
    ];

    const transfers = suggestTransfers(balances);

    expect(transfers.every((t) => t.amountCents > 0)).toBe(true);
    const payers = new Set(transfers.map((t) => t.from));
    const receivers = new Set(transfers.map((t) => t.to));
    for (const payer of payers) {
      expect(receivers.has(payer)).toBe(false);
    }
  });

  it("rompe empates por el orden de la persona en el ledger, de forma determinista", () => {
    const { ids } = build("Ana", "Beto", "Caro");
    const [anaId, betoId, caroId] = ids;
    const balances = [
      { personId: anaId!, amountCents: -300 },
      { personId: betoId!, amountCents: 300 },
      { personId: caroId!, amountCents: 300 },
    ];

    const first = suggestTransfers(balances);
    const second = suggestTransfers(balances);

    expect(first).toEqual(second);
    expect(first).toEqual([{ from: anaId, to: betoId, amountCents: 300 }]);
  });

  it("registrar todas las transferencias sugeridas como pagos deja todos los saldos en cero, incluso con sobrantes", () => {
    const { ledger, ids } = build("Ana", "Beto", "Caro");
    const [anaId, betoId, caroId] = ids;
    const withExpense = addExpense(
      ledger,
      {
        amountCents: 1000,
        paidBy: anaId!,
        participants: [anaId!, betoId!, caroId!],
        date: "2026-09-05",
      },
      "2026-09-05",
    );
    if (!withExpense.ok) throw new Error("expected ok");
    const withSettlement = addSettlement(
      withExpense.value.ledger,
      { amountCents: 50, from: betoId!, to: caroId!, date: "2026-09-05" },
      "2026-09-05",
    );
    if (!withSettlement.ok) throw new Error("expected ok");

    const balances = computeBalances(withSettlement.value.ledger);
    const transfers = suggestTransfers(balances);

    let ledgerAfterTransfers = withSettlement.value.ledger;
    for (const transfer of transfers) {
      const applied = addSettlement(
        ledgerAfterTransfers,
        { amountCents: transfer.amountCents, from: transfer.from, to: transfer.to, date: "2026-09-05" },
        "2026-09-05",
      );
      if (!applied.ok) throw new Error("expected ok");
      ledgerAfterTransfers = applied.value.ledger;
    }

    const finalBalances = computeBalances(ledgerAfterTransfers);
    expect(finalBalances.every((b) => b.amountCents === 0)).toBe(true);
  });
});
