import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";

const COLECCION = "logs_sistema";

const correoActual = () => {
  try {
    return getAuth().currentUser?.email?.toLowerCase() || null;
  } catch {
    return null;
  }
};

// Medir nunca debe afectar a la operación medida: cualquier fallo al registrar se ignora.
const registrar = (datos) => {
  try {
    addDoc(collection(db, COLECCION), { ...datos, origen: "cliente", fecha: serverTimestamp() }).catch(() => {});
  } catch {
    // sin permiso o sin conexión: la medición se pierde, la operación sigue
  }
};

// Ejecuta `fn`, registra su duración en milisegundos y su resultado (con el código de error de Firebase si falla).
export async function medirOperacion(operacion, fn, { correo } = {}) {
  const inicio = performance.now();
  const base = () => ({ operacion, duracionMs: Math.round(performance.now() - inicio), correo: correo || correoActual() });
  try {
    const resultado = await fn();
    registrar({ ...base(), exito: true });
    return resultado;
  } catch (error) {
    registrar({ ...base(), exito: false, codigoError: error?.code || null, mensaje: String(error?.message || error).slice(0, 300) });
    throw error;
  }
}

export const conMetrica = (operacion, fn) => (...args) => medirOperacion(operacion, () => fn(...args));
