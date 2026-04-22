import { collection, addDoc, getDocs, doc, updateDoc, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";

const coleccion = "comprasEwa";

export const crearCompra = async (datos) => {
    return await addDoc(collection(db, coleccion), {
        ...datos,
        estado: "PENDIENTE",
        fecha: new Date()
    });
};

export const obtenerCompras = async () => {
    const q = query(collection(db, coleccion), orderBy("fecha", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerCompraPorId = async (id) => {
    const snap = await getDoc(doc(db, coleccion, id));
    return { id: snap.id, ...snap.data() };
};

export const aceptarCompra = async (idCompra, itemsActualizados) => {
    await updateDoc(doc(db, coleccion, idCompra), { 
        estado: "ACEPTADO",
        items: itemsActualizados
    });
};

export const ingresarCompra = async (idCompra, itemsCompra) => {
    await updateDoc(doc(db, coleccion, idCompra), { estado: "INGRESADO" });
    
    for (const item of itemsCompra) {
        const prodRef = doc(db, "productos", item.productoId);
        const prodSnap = await getDoc(prodRef);
        
        if (prodSnap.exists()) {
            const stockActual = prodSnap.data().stock || 0;
            await updateDoc(prodRef, {
                stock: Number(stockActual) + Number(item.cantidad)
            });
        }
    }
};

export const rechazarCompra = async (idCompra) => {
    await updateDoc(doc(db, coleccion, idCompra), { estado: "RECHAZADO" });
};

