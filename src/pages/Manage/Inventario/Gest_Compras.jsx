import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Clock, CheckCircle, XCircle, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { obtenerCompras } from '../../../services/comprasService';
import { useAuth } from '../../../auth/AuthProvider';

export default function Gest_Compras() {
    const [compras, setCompras] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState("TODOS");
    const { role } = useAuth();
    const esGestor = role.includes("GESTOR DE INVENTARIO");

    useEffect(() => {
        obtenerCompras().then(setCompras);
    }, []);

    const comprasFiltradas = compras.filter(c => 
        filtroEstado === "TODOS" ? true : c.estado === filtroEstado
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#020817]">Órdenes de Compra</h2>
                    <p className="text-sm text-gray-500">Gestión de reabastecimiento de inventario</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select 
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="bg-white border border-gray-200 text-xs font-bold text-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 uppercase tracking-widest cursor-pointer w-full md:w-auto"
                    >
                        <option value="TODOS">sin filtro</option>
                        <option value="PENDIENTE">Pendientes</option>
                        <option value="ACEPTADO">Aceptadas</option>
                        <option value="RECHAZADO">Rechazadas</option>
                    </select>

                    {esGestor && (
                        <Link to="/compras/nuevo" className="bg-[#020817] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest shadow-lg w-full md:w-auto shrink-0">
                            <Plus className="w-4 h-4" /> Nueva
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Orden</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Artículos</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Estado</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {comprasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    No hay órdenes en este estado
                                </td>
                            </tr>
                        ) : (
                            comprasFiltradas.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50">
                                    <td className="p-4 font-bold text-sm text-gray-600">
                                        #{c.id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="p-4 text-center font-medium">
                                        {c.items ? c.items.length : 0} items
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center justify-center gap-1 w-fit mx-auto ${
                                            c.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-600' : 
                                            c.estado === 'ACEPTADO' ? 'bg-green-50 text-green-600' : 
                                            c.estado === 'INGRESADO' ? 'bg-blue-50 text-blue-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                            {c.estado === 'INGRESADO' && <Box className="w-3 h-3"/>}
                                            {c.estado === 'PENDIENTE' && <Clock className="w-3 h-3"/>}
                                            {c.estado === 'ACEPTADO' && <CheckCircle className="w-3 h-3"/>}
                                            {c.estado === 'RECHAZADO' && <XCircle className="w-3 h-3"/>}
                                            {c.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link to={`/compras/detalle/${c.id}`} className="text-gray-400 hover:text-[#7C3AED] transition-colors">
                                            <MoreHorizontal className="w-5 h-5 inline" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}