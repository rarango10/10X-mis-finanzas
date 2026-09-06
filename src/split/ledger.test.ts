import { describe, expect, it } from "vitest";
import { createLedger, nextId } from "./ledger.js";

describe("createLedger", () => {
  it("devuelve un ledger con people, expenses y settlements vacíos y seq en 0", () => {
    const ledger = createLedger();
    expect(ledger).toEqual({ people: [], expenses: [], settlements: [], seq: 0 });
  });
});

describe("nextId", () => {
  it("emite el identificador con el prefijo del tipo de entidad y el seq incrementado", () => {
    const ledger = createLedger();
    const { id, seq } = nextId(ledger, "p");
    expect(id).toBe("p-1");
    expect(seq).toBe(1);
  });

  it("no reutiliza números: dos emisiones seguidas dan identificadores distintos", () => {
    const ledger = createLedger();
    const first = nextId(ledger, "e");
    const ledgerAfterFirst = { ...ledger, seq: first.seq };
    const second = nextId(ledgerAfterFirst, "e");
    expect(first.id).toBe("e-1");
    expect(second.id).toBe("e-2");
  });
});
