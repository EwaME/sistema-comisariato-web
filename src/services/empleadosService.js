// src/services/empleadosService.js
import { collection, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { crearUsuarioBaseEmpleado } from "./usuariosService";

const coleccion = "empleados";

export const obtenerEmpleados = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        const empleados = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() 
        }));
        return empleados;
    } catch (error) {
        console.error("Error al obtener los empleados:", error);
        throw error;
    }
};

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

export const crearEmpleado = async (empleadoId, datosEmpleado) => {
    try {
        const docRef = doc(db, coleccion, empleadoId);
        
        await setDoc(docRef, {
            empleadoId: empleadoId,
            ...datosEmpleado,
            fechaRegistro: new Date()
        });
        
        await crearUsuarioBaseEmpleado({ id: empleadoId, ...datosEmpleado });
        
        return true;
    } catch (error) {
        console.error("Error al crear empleado:", error);
        throw error;
    }
};

// AQUI ESTÁ EL CAMBIO CLAVE
export const actualizarEmpleado = async (idEmpleado, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idEmpleado);
        
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date() 
        });

        // ------------------------------------------------------------------
        // MAGIA: Sincronizar la foto, nombre y estado con la colección de 'usuarios'
        // ------------------------------------------------------------------
        const emailUsuario = datosNuevos.correo || datosNuevos.correoContacto;
        if (emailUsuario) {
            const usuarioRef = doc(db, "usuarios", emailUsuario.toLowerCase());
            const userSnap = await getDoc(usuarioRef);
            if (userSnap.exists()) {
                await updateDoc(usuarioRef, {
                    nombre: `${datosNuevos.nombres} ${datosNuevos.apellidos}`.trim(),
                    fotoUrl: datosNuevos.fotoUrl || "", // Pasamos la foto al usuario
                    estado: datosNuevos.estado, // Sincronizamos si lo desactivan
                    fechaModificacion: new Date()
                });
            }
        }
        
        return true;
    } catch (error) {
        console.error("Error al actualizar empleado:", error);
        throw error;
    }
};

export const desactivarEmpleado = async (idEmpleado) => {
    try {
        const docRef = doc(db, coleccion, idEmpleado);
        
        await updateDoc(docRef, { 
            estado: "INACTIVO",
            fechaModificacion: new Date() 
        });

        // Opcional: Podrías buscar su correo y desactivar el usuario aquí también si quisieras
        
        return true;
    } catch (error) {
        console.error("Error al desactivar empleado:", error);
        throw error;
    }
};

export const subirImagenEmpleado = async (archivo, idEmpleado) => {
    try {
        const storage = getStorage();
        const extension = archivo.name.split('.').pop();
        const rutaImagen = `empleados/${idEmpleado}.${extension}`;
        const storageRef = ref(storage, rutaImagen);

        await uploadBytes(storageRef, archivo);
        
        const urlDescarga = await getDownloadURL(storageRef);
        return urlDescarga;
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        throw error;
    }
};