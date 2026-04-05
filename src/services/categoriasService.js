import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, limit, where, getCountFromServer } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { registrarAuditoria } from "./auditoriasService";

const coleccion = "categorias";

export const obtenerCategoriasConConteo = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        const categorias = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const categoriasConConteo = await Promise.all(categorias.map(async (cat) => {
            try {
                const q = query(collection(db, "productos"), where("categoriaId", "==", cat.categoriaId));
                const snapshot = await getCountFromServer(q);
                return { ...cat, cantidadProductos: snapshot.data().count };
            } catch (err) {
                console.error(`Error contando productos para ${cat.categoriaId}:`, err);
                return { ...cat, cantidadProductos: 0 };
            }
        }));

        return categoriasConConteo;
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        throw error;
    }
};

export const obtenerCategorias = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        throw error;
    }
};

export const obtenerCategoriaPorId = async (id) => {
    const docSnap = await getDoc(doc(db, coleccion, id));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    throw new Error("Categoría no encontrada");
};

export const crearCategoria = async (datosCategoria) => {
    try {
        const idGenerado = datosCategoria.categoriaId;
        const docRef = doc(db, coleccion, idGenerado);
        await setDoc(docRef, {
            ...datosCategoria,
            fechaRegistro: new Date()
        });

        await registrarAuditoria(
            "CREACIÓN", 
            "Gestión de Categorías", 
            `Se registró una nueva categoría: ${datosCategoria.nombre || idGenerado}`, 
            idGenerado
        );

        return idGenerado;
    } catch (error) {
        console.error("Error al crear categoría:", error);
        throw error;
    }
};

export const actualizarCategoria = async (id, datosNuevos) => {
    const docRef = doc(db, coleccion, id);
    await updateDoc(docRef, { ...datosNuevos, fechaModificacion: new Date() });

    await registrarAuditoria(
        "EDICIÓN", 
        "Gestión de Categorías", 
        `Se actualizaron los datos de la categoría`, 
        id
    );
};

export const cambiarEstadoCategoria = async (id, nuevoEstado) => {
    try {
        const docRef = doc(db, coleccion, id);
        await updateDoc(docRef, { 
            estado: nuevoEstado, 
            fechaModificacion: new Date() 
        });

        const esInactivo = nuevoEstado.toLowerCase() === 'inactivo';
        
        const tipoAccion = esInactivo ? 'ELIMINACIÓN' : 'ACTIVACIÓN';
        const mensaje = esInactivo 
            ? 'Se inhabilitó la categoría ocultándola de la App móvil' 
            : 'Se reactivó la categoría en el sistema';

        await registrarAuditoria(
            tipoAccion, 
            "Gestión de Categorías", 
            mensaje, 
            id
        );

        return true;
    } catch (error) {
        console.error("Error al cambiar estado de categoría:", error);
        throw error;
    }
};

export const subirImagenCategoria = async (archivo, categoriaId) => {
    const storage = getStorage();
    const extension = archivo.name.split('.').pop();
    const rutaImagen = `categorias/${categoriaId}.${extension}`;
    const storageRef = ref(storage, rutaImagen);
    await uploadBytes(storageRef, archivo);
    return await getDownloadURL(storageRef);
};