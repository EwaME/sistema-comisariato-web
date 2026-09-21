import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const navigate = vi.fn();
const signOutMock = vi.fn().mockResolvedValue(undefined);
const authMock = { currentUser: { email: "ana@x.com" } };

vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("firebase/auth", () => ({
  getAuth: () => authMock,
  signOut: (...args) => signOutMock(...args),
}));
vi.mock("../services/configuracionesService", () => ({
  obtenerConfiguracion: vi.fn(),
}));

import { obtenerConfiguracion } from "../services/configuracionesService";
import { useInactividad } from "./useInactividad";

const MIN = 60 * 1000;

// Avanza el reloj falso dentro de act() para que React procese los setState
const avanzar = (ms) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useInactividad", () => {
  it("usa 15 minutos por defecto cuando la configuración falla", async () => {
    obtenerConfiguracion.mockRejectedValue(new Error("sin config"));
    const { result } = renderHook(() => useInactividad());

    await avanzar(1000);

    expect(result.current.timeLeft).toBe("14:59");
    expect(result.current.showWarning).toBe(false);
  });

  it("toma el límite de inactividad desde la configuración global", async () => {
    obtenerConfiguracion.mockResolvedValue({ tiempoInactividad: 5 });
    const { result } = renderHook(() => useInactividad());

    await avanzar(1000);

    expect(result.current.timeLeft).toBe("04:59");
  });

  it("muestra la advertencia cuando faltan 2 minutos o menos", async () => {
    obtenerConfiguracion.mockRejectedValue(new Error("sin config"));
    const { result } = renderHook(() => useInactividad());

    await avanzar(12 * MIN);
    expect(result.current.showWarning).toBe(false);

    await avanzar(1 * MIN + 1000); // quedan < 2 min
    expect(result.current.showWarning).toBe(true);
  });

  it("cierra la sesión y redirige al login al agotarse el tiempo", async () => {
    obtenerConfiguracion.mockRejectedValue(new Error("sin config"));
    renderHook(() => useInactividad());

    await avanzar(15 * MIN + 1000);

    expect(signOutMock).toHaveBeenCalledWith(authMock);
    expect(navigate).toHaveBeenCalledWith("/login");
    expect(JSON.parse(sessionStorage.getItem("mensajeLogin"))).toMatchObject({
      tipo: "warning",
    });
  });

  it("la actividad del usuario reinicia el contador y evita el cierre", async () => {
    obtenerConfiguracion.mockRejectedValue(new Error("sin config"));
    const { result } = renderHook(() => useInactividad());

    await avanzar(14 * MIN);
    await act(async () => {
      window.dispatchEvent(new Event("mousemove"));
    });
    await avanzar(2 * MIN);

    expect(signOutMock).not.toHaveBeenCalled();
    expect(result.current.showWarning).toBe(false);
  });

  it("no intenta cerrar sesión si ya no hay usuario autenticado", async () => {
    obtenerConfiguracion.mockRejectedValue(new Error("sin config"));
    const original = authMock.currentUser;
    authMock.currentUser = null;

    renderHook(() => useInactividad());
    await avanzar(15 * MIN + 1000);

    expect(signOutMock).not.toHaveBeenCalled();
    authMock.currentUser = original;
  });
});
