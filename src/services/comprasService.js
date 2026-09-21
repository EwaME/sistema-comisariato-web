import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { registrarAuditoria } from "./auditoriasService";

const COLECCION = "exj_compras";

export const generarIdCompra = async () => {
  const snap = await getDocs(collection(db, COLECCION));
  const num = snap.size + 1;
  return `COMP-${String(num).padStart(3, "0")}`;
};

export const obtenerCompras = async () => {
  try {
    const q = query(collection(db, COLECCION), orderBy("fechaCreacion", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error al obtener compras:", error);
    throw error;
  }
};

export const obtenerCompraPorId = async (id) => {
  try {
    const docRef = doc(db, COLECCION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Pedido no encontrado.");
    const productosSnap = await getDocs(
      collection(db, COLECCION, id, "productos")
    );
    const productos = productosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { id: docSnap.id, ...docSnap.data(), productos };
  } catch (error) {
    console.error("Error al obtener compra:", error);
    throw error;
  }
};

export const escucharComprasRealTime = (callback) => {
  const q = query(collection(db, COLECCION), orderBy("fechaCreacion", "desc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error("Error real-time compras:", err)
  );
};

export const escucharComprasPorProveedorRealTime = (idProveedor, callback) => {
  const q = query(
    collection(db, COLECCION),
    where("idProveedor", "==", idProveedor),
    orderBy("fechaCreacion", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error("Error real-time compras proveedor:", err)
  );
};

export const crearCompra = async (datos, productos, solicitadoPor) => {
  try {
    const compraId = datos.compraId;
    const docRef = doc(db, COLECCION, compraId);

    await setDoc(docRef, {
      compraId,
      idProveedor: datos.idProveedor,
      nombreProveedor: datos.nombreProveedor,
      solicitadoPor,
      estado: "Pendiente",
      motivoRechazo: "",
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
    });

    const batch = writeBatch(db);
    for (const prod of productos) {
      const prodRef = doc(db, COLECCION, compraId, "productos", prod.id);
      batch.set(prodRef, {
        id: prod.id,
        nombreProducto: prod.nombreProducto,
        cantidad: Number(prod.cantidad),
      });
    }
    await batch.commit();

    await registrarAuditoria(
      "CREACIÓN",
      "Gestión de Compras",
      `Se registró un nuevo pedido de compra: ${compraId}`,
      compraId
    );

    return compraId;
  } catch (error) {
    console.error("Error al crear compra:", error);
    throw error;
  }
};

export const actualizarCompra = async (id, datos, productos, estadoAnterior) => {
  try {
    const docRef = doc(db, COLECCION, id);
    const update = {
      idProveedor: datos.idProveedor,
      nombreProveedor: datos.nombreProveedor,
      fechaModificacion: new Date(),
    };

    if (estadoAnterior === "Rechazado") {
      update.estado = "Pendiente";
      update.motivoRechazo = "";
    }

    await updateDoc(docRef, update);

    const existSnap = await getDocs(collection(db, COLECCION, id, "productos"));
    const batch = writeBatch(db);
    existSnap.docs.forEach((d) => batch.delete(d.ref));
    for (const prod of productos) {
      const prodRef = doc(db, COLECCION, id, "productos", prod.id);
      batch.set(prodRef, {
        id: prod.id,
        nombreProducto: prod.nombreProducto,
        cantidad: Number(prod.cantidad),
      });
    }
    await batch.commit();

    await registrarAuditoria(
      "EDICIÓN",
      "Gestión de Compras",
      `Se actualizó el pedido de compra: ${id}`,
      id
    );

    return true;
  } catch (error) {
    console.error("Error al actualizar compra:", error);
    throw error;
  }
};

export const eliminarCompra = async (id) => {
  try {
    const productosSnap = await getDocs(
      collection(db, COLECCION, id, "productos")
    );
    const batch = writeBatch(db);
    productosSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, COLECCION, id));
    await batch.commit();

    await registrarAuditoria(
      "ELIMINACIÓN",
      "Gestión de Compras",
      `Se eliminó el pedido de compra: ${id}`,
      id
    );

    return true;
  } catch (error) {
    console.error("Error al eliminar compra:", error);
    throw error;
  }
};

export const iniciarRevisionCompra = async (id) => {
  try {
    await updateDoc(doc(db, COLECCION, id), {
      estado: "En proceso",
      fechaModificacion: new Date(),
    });
    await registrarAuditoria(
      "EDICIÓN",
      "Gestión de Compras",
      `Se inició la revisión del pedido: ${id}`,
      id
    );
  } catch (error) {
    console.error("Error al iniciar revisión:", error);
    throw error;
  }
};

export const resolverCompra = async (id, estado, motivoRechazo = "") => {
  try {
    const update = { estado, fechaModificacion: new Date() };
    if (estado === "Rechazado") update.motivoRechazo = motivoRechazo;

    await updateDoc(doc(db, COLECCION, id), update);
    await registrarAuditoria(
      estado === "Aprobado" ? "APROBACIÓN" : "RECHAZO",
      "Gestión de Compras",
      `Pedido ${id} ${estado.toLowerCase()}${motivoRechazo ? `: ${motivoRechazo}` : ""}`,
      id
    );
  } catch (error) {
    console.error("Error al resolver compra:", error);
    throw error;
  }
};

export const marcarComoEntregado = async (id) => {
  try {
    const productosSnap = await getDocs(
      collection(db, COLECCION, id, "productos")
    );
    const productos = productosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    for (const prod of productos) {
      const productoRef = doc(db, "productos", prod.id);
      const productoSnap = await getDoc(productoRef);
      if (productoSnap.exists()) {
        const stockActual = productoSnap.data().stock || 0;
        await updateDoc(productoRef, {
          stock: stockActual + Number(prod.cantidad),
          fechaModificacion: new Date(),
        });
      }
    }

    await updateDoc(doc(db, COLECCION, id), {
      estado: "Entregado",
      fechaEntrega: new Date(),
      fechaModificacion: new Date(),
    });

    await registrarAuditoria(
      "ENTREGA",
      "Gestión de Compras",
      `Pedido ${id} marcado como entregado y stock actualizado`,
      id
    );
  } catch (error) {
    console.error("Error al marcar como entregado:", error);
    throw error;
  }
};
