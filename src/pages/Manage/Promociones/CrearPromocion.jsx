import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, BadgePercent } from "lucide-react";
import {
  crearPromocion,
  obtenerPromocionPorId,
  actualizarPromocion,
  obtenerPromociones,
} from "../../../services/promocionesService";

const TIPO_OPCIONES = [
  { value: "DESCUENTO_PORCENTAJE", label: "Descuento por Porcentaje (%)" },
  { value: "DESCUENTO_FIJO", label: "Descuento Fijo (L)" },
  { value: "2X1", label: "2 x 1" },
  { value: "COMBO", label: "Combo / Paquete" },
  { value: "OTRO", label: "Otro" },
];

export default function CrearPromocion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(isEdit);

  const [formData, setFormData] = useState({
    promocionId: "Calculando...",
    nombre: "",
    descripcion: "",
    tipo: "DESCUENTO_PORCENTAJE",
    valorDescuento: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "ACTIVO",
  });

  useEffect(() => {
    const inicializar = async () => {
      if (isEdit) {
        try {
          const prom = await obtenerPromocionPorId(id);
          setFormData({
            promocionId: prom.promocionId || id,
            nombre: prom.nombre || "",
            descripcion: prom.descripcion || "",
            tipo: prom.tipo || "DESCUENTO_PORCENTAJE",
            valorDescuento: prom.valorDescuento ?? "",
            fechaInicio: prom.fechaInicio || "",
            fechaFin: prom.fechaFin || "",
            estado: prom.estado || "ACTIVO",
          });
        } catch {
          navigate("/promociones");
        } finally {
          setCargandoDatos(false);
        }
      } else {
        try {
          const todas = await obtenerPromociones();
          const proxId = `PROM-${String(todas.length + 1).padStart(3, "0")}`;
          setFormData((prev) => ({ ...prev, promocionId: proxId }));
        } catch {
          setFormData((prev) => ({ ...prev, promocionId: "PROM-001" }));
        } finally {
          setCargandoDatos(false);
        }
      }
    };
    inicializar();
  }, [id, isEdit, navigate]);

  const mostrarValorDescuento =
    formData.tipo === "DESCUENTO_PORCENTAJE" || formData.tipo === "DESCUENTO_FIJO";

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return alert("El nombre es obligatorio.");
    if (!formData.fechaInicio) return alert("La fecha de inicio es obligatoria.");
    if (!formData.fechaFin) return alert("La fecha de fin es obligatoria.");
    if (formData.fechaFin < formData.fechaInicio)
      return alert("La fecha de fin debe ser posterior a la de inicio.");
    if (mostrarValorDescuento && !formData.valorDescuento)
      return alert("El valor de descuento es obligatorio para este tipo.");

    setCargando(true);
    try {
      const payload = {
        ...formData,
        valorDescuento: mostrarValorDescuento
          ? Number(formData.valorDescuento) || 0
          : null,
      };

      if (isEdit) {
        await actualizarPromocion(id, payload);
      } else {
        await crearPromocion(payload);
      }
      navigate("/promociones");
    } catch (error) {
      console.error(error);
      alert("Error al guardar la promoción. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-[#7C3AED] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
      <button
        onClick={() => navigate("/promociones")}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-6 hover:text-black transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Regresar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
        {/* FORMULARIO */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-50">
          <h2 className="text-2xl font-black text-[#020817] mb-2">
            {isEdit ? "Editar Promoción" : "Nueva Promoción"}
          </h2>
          <p className="text-gray-400 text-sm mb-10">
            Configura los detalles y vigencia de la promoción
          </p>

          <form onSubmit={handleGuardar} className="space-y-8">
            {/* ID */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                ID de Promoción
              </label>
              <input
                value={formData.promocionId}
                readOnly
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-400 cursor-default focus:outline-none"
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                Nombre de la Promoción{" "}
                <span className="text-red-400">*</span>
              </label>
              <input
                required
                placeholder="Ej: Descuento de verano..."
                className="w-full bg-[#F8F9FF] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                Descripción
              </label>
              <textarea
                placeholder="Describe los detalles de la promoción..."
                className="w-full bg-[#F8F9FF] border-none rounded-2xl px-5 py-4 text-sm font-medium h-28 resize-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
              />
            </div>

            {/* Tipo + Valor descuento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                  Tipo de Promoción <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  className="w-full bg-[#F8F9FF] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo: e.target.value,
                      valorDescuento: "",
                    })
                  }
                >
                  {TIPO_OPCIONES.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {mostrarValorDescuento && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                    {formData.tipo === "DESCUENTO_PORCENTAJE"
                      ? "Porcentaje (%)"
                      : "Monto Fijo (L)"}
                    <span className="text-red-400"> *</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    max={
                      formData.tipo === "DESCUENTO_PORCENTAJE" ? 100 : undefined
                    }
                    step="0.01"
                    placeholder={
                      formData.tipo === "DESCUENTO_PORCENTAJE"
                        ? "Ej: 20"
                        : "Ej: 50.00"
                    }
                    className="w-full bg-[#F8F9FF] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                    value={formData.valorDescuento}
                    onChange={(e) =>
                      setFormData({ ...formData, valorDescuento: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                  Fecha de Inicio <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="date"
                  className="w-full bg-[#F8F9FF] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                  value={formData.fechaInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaInicio: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                  Fecha de Fin <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="date"
                  className="w-full bg-[#F8F9FF] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                  value={formData.fechaFin}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaFin: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Estado + Botones */}
            <div className="flex items-center gap-6 pt-6 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Estado
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      estado: formData.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO",
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    formData.estado === "ACTIVO" ? "bg-[#7C3AED]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      formData.estado === "ACTIVO" ? "left-7" : "left-1"
                    }`}
                  />
                </button>
                <span className="text-xs font-bold text-[#020817]">
                  {formData.estado}
                </span>
              </div>

              <div className="flex-1 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/promociones")}
                  className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="bg-[#020817] text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-black transition-all disabled:opacity-50"
                >
                  {cargando
                    ? "Guardando..."
                    : isEdit
                    ? "Actualizar Promoción"
                    : "Guardar Promoción"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* PANEL INFORMATIVO */}
        <div className="hidden lg:flex flex-col gap-6">
          {/* Resumen de la promoción */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <BadgePercent className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <h3 className="font-black text-[#020817] text-sm uppercase tracking-wider">
                Vista Previa
              </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F8F9FF] rounded-2xl p-4">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Nombre
                </p>
                <p className="font-black text-[#020817] text-sm">
                  {formData.nombre || "Sin nombre"}
                </p>
              </div>

              <div className="bg-[#F8F9FF] rounded-2xl p-4">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Tipo
                </p>
                <p className="font-bold text-[#020817] text-sm">
                  {TIPO_OPCIONES.find((o) => o.value === formData.tipo)?.label ||
                    "—"}
                </p>
              </div>

              {mostrarValorDescuento && formData.valorDescuento && (
                <div className="bg-purple-50 rounded-2xl p-4">
                  <p className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest mb-1">
                    Descuento
                  </p>
                  <p className="font-black text-[#7C3AED] text-xl">
                    {formData.tipo === "DESCUENTO_PORCENTAJE"
                      ? `${formData.valorDescuento}%`
                      : `L ${formData.valorDescuento}`}
                  </p>
                </div>
              )}

              {(formData.fechaInicio || formData.fechaFin) && (
                <div className="bg-[#F8F9FF] rounded-2xl p-4">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Vigencia
                  </p>
                  <p className="font-bold text-[#020817] text-xs">
                    {formData.fechaInicio || "—"} → {formData.fechaFin || "—"}
                  </p>
                </div>
              )}

              <div
                className={`rounded-2xl p-4 ${
                  formData.estado === "ACTIVO"
                    ? "bg-green-50"
                    : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${
                    formData.estado === "ACTIVO"
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  Estado
                </p>
                <p
                  className={`font-black text-sm ${
                    formData.estado === "ACTIVO"
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {formData.estado}
                </p>
              </div>
            </div>
          </div>

          {/* Consejos */}
          <div className="bg-[#020817] rounded-[2rem] p-6 text-white">
            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-300 mb-3">
              Consejos
            </p>
            <ul className="space-y-2 text-[11px] text-gray-300 leading-relaxed">
              <li>• Usa un nombre descriptivo para identificar la promo fácilmente.</li>
              <li>• Verifica las fechas antes de guardar para evitar vigencias incorrectas.</li>
              <li>• Las promociones inactivas no se aplicarán en el sistema.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}