import React from 'react';
// Aquí podés importar íconos si los ocupás para los botones
import { Plus } from 'lucide-react'; 

export default function Inventario() {
    return (
        // El mismo contenedor principal del Dashboard para mantener los márgenes
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            
            {/* --- CABECERA DE LA PÁGINA --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#020817]">Gestión de Inventario</h2>
                    <p className="text-[13px] text-gray-500 mt-1 font-medium">
                        Administra los productos y existencias del sistema del comisariato.
                    </p>
                </div>
                
                {/* Botón de acción principal (opcional, pero se ve muy pro) */}
                <button className="bg-[#020817] text-white text-[11px] font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-black transition-colors shadow-md">
                    <Plus className="w-4 h-4" /> Nuevo Producto
                </button>
            </div>

            {/* --- ÁREA DE TRABAJO (Tarjeta blanca vacía) --- */}
            <div className="bg-white p-6 md:p-10 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-50 min-h-[60vh] flex items-center justify-center">
                
                {/* Este texto lo vas a borrar luego para poner tu tabla, formularios, etc. */}
                <div className="text-center">
                    <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">
                        Módulo de Inventario en Construcción 🛠️
                    </p>
                    <p className="text-xs text-gray-300 mt-2">
                        Aquí irá la tabla con la lista de productos.
                    </p>
                </div>

            </div>
            
        </div>
    );
}