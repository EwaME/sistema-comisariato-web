import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const coleccion = "ayudas";

export const obtenerAyudas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, coleccion));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener las ayudas:", error);
    throw error;
  }
};

export const crearGuia = async (datosGuia) => {
  try {
    const docRef = await addDoc(collection(db, coleccion), {
      ...datosGuia,
      fechaRegistro: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error al crear guía:", error);
    throw error;
  }
};

export const eliminarGuia = async (idGuia) => {
  try {
    await deleteDoc(doc(db, coleccion, idGuia));
    return true;
  } catch (error) {
    console.error("Error al eliminar guía:", error);
    throw error;
  }
};

export const actualizarGuia = async (idGuia, datosNuevos) => {
  try {
    const docRef = doc(db, coleccion, idGuia);
    await updateDoc(docRef, {
      ...datosNuevos,
      fechaModificacion: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error al actualizar guía:", error);
    throw error;
  }
};
