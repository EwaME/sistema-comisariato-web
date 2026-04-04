import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

const coleccion = "sugerencias";

export const obtenerSugerencias = (callback) => {
  const sugerenciasRef = collection(db, coleccion);
  const q = query(sugerenciasRef, orderBy("fechaRegistro", "desc"));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const sugerencias = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Sugerencias actualizadas:", sugerencias);
      callback(sugerencias);
    },
    (error) => {
      console.error("Error en tiempo real:", error);
    },
  );
};
