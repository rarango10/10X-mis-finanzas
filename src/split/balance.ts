import { splitEqually } from "./money.js";
import type { Balance, Ledger, PersonId, Transfer } from "./models.js";

export function computeBalances(ledger: Ledger): Balance[] {
  const amounts = new Map<PersonId, number>(ledger.people.map((p) => [p.id, 0]));

  for (const expense of ledger.expenses) {
    amounts.set(expense.paidBy, (amounts.get(expense.paidBy) ?? 0) + expense.amountCents);
    const shares = splitEqually(expense.amountCents, expense.participants.length);
    expense.participants.forEach((participantId, i) => {
      amounts.set(participantId, (amounts.get(participantId) ?? 0) - shares[i]!);
    });
  }

  for (const settlement of ledger.settlements) {
    amounts.set(settlement.from, (amounts.get(settlement.from) ?? 0) + settlement.amountCents);
    amounts.set(settlement.to, (amounts.get(settlement.to) ?? 0) - settlement.amountCents);
  }

  return ledger.people.map((p) => ({ personId: p.id, amountCents: amounts.get(p.id) ?? 0 }));
}

export function suggestTransfers(balances: Balance[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.amountCents < 0)
    .map((b) => ({ personId: b.personId, amountCents: b.amountCents }))
    .sort((a, b) => a.amountCents - b.amountCents);
  const creditors = balances
    .filter((b) => b.amountCents > 0)
    .map((b) => ({ personId: b.personId, amountCents: b.amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);

  const transfers: Transfer[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0]!;
    const creditor = creditors[0]!;
    const amountCents = Math.min(-debtor.amountCents, creditor.amountCents);

    transfers.push({ from: debtor.personId, to: creditor.personId, amountCents });

    debtor.amountCents += amountCents;
    creditor.amountCents -= amountCents;

    if (debtor.amountCents === 0) debtors.shift();
    if (creditor.amountCents === 0) creditors.shift();
  }

  return transfers;
}
