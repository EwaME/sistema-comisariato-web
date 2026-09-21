import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  initializeApp: vi.fn((config, name) => ({ name: name ?? "[DEFAULT]", config })),
  getAuth: vi.fn((app) => ({ tipo: "auth", app: app.name })),
  connectAuthEmulator: vi.fn(),
  getFirestore: vi.fn((app) => ({ tipo: "firestore", app: app.name })),
  connectFirestoreEmulator: vi.fn(),
  getStorage: vi.fn((app) => ({ tipo: "storage", app: app.name })),
  connectStorageEmulator: vi.fn(),
}));

vi.mock("firebase/app", () => ({ initializeApp: mocks.initializeApp }));
vi.mock("firebase/auth", () => ({
  getAuth: mocks.getAuth,
  connectAuthEmulator: mocks.connectAuthEmulator,
}));
vi.mock("firebase/firestore", () => ({
  getFirestore: mocks.getFirestore,
  connectFirestoreEmulator: mocks.connectFirestoreEmulator,
}));
vi.mock("firebase/storage", () => ({
  getStorage: mocks.getStorage,
  connectStorageEmulator: mocks.connectStorageEmulator,
}));

// El módulo se evalúa al importarlo, así que cada caso lo carga de nuevo con su entorno
const cargarFirebase = async () => {
  vi.resetModules();
  return import("./firebase");
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe("firebase.js — conexión a la nube (producción)", () => {
  it("no conecta ningún emulador cuando VITE_USE_EMULATORS no está definida", async () => {
    vi.stubEnv("VITE_USE_EMULATORS", "");
    await cargarFirebase();

    expect(mocks.connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(mocks.connectAuthEmulator).not.toHaveBeenCalled();
    expect(mocks.connectStorageEmulator).not.toHaveBeenCalled();
  });

  it("solo el valor exacto 'true' activa los emuladores", async () => {
    vi.stubEnv("VITE_USE_EMULATORS", "false");
    await cargarFirebase();

    expect(mocks.connectFirestoreEmulator).not.toHaveBeenCalled();
  });

  it("inicializa la app principal y la secundaria con la configuración de entorno", async () => {
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "mi-proyecto");
    const { app, authSecundaria } = await cargarFirebase();

    expect(app.config.projectId).toBe("mi-proyecto");
    expect(mocks.initializeApp).toHaveBeenCalledWith(expect.any(Object), "appSecundaria");
    expect(authSecundaria.app).toBe("appSecundaria");
  });
});

describe("firebase.js — Emulator Suite (desarrollo)", () => {
  beforeEach(() => vi.stubEnv("VITE_USE_EMULATORS", "true"));

  it("conecta Firestore, Auth (ambas apps) y Storage al host de la página", async () => {
    const { db, auth, authSecundaria } = await cargarFirebase();
    const host = window.location.hostname; // "localhost" en jsdom

    expect(mocks.connectFirestoreEmulator).toHaveBeenCalledWith(db, host, 8082);
    expect(mocks.connectAuthEmulator).toHaveBeenCalledWith(
      auth, `http://${host}:9099`, { disableWarnings: true },
    );
    expect(mocks.connectAuthEmulator).toHaveBeenCalledWith(
      authSecundaria, `http://${host}:9099`, { disableWarnings: true },
    );
    expect(mocks.connectStorageEmulator).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "storage" }), host, 9199,
    );
  });

  it("respeta VITE_EMULATOR_HOST cuando se define", async () => {
    vi.stubEnv("VITE_EMULATOR_HOST", "10.0.2.15");
    const { db } = await cargarFirebase();

    expect(mocks.connectFirestoreEmulator).toHaveBeenCalledWith(db, "10.0.2.15", 8082);
    expect(mocks.connectStorageEmulator).toHaveBeenCalledWith(expect.anything(), "10.0.2.15", 9199);
  });
});
