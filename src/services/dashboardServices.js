import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getCountFromServer,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const obtenerMetricasCards = async () => {
  const creditosRef = collection(db, "creditos");
  const reclamosRef = collection(db, "reclamos");

  const [pendientes, reclamos, rechazados, revisando] = await Promise.all([
    getCountFromServer(query(creditosRef, where("estado", "==", "Pendiente"))),
    getCountFromServer(query(reclamosRef, where("estado", "==", "Pendiente"))),
    getCountFromServer(query(creditosRef, where("estado", "==", "Rechazado"))),
    getCountFromServer(
      query(creditosRef, where("estado", "==", "En revisión")),
    ),
  ]);

  return {
    totalPendientes: pendientes.data().count,
    totalReclamos: reclamos.data().count,
    totalRechazados: rechazados.data().count,
    totalRevision: revisando.data().count,
  };
};

export const obtenerFlujoCuotasMensual = async () => {
  const cuotasRef = collection(db, "cuotas");
  const q = query(cuotasRef, orderBy("fechaRegistro", "asc"));
  const snap = await getDocs(q);

  const mesesNom = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const dataAgrupada = {};

  snap.forEach((doc) => {
    const d = doc.data();
    const fecha = d.fechaRegistro?.toDate();
    if (fecha) {
      const mes = mesesNom[fecha.getMonth()];
      dataAgrupada[mes] = (dataAgrupada[mes] || 0) + d.monto;
    }
  });

  return mesesNom.map((m) => ({ name: m, monto: dataAgrupada[m] || 0 }));
};

export const obtenerDistribucionRadar = async () => {
  const creditosRef = collection(db, "creditos");
  const estados = ["Pendiente", "Aprobado", "Rechazado", "Liquidado"];

  const counts = await Promise.all(
    estados.map(async (est) => {
      const snap = await getCountFromServer(
        query(creditosRef, where("estado", "==", est)),
      );
      return { subject: est, A: snap.data().count, fullMark: 100 };
    }),
  );

  return counts;
};

export const listenColaAprobacion = (callback) => {
  const q = query(
    collection(db, "creditos"),
    where("estado", "in", ["Pendiente", "En revisión"]),
    orderBy("fechaRegistro", "desc"),
    limit(5),
  );

  return onSnapshot(q, (snap) => {
    const lista = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(lista);
  });
};

export const getInventoryStats = async () => {
  const [productosSnap, categoriasSnap] = await Promise.all([
    getDocs(collection(db, "productos")),
    getDocs(collection(db, "categorias")),
  ]);

  const productos = productosSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const categorias = categoriasSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const prodActivosCount = productos.filter((p) => p.activo === true).length;

  const totalSKUs = productos.length;
  const patrimonioTotal = productos.reduce(
    (acc, p) => acc + (p.precioContado || 0) * (p.stock || 0),
    0,
  );
  const stockBajo = productos.filter((p) => (p.stock || 0) <= 5);

  const rotacionCategorias = categorias
    .map((cat) => {
      const productosDeCat = productos.filter((p) => p.categoriaId === cat.id);
      const ventas = productosDeCat.reduce(
        (acc, p) => acc + (p.cantidadVendida || 0),
        0,
      );
      const stock = productosDeCat.reduce((acc, p) => acc + (p.stock || 0), 0);

      return {
        name: cat.nombre,
        ventas,
        stock,
      };
    })
    .filter((c) => c.ventas > 0 || c.stock > 0);

  const productosEstrella = [...productos]
    .sort((a, b) => (b.cantidadVendida || 0) - (a.cantidadVendida || 0))
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      ventas: p.cantidadVendida || 0,
    }));

  return {
    totalSKUs,
    patrimonioTotal,
    alertaStock: stockBajo.length,
    rotacionCategorias,
    productosEstrella,
    itemsStockCritico: stockBajo.slice(0, 3),
    prodActivos: prodActivosCount,
  };
};

export const listenSugerencias = (callback) => {
  const q = query(
    collection(db, "sugerencias"),
    orderBy("fechaRegistro", "desc"),
    limit(10),
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      user: doc.data().nombreUsuario || "Usuario",
      msg: doc.data().descripcion,
      tag: doc.data().asunto,
      time:
        doc
          .data()
          .fechaRegistro?.toDate()
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ||
        "Reciente",
      foto: doc.data().fotoUsuario,
    }));
    callback(data);
  });
};

// 2. Obtener métricas y ranking de productos/usuarios
export const obtenerDataModerador = async () => {
  const [productosSnap, usuariosSnap, sugerenciasSnap] = await Promise.all([
    getDocs(collection(db, "productos")),
    getDocs(collection(db, "usuarios")),
    getDocs(collection(db, "sugerencias")),
  ]);

  const productos = productosSnap.docs.map((doc) => doc.data());
  const totalUsuarios = usuariosSnap.size;

  const productosConRating = productos
    .filter((p) => p.rate > 0)
    .map((p) => ({
      producto: p.nombre || "Producto",
      rating: p.rate || 0,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const avgSatisfaccion =
    productos.length > 0
      ? (productos.reduce((acc, p) => acc + (p.rate || 0), 0) /
          productos.length) *
        20
      : 0;

  return {
    totalUsuarios,
    totalSugerencias: sugerenciasSnap.size,
    satisfaccion: Math.round(avgSatisfaccion),
    productosConRating,
  };
};

export const obtenerMetricasProveedor = async () => {
  const comprasRef = collection(db, "comprasEwa"); 

  const [pendientes, aceptados, rechazados] = await Promise.all([
    getCountFromServer(query(comprasRef, where("estado", "==", "PENDIENTE"))),
    getCountFromServer(query(comprasRef, where("estado", "==", "ACEPTADO"))),
    getCountFromServer(query(comprasRef, where("estado", "==", "RECHAZADO"))),
  ]);

  return {
    totalPendientes: pendientes.data().count,
    totalAceptados: aceptados.data().count,
    totalRechazados: rechazados.data().count,
  };
};