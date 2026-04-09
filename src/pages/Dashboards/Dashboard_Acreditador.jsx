import React, { useState, useEffect } from "react";
import {
  obtenerMetricasCards,
  obtenerFlujoCuotasMensual,
  obtenerDistribucionRadar,
  listenColaAprobacion,
} from "../../services/dashboardServices";

import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";

import { fromTimestamp } from "../../helpers/timestampToDate";
import { IoTimeSharp } from "react-icons/io5";
import { MdOutlineRateReview, MdCancelPresentation } from "react-icons/md";
import { GoAlertFill } from "react-icons/go";

export default function Dashboard_Acreditador() {
  const [stats, setStats] = useState({
    totalPendientes: 0,
    totalReclamos: 0,
    totalRechazados: 0,
    totalRevision: 0,
  });
  const [dataArea, setDataArea] = useState([]);
  const [dataRadar, setDataRadar] = useState([]);
  const [colaCreditos, setColaCreditos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDashboard() {
      try {
        const [m, a, r] = await Promise.all([
          obtenerMetricasCards(),
          obtenerFlujoCuotasMensual(),
          obtenerDistribucionRadar(),
        ]);

        setStats(m);
        setDataArea(a);
        setDataRadar(r);
      } catch (error) {
        console.error("Error cargando dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    const unsub = listenColaAprobacion((data) => {
      setColaCreditos(data);
    });

    cargarDashboard();
    return () => unsub();
  }, []);

  const StatCard = ({ icon: Icon, color, value, label, badge }) => {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden group transition-all hover:shadow-md">
        {/* Icono de fondo decorativo */}
        <div
          className={`absolute -bottom-6 -right-6 ${color.icon} transform rotate-12 transition-transform group-hover:rotate-6 duration-500`}
        >
          <Icon size={140} />
        </div>

        <div className="relative z-10">
          <span
            className={`${color.badge} text-[10px] font-bold px-2 py-1 rounded-full mb-3 inline-block uppercase`}
          >
            {badge}
          </span>
          <h3 className="text-4xl font-extrabold text-[#020817] tracking-tight mb-1 truncate">
            {value}
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {label}
          </p>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-gray-500 uppercase tracking-widest animate-pulse">
        Sincronizando Dashboard...
      </div>
    );

  return (
    <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          {/* CARDS SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={IoTimeSharp}
              badge="Prioridad"
              value={stats.totalPendientes || 0}
              label="Créditos Pendientes"
              color={{
                icon: "text-blue-500/10",
                badge: "bg-blue-100 text-blue-600",
              }}
            />

            <StatCard
              icon={GoAlertFill}
              badge="Urgente"
              value={stats.totalReclamos || 0}
              label="Reclamos Abiertos"
              color={{
                icon: "text-red-500/10",
                badge: "bg-red-50 text-red-500",
              }}
            />

            <StatCard
              icon={MdCancelPresentation}
              badge="Histórico"
              value={stats.totalRechazados || 0}
              label="Créditos Rechazados"
              color={{
                icon: "text-gray-500/10",
                badge: "bg-gray-100 text-gray-600",
              }}
            />

            {/* CARD DINÁMICA: Revisiones */}
            <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-6 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="absolute -bottom-4 -right-4 text-white/10 rotate-12">
                <MdOutlineRateReview size={120} />
              </div>
              <div className="relative z-10">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full mb-3 inline-block uppercase">
                  En Proceso
                </span>
                <h3 className="text-4xl font-extrabold text-white tracking-tight mb-1">
                  {stats.totalRevision || 0}
                </h3>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                  Revisiones en Curso
                </p>
              </div>
            </div>
          </div>

          {/* GRÁFICOS SEGUNDA FILA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRÁFICO DE ÁREA */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#020817]">
                    Flujo de cuotas
                  </h3>
                  <p className="text-xs text-gray-400">
                    Contexto general de las cuotas pagadas
                  </p>
                </div>
                <TrendingUp className="text-green-500 w-5 h-5" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataArea}>
                    <defs>
                      <linearGradient
                        id="colorAcreditador"
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
                    <YAxis
                      hide={true}
                      domain={["dataMin - 500", "dataMax + 500"]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgb(0 0 0 / 0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="monto"
                      stroke="#7C3AED"
                      fillOpacity={1}
                      fill="url(#colorAcreditador)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRÁFICO DE RADAR */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="text-lg font-bold text-[#020817] mb-2">
                Distribución de Estados
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Estado actual de todas las solicitudes
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={dataRadar}
                  >
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fontSize: 10,
                        fill: "#6b7280",
                        fontWeight: "bold",
                      }}
                    />
                    <Radar
                      name="Créditos"
                      dataKey="A"
                      stroke="#7C3AED"
                      fill="#7C3AED"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TABLA DE COLA DE APROBACIÓN */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-[#020817] mb-6">
              Cola de Aprobación
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Empleado
                    </th>
                    <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                      Fecha
                    </th>
                    <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                      Cuota
                    </th>
                    <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {colaCreditos.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 font-bold text-[#020817]">
                        {item.usuario}
                      </td>
                      <td className="py-4 text-center text-gray-500">
                        {fromTimestamp(item.fechaRegistro)}
                      </td>
                      <td className="py-4 text-center font-black text-[#020817]">
                        L. {item.cuotaMensual?.toFixed(2)}
                      </td>
                      <td className="py-4 text-right">
                        <span
                          className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase ${
                            item.estado === "Pendiente"
                              ? "bg-blue-100 text-blue-600"
                              : item.estado === "En Revisión"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
