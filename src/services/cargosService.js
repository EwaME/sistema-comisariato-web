// src/services/cargosService.js
import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 

const coleccion = "cargos";

// Recuperar TODOS los cargos
export const obtenerCargos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener cargos:", error);
        throw error;
    }
};

// Recuperar UN cargo por ID
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

// Crear un NUEVO cargo
export const crearCargo = async (idCargo, datosCargo) => {
    try {
        // Ejemplo de idCargo: "CAR-001"
        const docRef = doc(db, coleccion, idCargo.toUpperCase());
        await setDoc(docRef, {
            codigo: idCargo.toUpperCase(),
            ...datosCargo,
            estado: "ACTIVO",
            fechaRegistro: new Date(),
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al crear cargo:", error);
        throw error;
    }
};

// Editar un cargo existente
export const actualizarCargo = async (idCargo, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idCargo);
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al actualizar cargo:", error);
        throw error;
    }
};

// Desactivar (Inhabilitar) un cargo
export const desactivarCargo = async (idCargo) => {
    try {
        const docRef = doc(db, coleccion, idCargo);
        await updateDoc(docRef, {
            estado: "INACTIVO",
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al inhabilitar cargo:", error);
        throw error;
    }
};