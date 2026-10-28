import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { dato } from "../helpers/graficos";

export function Tarjeta({ etiqueta, valor, sub, color, alClic }) {
  return (
    <button
      onClick={alClic}
      className="text-left bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.04)] hover:border-[#7C3AED]/40 transition-colors"
    >
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{etiqueta}</p>
      <p className="text-3xl font-black mt-1" style={{ color }}>{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </button>
  );
}

export function Panel({ titulo, subtitulo, vacio, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-[0_2px_20px_rgb(0,0,0,0.04)] [&_.recharts-sector]:cursor-pointer [&_.recharts-bar-rectangle]:cursor-pointer">
      <h3 className="text-base font-black text-[#020817]">{titulo}</h3>
      <p className="text-xs text-gray-400 mb-4">{subtitulo} · clic en el gráfico para ver el detalle</p>
      {vacio ? <p className="text-sm text-gray-400 py-16 text-center">Sin datos para este período.</p> : <div className="h-64">{children}</div>}
    </div>
  );
}

export function Dona({ datos, colores, alClic, formato }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={datos} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} onClick={(e) => alClic(dato(e)?.name ?? e?.name)}>
          {datos.map((d) => <Cell key={d.name} fill={colores[d.name]} />)}
        </Pie>
        <Tooltip formatter={formato} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Barras({ datos, clave, color, alClic, ejeX = "etiqueta", formato, horizontal = false, intervalo = 0 }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datos} layout={horizontal ? "vertical" : "horizontal"} margin={horizontal ? { left: 20 } : undefined}>
        <CartesianGrid strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" fontSize={11} allowDecimals={false} />
            <YAxis type="category" dataKey={ejeX} width={150} fontSize={11} />
          </>
        ) : (
          <>
            <XAxis dataKey={ejeX} fontSize={11} interval={intervalo} />
            <YAxis fontSize={11} allowDecimals={false} />
          </>
        )}
        <Tooltip formatter={formato} />
        <Bar dataKey={clave} fill={color} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} onClick={(e) => alClic(dato(e))} />
      </BarChart>
    </ResponsiveContainer>
  );
}
