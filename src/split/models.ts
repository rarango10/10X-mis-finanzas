export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type PersonId = string;
export type ExpenseId = string;
export type SettlementId = string;
export type IsoDate = string; // "AAAA-MM-DD"

export type Created<Id> = { ledger: Ledger; id: Id };

export interface Person {
  id: PersonId;
  name: string;
}

export interface SharedExpense {
  id: ExpenseId;
  amountCents: number;
  paidBy: PersonId;
  participants: PersonId[];
  date: IsoDate;
  description?: string;
}

export interface Settlement {
  id: SettlementId;
  amountCents: number;
  from: PersonId;
  to: PersonId;
  date: IsoDate;
}

export interface Ledger {
  people: Person[];
  expenses: SharedExpense[];
  settlements: Settlement[];
  seq: number;
}

export interface Balance {
  personId: PersonId;
  amountCents: number;
}

export interface Transfer {
  from: PersonId;
  to: PersonId;
  amountCents: number;
}
