import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Shield,
  UserPlus,
  CheckCircle,
  FileText,
  Loader2,
  Info,
  Users,
  MessageSquareWarning,
  TrendingUp,
  PackageSearch,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GiWallet } from "react-icons/gi";
import { MdOutlineCategory } from "react-icons/md";
import {
  obtenerMetricasCards,
  obtenerFlujoCuotasMensual,
  listenColaAprobacion,
  getInventoryStats,
  obtenerDataModerador,
} from "../../services/dashboardServices";
import { escucharAuditorias } from "../../services/auditoriasService";

const StatCard = ({
  icon: Icon,
  color,
  badge,
  value,
  label,
  details = [],
  hasPopover = false,
}) => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div
      className="bg-white p-5 md:p-6 rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200 relative overflow-hidden group transition-all hover:shadow-md h-full min-h-[140px] md:min-h-[160px]"
      onMouseEnter={() => hasPopover && setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
      onClick={() => hasPopover && setShowPopover(!showPopover)}
    >
      <div
        className={`absolute -bottom-6 -right-6 ${color.icon} transform rotate-12 transition-transform group-hover:rotate-6 duration-500`}
      >
        <Icon size={140} />
      </div>

      {showPopover && hasPopover && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-2 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#020817]/95 backdrop-blur-md text-white text-[11px] p-4 rounded-xl shadow-2xl border border-white/10 w-full h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
              <Info size={14} className="text-green-400" />
              <span className="font-bold uppercase tracking-wider text-[10px]">
                Análisis
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 uppercase font-black">
                  Valor Total
                </span>
                <span className="text-lg font-black text-green-400 leading-none">
                  {value}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                {details.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[8px] text-gray-500 uppercase font-bold">
                      {item.label}
                    </span>
                    <span className="text-white font-bold text-[10px]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <span
          className={`${color.badge} text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full mb-2 md:mb-3 inline-block uppercase`}
        >
          {badge}
        </span>
        <h3 className="text-xl md:text-2xl xl:text-3xl font-extrabold text-[#020817] tracking-tight mb-1 truncate">
          {value}
        </h3>
        <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [flujoData, setFlujoData] = useState([]);
  const [colaAprobacion, setColaAprobacion] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [auditorias, setAuditorias] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricas, flujo, inv, modData] = await Promise.all([
          obtenerMetricasCards(),
          obtenerFlujoCuotasMensual(),
          getInventoryStats(),
          obtenerDataModerador(),
        ]);
        setStats({ ...metricas, ...modData });
        setFlujoData(flujo);
        setInventory(inv);
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
    const desubCola = listenColaAprobacion((data) => setColaAprobacion(data));
    const desubAudits = escucharAuditorias((data) =>
      setAuditorias(data.slice(0, 6)),
    );
    return () => {
      if (desubCola) desubCola();
      if (desubAudits) desubAudits();
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF]">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
      </div>
    );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto bg-[#F8F9FF]">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              badge="Comunidad"
              value={stats.totalUsuarios || 0}
              label="Usuarios Registrados"
              color={{
                icon: "text-blue-500/10",
                badge: "bg-blue-100 text-blue-600",
              }}
            />
            <StatCard
              icon={GiWallet}
              badge="Patrimonio"
              value={`L. ${(inventory?.patrimonioTotal || 0).toLocaleString()}`}
              label="En Inventario"
              hasPopover={true}
              color={{
                icon: "text-green-500/10",
                badge: "bg-green-100 text-green-600",
              }}
              details={[
                { label: "SKUs", value: inventory?.totalSKUs },
                { label: "Activos", value: inventory?.prodActivos },
              ]}
            />
            <StatCard
              icon={MessageSquareWarning}
              badge="Atención"
              value={stats.totalReclamos || 0}
              label="Pendientes"
              color={{
                icon: "text-red-500/10",
                badge: "bg-red-50 text-red-500",
              }}
            />
            <StatCard
              icon={TrendingUp}
              badge="Créditos"
              value={stats.totalPendientes || 0}
              label="Por Aprobar"
              color={{
                icon: "text-yellow-500/10",
                badge: "bg-yellow-100 text-yellow-500",
              }}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-white p-5 md:p-6 rounded-2xl border border-gray-200 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-[#020817] mb-1">
                Recaudación Mensual
              </h3>
              <p className="text-[10px] md:text-xs text-gray-400 mb-6 uppercase tracking-wider font-bold">
                Flujo de cuotas percibidas
              </p>
              <div className="h-64 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={flujoData}>
                    <defs>
                      <linearGradient
                        id="colorMonto"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#7C3AED"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#7C3AED"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      dy={10}
                    />
                    <Tooltip
                      formatter={(v) => `L. ${v.toLocaleString()}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="monto"
                      stroke="#7C3AED"
                      fillOpacity={1}
                      fill="url(#colorMonto)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="w-full lg:w-80 bg-white p-5 md:p-6 rounded-2xl border border-gray-200">
              <h3 className="text-base md:text-lg font-bold text-[#020817] mb-6 flex items-center gap-2">
                <MdOutlineCategory className="text-purple-500" /> Top Productos
              </h3>
              <div className="space-y-3">
                {inventory?.productosEstrella.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="text-[11px] font-bold text-[#020817] truncate">
                        {item.nombre}
                      </p>
                      <p className="text-[9px] text-gray-500 uppercase font-black">
                        {item.ventas} unidades
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm shrink-0">
                      <PackageSearch size={14} className="text-purple-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200">
            <h3 className="text-base md:text-lg font-bold text-[#020817] mb-6">
              Cola de Aprobación Inmediata
            </h3>
            <div className="overflow-x-auto -mx-5 md:mx-0">
              <div className="inline-block min-w-full align-middle px-5 md:px-0">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="pb-4">Solicitante</th>
                      <th className="pb-4 text-center">Producto</th>
                      <th className="pb-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] md:text-sm">
                    {colaAprobacion.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-4 font-bold text-[#020817]">
                          {item.usuario || "N/A"}
                        </td>
                        <td className="py-4 text-center text-gray-500">
                          {item.productoNombre || "General"}
                        </td>
                        <td className="py-4 text-right font-extrabold text-[#7C3AED]">
                          L. {item.totalCredito?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 bg-white p-5 md:p-6 rounded-2xl border border-gray-200 flex flex-col h-fit shrink-0">
          <h3 className="text-base md:text-lg font-bold text-[#020817] mb-8 uppercase tracking-tighter">
            Auditoría
          </h3>
          <div className="space-y-6">
            {auditorias.map((log) => (
              <div key={log.id} className="flex gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 
                  ${
                    log.accion === "CREACIÓN"
                      ? "bg-blue-50 text-blue-500"
                      : log.accion === "EDICIÓN"
                        ? "bg-purple-50 text-purple-500"
                        : log.accion === "ELIMINACIÓN" ||
                            log.accion === "ALERTA"
                          ? "bg-red-50 text-red-500"
                          : "bg-green-50 text-green-500"
                  }`}
                >
                  {log.accion === "CREACIÓN" ? (
                    <UserPlus size={18} />
                  ) : log.accion === "EDICIÓN" ? (
                    <FileText size={18} />
                  ) : log.accion === "APROBADO" ? (
                    <CheckCircle size={18} />
                  ) : (
                    <Shield size={18} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[13px] font-bold text-[#020817] truncate">
                      {log.nombreUsuario}
                    </h4>
                    <MoreVertical
                      size={14}
                      className="text-gray-300 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 italic leading-relaxed">
                    {log.descripcion}
                  </p>
                  <p className="text-[8px] font-black text-[#7C3AED] uppercase mt-2 tracking-widest">
                    {log.fecha} • {log.hora}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/auditorias")}
            className="w-full mt-8 bg-[#020817] text-white text-[10px] font-bold py-4 rounded-xl hover:bg-black transition-all uppercase tracking-widest shadow-lg shadow-gray-200/50"
          >
            Reporte Completo
          </button>
        </div>
      </div>
    </div>
  );
}
