import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importa Storage

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
        return true;
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        throw error;
    }
};

// NUEVA FUNCIÓN PARA SUBIR IMÁGENES
export const subirImagenProducto = async (archivo, idProducto, tipoVista) => {
    try {
        const storage = getStorage();
        const extension = archivo.name.split('.').pop();
        // Guardamos en: productos/PROD-001/frontal.jpg
        const rutaImagen = `productos/${idProducto}/${tipoVista}.${extension}`;
        const storageRef = ref(storage, rutaImagen);

        await uploadBytes(storageRef, archivo);
        const urlDescarga = await getDownloadURL(storageRef);
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
        return true;
    } catch (error) {
        console.error("Error al actualizar comentario:", error);
        throw error;
    }
};