import { getFunctions, httpsCallable } from "firebase/functions";
import { useState } from "react";
import { Loader2, Play, CheckCircle, AlertCircle } from "lucide-react";

export default function TestCuotas() {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const ejecutarCuotas = async () => {
    setCargando(true);
    setResultado(null);
    setError(null);

    try {
      const functions = getFunctions();
      const procesarCuotas = httpsCallable(functions, "procesarCuotasManual");
      const response = await procesarCuotas();
      setResultado(response.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl md:text-5xl font-black text-[#020817] tracking-tight">
          Test Cloud Functions
        </h2>
        <p className="text-[13px] text-gray-500 mt-2 font-medium">
          Ejecución manual de procesamiento de cuotas
        </p>
      </div>

      <section className="bg-white rounded-[1.25rem] border border-gray-100 shadow-[0_2px_18px_rgb(0,0,0,0.03)] p-6 space-y-6">
        {/* Botón */}
        <button
          onClick={ejecutarCuotas}
          disabled={cargando}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#7C3AED] text-white font-bold text-sm rounded-xl hover:bg-[#6D28D9] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {cargando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Ejecutar procesarCuotasManual
            </>
          )}
        </button>

        {/* Resultado */}
        {resultado && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-700">
                Ejecución exitosa
              </p>
              <p className="text-sm text-green-600 mt-1">
                Créditos procesados:{" "}
                <span className="font-black">{resultado.procesados}</span>
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">
                Error al ejecutar
              </p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
