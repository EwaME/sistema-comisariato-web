// src/services/departamentosService.js
import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 

const coleccion = "departamentos";

// Recuperar TODOS los departamentos
export const obtenerDepartamentos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener departamentos:", error);
        throw error;
    }
};

// Recuperar UN departamento por ID
export const obtenerDepartamentoPorId = async (idDep) => {
    try {
        const docRef = doc(db, coleccion, idDep);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
        throw new Error("El departamento no existe.");
    } catch (error) {
        console.error("Error al obtener departamento:", error);
        throw error;
    }
};

// Crear un NUEVO departamento
export const crearDepartamento = async (idDep, datosDep) => {
    try {
        // Ejemplo de idDep: "DEP-001"
        const docRef = doc(db, coleccion, idDep);
        await setDoc(docRef, {
            codigo: idDep,
            ...datosDep,
            estado: "ACTIVO",
            fechaRegistro: new Date(),
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al crear departamento:", error);
        throw error;
    }
};

// Editar un departamento existente
export const actualizarDepartamento = async (idDep, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idDep);
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al actualizar departamento:", error);
        throw error;
    }
};

// Desactivar (Inhabilitar) un departamento
export const desactivarDepartamento = async (idDep) => {
    try {
        const docRef = doc(db, coleccion, idDep);
        await updateDoc(docRef, {
            estado: "INACTIVO",
            fechaModificacion: new Date()
        });
        return true;
    } catch (error) {
        console.error("Error al inhabilitar departamento:", error);
        throw error;
    }
};