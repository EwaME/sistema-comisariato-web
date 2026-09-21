import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Inbox,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../../../auth/AuthProvider";
import {
  escucharComprasPorProveedorRealTime,
  iniciarRevisionCompra,
} from "../../../services/comprasService";

const ESTADOS_COLOR = {
  Pendiente: "bg-amber-50 text-amber-600 border-amber-100",
  "En proceso": "bg-purple-50 text-purple-600 border-purple-100",
  Aprobado: "bg-emerald-50 text-emerald-600 border-emerald-100",
  Rechazado: "bg-red-50 text-red-600 border-red-100",
  Entregado: "bg-blue-50 text-blue-600 border-blue-100",
};

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
  return d.toLocaleDateString("es-HN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function Gest_SolicitudesCompra() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [pagCola, setPagCola] = useState(1);
  const [pagHistorial, setPagHistorial] = useState(1);
  const POR_PAG_COLA = 4;
  const POR_PAG_HIST = 10;

  useEffect(() => {
    if (!user?.email) return;
    const unsub = escucharComprasPorProveedorRealTime(user.email, (data) => {
      setSolicitudes(data);
      setCargando(false);
    });
    return () => unsub();
  }, [user]);

  const cola = solicitudes.filter(
    (s) => s.estado === "Pendiente" || s.estado === "En proceso"
  );
  const historial = solicitudes.filter(
    (s) =>
      s.estado === "Aprobado" ||
      s.estado === "Rechazado" ||
      s.estado === "Entregado"
  );

  const totalPagCola = Math.ceil(cola.length / POR_PAG_COLA);
  const colaPaginada = cola.slice(
    (pagCola - 1) * POR_PAG_COLA,
    pagCola * POR_PAG_COLA
  );

  const totalPagHist = Math.ceil(historial.length / POR_PAG_HIST);
  const historialPaginado = historial.slice(
    (pagHistorial - 1) * POR_PAG_HIST,
    pagHistorial * POR_PAG_HIST
  );

  const handleIniciarRevision = async (solicitud) => {
    try {
      if (solicitud.estado === "Pendiente") {
        await iniciarRevisionCompra(solicitud.id);
      }
      navigate(`revision/${solicitud.id}`);
    } catch (error) {
      console.error(error);
      alert("Error al iniciar la revisión.");
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFF]">
        <Loader2 className="animate-spin text-[#7C3AED] w-10 h-10 mb-4" />
        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">
          Cargando Solicitudes...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#FDFDFF] min-h-screen">
      {/* HEADER */}
      <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#020817] tracking-tight">
            Solicitudes de Compra
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
            Pedidos asignados a tu perfil de proveedor
          </p>
        </div>

        {/* CONTADOR */}
        <div className="flex items-center gap-5 bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
          <div className="w-14 h-14 rounded-[1rem] bg-[#020817] flex items-center justify-center text-white font-black text-xl shadow-lg">
            {cola.length}
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              En Cola
            </p>
            <p className="text-sm font-black text-gray-800">Pendientes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLA DE SOLICITUDES */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
              Cola de Solicitudes
            </h3>
            {totalPagCola > 1 && (
              <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPagCola((p) => Math.max(1, p - 1))}
                  disabled={pagCola === 1}
                  className="p-1 disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-[10px] font-bold text-gray-400 px-1">
                  {pagCola}/{totalPagCola}
                </span>
                <button
                  onClick={() => setPagCola((p) => Math.min(totalPagCola, p + 1))}
                  disabled={pagCola >= totalPagCola}
                  className="p-1 disabled:opacity-20"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {cola.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-[1.5rem] py-12 flex flex-col items-center justify-center shadow-sm">
                <Inbox className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  Sin solicitudes pendientes
                </p>
              </div>
            ) : (
              colaPaginada.map((sol) => {
                const enProceso = sol.estado === "En proceso";
                return (
                  <div
                    key={sol.id}
                    className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        {sol.compraId}
                      </span>
                      {enProceso && (
                        <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                          <span className="text-[9px] font-black text-purple-700 uppercase">
                            En Revisión
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Solicitado por
                      </p>
                      <p className="font-black text-sm text-gray-800">
                        {sol.solicitadoPor}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50/50 p-2 rounded-xl">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          Fecha
                        </p>
                        <p className="text-[11px] font-black text-gray-700">
                          {formatFecha(sol.fechaCreacion)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          Estado
                        </p>
                        <p
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border inline-block ${ESTADOS_COLOR[sol.estado]}`}
                        >
                          {sol.estado}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleIniciarRevision(sol)}
                      className="w-full py-3 text-[10px] font-black rounded-xl bg-[#020817] hover:bg-gray-800 text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {enProceso ? "CONTINUAR REVISIÓN" : "INICIAR REVISIÓN"}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* HISTORIAL */}
        <main className="lg:col-span-8 xl:col-span-9 bg-white border border-gray-100 rounded-[1rem] p-8 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <ClipboardList className="w-5 h-5 text-[#7C3AED]" />
            <div>
              <h3 className="text-xl font-black text-gray-800 tracking-tight">
                Historial de Solicitudes
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Solicitudes que ya fueron procesadas.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-4 text-left">Pedido</th>
                  <th className="pb-4 text-left">Solicitado Por</th>
                  <th className="pb-4 text-left">Fecha</th>
                  <th className="pb-4 text-center">Estado</th>
                  <th className="pb-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {historialPaginado.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        Sin historial
                      </p>
                    </td>
                  </tr>
                ) : (
                  historialPaginado.map((sol) => (
                    <tr
                      key={sol.id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-5 border-b border-gray-50/50">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                              sol.estado === "Aprobado"
                                ? "bg-emerald-50 border-emerald-100"
                                : sol.estado === "Rechazado"
                                ? "bg-red-50 border-red-100"
                                : "bg-blue-50 border-blue-100"
                            }`}
                          >
                            {sol.estado === "Aprobado" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : sol.estado === "Rechazado" ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <p className="font-black text-sm text-gray-800">
                            {sol.compraId}
                          </p>
                        </div>
                      </td>
                      <td className="py-5 border-b border-gray-50/50">
                        <p className="text-[11px] font-bold text-gray-600">
                          {sol.solicitadoPor}
                        </p>
                      </td>
                      <td className="py-5 border-b border-gray-50/50">
                        <p className="text-[11px] font-bold text-gray-500">
                          {formatFecha(sol.fechaCreacion)}
                        </p>
                      </td>
                      <td className="py-5 border-b border-gray-50/50 text-center">
                        <span
                          className={`text-[9px] font-black px-3 py-1.5 rounded-full border ${ESTADOS_COLOR[sol.estado]}`}
                        >
                          {sol.estado?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-5 border-b border-gray-50/50 text-right">
                        <Link
                          to={`detalle/${sol.id}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#020817] hover:text-white transition-all shadow-sm"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-8">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Total: {historial.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagHistorial === 1}
                onClick={() => setPagHistorial((p) => p - 1)}
                className="p-2 bg-gray-50 rounded-lg disabled:opacity-20 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-[11px] font-black text-gray-700 w-16 text-center">
                Pág. {pagHistorial}
              </span>
              <button
                disabled={pagHistorial >= totalPagHist}
                onClick={() => setPagHistorial((p) => p + 1)}
                className="p-2 bg-gray-50 rounded-lg disabled:opacity-20 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
