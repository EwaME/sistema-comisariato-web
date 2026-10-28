import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

const COLECCIONES = ["creditos", "cuotas", "productos", "reclamos", "usuarios", "promociones"];

// Escucha en tiempo real las colecciones que alimentan los indicadores: al importar o cambiar datos, el dashboard se recalcula solo.
export const escucharDatosGerenciales = (alCambiar, alFallar) => {
  const datos = Object.fromEntries(COLECCIONES.map((n) => [n, []]));
  datos.config = {};
  const listos = new Set();
  const total = COLECCIONES.length + 1;

  const emitir = (nombre) => {
    listos.add(nombre);
    if (listos.size === total) alCambiar({ ...datos });
  };

  const cancelar = COLECCIONES.map((nombre) =>
    onSnapshot(
      collection(db, nombre),
      (snap) => {
        datos[nombre] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emitir(nombre);
      },
      alFallar,
    ),
  );

  cancelar.push(
    onSnapshot(
      doc(db, "configuraciones", "config_global"),
      (snap) => {
        datos.config = snap.exists() ? snap.data() : {};
        emitir("config");
      },
      alFallar,
    ),
  );

  return () => cancelar.forEach((c) => c());
};
