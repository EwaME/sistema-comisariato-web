import React, { useState, useEffect } from "react";
import { useAuth } from "../../../auth/AuthProvider";
import {
  obtenerCreditosRealTime,
  obtenerListaEsperaRealTime,
  revisionState,
} from "../../../services/creditosService";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Inbox,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Gest_Creditos() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [historial, setHistorial] = useState([]);
  const [listaEspera, setListaEspera] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [pagEspera, setPagEspera] = useState(1);
  const itemsPorPagEspera = 4;

  const [pagHistorial, setPagHistorial] = useState(1);
  const itemsPorPagHistorial = 10;

  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Componente de animación para revisiones activas
  const DotsPlaying = () => (
    <div className="flex gap-1 items-center ml-1">
      <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.07s]"></div>
      <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce"></div>
    </div>
  );

  const formatearLempiras = (monto) => {
    return new Intl.NumberFormat("es-HN", {
      style: "currency",
      currency: "HNL",
    }).format(monto);
  };

  useEffect(() => {
    const desubEspera = obtenerListaEsperaRealTime((data) => {
      setListaEspera(data);
      setCargando(false);
    });
    const desubHistorial = obtenerCreditosRealTime((data) => {
      setHistorial(data);
    });
    return () => {
      desubEspera();
      desubHistorial();
    };
  }, []);

  const handleIniciarRevision = async (idCredito, revisorActualEmail) => {
    if (!user?.email) return;

    // BLOQUEO: Si alguien más lo está revisando, no dejar entrar
    if (revisorActualEmail && revisorActualEmail !== user.email) {
      alert(
        `Esta solicitud ya está siendo revisada por: ${revisorActualEmail}`,
      );
      return;
    }

    try {
      await revisionState(idCredito, user.email);
      navigate(`revision/${idCredito}`);
    } catch (error) {
      console.error(error);
    }
  };

  const historialFiltrado = historial.filter((c) => {
    const matchBusqueda =
      c.nombreProducto?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      c.usuario?.toLowerCase().includes(terminoBusqueda.toLowerCase());
    const matchEstado = filtroEstado === "" || c.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const totalPagEspera = Math.ceil(listaEspera.length / itemsPorPagEspera);
  const esperaPaginada = listaEspera.slice(
    (pagEspera - 1) * itemsPorPagEspera,
    pagEspera * itemsPorPagEspera,
  );

  const totalPagHistorial = Math.ceil(
    historialFiltrado.length / itemsPorPagHistorial,
  );
  const historialPaginado = historialFiltrado.slice(
    (pagHistorial - 1) * itemsPorPagHistorial,
    pagHistorial * itemsPorPagHistorial,
  );

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFF]">
        <Loader2 className="animate-spin text-[#7C3AED] w-10 h-10 mb-4" />
        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">
          Cargando Gestión...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#FDFDFF] min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#020817]">
            Gestión de Créditos
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 font-medium">
            Revisa, aprueba o rechaza solicitudes de crédito en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
            {listaEspera.length}
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none">
              Pendientes
            </p>
            <p className="text-xs font-bold text-gray-700">En cola</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LISTA DE ESPERA CON LÓGICA DE BLOQUEO */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
              Lista de Espera
            </h3>
            {totalPagEspera > 1 && (
              <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPagEspera((p) => Math.max(1, p - 1))}
                  disabled={pagEspera === 1}
                  className="p-1 disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-[10px] font-bold text-gray-400 px-1">
                  {pagEspera}/{totalPagEspera}
                </span>
                <button
                  onClick={() =>
                    setPagEspera((p) => Math.min(totalPagEspera, p + 1))
                  }
                  disabled={pagEspera >= totalPagEspera}
                  className="p-1 disabled:opacity-20"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {listaEspera.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-[1.5rem] py-12 flex flex-col items-center justify-center shadow-sm">
                <Inbox className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  Sin solicitudes
                </p>
              </div>
            ) : (
              esperaPaginada.map((solicitud) => {
                const estaSiendoRevisado =
                  solicitud.estado === "En revisión" ||
                  solicitud.estado === "En Revisión";
                const soyElRevisor = solicitud.revisorEmail === user?.email;
                const otroRevisor = estaSiendoRevisado && !soyElRevisor;

                return (
                  <div
                    key={solicitud.id}
                    className="bg-white border border-gray-100 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Badge de "En Revisión" por otros */}
                    {otroRevisor && (
                      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 z-10">
                        <Lock className="w-2.5 h-2.5" /> EN REVISIÓN
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={solicitud.imagenProductoURL}
                        className={`w-14 h-14 rounded-2xl object-cover bg-gray-50 border border-gray-50 shadow-sm ${otroRevisor ? "opacity-50 grayscale" : ""}`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-gray-800 truncate leading-tight">
                          {solicitud.nombreProducto}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-bold truncate uppercase">
                          {solicitud.usuario}
                        </p>
                      </div>
                    </div>

                    {/* Mostrar quién está revisando */}
                    {estaSiendoRevisado && (
                      <div className="mb-3 flex items-center gap-2 bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[8px] text-white font-bold">
                          <img
                            src={solicitud.revisorFotoTemp}
                            className={`w-5 h-5 rounded-2xl object-cover bg-gray-50 border border-gray-50 shadow-sm`}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-purple-700 flex items-center">
                          {soyElRevisor
                            ? "Estás revisando esto"
                            : `${solicitud.revisorEmail?.split("@")[0]} revisando`}
                          <DotsPlaying />
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50/50 p-2 rounded-xl">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          Cuota
                        </p>
                        <p className="text-[11px] font-black text-gray-700">
                          {formatearLempiras(solicitud.cuotaMensual)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          Plazo
                        </p>
                        <p className="text-[11px] font-black text-gray-700">
                          {solicitud.plazoMeses} Meses
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleIniciarRevision(
                          solicitud.id,
                          solicitud.revisorEmail,
                        )
                      }
                      disabled={otroRevisor}
                      className={`w-full py-3 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] 
                        ${
                          otroRevisor
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#020817] hover:bg-gray-800 text-white shadow-lg shadow-gray-200"
                        }`}
                    >
                      {soyElRevisor
                        ? "CONTINUAR REVISIÓN"
                        : otroRevisor
                          ? "BLOQUEADO"
                          : "INICIAR REVISIÓN"}
                      {!otroRevisor && <ArrowRight className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* TABLA DE HISTORIAL (DERECHA) */}
        <main className="lg:col-span-8 xl:col-span-9 bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            <div className="w-full text-center lg:text-left">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">
                Historial de Operaciones
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Registro histórico de transacciones finalizadas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={terminoBusqueda}
                  onChange={(e) => {
                    setTerminoBusqueda(e.target.value);
                    setPagHistorial(1);
                  }}
                  className="w-full sm:w-64 bg-gray-50 border-none text-[11px] font-bold pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPagHistorial(1);
                }}
                className="bg-gray-50 border-none text-[10px] font-black uppercase px-4 py-3 rounded-xl outline-none cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-4 text-left">Referencia de Crédito</th>
                  <th className="pb-4 text-left">Monto</th>
                  <th className="pb-4 text-center">Estado</th>
                  <th className="pb-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {historialPaginado.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-5 border-b border-gray-50/50">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.imagenProductoURL}
                          className="w-12 h-12 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all border border-gray-100 shadow-sm"
                        />
                        <div>
                          <p className="font-black text-gray-700 leading-tight">
                            {item.nombreProducto}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            {item.usuario}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 border-b border-gray-50/50">
                      <p className="font-black text-gray-700">
                        {formatearLempiras(item.cuotaMensual)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        {item.plazoMeses} meses
                      </p>
                    </td>
                    <td className="py-5 border-b border-gray-50/50 text-center">
                      <span
                        className={`text-[9px] font-black px-4 py-1.5 rounded-full border shadow-sm ${
                          item.estado === "Aprobado"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}
                      >
                        {item.estado?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-5 border-b border-gray-50/50 text-right">
                      <Link
                        to={`detalle/${item.id}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#020817] hover:text-white transition-all shadow-sm"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-8">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Total: {historialFiltrado.length}
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
                disabled={pagHistorial >= totalPagHistorial}
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
