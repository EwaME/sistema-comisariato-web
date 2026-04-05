import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import { registrarAuditoria } from "./auditoriasService";

const coleccion = "cargos";

export const obtenerCargos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener cargos:", error);
        throw error;
    }
};

export const obtenerCargoPorId = async (idCargo) => {
    try {
        const docRef = doc(db, coleccion, idCargo);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
        throw new Error("El cargo no existe.");
    } catch (error) {
        console.error("Error al obtener cargo:", error);
        throw error;
    }
};

export const crearCargo = async (idCargo, datosCargo) => {
    try {
        const docRef = doc(db, coleccion, idCargo.toUpperCase());
        await setDoc(docRef, {
            codigo: idCargo.toUpperCase(),
            ...datosCargo,
            estado: "ACTIVO",
            fechaRegistro: new Date(),
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "CREACIÓN", 
            "Gestión de Cargos", 
            `Se registró un nuevo cargo: ${datosCargo.nombre || idCargo.toUpperCase()}`, 
            idCargo.toUpperCase()
        );

        return true;
    } catch (error) {
        console.error("Error al crear cargo:", error);
        throw error;
    }
};

export const actualizarCargo = async (idCargo, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idCargo);
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "EDICIÓN", 
            "Gestión de Cargos", 
            `Se actualizaron los datos del cargo`, 
            idCargo
        );

        return true;
    } catch (error) {
        console.error("Error al actualizar cargo:", error);
        throw error;
    }
};

export const desactivarCargo = async (idCargo) => {
    try {
        const docRef = doc(db, coleccion, idCargo);
        await updateDoc(docRef, {
            estado: "INACTIVO",
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "ELIMINACIÓN", 
            "Gestión de Cargos", 
            `Se inhabilitó el cargo y se cambió su estado a INACTIVO`, 
            idCargo
        );

        return true;
    } catch (error) {
        console.error("Error al inhabilitar cargo:", error);
        throw error;
    }
};