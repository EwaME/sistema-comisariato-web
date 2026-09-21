import { describe, it, expect } from "vitest";
import {
  fromTimestamp,
  fromTimestampToSimpleDate,
  calcularVencimiento,
  calcularVencimientoDias,
} from "./timestampToDate";

// 15 de marzo de 2024, 12:00 UTC (mediodía para evitar saltos de día por zona horaria)
const SEGUNDOS = Date.UTC(2024, 2, 15, 12, 0, 0) / 1000;

describe("fromTimestamp", () => {
  it("devuelve '---' cuando no hay timestamp", () => {
    expect(fromTimestamp(null)).toBe("---");
    expect(fromTimestamp(undefined)).toBe("---");
  });

  it("devuelve '---' cuando el objeto no es un timestamp válido", () => {
    expect(fromTimestamp({})).toBe("---");
  });

  it("formatea un timestamp de Firestore con toDate()", () => {
    const ts = { toDate: () => new Date(SEGUNDOS * 1000) };
    expect(fromTimestamp(ts)).toMatch(/15\/03\/2024/);
  });

  it("formatea un timestamp plano con {seconds}", () => {
    expect(fromTimestamp({ seconds: SEGUNDOS })).toMatch(/15\/03\/2024/);
  });
});

describe("fromTimestampToSimpleDate", () => {
  it("devuelve '---' sin timestamp", () => {
    expect(fromTimestampToSimpleDate(null)).toBe("---");
  });

  it("devuelve solo la fecha, sin hora", () => {
    const resultado = fromTimestampToSimpleDate({ seconds: SEGUNDOS });
    expect(resultado).toMatch(/15\/03\/2024/);
    expect(resultado).not.toMatch(/:/);
  });
});

describe("calcularVencimiento", () => {
  it("devuelve null sin fecha de emisión", () => {
    expect(calcularVencimiento(null, 12)).toBeNull();
  });

  it("suma los meses de garantía a la fecha de emisión", () => {
    const emision = { toDate: () => new Date(2024, 0, 10) };
    const vence = calcularVencimiento(emision, 6);
    expect(vence.getFullYear()).toBe(2024);
    expect(vence.getMonth()).toBe(6); // julio
    expect(vence.getDate()).toBe(10);
  });

  it("acepta timestamps con {seconds}", () => {
    const vence = calcularVencimiento({ seconds: SEGUNDOS }, 12);
    expect(vence.getFullYear()).toBe(2025);
    expect(vence.getMonth()).toBe(2); // marzo
  });

  it("trata meses indefinidos como 0", () => {
    const emision = { toDate: () => new Date(2024, 0, 10) };
    expect(calcularVencimiento(emision, undefined).getMonth()).toBe(0);
  });

  it("devuelve null si la fecha es inválida", () => {
    expect(calcularVencimiento("no-es-fecha", 3)).toBeNull();
  });

  it("no muta la fecha original", () => {
    const original = new Date(2024, 0, 10);
    calcularVencimiento({ toDate: () => original }, 6);
    expect(original.getMonth()).toBe(0);
  });
});

describe("calcularVencimientoDias", () => {
  it("devuelve null si falta la fecha o los días", () => {
    expect(calcularVencimientoDias(null, 30)).toBeNull();
    expect(calcularVencimientoDias({ toDate: () => new Date() }, 0)).toBeNull();
  });

  it("suma los días indicados", () => {
    const base = { toDate: () => new Date(2024, 0, 30) };
    const vence = calcularVencimientoDias(base, 5);
    expect(vence.getMonth()).toBe(1); // febrero
    expect(vence.getDate()).toBe(4);
  });
});
