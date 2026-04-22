import React, { useState, useEffect } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import { obtenerMetricasProveedor } from "../../services/dashboardServices";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function DashboardProveedor() {
  const [stats, setStats] = useState({
    totalPendientes: 0,
    totalAceptados: 0,
    totalRechazados: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await obtenerMetricasProveedor();
        setStats(data);
      } catch (error) {
        console.error("Error cargando métricas del proveedor:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-gray-500">
        Cargando Panel del Proveedor...
      </div>
    );

  const chartData = [
    { name: "Pendientes", value: stats.totalPendientes, color: "#F59E0B" },
    { name: "Aceptadas", value: stats.totalAceptados, color: "#10B981" },  
    { name: "Rechazadas", value: stats.totalRechazados, color: "#EF4444" },
  ];

  const totalOrdenes = stats.totalPendientes + stats.totalAceptados + stats.totalRechazados;

  const StatCard = ({ color, value, label, badge }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden group transition-all hover:shadow-md">
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

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#020817]">Panel de Proveedor</h2>
        <p className="text-sm text-gray-500">Resumen de las órdenes de reabastecimiento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          badge="Por Atender"
          value={stats.totalPendientes}
          label="Órdenes Pendientes"
          color={{
            badge: "bg-amber-100 text-amber-600",
          }}
        />
        <StatCard
          badge="Completadas"
          value={stats.totalAceptados}
          label="Órdenes Aceptadas"
          color={{
            badge: "bg-green-100 text-green-600",
          }}
        />
        <StatCard
          badge="Canceladas"
          value={stats.totalRechazados}
          label="Órdenes Rechazadas"
          color={{
            badge: "bg-red-50 text-red-500",
          }}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
          <div className="bg-purple-50 p-2 rounded-lg">
            <PieChartIcon className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#020817]">
              Distribución de Órdenes
            </h3>
            <p className="text-xs text-gray-400">
              Total histórico: {totalOrdenes} órdenes
            </p>
          </div>
        </div>

        {totalOrdenes === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <PieChartIcon className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Sin datos para graficar</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  itemStyle={{ fontWeight: "bold", color: "#020817" }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", fontWeight: "bold", color: "#64748b" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}