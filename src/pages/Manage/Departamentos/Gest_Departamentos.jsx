import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreHorizontal, ChevronRight, Loader2, ChevronLeft, Building2, XCircle, AlertCircle, X } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { obtenerDepartamentos, desactivarDepartamento } from '../../../services/departamentosService'; 

export default function Gest_Departamentos() {
    const [departamentos, setDepartamentos] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const [menuActivo, setMenuActivo] = useState(null);
    const menuRef = useRef(null);

    // Estados para el Modal de Inhabilitar
    const [modalInhabilitar, setModalInhabilitar] = useState(false);
    const [depSeleccionado, setDepSeleccionado] = useState(null);
    const [inputConfirmacion, setInputConfirmacion] = useState("");
    const [desactivando, setDesactivando] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const data = await obtenerDepartamentos();
            setDepartamentos(data);
        } catch (error) {
            console.error("Error al cargar departamentos:", error);
        } finally {
            setCargando(false);
        }
    };

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickFuera = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuActivo(null);
            }
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const toggleMenu = (idDep) => {
        setMenuActivo(menuActivo === idDep ? null : idDep);
    };

    // Filtro de búsqueda
    const departamentosFiltrados = departamentos.filter(dep => {
        const termino = busqueda.toLowerCase();
        return dep.id?.toLowerCase().includes(termino) || 
               dep.nombre?.toLowerCase().includes(termino) ||
               dep.descripcion?.toLowerCase().includes(termino);
    });

    // Paginación
    const totalPaginas = Math.ceil(departamentosFiltrados.length / itemsPorPagina) || 1;
    const startIndex = (paginaActual - 1) * itemsPorPagina;
    const departamentosPaginados = departamentosFiltrados.slice(startIndex, startIndex + itemsPorPagina);

    // Funciones del Modal
    const abrirModal = (dep) => {
        setDepSeleccionado(dep);
        setModalInhabilitar(true);
        setInputConfirmacion("");
        setMenuActivo(null);
    };

    const cerrarModal = () => {
        setModalInhabilitar(false);
        setDepSeleccionado(null);
        setInputConfirmacion("");
    };

    const handleInhabilitar = async () => {
        if (inputConfirmacion !== depSeleccionado.id) return;

        setDesactivando(true);
        try {
            await desactivarDepartamento(depSeleccionado.id);
            setDepartamentos(departamentos.map(d => 
                d.id === depSeleccionado.id ? { ...d, estado: "INACTIVO" } : d
            ));
            cerrarModal();
        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo inhabilitar el departamento.");
        } finally {
            setDesactivando(false);
        }
    };

    return (
        <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen relative">
            
            {/* --- CABECERA --- */}
            <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-[#020817]">Gestión de Departamentos</h2>
                <p className="text-[13px] text-gray-500 mt-1 font-medium">Administra las áreas y divisiones operativas del Comisariato.</p>
            </div>

            {/* --- ÁREA PRINCIPAL --- */}
            <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative z-10 w-full overflow-hidden">
                
                {/* BARRA DE BÚSQUEDA Y BOTÓN NUEVO */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={busqueda}
                            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                            placeholder="Buscar por código, nombre o descripción..." 
                            className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                        />
                        {busqueda && (
                            <button onClick={() => { setBusqueda(''); setPaginaActual(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Link to="/departamentos/nuevo" className="bg-[#020817] text-white text-[11px] font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md w-full md:w-auto uppercase tracking-widest whitespace-nowrap">
                        <Building2 className="w-4 h-4" />
                        Nuevo Departamento
                    </Link>
                </div>

                {/* TABLA */}
                <div className="w-full overflow-x-auto min-h-[400px]"> 
                    {cargando ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7C3AED]" />
                            <p className="text-sm font-bold uppercase tracking-widest">Cargando departamentos...</p>
                        </div>
                    ) : departamentosPaginados.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-400 font-bold uppercase text-sm mb-2">No se encontraron departamentos</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-[#F8F9FF] rounded-xl">
                                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest rounded-l-xl">Código</th>
                                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Departamento</th>
                                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descripción</th>
                                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Estado</th>
                                    <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center rounded-r-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium text-[#020817]">
                                {departamentosPaginados.map((dep) => {
                                    const activo = dep.estado?.toUpperCase() === 'ACTIVO';

                                    return (
                                        <tr key={dep.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            
                                            <td className="py-5 px-4">
                                                <p className="font-extrabold text-gray-400 text-xs uppercase tracking-wider">{dep.id}</p>
                                            </td>
                                            
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-5 h-5 text-[#7C3AED]" />
                                                    </div>
                                                    <p className="font-extrabold text-[#020817] text-sm">{dep.nombre || "Sin nombre"}</p>
                                                </div>
                                            </td>

                                            <td className="py-5 px-4 text-gray-500">
                                                <p className="max-w-xs truncate" title={dep.descripcion}>
                                                    {dep.descripcion || "Sin descripción asignada."}
                                                </p>
                                            </td>

                                            <td className="py-5 px-4 text-center">
                                                <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest inline-block ${
                                                    activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                                }`}>
                                                    {dep.estado || 'INACTIVO'}
                                                </span>
                                            </td>

                                            <td className="py-5 px-4 text-center relative">
                                                <button onClick={() => toggleMenu(dep.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors focus:outline-none">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                                
                                                {menuActivo === dep.id && (
                                                    <div ref={menuRef} className="absolute right-12 top-10 w-40 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left overflow-hidden">
                                                        <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                                                            <span className="text-[11px] font-bold text-[#b2b1b6] uppercase tracking-widest">Opciones</span>
                                                        </div>
                                                        <div className="py-2 flex flex-col">
                                                            <Link to={`/departamentos/editar/${dep.id}`} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors block">
                                                                Editar
                                                            </Link>
                                                            
                                                            {activo && (
                                                                <button 
                                                                    onClick={() => abrirModal(dep)}
                                                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 text-left transition-colors w-full"
                                                                >
                                                                    Inhabilitar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* PAGINACIÓN */}
                {!cargando && departamentosFiltrados.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-50 gap-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPorPagina, departamentosFiltrados.length)} de {departamentosFiltrados.length} Departamentos
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-xs font-bold px-3">Página {paginaActual} de {totalPaginas}</span>
                            <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DE INHABILITAR DEPARTAMENTO */}
            {modalInhabilitar && depSeleccionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100 relative">
                            <button onClick={cerrarModal} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-extrabold text-red-600 text-center">¿Inhabilitar {depSeleccionado.nombre}?</h3>
                            <p className="text-xs font-medium text-red-500 mt-1 text-center px-4">
                                Esto marcará el departamento como inactivo. Asegúrate de reasignar a los empleados si es necesario.
                            </p>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                                Para confirmar, por favor escribe el código del departamento: <br/>
                                <span className="font-extrabold text-[#020817] select-all bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                                    {depSeleccionado.id}
                                </span>
                            </p>
                            <input 
                                type="text"
                                value={inputConfirmacion}
                                onChange={(e) => setInputConfirmacion(e.target.value)}
                                placeholder="Escribe el código aquí..."
                                className="w-full text-center bg-[#F8F9FF] border border-gray-200 text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            />
                            <div className="flex items-center gap-3 mt-6">
                                <button onClick={cerrarModal} className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase">
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleInhabilitar}
                                    disabled={inputConfirmacion !== depSeleccionado.id || desactivando}
                                    className={`flex-1 text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase
                                        ${(inputConfirmacion !== depSeleccionado.id || desactivando) 
                                            ? 'bg-red-200 cursor-not-allowed opacity-70' 
                                            : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                >
                                    {desactivando ? 'Inhabilitando...' : 'Sí, Inhabilitar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}