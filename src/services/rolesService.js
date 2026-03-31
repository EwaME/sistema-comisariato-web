// src/services/rolesService.js
import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 

const coleccion = "roles";

// Recuperar TODOS los roles
export const obtenerRoles = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener roles:", error);
        throw error;
    }
};

// Recuperar UN rol por ID
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

// Crear un NUEVO rol
export const crearRol = async (idRol, datosRol) => {
    try {
        // Usamos setDoc para que el ID del documento sea el nombre del rol (ej: "ADMINISTRADOR")
        const docRef = doc(db, coleccion, idRol.toUpperCase());
        await setDoc(docRef, {
            ...datosRol,
            estado: "ACTIVO",
            fechaRegistro: new Date(),
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al crear rol:", error);
        throw error;
    }
};

// Editar un rol existente
export const actualizarRol = async (idRol, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idRol);
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al actualizar rol:", error);
        throw error;
    }
};

// Desactivar (Inhabilitar) un rol
export const desactivarRol = async (idRol) => {
    try {
        const docRef = doc(db, coleccion, idRol);
        await updateDoc(docRef, {
            estado: "INACTIVO",
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al inhabilitar rol:", error);
        throw error;
    }
};