import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Package,
  FileDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  ShoppingCart,
} from "lucide-react";
import { obtenerCompraPorId } from "../../../services/comprasService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ESTADO_CONFIG = {
  Pendiente: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-900",
    sub: "text-amber-700",
    icon: <AlertCircle />,
    label: "Pendiente de Revisión",
    desc: "El pedido está en espera de revisión por el proveedor.",
  },
  "En proceso": {
    bg: "bg-purple-50",
    border: "border-purple-100",
    text: "text-purple-900",
    sub: "text-purple-700",
    icon: <Clock />,
    label: "En Proceso",
    desc: "El proveedor está revisando el pedido.",
  },
  Aprobado: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-900",
    sub: "text-emerald-700",
    icon: <CheckCircle2 />,
    label: "Pedido Aprobado",
    desc: "El proveedor aprobó el pedido. Puede marcarse como entregado.",
  },
  Rechazado: {
    bg: "bg-red-50",
    border: "border-red-100",
    text: "text-red-900",
    sub: "text-red-700",
    icon: <XCircle />,
    label: "Pedido Rechazado",
    desc: null,
  },
  Entregado: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-900",
    sub: "text-blue-700",
    icon: <Truck />,
    label: "Entregado",
    desc: "El pedido fue recibido y el stock fue actualizado.",
  },
};

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
  return d.toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function DetalleCompra() {
  const { id } = useParams();
  const [compra, setCompra] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerCompraPorId(id);
        setCompra(data);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    if (id) cargar();
  }, [id]);

  const exportarPDF = async () => {
    if (!compra) return;
    setExportando(true);
    try {
      const doc = new jsPDF();

      doc.setFillColor(2, 8, 23);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Pedido de Compra", 20, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`ID: ${compra.compraId}`, 20, 30);
      doc.text(`Estado: ${compra.estado}`, 80, 30);
      doc.text(`Fecha: ${formatFecha(compra.fechaCreacion)}`, 140, 30);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Proveedor:", 20, 55);
      doc.setFont("helvetica", "normal");
      doc.text(compra.nombreProveedor || compra.idProveedor, 55, 55);

      doc.setFont("helvetica", "bold");
      doc.text("Solicitado por:", 20, 63);
      doc.setFont("helvetica", "normal");
      doc.text(compra.solicitadoPor || "—", 55, 63);

      if (compra.estado === "Rechazado" && compra.motivoRechazo) {
        doc.setFont("helvetica", "bold");
        doc.text("Motivo de rechazo:", 20, 71);
        doc.setFont("helvetica", "normal");
        const motivo = doc.splitTextToSize(compra.motivoRechazo, 130);
        doc.text(motivo, 60, 71);
      }

      autoTable(doc, {
        startY: 85,
        head: [["#", "ID Producto", "Nombre del Producto", "Cantidad"]],
        body: (compra.productos || []).map((p, i) => [
          i + 1,
          p.id,
          p.nombreProducto,
          p.cantidad,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [2, 8, 23],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 249, 255] },
      });

      const totalUnidades = (compra.productos || []).reduce(
        (a, b) => a + Number(b.cantidad),
        0,
      );
      const finalY = doc.lastAutoTable.finalY + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        `Total de líneas: ${(compra.productos || []).length}`,
        20,
        finalY,
      );
      doc.text(`Unidades totales: ${totalUnidades}`, 120, finalY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado el ${new Date().toLocaleDateString("es-HN")}`,
        20,
        285,
      );

      doc.save(
        `pedido-${compra.compraId}-${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } finally {
      setExportando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Cargando Expediente
        </p>
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center">
        <p className="text-gray-400 font-bold">Pedido no encontrado.</p>
        <Link to="/compras" className="mt-4 text-[#7C3AED] font-black text-sm">
          Regresar
        </Link>
      </div>
    );
  }

  const estadoConf = ESTADO_CONFIG[compra.estado];

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <Link
          to="/compras"
          className="inline-flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-6 hover:text-[#7C3AED] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Regresar al Panel
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ShoppingCart className="w-6 h-6 text-[#7C3AED]" />
              <h1 className="text-3xl font-black text-[#020817] tracking-tight">
                {compra.compraId}
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest ml-9">
              Pedido de Compra · {formatFecha(compra.fechaCreacion)}
            </p>
          </div>
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="flex items-center gap-2 px-5 py-3 bg-[#020817] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {exportando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Exportar PDF
          </button>
        </div>
      </div>

      {/* BANNER ESTADO */}
      {estadoConf && (
        <div
          className={`${estadoConf.bg} border ${estadoConf.border} rounded-[1rem] p-5 flex items-start gap-4 mb-8`}
        >
          <div
            className={`border ${estadoConf.border} w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${estadoConf.text}`}
          >
            {estadoConf.icon}
          </div>
          <div>
            <p
              className={`text-xs font-black uppercase tracking-widest ${estadoConf.text}`}
            >
              {estadoConf.label}
            </p>
            <p className={`text-[11px] font-bold mt-0.5 ${estadoConf.sub}`}>
              {compra.estado === "Rechazado"
                ? compra.motivoRechazo || "Sin motivo especificado."
                : estadoConf.desc}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* INFO GENERAL */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm space-y-5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Información General
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Proveedor
              </p>
              <p className="font-black text-sm text-gray-800">
                {compra.nombreProveedor}
              </p>
              <p className="text-[10px] text-gray-400">{compra.idProveedor}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Solicitado Por
              </p>
              <p className="font-bold text-sm text-gray-700">
                {compra.solicitadoPor}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Fecha de Creación
              </p>
              <p className="font-bold text-sm text-gray-700">
                {formatFecha(compra.fechaCreacion)}
              </p>
            </div>
            {compra.fechaEntrega && (
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Fecha de Entrega
                </p>
                <p className="font-bold text-sm text-gray-700">
                  {formatFecha(compra.fechaEntrega)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RESUMEN */}
        <div className="bg-[#020817] rounded-[1.5rem] p-6 shadow-sm text-white space-y-5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Resumen
          </h2>
          <div></div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Unidades Totales
            </p>
            <p className="text-3xl font-black text-[#7C3AED]">
              {(compra.productos || []).reduce(
                (a, b) => a + Number(b.cantidad),
                0,
              )}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Estado
            </p>
            <span
              className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${
                compra.estado === "Pendiente"
                  ? "bg-amber-100/20 text-amber-400 border-amber-400/20"
                  : compra.estado === "En proceso"
                    ? "bg-purple-100/20 text-purple-400 border-purple-400/20"
                    : compra.estado === "Aprobado"
                      ? "bg-emerald-100/20 text-emerald-400 border-emerald-400/20"
                      : compra.estado === "Rechazado"
                        ? "bg-red-100/20 text-red-400 border-red-400/20"
                        : "bg-blue-100/20 text-blue-400 border-blue-400/20"
              }`}
            >
              {compra.estado?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
          <Package className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">
            Productos del Pedido
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                <th className="px-6 py-4 text-left">#</th>
                <th className="px-6 py-4 text-left">ID Producto</th>
                <th className="px-6 py-4 text-left">Nombre</th>
                <th className="px-6 py-4 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {(compra.productos || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Sin productos
                    </p>
                  </td>
                </tr>
              ) : (
                compra.productos.map((prod, i) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 border-b border-gray-50/50">
                      <span className="text-[11px] font-black text-gray-400">
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-50/50">
                      <span className="text-[11px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                        {prod.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-50/50">
                      <p className="font-black text-sm text-gray-800">
                        {prod.nombreProducto}
                      </p>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-50/50 text-right">
                      <p className="text-lg font-black text-[#020817]">
                        {prod.cantidad}
                        <span className="text-[10px] text-gray-400 font-bold ml-1">
                          uds
                        </span>
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {(compra.productos || []).length > 0 && (
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-4 text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Total Unidades
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xl font-black text-[#020817]">
                      {(compra.productos || []).reduce(
                        (a, b) => a + Number(b.cantidad),
                        0,
                      )}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
