import React, { useState } from 'react';
import { Search, Download, Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Auditorias() {
    const [busqueda, setBusqueda] = useState('');

    // Datos simulados (Mock data) basados en tu imagen
    const logsData = [
        { id: 1, fecha: "24 Oct 2023", hora: "14:22:15", usuario: "Carlos Mendoza", avatar: "https://ui-avatars.com/api/?name=Carlos+Mendoza&background=0D8ABC&color=fff", accion: "EDICIÓN", modulo: "Inventario", descripcion: "Cambio de precio unitario en producto..." },
        { id: 2, fecha: "24 Oct 2023", hora: "11:05:40", usuario: "Elena Rivas", avatar: "https://ui-avatars.com/api/?name=Elena+Rivas&background=10B981&color=fff", accion: "CREACIÓN", modulo: "Pedidos", descripcion: "Nuevo pedido generado para 'Ingenio..." },
        { id: 3, fecha: "23 Oct 2023", hora: "16:45:12", usuario: "Roberto Solis", avatar: "https://ui-avatars.com/api/?name=Roberto+Solis&background=F59E0B&color=fff", accion: "PAGO", modulo: "Nómina", descripcion: "Dispersión de quincena aprobada - Lot..." },
        { id: 4, fecha: "23 Oct 2023", hora: "08:30:00", usuario: "Admin System", avatar: "https://ui-avatars.com/api/?name=Admin+System&background=111827&color=fff", accion: "ELIMINACIÓN", modulo: "Proveedores", descripcion: "Eliminado registro inactivo: 'Textiles de..." },
    ];

    // Helper para los colores de las etiquetas de acción
    const getBadgeStyle = (accion) => {
        switch (accion) {
            case 'EDICIÓN': return 'bg-blue-50 text-blue-500 border-blue-100';
            case 'CREACIÓN': return 'bg-emerald-50 text-emerald-500 border-emerald-100';
            case 'PAGO': return 'bg-amber-50 text-amber-500 border-amber-100';
            case 'ELIMINACIÓN': return 'bg-red-50 text-red-500 border-red-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">
            
            {/* Tarjeta Principal */}
            <div className="bg-white rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-50 p-6 md:p-10">
                
                {/* Header de la vista */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-[28px] font-black text-[#020817] leading-tight">Auditorías del Sistema</h1>
                        <p className="text-sm font-medium text-gray-400 mt-1">Seguimiento detallado de todas las actividades y cambios en la plataforma.</p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#020817] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm">
                        <Download size={14} /> Exportar Log (CSV)
                    </button>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Filtro Fecha */}
                    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-3 flex flex-col justify-center">
                        <label className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-widest mb-1 px-1">Rango de fechas</label>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 px-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>01/10/2023 - 31/10/2023</span>
                        </div>
                    </div>

                    {/* Filtro Usuario */}
                    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-3 flex flex-col justify-center relative cursor-pointer">
                        <label className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-widest mb-1 px-1">Usuario</label>
                        <select className="w-full bg-transparent text-xs font-bold text-gray-600 px-1 outline-none appearance-none cursor-pointer">
                            <option>Todos los usuarios</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 text-gray-400" />
                    </div>

                    {/* Filtro Tipo Acción */}
                    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-3 flex flex-col justify-center relative cursor-pointer">
                        <label className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-widest mb-1 px-1">Tipo de acción</label>
                        <select className="w-full bg-transparent text-xs font-bold text-gray-600 px-1 outline-none appearance-none cursor-pointer">
                            <option>Todas las acciones</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 text-gray-400" />
                    </div>

                    {/* Filtro Módulo */}
                    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-3 flex flex-col justify-center relative cursor-pointer">
                        <label className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-widest mb-1 px-1">Módulo</label>
                        <select className="w-full bg-transparent text-xs font-bold text-gray-600 px-1 outline-none appearance-none cursor-pointer">
                            <option>Todos los módulos</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Buscador de la tabla */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Buscar en auditoría..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                    />
                </div>

                {/* Tabla de Auditoría */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F8F9FF]">
                                <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest rounded-l-xl whitespace-nowrap">Fecha y Hora</th>
                                <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest whitespace-nowrap">Usuario</th>
                                <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest whitespace-nowrap">Acción</th>
                                <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest whitespace-nowrap">Módulo</th>
                                <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest rounded-r-xl w-full">Descripción</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {logsData.map((log) => (
                                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-5 whitespace-nowrap">
                                        <p className="text-[#020817] font-bold">{log.fecha}</p>
                                        <p className="text-[11px] text-gray-400">{log.hora}</p>
                                    </td>
                                    <td className="py-4 px-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <img src={log.avatar} alt={log.usuario} className="w-8 h-8 rounded-full border border-gray-100" />
                                            <span className="font-bold text-[#020817]">{log.usuario}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 whitespace-nowrap">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border ${getBadgeStyle(log.accion)}`}>
                                            {log.accion}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5 whitespace-nowrap text-gray-600 font-bold">
                                        {log.modulo}
                                    </td>
                                    <td className="py-4 px-5 text-gray-500 text-xs truncate max-w-[250px]">
                                        {log.descripcion}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Paginación */}
                <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-50 gap-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        Mostrando 1 - 4 de 120 registros
                    </p>
                    <div className="flex items-center gap-1">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
                            <ChevronLeft size={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#020817] text-white text-xs font-bold shadow-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 text-xs font-bold transition-colors">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 text-xs font-bold transition-colors">3</button>
                        <span className="text-gray-400 mx-1">...</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 text-xs font-bold transition-colors">12</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}