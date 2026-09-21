import { collection, getDocs, doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { registrarAuditoria } from "./auditoriasService";

const coleccion = "promociones";

export const obtenerPromociones = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener promociones:", error);
        throw error;
    }
};

export const obtenerPromocionPorId = async (idPromocion) => {
    try {
        const docRef = doc(db, coleccion, idPromocion);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("La promoción no existe en la base de datos.");
        }
    } catch (error) {
        console.error("Error al obtener la promoción:", error);
        throw error;
    }
};

export const crearPromocion = async (datosPromocion) => {
    try {
        const idGenerado = datosPromocion.promocionId;
        const docRef = doc(db, coleccion, idGenerado);
        await setDoc(docRef, {
            ...datosPromocion,
            fechaRegistro: new Date(),
            fechaModificacion: new Date()
        });
        await registrarAuditoria(
            "CREACIÓN",
            "Gestión de Promociones",
            `Se registró una nueva promoción: ${datosPromocion.nombre || idGenerado}`,
            idGenerado
        );
        return idGenerado;
    } catch (error) {
        console.error("Error al crear promoción:", error);
        throw error;
    }
};

export const actualizarPromocion = async (idPromocion, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idPromocion);
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date()
        });
        await registrarAuditoria(
            "EDICIÓN",
            "Gestión de Promociones",
            `Se actualizó la promoción: ${datosNuevos.nombre || idPromocion}`,
            idPromocion
        );
        return true;
    } catch (error) {
        console.error("Error al actualizar promoción:", error);
        throw error;
    }
};

export const cambiarEstadoPromocion = async (idPromocion, nuevoEstado) => {
    try {
        const docRef = doc(db, coleccion, idPromocion);
        await updateDoc(docRef, {
            estado: nuevoEstado,
            fechaModificacion: new Date()
        });
        const accion = nuevoEstado === "ACTIVO" ? "ACTIVACIÓN" : "ELIMINACIÓN";
        const mensaje = nuevoEstado === "ACTIVO"
            ? "Se reactivó la promoción"
            : "Se desactivó la promoción";
        await registrarAuditoria(accion, "Gestión de Promociones", mensaje, idPromocion);
        return true;
    } catch (error) {
        console.error("Error al cambiar estado de promoción:", error);
        throw error;
    }
};

export const escucharPromocionesRealTime = (callback) => {
    const q = collection(db, coleccion);
    return onSnapshot(q, (querySnapshot) => {
        const promociones = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(promociones);
    }, (error) => {
        console.error("Error al escuchar promociones en tiempo real:", error);
    });
};