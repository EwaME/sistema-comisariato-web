import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const coleccion = "categorias";

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
        return idGenerado;
    } catch (error) {
        console.error("Error al crear categoría:", error);
        throw error;
    }
};

export const actualizarCategoria = async (id, datosNuevos) => {
    const docRef = doc(db, coleccion, id);
    await updateDoc(docRef, { ...datosNuevos, fechaModificacion: new Date() });
};

export const subirImagenCategoria = async (archivo, categoriaId) => {
    const storage = getStorage();
    const extension = archivo.name.split('.').pop();
    const rutaImagen = `categorias/${categoriaId}.${extension}`;
    const storageRef = ref(storage, rutaImagen);
    await uploadBytes(storageRef, archivo);
    return await getDownloadURL(storageRef);
};