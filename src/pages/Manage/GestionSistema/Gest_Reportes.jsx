import { useState } from "react";
import { 
    Calendar, CreditCard, Ban, Users, Package, 
    TrendingUp, FileDown, Download, Wallet,
    FileSpreadsheet, Loader2, Lock, KeyRound, ArrowRight
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { 
    obtenerReporteCreditosEntregados, 
    obtenerReporteCreditosRechazados,
    obtenerReporteEmpleados,
    obtenerReporteInventario,
    obtenerReporteDeducciones,
    obtenerReporteCategorias,
    verificarContrasenaReportes, 
    registrarExportacionReporte 
} from "../../../services/reportesService";

const REPORTES = [
    {
        id: "creditos_entregados",
        titulo: "Créditos por Período",
        descripcion: "Resumen detallado de líneas de crédito otorgadas y estados de aprobación.",
        icono: <CreditCard className="w-6 h-6 text-purple-600" />,
        bgIcono: "bg-purple-100",
        columnas: ["Fecha", "Empleado", "Producto", "Cuota", "Estado"]
    },
    {
        id: "creditos_rechazados",
        titulo: "Créditos Rechazados",
        descripcion: "Listado de solicitudes denegadas con sus respectivos motivos.",
        icono: <Ban className="w-6 h-6 text-red-600" />,
        bgIcono: "bg-red-100",
        columnas: ["Fecha", "Empleado", "Producto", "Motivo", "Monto"]
    },
    {
        id: "listado_empleados",
        titulo: "Listado de Empleados",
        descripcion: "Directorio de colaboradores, áreas y límites de crédito consumidos.",
        icono: <Users className="w-6 h-6 text-blue-600" />,
        bgIcono: "bg-blue-100",
        columnas: ["ID", "Nombre", "Departamento", "Límite", "Estado"]
    },
    {
        id: "inventario_actual",
        titulo: "Inventario Actual",
        descripcion: "Auditoría de existencias y valoración total de almacén.",
        icono: <Package className="w-6 h-6 text-emerald-600" />,
        bgIcono: "bg-emerald-100",
        columnas: ["SKU", "Producto", "Categoría", "Stock", "Precio Contado"]
    },
    {
        id: "categorias_ventas",
        titulo: "Categorías Más Vendidas",
        descripcion: "Análisis de rotación y popularidad por familia de productos.",
        icono: <TrendingUp className="w-6 h-6 text-orange-600" />,
        bgIcono: "bg-orange-100",
        columnas: ["Categoría", "Productos Vendidos", "Total Generado"]
    },
    {
        id: "deducciones_planilla",
        titulo: "Próximas Deducciones",
        descripcion: "Reporte de cuotas que se descontarán automáticamente de planilla.",
        icono: <Wallet className="w-6 h-6 text-indigo-600" />,
        bgIcono: "bg-indigo-100",
        columnas: ["ID Empleado", "Nombre", "Deducción Total", "Detalle de Créditos"]
    }
];

export default function PanelReportes() {
    const [autenticado, setAutenticado] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [errorAuth, setErrorAuth] = useState("");
    const [validando, setValidando] = useState(false);

    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [exportando, setExportando] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setValidando(true);
        setErrorAuth("");

        const esValido = await verificarContrasenaReportes(passwordInput);

        if (esValido) {
            setAutenticado(true);
        } else {
            setErrorAuth("Contraseña incorrecta. Intento registrado en auditoría.");
        }
        setValidando(false);
    };

    const obtenerDatosFirebase = async (reporteId) => {
        switch (reporteId) {
            case "creditos_entregados": return await obtenerReporteCreditosEntregados(fechaInicio, fechaFin);
            case "creditos_rechazados": return await obtenerReporteCreditosRechazados(fechaInicio, fechaFin);
            case "listado_empleados": return await obtenerReporteEmpleados();
            case "inventario_actual": return await obtenerReporteInventario();
            case "categorias_ventas": return await obtenerReporteCategorias();
            case "deducciones_planilla": return await obtenerReporteDeducciones();
            default: return [];
        }
    };

    const exportarExcelCSV = (data, reporte, formato) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
        
        const fileName = `${reporte.titulo}_${new Date().toLocaleDateString()}`;
        if (formato === "CSV") {
            XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: "csv" });
        } else {
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        }
    };

    const exportarPDF = (data, reporte) => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("COMISARIATO - REPORTE DEL SISTEMA", 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Reporte: ${reporte.titulo}`, 14, 30);
        doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 14, 37);
        doc.text(`Rango: ${fechaInicio || "Inicio"} al ${fechaFin || "Hoy"}`, 14, 44);

        const tableRows = data.map(obj => Object.values(obj));
        autoTable(doc, {
            startY: 50,
            head: [reporte.columnas],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [124, 58, 237] },
        });

        doc.save(`${reporte.titulo}.pdf`);
    };

    const handleExportar = async (formato, reporteId) => {
        const reporte = REPORTES.find(r => r.id === reporteId);
        setExportando(true);
        
        try {
            const data = await obtenerDatosFirebase(reporteId);
            
            if (data.length === 0) {
                alert("No hay datos para exportar. Intenta ampliar el rango de fechas.");
                return;
            }

            if (formato === "PDF") exportarPDF(data, reporte);
            else exportarExcelCSV(data, reporte, formato);

            const rangoAuditoria = (fechaInicio || fechaFin) ? `Del ${fechaInicio || 'Inicio'} al ${fechaFin || 'Hoy'}` : 'Global';
            await registrarExportacionReporte(reporte.titulo, formato, rangoAuditoria);

        } catch (error) {
            console.error("Error exportando:", error);
            alert("Ocurrió un error al generar el reporte.");
        } finally {
            setExportando(false);
        }
    };

    if (!autenticado) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#F8F9FF] p-4">
                <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-gray-100 max-w-md w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                    
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-indigo-600" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-[#101828] mb-2">Acceso Restringido</h2>
                    <p className="text-[13px] text-gray-500 mb-8 leading-relaxed">
                        El módulo de reportes contiene información sensible. Por favor, ingrese la contraseña maestra de administrador.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="password" 
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Contraseña Maestra..."
                                className={`w-full bg-[#F8F9FF] border ${errorAuth ? 'border-red-300 focus:ring-red-500/20' : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'} text-sm font-bold pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-4 transition-all`}
                            />
                        </div>
                        
                        {errorAuth && (
                            <p className="text-red-500 text-[12px] font-bold text-left px-2 animate-pulse">{errorAuth}</p>
                        )}

                        <button 
                            type="submit"
                            disabled={!passwordInput || validando}
                            className="w-full bg-[#020817] hover:bg-black text-white py-4 rounded-xl text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {validando ? <Loader2 className="w-5 h-5 animate-spin" /> : "Desbloquear Panel"}
                            {!validando && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F8F9FF] animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-[34px] leading-none font-black text-[#101828] mb-2">Reportes del Sistema</h1>
                    <p className="text-[14px] text-[#6A7288]">
                        Exporta datos críticos para la gestión de planilla y bodega.
                    </p>
                </div>

                <div className="bg-white p-2 rounded-2xl border border-[#E6E8F2] shadow-sm flex items-center gap-2 max-w-fit">
                    <div className="flex items-center px-3 gap-2 border-r border-gray-100">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Período</span>
                    </div>
                    <div className="flex items-center gap-2 px-2">
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="text-sm outline-none bg-transparent text-gray-600"/>
                        <span className="text-gray-300">-</span>
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="text-sm outline-none bg-transparent pr-2 text-gray-600"/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {REPORTES.map((reporte) => (
                    <div key={reporte.id} className="bg-white rounded-[1.5rem] border border-[#E6E8F2] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col group hover:border-purple-200 transition-all">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${reporte.bgIcono}`}>
                            {reporte.icono}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[18px] font-black text-[#101828] mb-2">{reporte.titulo}</h3>
                            <p className="text-[13px] text-[#6A7288] leading-relaxed mb-6">{reporte.descripcion}</p>
                        </div>

                        <div className="mt-auto space-y-2">
                            <button 
                                onClick={() => handleExportar('PDF', reporte.id)}
                                disabled={exportando}
                                className="w-full py-2.5 rounded-xl bg-[#020817] text-white text-[12px] font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {exportando ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} 
                                EXPORTAR PDF
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleExportar('EXCEL', reporte.id)}
                                    disabled={exportando}
                                    className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold hover:bg-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <FileSpreadsheet size={14} /> EXCEL
                                </button>
                                <button 
                                    onClick={() => handleExportar('CSV', reporte.id)}
                                    disabled={exportando}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Download size={14} /> CSV
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}