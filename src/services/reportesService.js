import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import { registrarAuditoria } from "./auditoriasService"; 

export const verificarContrasenaReportes = async (password) => {
    const CONTRASEÑA_MAESTRA = "Admin2026*";

    if (password === CONTRASEÑA_MAESTRA) {
        await registrarAuditoria("ACCESO", "Reportes", "Ingreso exitoso al panel de reportes mediante contraseña maestra.", "N/A");
        return true;
    } else {
        await registrarAuditoria("ALERTA", "Reportes", "Intento fallido de ingreso al panel de reportes (contraseña incorrecta).", "N/A");
        return false;
    }
};

export const registrarExportacionReporte = async (titulo, formato, rango) => {
    await registrarAuditoria("EXPORTACIÓN", "Reportes", `Exportó el reporte '${titulo}' en formato ${formato}. Rango: ${rango}`, "N/A");
};

const estaEnRango = (fechaRegistro, fechaInicio, fechaFin) => {
    if (!fechaRegistro) return false;
    const millis = fechaRegistro.toMillis();
    const start = fechaInicio ? Timestamp.fromDate(new Date(`${fechaInicio}T00:00:00`)).toMillis() : 0;
    const end = fechaFin ? Timestamp.fromDate(new Date(`${fechaFin}T23:59:59`)).toMillis() : Infinity;
    return millis >= start && millis <= end;
};

const obtenerDiccionarioEmpleados = async () => {
    const empleadosRef = collection(db, "empleados");
    const snapshot = await getDocs(empleadosRef);
    const diccionario = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        diccionario[data.empleadoId || doc.id] = `${data.nombres} ${data.apellidos}`;
    });
    return diccionario;
};

export const obtenerReporteCreditosEntregados = async (fechaInicio, fechaFin) => {
    try {
        const empleados = await obtenerDiccionarioEmpleados();
        const creditosRef = collection(db, "creditos");
        let q = query(creditosRef, where("estado", "==", "Aprobado"));
        const snapshot = await getDocs(q);
        
        const data = [];
        snapshot.forEach((doc) => {
            const row = doc.data();
            if (estaEnRango(row.fechaRegistro, fechaInicio, fechaFin)) {
                data.push({
                    "Fecha": row.fechaRegistro.toDate().toLocaleDateString('es-HN'),
                    "Empleado": empleados[row.empleadoId] || row.empleadoId || "Desconocido",
                    "Producto": row.nombreProducto || "N/A",
                    "Cuota": `L. ${parseFloat(row.cuotaMensual || 0).toFixed(2)}`,
                    "Estado": row.estado
                });
            }
        });
        return data;
    } catch (error) {
        console.error("Error en reporte de entregados:", error);
        return [];
    }
};

export const obtenerReporteCreditosRechazados = async (fechaInicio, fechaFin) => {
    try {
        const empleados = await obtenerDiccionarioEmpleados();
        const creditosRef = collection(db, "creditos");
        let q = query(creditosRef, where("estado", "==", "Rechazado"));
        const snapshot = await getDocs(q);
        
        const data = [];
        snapshot.forEach((doc) => {
            const row = doc.data();
            if (estaEnRango(row.fechaRegistro, fechaInicio, fechaFin)) {
                data.push({
                    "Fecha": row.fechaRegistro.toDate().toLocaleDateString('es-HN'),
                    "Empleado": empleados[row.empleadoId] || row.empleadoId || "Desconocido",
                    "Producto": row.nombreProducto || "N/A",
                    "Motivo": row.Respuesta || "Sin justificación",
                    "Cuota": `L. ${parseFloat(row.cuotaMensual || 0).toFixed(2)}`
                });
            }
        });
        return data;
    } catch (error) {
        console.error("Error en reporte de rechazados:", error);
        return [];
    }
};

export const obtenerReporteEmpleados = async () => {
    try {
        const empleadosRef = collection(db, "empleados");
        const snapshot = await getDocs(empleadosRef);
        const data = [];
        snapshot.forEach((doc) => {
            const row = doc.data();
            data.push({
                "ID": row.empleadoId || doc.id,
                "Nombre": `${row.nombres} ${row.apellidos}`,
                "Departamento": row.departamento || "N/A",
                "Límite": `L. ${row.limiteCredito || 0}`,
                "Estado": row.estado || "N/A"
            });
        });
        return data;
    } catch (error) {
        console.error("Error en reporte de empleados:", error);
        return [];
    }
};

export const obtenerReporteInventario = async () => {
    try {
        const productosRef = collection(db, "productos");
        const snapshot = await getDocs(productosRef);
        const data = [];
        snapshot.forEach((doc) => {
            const row = doc.data();
            data.push({
                "SKU": row.productoId || doc.id,
                "Producto": row.nombre || "N/A",
                "Categoría": row.categoria || "N/A",
                "Stock": row.stock || 0,
                "Precio Contado": `L. ${row.precioContado || 0}`
            });
        });
        return data;
    } catch (error) {
        console.error("Error en reporte de inventario:", error);
        return [];
    }
};

export const obtenerReporteCategorias = async () => {
    try {
        const productosRef = collection(db, "productos");
        const snapshot = await getDocs(productosRef);
        const categorias = {};

        snapshot.forEach((doc) => {
            const p = doc.data();
            const cat = p.categoria || "Sin Categoría";
            const vendida = p.cantidadVendida || 0;
            const totalLps = vendida * (p.precioContado || 0);

            if (!categorias[cat]) categorias[cat] = { vendida: 0, total: 0 };
            categorias[cat].vendida += vendida;
            categorias[cat].total += totalLps;
        });

        return Object.entries(categorias)
            .sort((a, b) => b[1].vendida - a[1].vendida)
            .map(([cat, info]) => ({
                "Categoría": cat,
                "Productos Vendidos": info.vendida,
                "Total Generado": `L. ${info.total.toFixed(2)}`
            }));
    } catch (error) {
        console.error("Error en reporte de categorias:", error);
        return [];
    }
};

export const obtenerReporteDeducciones = async () => {
    try {
        const empleados = await obtenerDiccionarioEmpleados();
        const creditosRef = collection(db, "creditos");
        let q = query(creditosRef, where("estado", "==", "Aprobado"));
        const snapshot = await getDocs(q);
        
        const consolidado = {};

        snapshot.forEach((doc) => {
            const row = doc.data();
            const pagadas = row.cuotasPagadas || 0;
            const totalCuotas = row.cantidad || 12;

            if (pagadas < totalCuotas) { 
                const empId = row.empleadoId;
                const cuota = parseFloat(row.cuotaMensual) || 0;

                if (!consolidado[empId]) {
                    consolidado[empId] = {
                        "ID Empleado": empId,
                        "Nombre": empleados[empId] || "Desconocido",
                        TotalDeducir: 0,
                        "Detalle": ""
                    };
                }
                consolidado[empId].TotalDeducir += cuota;
                consolidado[empId].Detalle += `${row.nombreProducto} (L.${cuota.toFixed(2)}) | `;
            }
        });

        return Object.values(consolidado).map(emp => ({
            "ID Empleado": emp["ID Empleado"],
            "Nombre": emp.Nombre,
            "Deducción Total": `L. ${emp.TotalDeducir.toFixed(2)}`,
            "Detalle de Créditos": emp.Detalle.slice(0, -3)
        }));

    } catch (error) {
        console.error("Error en reporte de deducciones:", error);
        return [];
    }
};