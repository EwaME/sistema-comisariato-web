import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import { registrarAuditoria } from "./auditoriasService";

const coleccion = "departamentos";

export const obtenerDepartamentos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener departamentos:", error);
        throw error;
    }
};

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

export const crearDepartamento = async (idDep, datosDep) => {
    try {
        const docRef = doc(db, coleccion, idDep);
        await setDoc(docRef, {
            codigo: idDep,
            ...datosDep,
            estado: "ACTIVO",
            fechaRegistro: new Date(),
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "CREACIÓN", 
            "Gestión de Departamentos", 
            `Se registró un nuevo departamento: ${datosDep.nombre || idDep}`, 
            idDep
        );

        return true;
    } catch (error) {
        console.error("Error al crear departamento:", error);
        throw error;
    }
};

export const actualizarDepartamento = async (idDep, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idDep);
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "EDICIÓN", 
            "Gestión de Departamentos", 
            `Se actualizaron los datos del departamento`, 
            idDep
        );

        return true;
    } catch (error) {
        console.error("Error al actualizar departamento:", error);
        throw error;
    }
};

export const desactivarDepartamento = async (idDep) => {
    try {
        const docRef = doc(db, coleccion, idDep);
        await updateDoc(docRef, {
            estado: "INACTIVO",
            fechaModificacion: new Date()
        });

        await registrarAuditoria(
            "ELIMINACIÓN", 
            "Gestión de Departamentos", 
            `Se inhabilitó el departamento y se cambió su estado a inactivo`, 
            idDep
        );

        return true;
    } catch (error) {
        console.error("Error al inhabilitar departamento:", error);
        throw error;
    }
};