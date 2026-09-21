import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(),
  where: vi.fn(),
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => "SERVER_TS"),
  getAggregateFromServer: vi.fn(),
  sum: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("../firebase/firebase", () => ({ db: {} }));
vi.mock("./auditoriasService", () => ({
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
}));

import { getDoc, getDocs, updateDoc } from "firebase/firestore";
import { registrarAuditoria } from "./auditoriasService";
import {
  obtenerCreditosPorId,
  revisionState,
  actualizarRevisionCredito,
  obtenerTotalCuotasPorEmpleadoId,
  obtenerCreditosActivosPorEmpleadoId,
} from "./creditosService";

// Helper: simula un QuerySnapshot con documentos { id, data }
const snapshot = (docs) => {
  const items = docs.map(({ id, ...data }) => ({ id, data: () => data }));
  return { docs: items, forEach: (fn) => items.forEach(fn) };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("obtenerCreditosPorId", () => {
  it("devuelve el crédito con su id", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      id: "C-1",
      data: () => ({ estado: "Pendiente" }),
    });
    await expect(obtenerCreditosPorId("C-1")).resolves.toEqual({
      id: "C-1",
      estado: "Pendiente",
    });
  });

  it("lanza error si el crédito no existe", async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    await expect(obtenerCreditosPorId("nope")).rejects.toThrow(
      "El crédito no existe en la base de datos.",
    );
  });
});

describe("revisionState", () => {
  it("marca el crédito 'En revisión' con los datos del revisor y audita", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ nombre: "Ana", fotoUrl: "http://foto" }),
    });
    updateDoc.mockResolvedValue(undefined);

    await expect(revisionState("C-1", "ana@x.com")).resolves.toEqual({
      success: true,
    });

    expect(updateDoc.mock.calls[0][1]).toMatchObject({
      estado: "En revisión",
      revisadoPor: "Ana",
      revisorFotoTemp: "http://foto",
      revisorEmail: "ana@x.com",
    });
    expect(registrarAuditoria).toHaveBeenCalledWith(
      "INICIO REVISIÓN",
      "Gestión de Créditos",
      expect.stringContaining("ana@x.com"),
      "C-1",
    );
  });

  it("falla y no toca el crédito si el revisor no existe en 'usuarios'", async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    await expect(revisionState("C-1", "fantasma@x.com")).rejects.toThrow(
      /no existe en la colección 'usuarios'/,
    );
    expect(updateDoc).not.toHaveBeenCalled();
  });
});

describe("actualizarRevisionCredito", () => {
  it("guarda estado y respuesta, y audita con el estado en mayúsculas", async () => {
    updateDoc.mockResolvedValue(undefined);

    await actualizarRevisionCredito("C-1", "Aprobado", "Todo en regla");

    expect(updateDoc.mock.calls[0][1]).toMatchObject({
      estado: "Aprobado",
      Respuesta: "Todo en regla",
    });
    expect(registrarAuditoria.mock.calls[0][0]).toBe("APROBADO");
  });
});

describe("obtenerTotalCuotasPorEmpleadoId (crédito usado)", () => {
  it("suma el saldo pendiente: (cuotas totales - pagadas) x cuota mensual", async () => {
    getDocs.mockResolvedValue(
      snapshot([
        { id: "C-1", cantidad: 12, cuotasPagadas: 2, cuotaMensual: "100" }, // 10 x 100
        { id: "C-2", cantidad: 6, cuotasPagadas: 0, cuotaMensual: 50 }, //  6 x 50
      ]),
    );

    await expect(obtenerTotalCuotasPorEmpleadoId("E-1")).resolves.toBe(1300);
  });

  it("ignora créditos ya pagados por completo", async () => {
    getDocs.mockResolvedValue(
      snapshot([{ id: "C-1", cantidad: 3, cuotasPagadas: 3, cuotaMensual: 200 }]),
    );
    await expect(obtenerTotalCuotasPorEmpleadoId("E-1")).resolves.toBe(0);
  });

  it("asume 1 cuota y 0 pagadas cuando faltan los campos", async () => {
    getDocs.mockResolvedValue(snapshot([{ id: "C-1", cuotaMensual: 80 }]));
    await expect(obtenerTotalCuotasPorEmpleadoId("E-1")).resolves.toBe(80);
  });

  it("devuelve 0 sin créditos aprobados", async () => {
    getDocs.mockResolvedValue(snapshot([]));
    await expect(obtenerTotalCuotasPorEmpleadoId("E-1")).resolves.toBe(0);
  });
});

describe("obtenerCreditosActivosPorEmpleadoId", () => {
  it("filtra los créditos con cuotas aún por pagar", async () => {
    getDocs.mockResolvedValue(
      snapshot([
        { id: "C-1", cantidad: 12, cuotasPagadas: 12 }, // saldado
        { id: "C-2", cantidad: 12, cuotasPagadas: 5 }, // activo
        { id: "C-3" }, // sin datos: 0 de 1 pagadas -> activo
      ]),
    );

    const activos = await obtenerCreditosActivosPorEmpleadoId("E-1");

    expect(activos.map((c) => c.id)).toEqual(["C-2", "C-3"]);
  });
});
