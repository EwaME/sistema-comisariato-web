import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebase";

const LIMITE_LOGS = 5000;

const CONSULTAS = {
  actividad: () => query(collection(db, "actividad_logs"), orderBy("fechaAccion", "desc"), limit(LIMITE_LOGS)),
  usuarios: () => collection(db, "usuarios"),
  logsSistema: () => query(collection(db, "logs_sistema"), orderBy("fecha", "desc"), limit(LIMITE_LOGS)),
  importaciones: () => query(collection(db, "importaciones"), orderBy("fecha", "desc"), limit(500)),
};

// Escucha en tiempo real las fuentes del dashboard técnico. Los registros de actividad y de mediciones
// se limitan a los 5,000 más recientes.
export const escucharDatosTecnicos = (alCambiar, alFallar) => {
  const nombres = Object.keys(CONSULTAS);
  const datos = Object.fromEntries(nombres.map((n) => [n, []]));
  const listos = new Set();

  const cancelar = nombres.map((nombre) =>
    onSnapshot(
      CONSULTAS[nombre](),
      (snap) => {
        datos[nombre] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        listos.add(nombre);
        if (listos.size === nombres.length) alCambiar({ ...datos });
      },
      alFallar,
    ),
  );

  return () => cancelar.forEach((c) => c());
};
