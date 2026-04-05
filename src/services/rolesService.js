import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import { registrarAuditoria } from "./auditoriasService";

const coleccion = "roles";

export const obtenerRoles = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener roles:", error);
        throw error;
    }
};

export const obtenerRolPorId = async (idRol) => {
    try {
        const docRef = doc(db, coleccion, idRol);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
        throw new Error("El rol no existe.");
    } catch (error) {
        console.error("Error al obtener rol:", error);
        throw error;
    }
};

export const crearRol = async (idRol, datosRol) => {
    try {
        const docRef = doc(db, coleccion, idRol.toUpperCase());
        await setDoc(docRef, {
            ...datosRol,
            estado: "ACTIVO",
            fechaRegistro: new Date(),
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "CREACIÓN", 
            "Gestión de Roles", 
            `Se registró un nuevo rol en el sistema: ${idRol.toUpperCase()}`, 
            idRol.toUpperCase()
        );

        return true;
    } catch (error) {
        console.error("Error al crear rol:", error);
        throw error;
    }
};

export const actualizarRol = async (idRol, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idRol);
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "EDICIÓN", 
            "Gestión de Roles", 
            `Se actualizaron los permisos o datos del rol`, 
            idRol
        );

        return true;
    } catch (error) {
        console.error("Error al actualizar rol:", error);
        throw error;
    }
};

export const desactivarRol = async (idRol) => {
    try {
        const docRef = doc(db, coleccion, idRol);
        await updateDoc(docRef, {
            estado: "INACTIVO",
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "ELIMINACIÓN", 
            "Gestión de Roles", 
            `Se inhabilitó el rol y se cambió su estado a INACTIVO`, 
            idRol
        );

        return true;
    } catch (error) {
        console.error("Error al inhabilitar rol:", error);
        throw error;
    }
};