import { describe, expect, it } from "vitest";
import { formatAmount, splitEqually, toCents } from "./money.js";

describe("splitEqually", () => {
  it("reparte en partes exactamente iguales cuando el monto es divisible", () => {
    expect(splitEqually(900, 3)).toEqual([300, 300, 300]);
  });

  it("reparte el sobrante de a un centavo entre los primeros participantes", () => {
    expect(splitEqually(1000, 3)).toEqual([334, 333, 333]);
  });

  it("la suma de las partes es exactamente el total, para cualquier monto y cantidad", () => {
    const cases: Array<[number, number]> = [
      [1000, 3],
      [901, 7],
      [1, 5],
      [0, 4],
      [12345, 6],
    ];
    for (const [totalCents, parts] of cases) {
      const shares = splitEqually(totalCents, parts);
      expect(shares.reduce((sum, share) => sum + share, 0)).toBe(totalCents);
    }
  });
});

describe("toCents", () => {
  it("convierte un monto decimal a centavos enteros", () => {
    expect(toCents(10.5)).toBe(1050);
  });

  it("no arrastra el error de punto flotante", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
  });

  it("convierte un monto entero sin decimales", () => {
    expect(toCents(10)).toBe(1000);
  });
});

describe("formatAmount", () => {
  it("formatea centavos como string con dos decimales", () => {
    expect(formatAmount(1050)).toBe("10.50");
  });

  it("formatea montos negativos", () => {
    expect(formatAmount(-1050)).toBe("-10.50");
  });

  it("formatea cero", () => {
    expect(formatAmount(0)).toBe("0.00");
  });
});
