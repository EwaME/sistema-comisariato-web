// src/services/empleadosService.js
import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 

const coleccion = "empleados";

// 1. Obtener TODOS los empleados (Para la tabla principal)
export const obtenerEmpleados = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        const empleados = querySnapshot.docs.map(doc => ({
            id: doc.id, // Esto será el EMP-001
            ...doc.data() 
        }));
        return empleados;
    } catch (error) {
        console.error("Error al obtener los empleados:", error);
        throw error; // Lanzamos el error para que la pantalla lo pueda atrapar
    }
};

// 2. Obtener UN SOLO empleado (Para la pantalla de Detalle)
export const obtenerEmpleadoPorId = async (idEmpleado) => {
    try {
        const docRef = doc(db, coleccion, idEmpleado);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("El empleado no existe en la base de datos.");
        }
    } catch (error) {
        console.error("Error al obtener el empleado:", error);
        throw error;
    }
};

// 3. Crear un NUEVO empleado
export const crearEmpleado = async (empleadoId, datosEmpleado) => {
    try {
        // Al usar 'doc(db, coleccion, empleadoId)' le estamos diciendo a Firebase:
        // "Obligatoriamente nombra este documento como el empleadoId que te estoy pasando"
        const docRef = doc(db, coleccion, empleadoId);
        
        // Usamos setDoc en lugar de addDoc para poder usar nuestro propio ID
        await setDoc(docRef, {
            empleadoId: empleadoId,
            ...datosEmpleado,
            fechaRegistro: new Date() // Guarda la fecha y hora actual automáticamente
        });
        
        return true;
    } catch (error) {
        console.error("Error al crear empleado:", error);
        throw error;
    }
};

// 4. Actualizar datos de un empleado (Para cuando le den a "Editar Perfil")
export const actualizarEmpleado = async (idEmpleado, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idEmpleado);
        
        // Le inyectamos la fechaModificacion antes de mandarlo a Firebase
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date() // Timestamp automático del momento exacto
        });
        
        return true;
    } catch (error) {
        console.error("Error al actualizar empleado:", error);
        throw error;
    }
};

// 5. Desactivar un empleado (En vez de borrarlo para no perder el historial)
export const desactivarEmpleado = async (idEmpleado) => {
    try {
        const docRef = doc(db, coleccion, idEmpleado);
        
        await updateDoc(docRef, { 
            estado: "INACTIVO",
            fechaModificacion: new Date() // Aquí también guardamos cuándo lo desactivaron
        });
        
        return true;
    } catch (error) {
        console.error("Error al desactivar empleado:", error);
        throw error;
    }
};