import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((...args) => ({ __col: args.slice(1).join("/") })),
  doc: vi.fn((...args) => ({ __doc: args.slice(1).join("/") })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));
vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));
vi.mock("../firebase/firebase", () => ({ db: {} }));
vi.mock("./auditoriasService", () => ({
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
}));

import { getDocs, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { registrarAuditoria } from "./auditoriasService";
import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto,
} from "./productosService";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("obtenerProductos", () => {
  it("mapea cada documento agregando su id", async () => {
    getDocs.mockResolvedValue({
      docs: [
        { id: "P-1", data: () => ({ nombre: "Arroz" }) },
        { id: "P-2", data: () => ({ nombre: "Frijol" }) },
      ],
    });

    const productos = await obtenerProductos();

    expect(productos).toEqual([
      { id: "P-1", nombre: "Arroz" },
      { id: "P-2", nombre: "Frijol" },
    ]);
  });

  it("propaga el error de Firestore", async () => {
    getDocs.mockRejectedValue(new Error("permission-denied"));
    await expect(obtenerProductos()).rejects.toThrow("permission-denied");
  });
});

describe("obtenerProductoPorId", () => {
  it("devuelve el producto cuando existe", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      id: "P-1",
      data: () => ({ nombre: "Arroz" }),
    });

    await expect(obtenerProductoPorId("P-1")).resolves.toEqual({
      id: "P-1",
      nombre: "Arroz",
    });
  });

  it("lanza error cuando el producto no existe", async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    await expect(obtenerProductoPorId("X")).rejects.toThrow(
      "El producto no existe en la base de datos.",
    );
  });
});

describe("crearProducto", () => {
  it("guarda el documento con fechas y registra auditoría de CREACIÓN", async () => {
    setDoc.mockResolvedValue(undefined);

    const id = await crearProducto({ productoId: "P-9", nombre: "Aceite" });

    expect(id).toBe("P-9");
    const [, datos] = setDoc.mock.calls[0];
    expect(datos.nombre).toBe("Aceite");
    expect(datos.fechaRegistro).toBeInstanceOf(Date);
    expect(datos.fechaModificacion).toBeInstanceOf(Date);
    expect(registrarAuditoria).toHaveBeenCalledWith(
      "CREACIÓN",
      "Gestión de Productos",
      expect.stringContaining("Aceite"),
      "P-9",
    );
  });

  it("no registra auditoría si falla el guardado", async () => {
    setDoc.mockRejectedValue(new Error("fallo de red"));

    await expect(crearProducto({ productoId: "P-9" })).rejects.toThrow(
      "fallo de red",
    );
    expect(registrarAuditoria).not.toHaveBeenCalled();
  });
});

describe("actualizarProducto", () => {
  it("actualiza con fechaModificacion y audita la EDICIÓN", async () => {
    updateDoc.mockResolvedValue(undefined);

    await expect(actualizarProducto("P-1", { precio: 50 })).resolves.toBe(true);

    const [, datos] = updateDoc.mock.calls[0];
    expect(datos.precio).toBe(50);
    expect(datos.fechaModificacion).toBeInstanceOf(Date);
    expect(registrarAuditoria).toHaveBeenCalledWith(
      "EDICIÓN",
      "Gestión de Productos",
      expect.any(String),
      "P-1",
    );
  });
});

describe("cambiarEstadoProducto", () => {
  it("audita ACTIVACIÓN al reactivar", async () => {
    updateDoc.mockResolvedValue(undefined);
    await cambiarEstadoProducto("P-1", true);

    expect(updateDoc.mock.calls[0][1].activo).toBe(true);
    expect(registrarAuditoria.mock.calls[0][0]).toBe("ACTIVACIÓN");
  });

  it("audita ELIMINACIÓN al inhabilitar (borrado lógico)", async () => {
    updateDoc.mockResolvedValue(undefined);
    await cambiarEstadoProducto("P-1", false);

    expect(updateDoc.mock.calls[0][1].activo).toBe(false);
    expect(registrarAuditoria.mock.calls[0][0]).toBe("ELIMINACIÓN");
  });
});
