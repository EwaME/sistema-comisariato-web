import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { registrarAuditoria } from "./auditoriasService";

const coleccion = "productos";

export const obtenerProductos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        throw error;
    }
};

export const obtenerProductoPorId = async (idProducto) => {
    try {
        const docRef = doc(db, coleccion, idProducto);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("El producto no existe en la base de datos.");
        }
    } catch (error) {
        console.error("Error al obtener el producto:", error);
        throw error;
    }
};

export const crearProducto = async (datosProducto) => {
    try {
        const idGenerado = datosProducto.productoId; 
        const docRef = doc(db, coleccion, idGenerado);
        
        await setDoc(docRef, {
            ...datosProducto,
            fechaRegistro: new Date(),
            fechaModificacion: new Date()
        });
        
        await registrarAuditoria(
            "CREACIÓN", 
            "Gestión de Productos", 
            `Se registró un nuevo producto: ${datosProducto.nombre || idGenerado}`, 
            idGenerado
        );

        return idGenerado;
    } catch (error) {
        console.error("Error al crear producto:", error);
        throw error;
    }
};

export const actualizarProducto = async (idProducto, datosNuevos) => {
    try {
        const docRef = doc(db, coleccion, idProducto);
        await updateDoc(docRef, {
            ...datosNuevos,
            fechaModificacion: new Date()
        });

        // Al ser una edición normal, siempre mandará este log
        await registrarAuditoria(
            "EDICIÓN", 
            "Gestión de Productos", 
            "Se actualizaron los datos generales del producto", 
            idProducto
        );

        return true;
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        throw error;
    }
};

// --- NUEVA FUNCIÓN EXCLUSIVA PARA EL ESTADO ---
export const cambiarEstadoProducto = async (idProducto, nuevoEstadoActivo) => {
    try {
        const docRef = doc(db, coleccion, idProducto);
        await updateDoc(docRef, { 
            activo: nuevoEstadoActivo, 
            fechaModificacion: new Date() 
        });

        const accion = nuevoEstadoActivo ? "ACTIVACIÓN" : "ELIMINACIÓN";
        const mensaje = nuevoEstadoActivo 
            ? "Se reactivó el producto en la tienda"
            : "Se inhabilitó el producto ocultándolo de la tienda";

        await registrarAuditoria(
            accion, 
            "Gestión de Productos", 
            mensaje, 
            idProducto
        );

        return true;
    } catch (error) {
        console.error("Error al cambiar estado de producto:", error);
        throw error;
    }
};

export const subirImagenProducto = async (archivo, idProducto, tipoVista) => {
    try {
        const storage = getStorage();
        const extension = archivo.name.split('.').pop();
        const rutaImagen = `productos/${idProducto}/${tipoVista}.${extension}`;
        const storageRef = ref(storage, rutaImagen);

        await uploadBytes(storageRef, archivo);
        const urlDescarga = await getDownloadURL(storageRef);

        await registrarAuditoria(
            "EDICIÓN", 
            "Gestión de Productos", 
            `Se subió/actualizó la imagen (${tipoVista}) del producto`, 
            idProducto
        );

        return urlDescarga;
    } catch (error) {
        console.error(`Error al subir la imagen ${tipoVista}:`, error);
        throw error;
    }
};

export const obtenerComentariosProducto = async (idProducto) => {
    try {
        const subcoleccion = collection(db, coleccion, idProducto, "comentarios");
        const querySnapshot = await getDocs(subcoleccion);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener comentarios:", error);
        throw error;
    }
};

export const actualizarVisibilidadComentario = async (idProducto, idComentario, visible) => {
    try {
        const docRef = doc(db, coleccion, idProducto, "comentarios", idComentario);
        await updateDoc(docRef, {
            visible,
            fechaModificacion: new Date()
        });

        const accion = visible ? "ACTIVACIÓN" : "ELIMINACIÓN";
        const mensaje = visible ? "Se restauró la visibilidad de un comentario" : "Se ocultó un comentario por moderación";

        await registrarAuditoria(accion, "Gestión de Comentarios", mensaje, idProducto);

        return true;
    } catch (error) {
        console.error("Error al actualizar comentario:", error);
        throw error;
    }
};