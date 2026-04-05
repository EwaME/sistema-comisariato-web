import React, { useState, useEffect } from 'react';
import { Search, Download, ChevronDown, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { escucharAuditorias, obtenerRolesAuditoria } from '../../../services/auditoriasService'; 

export default function Auditorias() {
    const [logsData, setLogsData] = useState([]);
    const [rolesDisponibles, setRolesDisponibles] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [filtroAccion, setFiltroAccion] = useState('');
    const [filtroModulo, setFiltroModulo] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const [paginaActual, setPaginaActual] = useState(1);
    const registrosPorPagina = 10;

    useEffect(() => {
        let desuscribir = () => {};

        const cargarDatos = async () => {
            setCargando(true);
            try {
                const rolesFetch = await obtenerRolesAuditoria();
                setRolesDisponibles(rolesFetch);

                desuscribir = escucharAuditorias((nuevosDatos) => {
                    setLogsData(nuevosDatos);
                    setCargando(false);
                });
            } catch (error) {
                console.error("Error al inicializar datos:", error);
                setCargando(false);
            }
        };

        cargarDatos();

        return () => desuscribir();
    }, []);

    const accionesUnicas = [...new Set(logsData.map(item => item.accion).filter(Boolean))];
    const modulosUnicos = [...new Set(logsData.map(item => item.modulo).filter(Boolean))];

    const logsFiltrados = logsData.filter(log => {
        const cumpleBusqueda = 
            log.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) || 
            log.nombreUsuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
            log.correo?.toLowerCase().includes(busqueda.toLowerCase());
            
        const cumpleRol = filtroRol ? log.rolUsuario === filtroRol : true;
        const cumpleAccion = filtroAccion ? log.accion === filtroAccion : true;
        const cumpleModulo = filtroModulo ? log.modulo === filtroModulo : true;

        let cumpleFecha = true;
        if (fechaInicio && fechaFin && log.fechaAccion) {
            const dateLog = log.fechaAccion.toDate();
            const start = new Date(fechaInicio + 'T00:00:00');
            const end = new Date(fechaFin + 'T23:59:59');
            cumpleFecha = dateLog >= start && dateLog <= end;
        }

        return cumpleBusqueda && cumpleRol && cumpleAccion && cumpleModulo && cumpleFecha;
    });

    const indiceUltimoRegistro = paginaActual * registrosPorPagina;
    const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
    const registrosActuales = logsFiltrados.slice(indicePrimerRegistro, indiceUltimoRegistro);
    const totalPaginas = Math.ceil(logsFiltrados.length / registrosPorPagina);

    const exportarCSV = () => {
        if (logsFiltrados.length === 0) return;

        const cabeceras = ['Fecha', 'Hora', 'Usuario', 'Correo', 'Rol', 'Acción', 'Módulo', 'ID Referencia', 'Descripción'];
        
        const filasCSV = logsFiltrados.map(log => [
            log.fecha,
            log.hora,
            `"${log.nombreUsuario}"`,
            log.correo,
            log.rolUsuario,
            log.accion,
            log.modulo,
            log.idReferencia,
            `"${log.descripcion?.replace(/"/g, '""')}"`
        ]);

        const contenidoCSV = [
            cabeceras.join(','),
            ...filasCSV.map(fila => fila.join(','))
        ].join('\n');

        const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Auditorias_Comisariato_${new Date().toLocaleDateString('es-HN')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getBadgeStyle = (accion) => {
        switch (accion?.toUpperCase()) {
            case 'EDICIÓN': return 'bg-blue-50 text-blue-500 border-blue-100';
            case 'CREACIÓN': return 'bg-emerald-50 text-emerald-500 border-emerald-100';
            case 'PAGO': return 'bg-amber-50 text-amber-500 border-amber-100';
            case 'ELIMINACIÓN': return 'bg-red-50 text-red-500 border-red-100';
            case 'ACTIVACIÓN': return 'bg-purple-50 text-purple-500 border-purple-100';
            case 'ALERTA': return 'bg-yellow-50 text-yellow-500 border-yellow-100';
            case 'EXPORTACIÓN': return 'bg-green-50 text-green-500 border-green-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="bg-white rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-50 p-6 md:p-10">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-[28px] font-black text-[#020817] leading-tight">Auditorías del Sistema</h1>
                        <p className="text-sm font-medium text-gray-400 mt-1">Seguimiento detallado de todas las actividades y cambios en la plataforma.</p>
                    </div>
                    <button 
                        onClick={exportarCSV}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#020817] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download size={14} /> Exportar Log (CSV)
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-3 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <label className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-widest">Rango de fechas</label>
                            {(fechaInicio || fechaFin) && (
                                <button 
                                    onClick={() => { setFechaInicio(''); setFechaFin(''); setPaginaActual(1); }} 
                                    className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1 rounded-md transition-all"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 px-1">
                            <input 
                                type="date" 
                                value={fechaInicio}
                                onChange={(e) => { setFechaInicio(e.target.value); setPaginaActual(1); }}
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none w-full cursor-pointer"
                            />
                            <input 
                                type="date" 
                                value={fechaFin}
                                onChange={(e) => { setFechaFin(e.target.value); setPaginaActual(1); }}
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none w-full cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-3 flex flex-col justify-center relative hover:bg-gray-50 transition-colors">
                        <label className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-widest mb-1 px-1">Rol</label>
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-gray-600 truncate">{filtroRol || 'Todos los roles'}</span>
                            {filtroRol ? (
                                <button 
                                    onClick={(e) => { e.preventDefault(); setFiltroRol(''); setPaginaActual(1); }} 
                                    className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1 rounded-md transition-all relative z-20"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            ) : (
                                <ChevronDown size={16} className="text-gray-400" />
                            )}
                        </div>
                        <select 
                            value={filtroRol}
                            onChange={(e) => { setFiltroRol(e.target.value); setPaginaActual(1); }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 appearance-none"
                        >
                            <option value="">Todos los roles</option>
                            {rolesDisponibles.map(rol => (
                                <option key={rol} value={rol}>{rol}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-3 flex flex-col justify-center relative hover:bg-gray-50 transition-colors">
                        <label className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-widest mb-1 px-1">Tipo de acción</label>
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-gray-600 truncate">{filtroAccion || 'Todas las acciones'}</span>
                            {filtroAccion ? (
                                <button 
                                    onClick={(e) => { e.preventDefault(); setFiltroAccion(''); setPaginaActual(1); }} 
                                    className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1 rounded-md transition-all relative z-20"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            ) : (
                                <ChevronDown size={16} className="text-gray-400" />
                            )}
                        </div>
                        <select 
                            value={filtroAccion}
                            onChange={(e) => { setFiltroAccion(e.target.value); setPaginaActual(1); }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 appearance-none"
                        >
                            <option value="">Todas las acciones</option>
                            {accionesUnicas.map(accion => (
                                <option key={accion} value={accion}>{accion}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-3 flex flex-col justify-center relative hover:bg-gray-50 transition-colors">
                        <label className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-widest mb-1 px-1">Módulo</label>
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-gray-600 truncate">{filtroModulo || 'Todos los módulos'}</span>
                            {filtroModulo ? (
                                <button 
                                    onClick={(e) => { e.preventDefault(); setFiltroModulo(''); setPaginaActual(1); }} 
                                    className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1 rounded-md transition-all relative z-20"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            ) : (
                                <ChevronDown size={16} className="text-gray-400" />
                            )}
                        </div>
                        <select 
                            value={filtroModulo}
                            onChange={(e) => { setFiltroModulo(e.target.value); setPaginaActual(1); }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 appearance-none"
                        >
                            <option value="">Todos los módulos</option>
                            {modulosUnicos.map(modulo => (
                                <option key={modulo} value={modulo}>{modulo}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario, correo o descripción..." 
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                    />
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    {cargando ? (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin mb-4" />
                            <p className="text-gray-400 font-medium text-sm">Cargando registros...</p>
                        </div>
                    ) : registrosActuales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <p className="text-gray-400 font-medium text-sm">No se encontraron registros de auditoría.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8F9FF]">
                                    <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest rounded-l-xl whitespace-nowrap">Rol / Fecha</th>
                                    <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest whitespace-nowrap">Usuario</th>
                                    <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest whitespace-nowrap">Acción</th>
                                    <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest whitespace-nowrap">Módulo</th>
                                    <th className="py-4 px-5 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-widest rounded-r-xl w-full">Descripción</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {registrosActuales.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-5 whitespace-nowrap">
                                            <p className="text-[#020817] font-black text-xs uppercase tracking-wider">{log.rolUsuario || 'SISTEMA'}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{log.fecha} • {log.hora}</p>
                                        </td>
                                        <td className="py-4 px-5 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#020817]">{log.nombreUsuario}</span>
                                                <span className="text-[10px] text-gray-400">{log.correo}</span>
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
                                        <td className="py-4 px-5 text-gray-500 text-xs w-[40%]">
                                            <p className="whitespace-normal leading-relaxed">{log.descripcion}</p>
                                            {log.idReferencia && log.idReferencia !== "N/A" && (
                                                <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 font-bold mt-2 inline-block">REF: {log.idReferencia}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!cargando && logsFiltrados.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-50 gap-4">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            Mostrando {indicePrimerRegistro + 1} - {Math.min(indiceUltimoRegistro, logsFiltrados.length)} de {logsFiltrados.length} registros
                        </p>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                disabled={paginaActual === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            
                            <span className="text-xs font-bold text-gray-600 mx-2">
                                Página {paginaActual} de {totalPaginas}
                            </span>

                            <button 
                                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                                disabled={paginaActual === totalPaginas}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}