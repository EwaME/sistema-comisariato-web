import {
  collection,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  getAggregateFromServer,
  sum,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { registrarAuditoria } from "./auditoriasService";

const coleccion = "creditos";

export const obtenerCreditosRealTime = (callback) => {
  const creditosRef = collection(db, coleccion);
  const q = query(creditosRef, orderBy("fechaRegistro", "desc"));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const creditos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(creditos);
    },
    (error) => {
      console.error("Error en tiempo real:", error);
    },
  );
};

export const obtenerProductoPorId = async (id) => {
  try {
    const docRef = doc(db, "productos", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("El producto no existe en la base de datos.");
    }
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    throw error;
  }
};

export const obtenerCreditosPorId = async (idCredito) => {
  try {
    const docRef = doc(db, coleccion, idCredito);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("El crédito no existe en la base de datos.");
    }
  } catch (error) {
    console.error("Error al obtener el crédito:", error);
    throw error;
  }
};

export const obtenerCuotasPorCreditoId = async (idCredito) => {
  try {
    const cuotasRef = collection(db, "cuotas");
    const q = query(cuotasRef, where("creditoId", "==", idCredito));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error al obtener cuotas:", error);
    throw error;
  }
};

export const revisionState = async (idCredito, emailRevisor) => {
  try {
    const revisorRef = doc(db, "usuarios", emailRevisor);
    const revisorSnap = await getDoc(revisorRef);

    if (!revisorSnap.exists()) {
      throw new Error(
        "El perfil de usuario no existe en la colección 'usuarios'",
      );
    }

    const { nombre, fotoUrl } = revisorSnap.data();

    const creditoRef = doc(db, coleccion, idCredito);
    await updateDoc(creditoRef, {
      estado: "En revisión",
      revisadoPor: nombre || "Revisor sin nombre",
      revisorFotoTemp: fotoUrl || "",
      fechaInicioRevision: serverTimestamp(),
      revisorEmail: emailRevisor,
    });

    await registrarAuditoria(
      "INICIO REVISIÓN",
      "Gestión de Créditos",
      `El revisor ${nombre} (${emailRevisor}) ha tomado el crédito para evaluación.`,
      idCredito,
    );

    return { success: true };
  } catch (error) {
    console.error("Error en revisionState:", error);
    throw error;
  }
};

export const actualizarRevisionCredito = async (
  idDocumento,
  estado,
  respuestaRevisor,
) => {
  try {
    const docRef = doc(db, "creditos", idDocumento);

    await updateDoc(docRef, {
      estado: estado,
      Respuesta: respuestaRevisor,
      fechaRevision: serverTimestamp(),
    });

    await registrarAuditoria(
      estado.toUpperCase(),
      "Gestión de Créditos",
      `Se finalizó la revisión del crédito con estado: ${estado}. Observaciones: ${respuestaRevisor}`,
      idDocumento,
    );

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar el crédito:", error);
    throw error;
  }
};

export const obtenerTotalCuotasAprobadas = async (usuarioId) => {
  try {
    const creditosRef = collection(db, coleccion);

    const q = query(
      creditosRef,
      where("usuarioId", "==", usuarioId),
      where("estado", "==", "Aprobado"),
    );

    const snapshot = await getAggregateFromServer(q, {
      totalSumado: sum("cuotaMensual"),
    });

    return snapshot.data().totalSumado;
  } catch (error) {
    console.error("Error al sumar cuotas:", error);
    throw error;
  }
};

export const obtenerCreditosRecientesPorEmpleado = async (empleadoId) => {
  try {
    const creditosRef = collection(db, coleccion);

    const q = query(
      creditosRef,
      where("empleadoId", "==", empleadoId),
      orderBy("fechaRegistro", "desc"),
      limit(3),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener historial de créditos:", error);
    throw error;
  }
};

export const obtenerListaEsperaRealTime = (callback) => {
  const creditosRef = collection(db, "creditos");

  const q = query(
    creditosRef,
    where("estado", "in", ["Pendiente", "En revisión"]),
    orderBy("fechaRegistro", "asc"),
  );

  return onSnapshot(q, (querySnapshot) => {
    const lista = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(lista);
  });
};

export const obtenerTotalCuotasPorEmpleadoId = async (empleadoId) => {
  try {
    const creditosRef = collection(db, "creditos");

    const q = query(
      creditosRef,
      where("empleadoId", "==", empleadoId),
      where("estado", "==", "Aprobado"),
    );

    const querySnapshot = await getDocs(q);
    let totalUsado = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const totalCuotas = data.cantidad || 1; 
      const pagadas = data.cuotasPagadas || 0; 
      const cuota = parseFloat(data.cuotaMensual) || 0;

      if (pagadas < totalCuotas) {
        const saldoPendiente = (totalCuotas - pagadas) * cuota;
        totalUsado += saldoPendiente;
      }
    });

    return totalUsado;
  } catch (error) {
    console.error("Error al sumar el crédito usado:", error);
    throw error;
  }
};

export const obtenerCreditosActivosPorEmpleadoId = async (empleadoId) => {
  try {
    const creditosRef = collection(db, "creditos");
    const q = query(
      creditosRef,
      where("empleadoId", "==", empleadoId),
      where("estado", "==", "Aprobado")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(credito => (credito.cuotasPagadas || 0) < (credito.cantidad || 1));
      
  } catch (error) {
    console.error("Error al obtener historial de productos activos:", error);
    throw error;
  }
};