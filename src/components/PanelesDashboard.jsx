import { useId } from "react";
import { ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { C, dato } from "../helpers/graficos";

const TONOS = {
  morado: "bg-purple-100 text-purple-600",
  verde: "bg-green-100 text-green-600",
  ambar: "bg-yellow-100 text-yellow-600",
  rojo: "bg-red-50 text-red-500",
};

// Tarjeta de un indicador: cifra principal + una mini visualización. Al pulsarla se abre el drawer con el detalle.
export function TarjetaIndicador({ categoria, icono: Icono, tono = "morado", valor, etiqueta, sub, ancho = false, alClic, children }) {
  return (
    <button
      onClick={alClic}
      aria-label={`${etiqueta}: ver detalle`}
      className={`group text-left bg-white rounded-2xl border border-gray-200 p-5 xl:[@media(max-height:820px)]:p-3.5 flex flex-col min-h-0 h-60 xl:h-auto hover:shadow-md hover:border-[#7C3AED]/40 transition-all ${ancho ? "sm:col-span-2" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 shrink-0">
        <span className={`${TONOS[tono]} text-[10px] font-bold px-2 py-1 rounded-full uppercase inline-flex items-center gap-1`}>
          {Icono && <Icono size={11} />} {categoria}
        </span>
        <ArrowUpRight size={16} className="text-gray-300 group-hover:text-[#7C3AED] transition-colors" />
      </div>
      <p className="text-2xl 2xl:text-3xl xl:[@media(max-height:820px)]:text-xl font-extrabold text-[#020817] tracking-tight mt-3 xl:[@media(max-height:820px)]:mt-1.5 truncate shrink-0">{valor}</p>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0">{etiqueta}</p>
      {sub && <p className="text-xs text-gray-500 mt-1 truncate shrink-0 xl:[@media(max-height:820px)]:hidden">{sub}</p>}
      <div className="flex-1 min-h-[44px] mt-3 xl:[@media(max-height:820px)]:mt-2 relative pointer-events-none">
        <div className="absolute inset-0">{children}</div>
      </div>
    </button>
  );
}

export const SinDatos = ({ texto = "Sin datos en el período" }) => (
  <div className="h-full flex items-center justify-center text-xs text-gray-400">{texto}</div>
);

// ---------- Mini visualizaciones (dentro de las tarjetas) ----------

export function MiniArea({ datos, clave, color = C.morado }) {
  const id = useId().replace(/:/g, "");
  if (!datos.length) return <SinDatos />;
  if (datos.length < 2) return <MiniBarras datos={datos} series={[{ clave, color }]} />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={datos} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={clave} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniBarras({ datos, series, colorDe }) {
  if (!datos.length) return <SinDatos />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datos} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={2}>
        {series.map((s) => (
          <Bar key={s.clave} dataKey={s.clave} fill={s.color} radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {colorDe && datos.map((d, i) => <Cell key={i} fill={colorDe(d, s)} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonaConLeyenda({ datos, colores, formato = (v) => v, apilado = false }) {
  const con = datos.filter((d) => d.value > 0);
  if (!con.length) return <SinDatos />;
  return (
    <div className="flex items-center gap-4 h-full">
      <div className="h-full shrink-0" style={{ aspectRatio: "1" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={con} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={con.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
              {con.map((d) => <Cell key={d.name} fill={colores[d.name]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className={`flex flex-col gap-1.5 text-xs min-w-0 flex-1 ${datos.length > 2 ? "xl:[@media(max-height:820px)]:grid xl:[@media(max-height:820px)]:grid-cols-2 xl:[@media(max-height:820px)]:gap-x-3 xl:[@media(max-height:820px)]:text-[11px]" : ""}`}>
        {datos.map((d) => (
          <li key={d.name} className={apilado ? "min-w-0" : "flex items-center gap-1.5 min-w-0"}>
            <span className={apilado ? "flex items-center gap-1.5 text-gray-500" : "contents"}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colores[d.name] }} />
              <span className="text-gray-500 truncate">{d.name}</span>
            </span>
            <span className={`font-bold text-[#020817] ${apilado ? "block pl-3.5 truncate" : "ml-auto shrink-0"}`}>{formato(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MiniRanking({ items, max = 4, columnas = 1, color = C.morado }) {
  if (!items.length) return <SinDatos />;
  const tope = Math.max(...items.map((i) => i.valor), 1);
  return (
    <ul className={`h-full overflow-hidden ${columnas === 2 ? "grid grid-cols-2 gap-x-6 gap-y-2 content-start" : "space-y-2"}`}>
      {items.slice(0, max).map((i) => (
        <li key={i.nombre}>
          <div className="flex justify-between gap-2 text-[11px] leading-tight">
            <span className="truncate text-gray-600">{i.nombre}</span>
            <span className="font-bold text-[#020817] shrink-0">{i.valor}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 mt-1">
            <div className="h-full rounded-full" style={{ width: `${(i.valor / tope) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MiniLista({ items, max = 3 }) {
  if (!items.length) return <SinDatos texto="Nadie activo ahora" />;
  return (
    <ul className="space-y-2 h-full overflow-hidden">
      {items.slice(0, max).map((i) => (
        <li key={i.nombre} className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-[11px] font-black flex items-center justify-center shrink-0">
            {String(i.nombre).trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span className="min-w-0">
            <span className="block text-[12px] font-bold text-[#020817] truncate leading-tight">{i.nombre}</span>
            <span className="block text-[10px] text-gray-400 truncate">{i.detalle}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AnilloProgreso({ porcentaje, lineas = [] }) {
  const radio = 38;
  const longitud = 2 * Math.PI * radio;
  const relleno = Math.min(Math.max(porcentaje, 0), 100);
  return (
    <div className="flex items-center gap-4 h-full">
      <svg viewBox="0 0 100 100" className="h-full shrink-0" style={{ aspectRatio: "1" }} role="img" aria-label={`${porcentaje} %`}>
        <circle cx="50" cy="50" r={radio} fill="none" stroke="#F3F4F6" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radio} fill="none" stroke={C.morado} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(relleno / 100) * longitud} ${longitud}`} transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="800" fill={C.noche}>{Math.round(relleno)}%</text>
      </svg>
      <ul className="space-y-1.5 text-xs min-w-0 flex-1">
        {lineas.map(([etiqueta, valor]) => (
          <li key={etiqueta}>
            <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold">{etiqueta}</span>
            <span className="block font-bold text-[#020817] truncate">{valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Gráficos completos (dentro del drawer) ----------

const ejes = { fontSize: 11, tickLine: false, axisLine: false, tick: { fill: "#9CA3AF" } };
const estiloTooltip = { borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" };
const atenuar = (activo, valor) => (activo !== undefined && activo !== null && activo !== valor ? 0.3 : 1);

export function Dona({ datos, colores, alClic, formato, activo }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={datos} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={datos.length > 1 ? 2 : 0} stroke="none" onClick={(e) => alClic?.(dato(e)?.name ?? e?.name)}>
          {datos.map((d) => <Cell key={d.name} fill={colores[d.name]} fillOpacity={atenuar(activo, d.name)} />)}
        </Pie>
        <Tooltip formatter={formato} contentStyle={estiloTooltip} />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Barras({ datos, clave, color = C.morado, alClic, ejeX = "etiqueta", formato, horizontal = false, intervalo = 0, activo }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datos} layout={horizontal ? "vertical" : "horizontal"} margin={horizontal ? { left: 10 } : undefined}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" allowDecimals={false} {...ejes} />
            <YAxis type="category" dataKey={ejeX} width={130} {...ejes} />
          </>
        ) : (
          <>
            <XAxis dataKey={ejeX} interval={intervalo} {...ejes} />
            <YAxis allowDecimals={false} {...ejes} />
          </>
        )}
        <Tooltip formatter={formato} contentStyle={estiloTooltip} cursor={{ fill: "#F8F9FF" }} />
        <Bar dataKey={clave} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} onClick={(e) => alClic?.(dato(e))}>
          {datos.map((d, i) => <Cell key={i} fill={color} fillOpacity={atenuar(activo, d[ejeX])} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// series: [{ clave, nombre, color }]; alClic(serie, dato)
export function BarrasDobles({ datos, series, ejeX = "etiqueta", alClic, apilado = false, formato }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey={ejeX} {...ejes} />
        <YAxis allowDecimals={false} {...ejes} />
        <Tooltip formatter={formato} contentStyle={estiloTooltip} cursor={{ fill: "#F8F9FF" }} />
        <Legend iconType="circle" />
        {series.map((s, i) => (
          <Bar
            key={s.clave} name={s.nombre} dataKey={s.clave} fill={s.color} stackId={apilado ? "a" : undefined}
            radius={apilado ? (i === series.length - 1 ? [6, 6, 0, 0] : 0) : [6, 6, 0, 0]} onClick={(e) => alClic?.(s, dato(e))}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
