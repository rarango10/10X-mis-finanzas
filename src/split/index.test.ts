import { describe, expect, it } from "vitest";
import {
  addExpense,
  addPerson,
  addSettlement,
  computeBalances,
  createLedger,
  removeExpense,
  suggestTransfers,
} from "./index.js";
import type { Ledger } from "./index.js";

describe("escenario end-to-end vía index.ts", () => {
  it("altas, gasto con sobrante, pago, eliminación, saldos y transferencias se comportan como se espera", () => {
    const emptyLedger = createLedger();

    const withAna = addPerson(emptyLedger, "Ana");
    if (!withAna.ok) throw new Error("expected ok");
    const withBeto = addPerson(withAna.value.ledger, "Beto");
    if (!withBeto.ok) throw new Error("expected ok");
    const withCaro = addPerson(withBeto.value.ledger, "Caro");
    if (!withCaro.ok) throw new Error("expected ok");

    const anaId = withAna.value.id;
    const betoId = withBeto.value.id;
    const caroId = withCaro.value.id;
    const ledgerWithPeople: Ledger = withCaro.value.ledger;

    const expenseToDiscard = addExpense(
      ledgerWithPeople,
      { amountCents: 100, paidBy: anaId, participants: [anaId], date: "2026-09-05" },
      "2026-09-05",
    );
    if (!expenseToDiscard.ok) throw new Error("expected ok");
    const removedDiscarded = removeExpense(expenseToDiscard.value.ledger, expenseToDiscard.value.id);
    if (!removedDiscarded.ok) throw new Error("expected ok");
    expect(removedDiscarded.value.expenses).toEqual(ledgerWithPeople.expenses);
    expect(computeBalances(removedDiscarded.value)).toEqual(computeBalances(ledgerWithPeople));

    const withExpense = addExpense(
      ledgerWithPeople,
      {
        amountCents: 1000,
        paidBy: anaId,
        participants: [anaId, betoId, caroId],
        date: "2026-09-05",
      },
      "2026-09-05",
    );
    if (!withExpense.ok) throw new Error("expected ok");

    const withSettlement = addSettlement(
      withExpense.value.ledger,
      { amountCents: 100, from: betoId, to: anaId, date: "2026-09-05" },
      "2026-09-05",
    );
    if (!withSettlement.ok) throw new Error("expected ok");

    const balances = computeBalances(withSettlement.value.ledger);
    const total = balances.reduce((sum, b) => sum + b.amountCents, 0);
    expect(total).toBe(0);

    const transfers = suggestTransfers(balances);

    let settledLedger = withSettlement.value.ledger;
    for (const transfer of transfers) {
      const applied = addSettlement(
        settledLedger,
        { amountCents: transfer.amountCents, from: transfer.from, to: transfer.to, date: "2026-09-05" },
        "2026-09-05",
      );
      if (!applied.ok) throw new Error("expected ok");
      settledLedger = applied.value.ledger;
    }

    expect(computeBalances(settledLedger).every((b) => b.amountCents === 0)).toBe(true);

    expect(emptyLedger.people).toEqual([]);
    expect(ledgerWithPeople.people).toHaveLength(3);
    expect(withExpense.value.ledger.settlements).toEqual([]);
  });
});
