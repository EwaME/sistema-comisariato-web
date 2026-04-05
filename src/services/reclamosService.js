import {
  collection,
  getDoc,
  query,
  orderBy,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const coleccion = "reclamos";

export const obtenerReclamosRealTime = (callback) => {
  const reclamosRef = collection(db, coleccion);
  const q = query(reclamosRef, orderBy("fechaEmision", "desc"));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const reclamos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(reclamos);
    },
    (error) => {
      console.error("Error en tiempo real:", error);
    },
  );
};

export const obtenerReclamoPorId = async (idReclamo) => {
  try {
    const docRef = doc(db, coleccion, idReclamo);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("El reclamo no existe en la base de datos.");
    }
  } catch (error) {
    console.error("Error al obtener el reclamo:", error);
    throw error;
  }
};

export const verificarVigencia = (fechaVencimiento) => {
  const hoy = new Date();

  return hoy <= fechaVencimiento;
};

export const revisionState = async (idReclamo, emailRevisor) => {
  try {
    const revisorRef = doc(db, "usuarios", emailRevisor);
    const revisorSnap = await getDoc(revisorRef);

    if (!revisorSnap.exists()) {
      throw new Error(
        "El perfil de usuario no existe en la colección 'usuarios'",
      );
    }
    const { nombre, fotoUrl } = revisorSnap.data();

    const creditoRef = doc(db, coleccion, idReclamo);
    await updateDoc(creditoRef, {
      estado: "En revisión",
      revisadoPor: nombre || "Revisor sin nombre",
      revisorFotoTemp: fotoUrl || "",
      fechaInicioRevision: serverTimestamp(),
      revisorEmail: emailRevisor,
    });

    return { success: true };
  } catch (error) {
    console.error("Error en revisionState:", error);
    throw error;
  }
};

export const actualizarRevisionReclamo = async (
  idDocumento,
  respuestaRevisor,
) => {
  try {
    const docRef = doc(db, coleccion, idDocumento);

    await updateDoc(docRef, {
      estado: "Revisado",
      respuesta: respuestaRevisor,
      fechaInicioRevision: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar el crédito:", error);
    throw error;
  }
};

export const cancelarRevision = async (idDocumento) => {
  try {
    const docRef = doc(db, coleccion, idDocumento);

    await updateDoc(docRef, {
      estado: "Pendiente",
      revisorFotoTemp: deleteField(),
      revisadoPor: deleteField(),
      revisorEmail: deleteField(),
      fechaInicioRevision: deleteField(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar el crédito:", error);
    throw error;
  }
};
