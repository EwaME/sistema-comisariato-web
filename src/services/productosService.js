// src/services/productosService.js
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; 

const coleccion = "productos";

// Obtener todos los productos para la tabla principal
export const obtenerProductos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        const productos = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() 
        }));
        return productos;
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        throw error;
    }
};

// Obtener un solo producto (te servirá más adelante para Editar o Ver Detalles)
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