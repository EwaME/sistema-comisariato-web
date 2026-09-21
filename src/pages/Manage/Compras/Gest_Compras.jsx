import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Trash2,
  Edit2,
  PackageCheck,
  ShoppingCart,
  Inbox,
} from "lucide-react";
import {
  escucharComprasRealTime,
  eliminarCompra,
  marcarComoEntregado,
} from "../../../services/comprasService";

const ESTADOS_COLOR = {
  Pendiente: "bg-amber-50 text-amber-600 border-amber-100",
  "En proceso": "bg-purple-50 text-purple-600 border-purple-100",
  Aprobado: "bg-emerald-50 text-emerald-600 border-emerald-100",
  Rechazado: "bg-red-50 text-red-600 border-red-100",
  Entregado: "bg-blue-50 text-blue-600 border-blue-100",
};

export default function Gest_Compras() {
  const navigate = useNavigate();
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 10;

  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalEntregado, setModalEntregado] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const unsub = escucharComprasRealTime((data) => {
      setCompras(data);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const filtradas = compras.filter((c) => {
    const q = busqueda.toLowerCase();
    const matchSearch =
      c.compraId?.toLowerCase().includes(q) ||
      c.nombreProveedor?.toLowerCase().includes(q) ||
      c.solicitadoPor?.toLowerCase().includes(q);
    const matchEstado = !filtroEstado || c.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const totalPag = Math.ceil(filtradas.length / POR_PAGINA);
  const paginadas = filtradas.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA,
  );

  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const abrirEliminar = (compra) => {
    setCompraSeleccionada(compra);
    setModalEliminar(true);
  };

  const abrirEntregado = (compra) => {
    setCompraSeleccionada(compra);
    setModalEntregado(true);
  };

  const confirmarEliminar = async () => {
    if (!compraSeleccionada) return;
    setProcesando(true);
    try {
      await eliminarCompra(compraSeleccionada.id);
      setModalEliminar(false);
    } catch {
      alert("Error al eliminar el pedido.");
    } finally {
      setProcesando(false);
    }
  };

  const confirmarEntregado = async () => {
    if (!compraSeleccionada) return;
    setProcesando(true);
    try {
      await marcarComoEntregado(compraSeleccionada.id);
      setModalEntregado(false);
    } catch {
      alert("Error al marcar como entregado.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFF]">
        <Loader2 className="animate-spin text-[#7C3AED] w-10 h-10 mb-4" />
        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">
          Cargando Pedidos...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#FDFDFF] min-h-screen">
      {/* HEADER */}
      <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black text-[#020817] tracking-tight">
              Pedidos de Compra
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Gestión de órdenes de compra a proveedores
          </p>
        </div>
        <button
          onClick={() => navigate("nuevo")}
          className="flex items-center gap-2 bg-[#020817] text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nuevo Pedido
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {["Pendiente", "En proceso", "Aprobado", "Rechazado", "Entregado"].map(
          (e) => (
            <button
              key={e}
              onClick={() => {
                setFiltroEstado(filtroEstado === e ? "" : e);
                setPagina(1);
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:shadow-md ${filtroEstado === e ? "ring-2 ring-[#7C3AED] ring-offset-2" : ""} ${ESTADOS_COLOR[e]}`}
            >
              <p className="text-2xl font-black">
                {compras.filter((c) => c.estado === e).length}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest mt-0.5">
                {e}
              </p>
            </button>
          ),
        )}
      </div>

      {/* TABLA */}
      <div className="bg-white border border-gray-100 rounded-[1rem] shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-gray-50">
          <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">
            Historial de Pedidos
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID, proveedor..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                className="w-full sm:w-64 bg-gray-50 border-none text-[11px] font-bold pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPagina(1);
              }}
              className="bg-gray-50 border-none text-[10px] font-black uppercase px-4 py-3 rounded-xl outline-none cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                <th className="px-6 pb-4 pt-4 text-left">Pedido</th>
                <th className="px-6 pb-4 pt-4 text-left">Proveedor</th>
                <th className="px-6 pb-4 pt-4 text-left">Solicitado Por</th>
                <th className="px-6 pb-4 pt-4 text-left">Fecha</th>
                <th className="px-6 pb-4 pt-4 text-center">Estado</th>
                <th className="px-6 pb-4 pt-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      No hay pedidos registrados
                    </p>
                  </td>
                </tr>
              ) : (
                paginadas.map((compra) => {
                  const puedEditar =
                    compra.estado === "Pendiente" ||
                    compra.estado === "Rechazado";
                  const puedEliminar = compra.estado === "Pendiente";
                  const puedEntregar = compra.estado === "Aprobado";

                  return (
                    <tr
                      key={compra.id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 border-b border-gray-50/50">
                        <p className="font-black text-[12px] text-gray-800">
                          {compra.compraId}
                        </p>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50/50">
                        <p className="font-bold text-[12px] text-gray-700">
                          {compra.nombreProveedor}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase">
                          {compra.idProveedor}
                        </p>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50/50">
                        <p className="text-[11px] font-bold text-gray-500">
                          {compra.solicitadoPor}
                        </p>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50/50">
                        <p className="text-[11px] font-bold text-gray-500">
                          {formatFecha(compra.fechaCreacion)}
                        </p>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50/50 text-center">
                        <span
                          className={`text-[9px] font-black px-3 py-1.5 rounded-full border ${ESTADOS_COLOR[compra.estado] || "bg-gray-50 text-gray-500 border-gray-100"}`}
                        >
                          {compra.estado?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50/50 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {puedEntregar && (
                            <button
                              onClick={() => abrirEntregado(compra)}
                              title="Marcar como Entregado"
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase hover:bg-emerald-100 transition-all"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Entregar
                            </button>
                          )}
                          {puedEditar && (
                            <button
                              onClick={() => navigate(`editar/${compra.id}`)}
                              title="Editar"
                              className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#020817] hover:text-white transition-all flex items-center justify-center"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {puedEliminar && (
                            <button
                              onClick={() => abrirEliminar(compra)}
                              title="Eliminar"
                              className="w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Link
                            to={`detalle/${compra.id}`}
                            title="Ver detalle"
                            className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#020817] hover:text-white transition-all flex items-center justify-center"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-50">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Total: {filtradas.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
              className="p-2 bg-gray-50 rounded-lg disabled:opacity-20 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-[11px] font-black text-gray-700 w-16 text-center">
              Pág. {pagina}
            </span>
            <button
              disabled={pagina >= totalPag}
              onClick={() => setPagina((p) => p + 1)}
              className="p-2 bg-gray-50 rounded-lg disabled:opacity-20 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL ELIMINAR */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020817]/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tighter mb-2">
              ¿Eliminar pedido?
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mb-2">
              {compraSeleccionada?.compraId}
            </p>
            <p className="text-[11px] text-gray-400 font-bold mb-8">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button
                disabled={procesando}
                onClick={confirmarEliminar}
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                {procesando && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Eliminación
              </button>
              <button
                disabled={procesando}
                onClick={() => setModalEliminar(false)}
                className="w-full py-4 text-[10px] font-black text-gray-400 uppercase hover:text-[#020817] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MARCAR ENTREGADO */}
      {modalEntregado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020817]/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center mb-6">
              <PackageCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black tracking-tighter mb-2">
              Marcar como Entregado
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mb-2">
              {compraSeleccionada?.compraId}
            </p>
            <p className="text-[11px] text-gray-500 font-bold mb-8">
              Las cantidades de todos los productos del pedido se sumarán al
              stock del inventario.
            </p>
            <div className="flex flex-col gap-3">
              <button
                disabled={procesando}
                onClick={confirmarEntregado}
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-[#020817] text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {procesando && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Entrega
              </button>
              <button
                disabled={procesando}
                onClick={() => setModalEntregado(false)}
                className="w-full py-4 text-[10px] font-black text-gray-400 uppercase hover:text-[#020817] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
