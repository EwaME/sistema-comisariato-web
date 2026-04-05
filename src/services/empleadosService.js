import { collection, getDocs, getDoc, doc, query, where, setDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { crearUsuarioBaseEmpleado } from "./usuariosService";
import { registrarAuditoria } from "./auditoriasService";
import emailjs from '@emailjs/browser';

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
        
        await registrarAuditoria(
            "CREACIÓN", 
            "Gestión de Empleados", 
            `Se registró un nuevo empleado: ${datosEmpleado.nombres} ${datosEmpleado.apellidos}`, 
            empleadoId
        );

        return true;
    } catch (error) {
        console.error("Error al crear empleado:", error);
        throw error;
    }
};

export const actualizarEmpleado = async (idEmpleado, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idEmpleado);
        
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date() 
        });

        const emailUsuario = datosNuevos.correo || datosNuevos.correoContacto;
        if (emailUsuario) {
            const usuarioRef = doc(db, "usuarios", emailUsuario.toLowerCase());
            const userSnap = await getDoc(usuarioRef);
            if (userSnap.exists()) {
                await updateDoc(usuarioRef, {
                    nombre: `${datosNuevos.nombres} ${datosNuevos.apellidos}`.trim(),
                    fotoUrl: datosNuevos.fotoUrl || "", 
                    estado: datosNuevos.estado, 
                    fechaModificacion: new Date()
                });
            }
        }
        
        await registrarAuditoria(
            "EDICIÓN", 
            "Gestión de Empleados", 
            `Se actualizaron los datos del empleado: ${datosNuevos.nombres} ${datosNuevos.apellidos}`, 
            idEmpleado
        );

        return true;
    } catch (error) {
        console.error("Error al actualizar empleado:", error);
        throw error;
    }
};

export const desactivarEmpleado = async (idEmpleado) => {
    try {
        const empleadoRef = doc(db, coleccion, idEmpleado);
        await updateDoc(empleadoRef, { 
            estado: "INACTIVO",
            fechaModificacion: new Date() 
        });

        const usuariosRef = collection(db, "usuarios");
        const q = query(usuariosRef, where("empleadoId", "==", idEmpleado)); 
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const promesasUsuarios = querySnapshot.docs.map((usuarioDoc) => {
                const usuarioRef = doc(db, "usuarios", usuarioDoc.id);
                return updateDoc(usuarioRef, {
                    estado: "INACTIVO",
                    fechaModificacion: new Date()
                });
            });

            await Promise.all(promesasUsuarios);
        }

        await registrarAuditoria(
            "ELIMINACIÓN", 
            "Gestión de Empleados", 
            `Se desactivó el empleado y su usuario de acceso`, 
            idEmpleado
        );

        return true;
    } catch (error) {
        console.error("Error al desactivar empleado y usuario:", error);
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

export const enviarCorreoBienvenida = async (correoDestino, nombreCompleto) => {
    const SERVICE_ID = "service_dcudf5l";
    const TEMPLATE_ID = "template_gjphc7v";
    const PUBLIC_KEY = "RzoFvVrmrGrLsQ_pb";

    const templateParams = {
        nombre: nombreCompleto,
        correo: correoDestino,
        to_email: correoDestino,
    };

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        
        await registrarAuditoria(
            "NOTIFICACIÓN", 
            "Gestión de Empleados", 
            `Correo de bienvenida enviado exitosamente a ${correoDestino} vía EmailJS`, 
            "N/A"
        );
        
        return true;
    } catch (error) {
        console.error("Error al enviar correo con EmailJS:", error);
        return false;
    }
};