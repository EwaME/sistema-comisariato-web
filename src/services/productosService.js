// src/services/productosService.js
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 

const coleccion = "productos";

// Obtener todos los productos
export const obtenerProductos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        throw error;
    }
};

// Obtener un solo producto
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

// Crear un NUEVO producto
export const crearProducto = async (datosProducto) => {
    try {
        // Generamos un ID tipo "PROD-123456" usando los últimos dígitos del timestamp
        const idGenerado = `PROD-${Date.now().toString().slice(-6)}`;
        const docRef = doc(db, coleccion, idGenerado);
        
        await setDoc(docRef, {
            productoId: idGenerado,
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

// (Opcional) Editar un producto existente
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