import React from 'react';
import { Download, MoreVertical, Package, Shield, UserPlus } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="p-8 max-w-[1600px] mx-auto">
        
        {/* --- ESTRUCTURA PRINCIPAL: IZQUIERDA (Contenido) y DERECHA (Actividad) --- */}
        <div className="flex flex-col xl:flex-row gap-6">
            
            {/* --- COLUMNA IZQUIERDA (El 75% del ancho) --- */}
            <div className="flex-1 flex flex-col gap-6">
            
            {/* 1. FILA DE TARJETAS (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tarjeta 1 */}
                <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative overflow-hidden">
                <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full mb-3 inline-block">+12%</span>
                <h3 className="text-4xl font-extrabold text-[#020817] tracking-tight mb-1">1,248</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Créditos Activos</p>
                {/* Forma decorativa morada */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#F5F3FF] rounded-full opacity-50"></div>
                <div className="absolute -bottom-2 right-2 w-12 h-3 bg-[#E0E7FF] rounded-full rotate-45"></div>
                </div>

                {/* Tarjeta 2 */}
                <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                <span className="bg-purple-50 text-purple-500 text-[10px] font-bold px-2 py-1 rounded-full mb-3 inline-block">Noticia</span>
                <h3 className="text-4xl font-extrabold text-[#020817] tracking-tight mb-1">L842k</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Monto Total Pendiente</p>
                </div>
                

                {/* Tarjeta 3 */}
                <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative overflow-hidden">
                <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full mb-3 inline-block">Crítico</span>
                <h3 className="text-4xl font-extrabold text-[#020817] tracking-tight mb-1">24</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Productos con Stock Bajo</p>
                <div className="absolute -bottom-4 right-4 w-12 h-12 bg-red-50 rounded-full"></div>
                </div>

                {/* Tarjeta 4 */}
                <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative overflow-hidden">
                <span className="bg-yellow-50 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded-full mb-3 inline-block">Pendiente</span>
                <h3 className="text-4xl font-extrabold text-[#020817] tracking-tight mb-1">89</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Créditos Pendientes</p>
                <div className="absolute top-6 right-6 w-8 h-8 bg-yellow-50 rounded-full"></div>
                </div>
            </div>

            {/* 2. FILA DE GRÁFICOS */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Gráfico Principal */}
                <div className="flex-1 bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                    <div>
                    <h3 className="text-lg font-bold text-[#020817]">Flujo de Créditos Mensual</h3>
                    <p className="text-xs text-gray-400">Visualización de desembolsos industriales 2026</p>
                    </div>
                    <button className="bg-[#020817] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition-colors">
                    Exportar <Download className="w-3 h-3" />
                    </button>
                </div>
                
                {/* Simulación del Gráfico con SVG */}
                <div className="flex-1 w-full h-48 relative mt-auto">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Curva Suave */}
                    <path d="M0,35 Q15,35 25,25 T50,15 T75,5 T100,5 L100,40 L0,40 Z" fill="url(#gradient)" />
                    <path d="M0,35 Q15,35 25,25 T50,15 T75,5 T100,5" fill="none" stroke="#7C3AED" strokeWidth="1" />
                    {/* Puntos de datos */}
                    <circle cx="25" cy="25" r="1.5" fill="white" stroke="#7C3AED" strokeWidth="1" />
                    <circle cx="50" cy="15" r="1.5" fill="white" stroke="#7C3AED" strokeWidth="1" />
                    <circle cx="75" cy="5" r="1.5" fill="white" stroke="#7C3AED" strokeWidth="1" />
                    <circle cx="100" cy="5" r="1.5" fill="white" stroke="#7C3AED" strokeWidth="1" />
                    </svg>
                    {/* Meses en X */}
                    <div className="absolute bottom-0 w-full flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-1">
                    <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
                    </div>
                </div>
                </div>

                {/* Categorías (Barras horizontales) */}
                <div className="w-full lg:w-72 bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                <h3 className="text-lg font-bold text-[#020817] mb-6">Créditos por Categorías</h3>
                <div className="space-y-5">
                    {/* Barra 1 */}
                    <div>
                    <div className="flex justify-between text-xs font-bold text-[#020817] mb-2">
                        <span>Hogar</span> <span>65%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-[#020817] h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    </div>
                    {/* Barra 2 */}
                    <div>
                    <div className="flex justify-between text-xs font-bold text-[#020817] mb-2">
                        <span>Electrónica</span> <span>48%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-[#7C3AED] h-2 rounded-full" style={{ width: '48%' }}></div>
                    </div>
                    </div>
                    {/* Barra 3 */}
                    <div>
                    <div className="flex justify-between text-xs font-bold text-[#020817] mb-2">
                        <span>Ropa</span> <span>32%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: '32%' }}></div>
                    </div>
                    </div>
                    {/* Barra 4 */}
                    <div>
                    <div className="flex justify-between text-xs font-bold text-[#020817] mb-2">
                        <span>Otras Categorías</span> <span>15%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gray-200 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    </div>
                </div>
                </div>
            </div>

            {/* 3. FILA DE TABLA */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#020817]">Últimos Créditos Generados</h3>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-50 rounded-lg"><Filter className="w-4 h-4 text-gray-500" /></button>
                    <button className="p-2 hover:bg-gray-50 rounded-lg"><MoreVertical className="w-4 h-4 text-gray-500" /></button>
                </div>
                </div>

                <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-gray-100">
                        <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/3">Empleado</th>
                        <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-1/4">Fecha Emisión</th>
                        <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-1/4">Monto</th>
                        <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right w-1/6">Estado</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-[#020817]">
                    {/* Fila 1 */}
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-[#7C3AED] flex items-center justify-center text-xs font-bold">JR</div>
                            <span>Jorge Rodriguez</span>
                        </div>
                        </td>
                        <td className="py-4 text-center text-gray-500 font-normal">24 May 2024</td>
                        <td className="py-4 text-center font-bold">$1,250.00</td>
                        <td className="py-4 text-right">
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Aprobado</span>
                        </td>
                    </tr>
                    {/* Fila 2 */}
                    <tr className="hover:bg-gray-50/50">
                        <td className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">MS</div>
                            <span>Miguel Sánchez</span>
                        </div>
                        </td>
                        <td className="py-4 text-center text-gray-500 font-normal">23 May 2024</td>
                        <td className="py-4 text-center font-bold">$480.00</td>
                        <td className="py-4 text-right">
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Pendiente</span>
                        </td>
                    </tr>
                    </tbody>
                </table>
                </div>
            </div>
            
            </div>

            {/* --- COLUMNA DERECHA (Actividad Reciente) --- */}
            <div className="w-full xl:w-80 bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 flex flex-col h-full">
            <h3 className="text-lg font-bold text-[#020817] mb-8">Actividad Reciente</h3>
            
            <div className="space-y-6 flex-1">
                
                {/* Item 1 */}
                <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <img src="https://i.pravatar.cc/150?img=11" alt="Carlos" className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between">
                    <h4 className="text-sm font-bold text-[#020817]">Carlos Ramírez</h4>
                    <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Realizó un pago de crédito</p>
                    <p className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest mt-2">Hace 5 min</p>
                </div>
                </div>

                {/* Item 2 */}
                <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between">
                    <h4 className="text-sm font-bold text-[#020817]">Nueva Reserva</h4>
                    <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Herramientas de seguridad (x12)</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Hace 2 horas</p>
                </div>
                </div>

                {/* Item 3 */}
                <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <img src="https://i.pravatar.cc/150?img=9" alt="Elena" className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between">
                    <h4 className="text-sm font-bold text-[#020817]">Elena Martínez</h4>
                    <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Nuevo empleado registrado</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Ayer 14:30</p>
                </div>
                </div>

                {/* Item 4 */}
                <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between">
                    <h4 className="text-sm font-bold text-[#020817]">Stock Agotado</h4>
                    <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Filtros industriales serie K</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Ayer 09:12</p>
                </div>
                </div>
                
            </div>

            <button className="w-full mt-6 bg-[#020817] text-white text-xs font-bold py-4 rounded-xl hover:bg-black transition-colors uppercase tracking-widest">
                Ver todo el historial
            </button>
            </div>

        </div>
        </div>
    );
}

// Pequeño componente Filter porque me faltó importarlo arriba
function Filter(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
    );
}