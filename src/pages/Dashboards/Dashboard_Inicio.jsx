import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Package,
  Shield,
  UserPlus,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileText,
  Loader2,
  PiggyBank,
  Info,
  ExternalLink,
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
import { MdOutlineElectricBolt } from "react-icons/md";
import { GoAlertFill } from "react-icons/go";
import { IoTimeSharp } from "react-icons/io5";

import { obtenerCreditosRealTime } from "../../services/creditosService";
import { obtenerProductos } from "../../services/productosService";
import { escucharAuditorias } from "../../services/auditoriasService";
import { obtenerConfiguracion } from "../../services/configuracionesService";

export default function Dashboard() {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatosBase = async () => {
      try {
        const prods = await obtenerProductos();
        setProductos(prods);

        const conf = await obtenerConfiguracion();
        setConfig(conf);
      } catch (error) {
        console.error("Error cargando base:", error);
      }
    };
    cargarDatosBase();

    const desuscribirCreditos = obtenerCreditosRealTime((data) => {
      setCreditos(data);
      setCargando(false);
    });

    const desuscribirAuditorias = escucharAuditorias((data) => {
      setAuditorias(data.slice(0, 5));
    });

    return () => {
      if (desuscribirCreditos) desuscribirCreditos();
      if (desuscribirAuditorias) desuscribirAuditorias();
    };
  }, []);

  const creditosActivos = creditos.filter(
    (c) => c.estado === "Aprobado",
  ).length;
  const creditosPendientes = creditos.filter(
    (c) => c.estado === "Pendiente",
  ).length;

  const montoPendiente = creditos
    .filter((c) => c.estado === "Pendiente" || c.estado === "Aprobado")
    .reduce((acc, curr) => acc + (curr.totalCredito || 0), 0);

  const limiteStock = config?.StockMinimoAviso || 8;
  const stockBajoCount = productos.filter(
    (p) => p.stock <= limiteStock && p.activo,
  ).length;

  const conteoCategorias = {};
  creditos.forEach((credito) => {
    const productoAsociado = productos.find(
      (p) => p.productoId === credito.productoId || p.id === credito.productoId,
    );
    const cat = productoAsociado?.categoria || "General";
    conteoCategorias[cat] = (conteoCategorias[cat] || 0) + 1;
  });

  const totalCreditos = creditos.length || 1;

  const topCategorias = Object.entries(conteoCategorias)
    .map(([nombre, count]) => ({
      nombre,
      porcentaje: Math.round((count / totalCreditos) * 100),
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .slice(0, 4);

  const mesesNombres = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const fechaActual = new Date();
  const mesActualIndex = fechaActual.getMonth();

  const dataRecharts = [];
  for (let i = 5; i >= 0; i--) {
    let m = mesActualIndex - i;
    if (m < 0) m += 12;
    dataRecharts.push({ name: mesesNombres[m], monto: 0 });
  }

  creditos.forEach((c) => {
    if (c.estado !== "Aprobado") return;
    const fechaC = c.fechaRegistro?.toDate
      ? c.fechaRegistro.toDate()
      : new Date(c.fechaRegistro);
    const diffMeses =
      (fechaActual.getFullYear() - fechaC.getFullYear()) * 12 +
      (fechaActual.getMonth() - fechaC.getMonth());

    if (diffMeses >= 0 && diffMeses <= 5) {
      const indexArr = 5 - diffMeses;
      dataRecharts[indexArr].monto += c.totalCredito || 0;
    }
  });

  const obtenerIniciales = (nombre) => {
    if (!nombre) return "UX";
    const partes = nombre.split(" ");
    return partes.length > 1
      ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
      : partes[0].substring(0, 2).toUpperCase();
  };

  const getIconoAuditoria = (accion) => {
    switch (accion) {
      case "CREACIÓN":
        return <UserPlus className="w-5 h-5" />;
      case "EDICIÓN":
        return <FileText className="w-5 h-5" />;
      case "ELIMINACIÓN":
      case "ALERTA":
        return <AlertTriangle className="w-5 h-5" />;
      case "APROBADO":
      case "RESOLUCIÓN":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return "Fecha desconocida";
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const coloresBarras = [
    "bg-[#020817]",
    "bg-[#7C3AED]",
    "bg-gray-400",
    "bg-gray-200",
  ];

  const montoSoloAprobados = creditos
    .filter((c) => c.estado === "Aprobado")
    .reduce((acc, curr) => acc + (curr.totalCredito || 0), 0);

  const StatCard = ({
    icon: Icon,
    color,
    title,
    value,
    label,
    badge,
    details,
  }) => {
    const [showPopover, setShowPopover] = useState(false);

    return (
      <div
        className="bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200 relative overflow-hidden group transition-all hover:shadow-md"
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
      >
        {/* Icono de Fondo */}
        <div
          className={`absolute -bottom-6 -right-6 ${color.icon} transform rotate-12 transition-transform group-hover:rotate-6 duration-500`}
        >
          <Icon size={140} />
        </div>

        {/* Popover */}
        {showPopover && (
          <div className="absolute top-2 right-2 z-50 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#020817] text-white text-[11px] p-3 rounded-xl shadow-xl border border-gray-700 w-48">
              <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-1">
                <Info size={12} className="text-purple-400" />
                <span className="font-bold uppercase tracking-wider text-[9px]">
                  Detalles Rápidos
                </span>
              </div>
              <div className="space-y-1 text-gray-300">
                {details.map((item, idx) => (
                  <div key={idx} className="flex justify-between italic">
                    <span>{item.label}:</span>
                    <span className="text-white font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contenido Principal */}
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

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF]">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF]">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={GiWallet}
              badge="Activos"
              value={creditosActivos}
              label="Total Créditos Aprobados"
              color={{
                icon: "text-green-500/10",
                badge: "bg-green-100 text-green-600",
              }}
              details={[
                { label: "Este mes", value: "+4" },
                { label: "Tasa Promedio", value: "15%" },
              ]}
            />

            <StatCard
              icon={MdOutlineElectricBolt}
              badge="Global"
              value={`L. ${montoPendiente.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              label="Monto Total Activo"
              color={{
                icon: "text-purple-500/15",
                badge: "bg-purple-50 text-purple-500",
              }}
              details={[
                {
                  label: "Solo Aprobados",
                  value: `L. ${montoSoloAprobados.toLocaleString()}`,
                },
                { label: "Proyección", value: "Alza 5%" },
              ]}
            />

            <StatCard
              icon={GoAlertFill}
              badge="Crítico"
              value={stockBajoCount}
              label="Productos Stock Bajo"
              color={{
                icon: "text-red-500/10",
                badge: "bg-red-50 text-red-500",
              }}
              details={[
                { label: "Categoría Top", value: "Electrónica" },
                { label: "Reponer Urgente", value: "3 items" },
              ]}
            />
            <StatCard
              icon={IoTimeSharp}
              badge="Pendientes"
              value={creditosPendientes}
              label="Créditos por Revisar"
              color={{
                icon: "text-yellow-500/10",
                badge: "bg-yellow-50 text-yellow-500",
              }}
              details={[
                { label: "Más antiguo", value: "Hace 2 días" },
                { label: "Prioridad Alta", value: "1" },
              ]}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#020817]">
                    Flujo de Créditos Mensual
                  </h3>
                  <p className="text-xs text-gray-400">
                    Desembolsos de los últimos 6 meses
                  </p>
                </div>
              </div>

              <div
                className="flex-1 w-full h-52 relative mt-auto"
                style={{ marginLeft: "-15px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dataRecharts}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
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
                      tick={{
                        fontSize: 10,
                        fill: "#9CA3AF",
                        fontWeight: "bold",
                      }}
                      dy={10}
                    />
                    <YAxis hide={true} domain={["dataMin", "dataMax + 1000"]} />
                    <Tooltip
                      formatter={(value) => [
                        `L. ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                        "Desembolso",
                      ]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgb(0 0 0 / 0.08)",
                      }}
                      labelStyle={{ fontWeight: "bold", color: "#020817" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="monto"
                      stroke="#7C3AED"
                      fillOpacity={1}
                      fill="url(#colorMonto)"
                      strokeWidth={2}
                      activeDot={{
                        r: 6,
                        fill: "#7C3AED",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="w-full lg:w-72 bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200">
              <h3 className="text-lg font-bold text-[#020817] mb-6">
                Créditos por Categorías
              </h3>
              <div className="space-y-5">
                {topCategorias.length > 0 ? (
                  topCategorias.map((cat, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-xs font-bold text-[#020817] mb-2">
                        <span className="truncate pr-2">{cat.nombre}</span>{" "}
                        <span>{cat.porcentaje}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${coloresBarras[index % coloresBarras.length]} h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${cat.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No hay datos suficientes
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#020817]">
                Últimos Créditos Generados
              </h3>
              <div className="flex gap-2"></div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/3">
                      Empleado
                    </th>
                    <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-1/4">
                      Fecha Emisión
                    </th>
                    <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-1/4">
                      Monto
                    </th>
                    <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right w-1/6">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-[#020817]">
                  {creditos.slice(0, 5).map((credito) => (
                    <tr
                      key={credito.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-[#7C3AED] flex items-center justify-center text-xs font-bold shrink-0">
                            {obtenerIniciales(credito.usuario || "NN")}
                          </div>
                          <span className="truncate max-w-[200px]">
                            {credito.usuario || "Empleado Desconocido"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-center text-gray-500 font-normal">
                        {formatearFecha(credito.fechaRegistro)}
                      </td>
                      <td className="py-4 text-center font-bold">
                        L.{" "}
                        {credito.cuotaMensual?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 text-right">
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block
                          ${
                            credito.estado === "Aprobado"
                              ? "bg-green-100 text-green-700"
                              : credito.estado === "Pendiente"
                                ? "bg-yellow-100 text-yellow-700"
                                : credito.estado === "Rechazado"
                                  ? "bg-red-100 text-red-700"
                                  : credito.estado === "Liquidado"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-500"
                          }`}
                        >
                          {credito.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {creditos.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-6 text-gray-400 text-sm"
                      >
                        No hay créditos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-200 flex flex-col h-full">
          <h3 className="text-lg font-bold text-[#020817] mb-8">
            Actividad Reciente
          </h3>

          <div className="space-y-6 flex-1">
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
                  }
                `}
                >
                  {getIconoAuditoria(log.accion)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-bold text-[#020817] truncate pr-2">
                      {log.nombreUsuario}
                    </h4>
                    <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer shrink-0" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {log.descripcion}
                  </p>
                  <p className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest mt-2">
                    {log.fecha} • {log.hora}
                  </p>
                </div>
              </div>
            ))}

            {auditorias.length === 0 && (
              <p className="text-center text-xs text-gray-400 mt-10">
                No hay actividad reciente
              </p>
            )}
          </div>

          <button
            onClick={() => {
              navigate("/auditorias");
            }}
            className="w-full mt-6 bg-[#020817] text-white text-xs font-bold py-4 rounded-xl hover:bg-black transition-colors uppercase tracking-widest"
          >
            Ver todo el historial
          </button>
        </div>
      </div>
    </div>
  );
}
