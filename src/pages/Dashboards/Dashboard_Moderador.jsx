import React, { useState, useEffect } from "react";
import { IoIosPeople } from "react-icons/io";
import { MdOutlineSentimentSatisfiedAlt } from "react-icons/md";
import { MessageCircle, Zap, Star } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  listenSugerencias,
  obtenerDataModerador,
} from "../../services/dashboardServices";

export default function DashboardModerador() {
  const [loading, setLoading] = useState(true); // Estado de carga
  const [sugerencias, setSugerencias] = useState([]);
  const [metrics, setMetrics] = useState({
    totalUsuarios: 0,
    totalSugerencias: 0,
    satisfaccion: 0,
    productosConRating: [],
  });

  useEffect(() => {
    // Carga de métricas iniciales
    obtenerDataModerador().then((data) => {
      setMetrics(data);
      setLoading(false); // Finaliza carga inicial
    });

    // Suscripción en tiempo real
    const unsubscribe = listenSugerencias((data) => {
      setSugerencias(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen text-slate-800">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          {/* CARDS DINÁMICOS / SKELETONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              // Renderiza 4 esqueletos mientras carga
              Array(4)
                .fill(0)
                .map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  icon={IoIosPeople}
                  value={metrics.totalUsuarios}
                  label="Usuarios Totales"
                  badge="Comunidad"
                  color="blue"
                />
                <StatCard
                  icon={MdOutlineSentimentSatisfiedAlt}
                  value={`${metrics.satisfaccion}%`}
                  label="Satisfacción"
                  badge="Sensación"
                  color="green"
                />
                <StatCard
                  icon={MessageCircle}
                  value={metrics.totalSugerencias}
                  label="Sugerencias"
                  badge="Feedback"
                  color="purple"
                />
                <StatCard
                  icon={Zap}
                  value={sugerencias.length > 0 ? sugerencias[0].tag : "N/A"}
                  label="Último Tema"
                  badge="Tendencia"
                  color="yellow"
                />
              </>
            )}
          </div>

          {/* GRÁFICO / SKELETON */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" size={20} />
              Rating Real de Productos
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="w-full h-full bg-gray-50 animate-pulse rounded-xl flex items-end gap-2 p-4">
                  <div className="flex-1 bg-gray-200 h-1/2 rounded-t-lg" />
                  <div className="flex-1 bg-gray-200 h-3/4 rounded-t-lg" />
                  <div className="flex-1 bg-gray-200 h-2/3 rounded-t-lg" />
                  <div className="flex-1 bg-gray-200 h-1/3 rounded-t-lg" />
                  <div className="flex-1 bg-gray-200 h-4/5 rounded-t-lg" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.productosConRating}>
                    <XAxis
                      dataKey="producto"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={[0, 5]} />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{ borderRadius: "12px", border: "none" }}
                    />
                    <Bar dataKey="rating" radius={[6, 6, 0, 0]} barSize={40}>
                      {metrics.productosConRating.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.rating > 4 ? "#7C3AED" : "#C4B5FD"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* MURO DE SUGERENCIAS (Siempre vivo por Firebase) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold mb-6">
              Muro de Sugerencias (En Vivo)
            </h3>
            <div className="grid gap-4">
              {sugerencias.length === 0 && loading
                ? Array(3)
                    .fill(0)
                    .map((_, i) => <SugerenciaSkeleton key={i} />)
                : sugerencias.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            s.foto ||
                            `https://ui-avatars.com/api/?name=${s.user}&background=7C3AED&color=fff`
                          }
                          className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                          alt="avatar"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{s.user}</span>
                            <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase font-black">
                              {s.tag}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 italic">
                            "{s.msg}"
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">
                        {s.time}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

function StatCard({ icon: Icon, value, label, badge, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600 text-blue-500/10",
    green: "bg-green-100 text-green-600 text-green-500/10",
    purple: "bg-purple-100 text-purple-600 text-purple-500/10",
    yellow: "bg-yellow-100 text-yellow-600 text-yellow-500/10",
  };
  const [cBadge, cText, cIcon] = colors[color].split(" ");

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden h-32">
      <Icon className={`absolute -bottom-4 -right-4 size-24 ${cIcon}`} />
      <div className="relative z-10">
        <span
          className={`${cBadge} ${cText} text-[10px] font-bold px-2 py-1 rounded-full uppercase`}
        >
          {badge}
        </span>
        <h3 className="text-3xl font-black mt-2">{value}</h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          {label}
        </p>
      </div>
    </div>
  );
}

// Skeletons con el mismo estilo que los originales
function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 h-32 animate-pulse">
      <div className="w-16 h-4 bg-gray-100 rounded mb-4" />
      <div className="w-24 h-8 bg-gray-100 rounded mb-2" />
      <div className="w-20 h-3 bg-gray-50 rounded" />
    </div>
  );
}

function SugerenciaSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="w-20 h-4 bg-gray-200 rounded" />
            <div className="w-12 h-4 bg-gray-200 rounded" />
          </div>
          <div className="w-32 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-10 h-3 bg-gray-200 rounded" />
    </div>
  );
}
