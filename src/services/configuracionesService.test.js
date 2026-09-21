import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((...args) => ({ __path: args.slice(1).join("/") })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(() => ({})),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));
vi.mock("../firebase/firebase", () => ({ db: {} }));
vi.mock("./auditoriasService", () => ({
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
}));

import { getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { registrarAuditoria } from "./auditoriasService";
import {
  obtenerConfiguracion,
  obtenerPlazos,
  agregarPlazo,
  agregarGarantia,
  eliminarPlazo,
  obtenerGarantias,
} from "./configuracionesService";

const snapshot = (docs) => ({
  docs: docs.map(({ id, ...data }) => ({ id, data: () => data })),
});

beforeEach(() => vi.clearAllMocks());

describe("obtenerConfiguracion", () => {
  it("devuelve la configuración global", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ tiempoInactividad: 15 }),
    });
    await expect(obtenerConfiguracion()).resolves.toEqual({
      tiempoInactividad: 15,
    });
  });

  it("lanza error si no existe config_global", async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    await expect(obtenerConfiguracion()).rejects.toThrow(
      "No se encontró la configuración global.",
    );
  });
});

describe("obtenerPlazos", () => {
  it("ordena los plazos por meses de menor a mayor", async () => {
    getDocs.mockResolvedValue(
      snapshot([
        { id: "PLZ-02", plazoMeses: 24 },
        { id: "PLZ-01", plazoMeses: 6 },
        { id: "PLZ-03", plazoMeses: 12 },
      ]),
    );
    const plazos = await obtenerPlazos();
    expect(plazos.map((p) => p.plazoMeses)).toEqual([6, 12, 24]);
  });
});

describe("agregarPlazo", () => {
  it("genera PLZ-01 cuando no hay plazos", async () => {
    getDocs.mockResolvedValue(snapshot([]));
    const plazo = await agregarPlazo(6);
    expect(plazo.plazoId).toBe("PLZ-01");
    expect(setDoc.mock.calls[0][1]).toMatchObject({ plazoId: "PLZ-01", plazoMeses: 6 });
  });

  it("usa el mayor número existente + 1, aunque falten huecos", async () => {
    // Se borró PLZ-02: el siguiente debe ser PLZ-04, no PLZ-03 (evitaría colisión)
    getDocs.mockResolvedValue(snapshot([{ id: "PLZ-01" }, { id: "PLZ-03" }]));
    const plazo = await agregarPlazo(18);
    expect(plazo.plazoId).toBe("PLZ-04");
  });

  it("ignora ids con formato inesperado", async () => {
    getDocs.mockResolvedValue(snapshot([{ id: "raro" }, { id: "PLZ-x" }]));
    const plazo = await agregarPlazo(3);
    expect(plazo.plazoId).toBe("PLZ-01");
  });

  it("registra auditoría de CREACIÓN", async () => {
    getDocs.mockResolvedValue(snapshot([]));
    await agregarPlazo(6);
    expect(registrarAuditoria.mock.calls[0][0]).toBe("CREACIÓN");
  });
});

describe("agregarGarantia", () => {
  it("genera GAR-nn y conserva los datos enviados", async () => {
    getDocs.mockResolvedValue(snapshot([{ id: "GAR-09" }]));
    const garantia = await agregarGarantia({ diasCobertura: 90 });
    expect(garantia).toMatchObject({ garantiaId: "GAR-10", diasCobertura: 90 });
  });
});

describe("obtenerGarantias", () => {
  it("ordena por cobertura en días, convirtiendo meses (x30) cuando faltan días", async () => {
    getDocs.mockResolvedValue(
      snapshot([
        { id: "GAR-01", mesesCobertura: 12 }, // 360 días
        { id: "GAR-02", diasCobertura: 30 }, //  30 días
        { id: "GAR-03", mesesCobertura: 3 }, //  90 días
      ]),
    );
    const garantias = await obtenerGarantias();
    expect(garantias.map((g) => g.id)).toEqual(["GAR-02", "GAR-03", "GAR-01"]);
  });
});

describe("eliminarPlazo", () => {
  it("borra el documento y audita la ELIMINACIÓN", async () => {
    deleteDoc.mockResolvedValue(undefined);
    await eliminarPlazo("PLZ-01");
    expect(deleteDoc).toHaveBeenCalledTimes(1);
    expect(registrarAuditoria.mock.calls[0][0]).toBe("ELIMINACIÓN");
  });
});
