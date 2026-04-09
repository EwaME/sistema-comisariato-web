import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertOctagon,
  BarChart3,
  ShoppingCart,
  Search,
  ChevronRight,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  MdOutlineInventory2,
  MdProductionQuantityLimits,
} from "react-icons/md";
import { FaWarehouse } from "react-icons/fa";
import { getInventoryStats } from "../../services/dashboardServices";

export default function DashboardInventario() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getInventoryStats();
        setStats(data);
      } catch (error) {
        console.error("Error cargando inventario:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center font-bold">Cargando Dashboard...</div>
    );
  const StatCard = ({ icon: Icon, color, value, label, badge }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden group transition-all hover:shadow-md">
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

  return (
    <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={MdOutlineInventory2}
              badge="Catálogo"
              value={stats.totalSKUs}
              label="Items Únicos (SKU)"
              color={{
                icon: "text-blue-500/10",
                badge: "bg-blue-100 text-blue-600",
              }}
            />
            <StatCard
              icon={FaWarehouse}
              badge="Patrimonio"
              value={`L. ${(stats.patrimonioTotal / 1000).toFixed(1)}k`}
              label="Valor de Inventario"
              color={{
                icon: "text-purple-500/10",
                badge: "bg-purple-50 text-purple-500",
              }}
            />
            <StatCard
              icon={MdProductionQuantityLimits}
              badge="Alerta"
              value={stats.alertaStock}
              label="Productos Stock Bajo"
              color={{
                icon: "text-red-500/10",
                badge: "bg-red-50 text-red-500",
              }}
            />
            <StatCard
              icon={ShoppingCart}
              badge="Estado"
              value={stats.prodActivos}
              label="Productos activos"
              color={{
                icon: "text-green-500/10",
                badge: "bg-green-100 text-green-600",
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GRÁFICO DE ROTACIÓN */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#020817]">
                  Rotación por Categoría
                </h3>
                <p className="text-xs text-gray-400">
                  Ventas vs Stock por ID de Categoría
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.rotacionCategorias}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fontWeight: "bold",
                        fill: "#020817",
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ borderRadius: "12px", border: "none" }}
                    />
                    <Bar
                      dataKey="ventas"
                      fill="#7C3AED"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="stock"
                      fill="#E2E8F0"
                      radius={[0, 4, 4, 0]}
                      barSize={10}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PRODUCTOS ESTRELLA (DINÁMICO) */}
            <div className="bg-[#020817] p-6 rounded-2xl text-white">
              <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-400" /> Más Vendidos
              </h3>
              <div className="space-y-6">
                {stats.productosEstrella.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex justify-between items-center border-b border-white/10 pb-4 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold">{prod.nombre}</p>
                      <p className="text-[10px] text-gray-400">
                        {prod.ventas} unidades vendidas
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ABASTECIMIENTO CRÍTICO */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-[#020817] mb-6">
              Prioridad de Reabastecimiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.itemsStockCritico.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] font-bold text-red-500 uppercase">
                      Stock Crítico
                    </p>
                    <h4 className="text-sm font-black text-[#020817]">
                      {item.nombre}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Quedan: {item.stock} u.
                    </p>
                  </div>
                  <AlertOctagon
                    size={20}
                    className={
                      item.stock === 0 ? "text-red-600" : "text-red-400"
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
