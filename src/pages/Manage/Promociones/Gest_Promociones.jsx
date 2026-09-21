import React, { useState, useEffect, useRef } from "react";
import {
  Search, MoreHorizontal, ChevronRight, Loader2, ChevronLeft,
  Filter, XCircle, X, AlertCircle, FileDown, FileSpreadsheet,
  Download, BadgePercent,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  escucharPromocionesRealTime,
  cambiarEstadoPromocion,
} from "../../../services/promocionesService";

const TIPO_LABELS = {
  DESCUENTO_PORCENTAJE: "Desc. %",
  DESCUENTO_FIJO: "Desc. Fijo",
  "2X1": "2 x 1",
  COMBO: "Combo",
  OTRO: "Otro",
};

const TIPO_COLORS = {
  DESCUENTO_PORCENTAJE: "#7C3AED",
  DESCUENTO_FIJO: "#2563EB",
  "2X1": "#16A34A",
  COMBO: "#EA580C",
  OTRO: "#6B7280",
};

const TIPOS = Object.keys(TIPO_LABELS);

export default function GestPromociones() {
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const filtroRef = useRef(null);
  const [filtrosTemp, setFiltrosTemp] = useState({ tipo: "", estado: "" });
  const [filtrosAplicados, setFiltrosAplicados] = useState({ tipo: "", estado: "" });

  const [menuActivo, setMenuActivo] = useState(null);
  const menuRef = useRef(null);

  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [promocionSeleccionada, setPromocionSeleccionada] = useState(null);
  const [inputConfirmacion, setInputConfirmacion] = useState("");
  const [procesandoEstado, setProcesandoEstado] = useState(false);

  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    setCargando(true);
    const desuscribir = escucharPromocionesRealTime((data) => {
      setPromociones(data);
      setCargando(false);
    });
    return () => desuscribir();
  }, []);

  useEffect(() => {
    const handleClickFuera = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuActivo(null);
      if (filtroRef.current && !filtroRef.current.contains(event.target))
        setMostrarFiltros(false);
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const isFiltroActivo =
    filtrosAplicados.tipo !== "" || filtrosAplicados.estado !== "";

  const handleBotonFiltroClick = () => {
    if (isFiltroActivo) {
      setFiltrosAplicados({ tipo: "", estado: "" });
      setFiltrosTemp({ tipo: "", estado: "" });
      setPaginaActual(1);
    } else {
      setMostrarFiltros(!mostrarFiltros);
    }
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados(filtrosTemp);
    setMostrarFiltros(false);
    setPaginaActual(1);
  };

  const promocionesFiltradas = promociones.filter((prom) => {
    const termino = busqueda.toLowerCase();
    const matchBusqueda =
      prom.nombre?.toLowerCase().includes(termino) ||
      prom.promocionId?.toLowerCase().includes(termino);
    const matchTipo =
      filtrosAplicados.tipo === "" || prom.tipo === filtrosAplicados.tipo;
    const matchEstado =
      filtrosAplicados.estado === "" || prom.estado === filtrosAplicados.estado;
    return matchBusqueda && matchTipo && matchEstado;
  });

  const totalPaginas =
    Math.ceil(promocionesFiltradas.length / itemsPorPagina) || 1;
  const startIndex = (paginaActual - 1) * itemsPorPagina;
  const promocionesPaginadas = promocionesFiltradas.slice(
    startIndex,
    startIndex + itemsPorPagina
  );

  const dataPie = TIPOS.map((tipo) => ({
    name: TIPO_LABELS[tipo],
    value: promociones.filter((p) => p.tipo === tipo).length,
    color: TIPO_COLORS[tipo],
  })).filter((d) => d.value > 0);

  const obtenerDatosExport = () =>
    promocionesFiltradas.map((p) => ({
      ID: p.promocionId || p.id,
      Nombre: p.nombre,
      Tipo: TIPO_LABELS[p.tipo] || p.tipo,
      Descuento:
        p.tipo === "DESCUENTO_PORCENTAJE"
          ? `${p.valorDescuento}%`
          : p.tipo === "DESCUENTO_FIJO"
          ? `L ${p.valorDescuento}`
          : "N/A",
      "Fecha Inicio": p.fechaInicio || "N/A",
      "Fecha Fin": p.fechaFin || "N/A",
      Estado: p.estado,
    }));

  const exportarPDF = () => {
    setExportando(true);
    try {
      const datos = obtenerDatosExport();
      if (datos.length === 0) {
        alert("No hay promociones para exportar.");
        return;
      }
      const docPDF = new jsPDF();
      docPDF.setFontSize(18);
      docPDF.text("COMISARIATO - GESTIÓN DE PROMOCIONES", 14, 20);
      docPDF.setFontSize(11);
      docPDF.setTextColor(100);
      docPDF.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
      docPDF.text(`Total de registros: ${datos.length}`, 14, 37);
      autoTable(docPDF, {
        startY: 45,
        head: [["ID", "Nombre", "Tipo", "Descuento", "F. Inicio", "F. Fin", "Estado"]],
        body: datos.map((d) => [
          d.ID,
          d.Nombre,
          d.Tipo,
          d.Descuento,
          d["Fecha Inicio"],
          d["Fecha Fin"],
          d.Estado,
        ]),
        theme: "striped",
        headStyles: { fillColor: [124, 58, 237] },
      });
      docPDF.save("Promociones.pdf");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al generar el PDF.");
    } finally {
      setExportando(false);
    }
  };

  const exportarExcelCSV = (formato) => {
    setExportando(true);
    try {
      const datos = obtenerDatosExport();
      if (datos.length === 0) {
        alert("No hay promociones para exportar.");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(datos);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Promociones");
      const fileName = `Promociones_${new Date().toLocaleDateString()}`;
      if (formato === "CSV") {
        XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: "csv" });
      } else {
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al generar el archivo.");
    } finally {
      setExportando(false);
    }
  };

  const abrirModalEstado = (prom) => {
    setPromocionSeleccionada(prom);
    setModalConfirmacion(true);
    setInputConfirmacion("");
    setMenuActivo(null);
  };

  const cerrarModalEstado = () => {
    setModalConfirmacion(false);
    setPromocionSeleccionada(null);
    setInputConfirmacion("");
  };

  const confirmarCambioEstado = async () => {
    if (inputConfirmacion !== promocionSeleccionada.promocionId) return;
    setProcesandoEstado(true);
    try {
      const nuevoEstado =
        promocionSeleccionada.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      await cambiarEstadoPromocion(promocionSeleccionada.id, nuevoEstado);
      cerrarModalEstado();
    } catch (error) {
      alert("No se pudo actualizar el estado de la promoción.");
    } finally {
      setProcesandoEstado(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-[#020817]">
          Gestión de Promociones
        </h2>
        <p className="text-[13px] text-gray-500 mt-1 font-medium">
          Administra las promociones y descuentos activos del comisariato
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] items-start gap-6 w-full">
        {/* TABLA PRINCIPAL */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200 relative z-10 w-full overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 relative">
            {/* Búsqueda */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar por nombre o ID..."
                className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
              />
              {busqueda && (
                <button
                  onClick={() => {
                    setBusqueda("");
                    setPaginaActual(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto relative">
              {/* Botón filtro */}
              <button
                onClick={handleBotonFiltroClick}
                className={`border text-[11px] font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors w-full md:w-auto uppercase tracking-widest
                  ${isFiltroActivo
                    ? "bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100"
                    : "bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {isFiltroActivo ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
                {isFiltroActivo ? "Quitar Filtros" : "Filtrar"}
              </button>

              {/* Dropdown filtros */}
              {mostrarFiltros && (
                <div
                  ref={filtroRef}
                  className="absolute top-14 right-0 md:right-36 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 p-4"
                >
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">
                    Opciones de Filtro
                  </h4>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-[#020817] mb-2">
                      Tipo
                    </label>
                    <select
                      value={filtrosTemp.tipo}
                      onChange={(e) =>
                        setFiltrosTemp({ ...filtrosTemp, tipo: e.target.value })
                      }
                      className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    >
                      <option value="">Todos los tipos</option>
                      {TIPOS.map((t) => (
                        <option key={t} value={t}>
                          {TIPO_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-[#020817] mb-2">
                      Estado
                    </label>
                    <select
                      value={filtrosTemp.estado}
                      onChange={(e) =>
                        setFiltrosTemp({ ...filtrosTemp, estado: e.target.value })
                      }
                      className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    >
                      <option value="">Todos los estados</option>
                      <option value="ACTIVO">Activos</option>
                      <option value="INACTIVO">Inactivos</option>
                    </select>
                  </div>

                  <button
                    onClick={aplicarFiltros}
                    className="w-full bg-[#020817] text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-black transition-colors uppercase tracking-widest"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              )}

              <Link
                to="/promociones/nueva"
                className="bg-[#020817] text-white text-[11px] font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md w-full md:w-auto uppercase tracking-widest whitespace-nowrap"
              >
                Nueva Promoción
              </Link>
            </div>
          </div>

          {/* Tabla */}
          <div className="w-full overflow-x-auto min-h-[400px]">
            {cargando ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7C3AED]" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  Cargando promociones...
                </p>
              </div>
            ) : promocionesPaginadas.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 font-bold uppercase text-sm mb-2">
                  No se encontraron promociones
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F9FF] rounded-xl">
                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest rounded-l-xl">
                      ID #
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Nombre
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Tipo
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">
                      Descuento
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      F. Inicio
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      F. Fin
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">
                      Estado
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center rounded-r-xl">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-[#020817]">
                  {promocionesPaginadas.map((prom) => {
                    const estaActivo = prom.estado === "ACTIVO";
                    return (
                      <tr
                        key={prom.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-5 px-4 text-gray-400 font-bold text-xs">
                          {prom.promocionId}
                        </td>
                        <td className="py-5 px-4">
                          <p
                            className="font-bold text-[#020817] text-sm max-w-[200px] truncate"
                            title={prom.nombre}
                          >
                            {prom.nombre}
                          </p>
                          {prom.descripcion && (
                            <p className="text-[10px] text-gray-400 max-w-[200px] truncate">
                              {prom.descripcion}
                            </p>
                          )}
                        </td>
                        <td className="py-5 px-4">
                          <span
                            className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest inline-block"
                            style={{
                              backgroundColor: `${TIPO_COLORS[prom.tipo]}18`,
                              color: TIPO_COLORS[prom.tipo] || "#6B7280",
                            }}
                          >
                            {TIPO_LABELS[prom.tipo] || prom.tipo}
                          </span>
                        </td>
                        <td className="py-5 px-4 text-center font-bold text-gray-700">
                          {prom.tipo === "DESCUENTO_PORCENTAJE"
                            ? `${prom.valorDescuento}%`
                            : prom.tipo === "DESCUENTO_FIJO"
                            ? `L ${prom.valorDescuento}`
                            : "—"}
                        </td>
                        <td className="py-5 px-4 text-gray-600 text-xs">
                          {prom.fechaInicio || "—"}
                        </td>
                        <td className="py-5 px-4 text-gray-600 text-xs">
                          {prom.fechaFin || "—"}
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span
                            className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest inline-block ${
                              estaActivo
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {estaActivo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="py-5 px-4 text-center relative">
                          <button
                            onClick={() =>
                              setMenuActivo(
                                menuActivo === prom.id ? null : prom.id
                              )
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors focus:outline-none"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {menuActivo === prom.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-12 top-10 w-40 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left py-2"
                            >
                              <div className="px-4 py-1 mb-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                  Opciones
                                </span>
                              </div>
                              <Link
                                to={`/promociones/editar/${prom.id}`}
                                className="block w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Editar
                              </Link>
                              <button
                                onClick={() => abrirModalEstado(prom)}
                                className={`w-full px-4 py-2 text-xs font-medium text-left transition-colors ${
                                  estaActivo
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {estaActivo ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {!cargando && promocionesFiltradas.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Mostrando {startIndex + 1} a{" "}
                {Math.min(startIndex + itemsPorPagina, promocionesFiltradas.length)}{" "}
                de {promocionesFiltradas.length} Promociones
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-3">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() =>
                    setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PANEL DERECHO */}
        <div className="flex flex-col gap-6 w-full">
          {/* Tarjeta de exportación */}
          <div className="w-full bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <FileDown className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <h3 className="font-extrabold text-[#020817] uppercase tracking-wider text-sm">
                Exportar
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mb-5 leading-relaxed">
              Exporta el listado actual con los filtros aplicados.
            </p>
            <div className="space-y-2">
              <button
                onClick={exportarPDF}
                disabled={exportando}
                className="w-full py-2.5 rounded-xl bg-[#020817] text-white text-[12px] font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exportando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileDown size={14} />
                )}
                EXPORTAR PDF
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => exportarExcelCSV("EXCEL")}
                  disabled={exportando}
                  className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold hover:bg-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} /> EXCEL
                </button>
                <button
                  onClick={() => exportarExcelCSV("CSV")}
                  disabled={exportando}
                  className="flex-1 py-2.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={14} /> CSV
                </button>
              </div>
            </div>
          </div>

          {/* Gráfico de pastel */}
          <div className="w-full bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <BadgePercent className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-extrabold text-[#020817] uppercase tracking-wider text-sm">
                Distribución por Tipo
              </h3>
            </div>

            {cargando ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            ) : dataPie.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Sin datos para mostrar
                </p>
                <p className="text-[10px] text-gray-300 mt-1">
                  Agrega promociones para ver el gráfico
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f0f0f0",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Modal confirmación de estado */}
      {modalConfirmacion && promocionSeleccionada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div
              className={`${
                promocionSeleccionada.estado === "ACTIVO"
                  ? "bg-red-50 border-red-100"
                  : "bg-green-50 border-green-100"
              } p-6 flex flex-col items-center border-b relative`}
            >
              <button
                onClick={cerrarModalEstado}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <AlertCircle
                  className={`w-8 h-8 ${
                    promocionSeleccionada.estado === "ACTIVO"
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                />
              </div>
              <h3
                className={`text-lg font-extrabold text-center ${
                  promocionSeleccionada.estado === "ACTIVO"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                ¿{promocionSeleccionada.estado === "ACTIVO"
                  ? "Desactivar"
                  : "Activar"}{" "}
                promoción?
              </h3>
              <p
                className={`text-xs font-medium mt-1 text-center px-4 ${
                  promocionSeleccionada.estado === "ACTIVO"
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {promocionSeleccionada.estado === "ACTIVO"
                  ? "La promoción dejará de aplicarse en el sistema."
                  : "La promoción volverá a estar disponible."}
              </p>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                Para confirmar, escribe el{" "}
                <span className="font-bold">ID de la Promoción</span>: <br />
                <span className="font-extrabold text-[#020817] select-all bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  {promocionSeleccionada.promocionId}
                </span>
              </p>

              <input
                type="text"
                value={inputConfirmacion}
                onChange={(e) => setInputConfirmacion(e.target.value)}
                placeholder={`Ej: ${promocionSeleccionada.promocionId}`}
                className={`w-full text-center bg-[#F8F9FF] border text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  promocionSeleccionada.estado === "ACTIVO"
                    ? "border-gray-200 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 focus:ring-green-500/20 focus:border-green-500"
                }`}
              />

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={cerrarModalEstado}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCambioEstado}
                  disabled={
                    inputConfirmacion !== promocionSeleccionada.promocionId ||
                    procesandoEstado
                  }
                  className={`flex-1 text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase
                    ${
                      inputConfirmacion !== promocionSeleccionada.promocionId ||
                      procesandoEstado
                        ? "bg-gray-300 cursor-not-allowed opacity-70"
                        : promocionSeleccionada.estado === "ACTIVO"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                >
                  {procesandoEstado
                    ? "Procesando..."
                    : promocionSeleccionada.estado === "ACTIVO"
                    ? "Sí, Desactivar"
                    : "Sí, Activar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}