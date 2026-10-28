import { useEffect, useState } from "react";
import { FileSpreadsheet, Package, CreditCard, Receipt, ChevronRight } from "lucide-react";
import DrawerImportarExcel from "../../../components/DrawerImportarExcel";
import { TABLAS } from "../../../helpers/importacionExcel";
import { obtenerImportaciones } from "../../../services/importacionesService";

const OPCIONES = [
  { clave: "productos", icono: Package, descripcion: "Carga masiva de productos al inventario" },
  { clave: "creditos", icono: CreditCard, descripcion: "Créditos históricos con sus estados y plazos" },
  { clave: "cuotas", icono: Receipt, descripcion: "Pagos de cuotas de créditos aprobados o liquidados" },
];

export default function ImportarExcel() {
  const [tabla, setTabla] = useState(null); // colección cuyo drawer está abierto
  const [historial, setHistorial] = useState([]);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let activo = true;
    obtenerImportaciones(10)
      .then((lista) => activo && setHistorial(lista))
      .catch((e) => console.error("Error al cargar importaciones:", e));
    return () => {
      activo = false;
    };
  }, [recarga]);

  const cerrar = () => {
    setTabla(null);
    setRecarga((n) => n + 1); // refresca el historial con lo que se acaba de importar
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="bg-white rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-50 p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-[28px] font-black text-[#020817] leading-tight flex items-center gap-3">
            <FileSpreadsheet className="text-[#7C3AED]" /> Importar desde Excel
          </h1>
          <p className="text-sm font-medium text-gray-400 mt-1">
            Elija qué desea importar. Cada archivo se analiza antes de guardarse y se pide su contraseña para confirmar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {OPCIONES.map((op) => {
            const { clave, descripcion } = op;
            const Icono = op.icono;
            return (
            <button
              key={clave}
              onClick={() => setTabla(clave)}
              className="group flex items-center gap-4 text-left bg-[#F8F9FF] hover:bg-purple-50 rounded-2xl p-5 transition-colors"
            >
              <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                <Icono size={22} className="text-[#7C3AED]" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-black text-[#020817] uppercase tracking-wider">{TABLAS[clave].etiqueta}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{descripcion}</span>
              </span>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[#7C3AED] transition-colors shrink-0" />
            </button>
            );
          })}
        </div>

        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Últimas importaciones</p>
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
              <tr>
                {["Fecha", "Tabla", "Archivo", "Usuario", "Filas", "Insertadas", "Actualizadas", "Rechazadas", "Omitidas"].map((h) => (
                  <th key={h} className="text-left px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-4 text-gray-400">Aún no hay importaciones.</td></tr>
              )}
              {historial.map((i) => (
                <tr key={i.id} className="border-t border-gray-50">
                  <td className="px-4 py-2">{i.fecha?.toDate?.().toLocaleString("es-HN") ?? "—"}</td>
                  <td className="px-4 py-2">{TABLAS[i.tabla]?.etiqueta ?? i.tabla}</td>
                  <td className="px-4 py-2">{i.archivo}</td>
                  <td className="px-4 py-2">{i.usuario}</td>
                  <td className="px-4 py-2">{i.totalFilas}</td>
                  <td className="px-4 py-2 text-emerald-600 font-bold">{i.insertadas}</td>
                  <td className="px-4 py-2 text-violet-600 font-bold">{i.actualizadas ?? 0}</td>
                  <td className="px-4 py-2 text-rose-600 font-bold">{i.rechazadas}</td>
                  <td className="px-4 py-2 text-amber-600 font-bold">{i.omitidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {tabla && <DrawerImportarExcel key={tabla} abierto alCerrar={cerrar} tablas={[tabla]} modulo="Importación Excel" />}
    </div>
  );
}
