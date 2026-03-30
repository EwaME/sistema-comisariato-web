import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { obtenerEmpleados, desactivarEmpleado } from '../../../services/empleadosService';

export default function Empleados() {
    const [empleados, setEmpleados] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    // ==========================================
    // ESTADOS DE BÚSQUEDA, FILTROS Y PAGINACIÓN
    // ==========================================
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    // Filtros
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const filtroRef = useRef(null);
    
    // filtrosTemp es lo que el usuario selecciona en el modal antes de darle "Aplicar"
    const [filtrosTemp, setFiltrosTemp] = useState({ departamento: '', estado: '' });
    // filtrosAplicados es lo que realmente filtra la tabla
    const [filtrosAplicados, setFiltrosAplicados] = useState({ departamento: '', estado: '' });

    // ==========================================
    // ESTADOS ORIGINALES (Dropdowns y Modal)
    // ==========================================
    const [menuActivo, setMenuActivo] = useState(null);
    const menuRef = useRef(null);
    const [modalInhabilitar, setModalInhabilitar] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
    const [inputConfirmacion, setInputConfirmacion] = useState("");
    const [desactivando, setDesactivando] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const data = await obtenerEmpleados();
                setEmpleados(data);
            } catch (error) {
                console.error("No se pudieron cargar los empleados", error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    // Cerrar dropdowns o filtros al hacer clic fuera
    useEffect(() => {
        const handleClickFuera = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuActivo(null);
            }
            if (filtroRef.current && !filtroRef.current.contains(event.target)) {
                setMostrarFiltros(false);
            }
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const obtenerIniciales = (nombres = "", apellidos = "") => {
        return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
    };

    const toggleMenu = (idEmpleado) => {
        if (menuActivo === idEmpleado) setMenuActivo(null);
        else setMenuActivo(idEmpleado);
    };

    // ==========================================
    // LÓGICA DE PROCESAMIENTO (FILTRAR Y BUSCAR)
    // ==========================================
    const empleadosFiltrados = empleados.filter(emp => {
        // 1. Filtrar por Búsqueda (Nombre o ID)
        const termino = busqueda.toLowerCase();
        const nombreCompleto = `${emp.nombres} ${emp.apellidos}`.toLowerCase();
        const matchBusqueda = emp.id?.toLowerCase().includes(termino) || nombreCompleto.includes(termino);

        // 2. Filtrar por Departamento (Si hay uno aplicado)
        const matchDepto = filtrosAplicados.departamento === '' || emp.departamento === filtrosAplicados.departamento;

        // 3. Filtrar por Estado (Si hay uno aplicado)
        const matchEstado = filtrosAplicados.estado === '' || emp.estado === filtrosAplicados.estado;

        return matchBusqueda && matchDepto && matchEstado;
    });

    // ==========================================
    // LÓGICA DE PAGINACIÓN
    // ==========================================
    const totalPaginas = Math.ceil(empleadosFiltrados.length / itemsPorPagina);
    const startIndex = (paginaActual - 1) * itemsPorPagina;
    const empleadosPaginados = empleadosFiltrados.slice(startIndex, startIndex + itemsPorPagina);

    // Si la búsqueda reduce los resultados y la página actual queda vacía, regresamos a la pag 1
    useEffect(() => {
        if (paginaActual > totalPaginas && totalPaginas > 0) {
            setPaginaActual(1);
        }
    }, [empleadosFiltrados.length, paginaActual, totalPaginas]);

    // ==========================================
    // LÓGICA DE BOTONES DE FILTRO
    // ==========================================
    const isFiltroActivo = filtrosAplicados.departamento !== '' || filtrosAplicados.estado !== '';

    const handleBotonFiltroClick = () => {
        if (isFiltroActivo) {
            // Si ya hay filtros, el botón sirve para quitarlos todos
            setFiltrosAplicados({ departamento: '', estado: '' });
            setFiltrosTemp({ departamento: '', estado: '' });
            setPaginaActual(1);
        } else {
            // Si no hay filtros, abre el modal
            setMostrarFiltros(!mostrarFiltros);
        }
    };

    const aplicarFiltros = () => {
        setFiltrosAplicados(filtrosTemp);
        setMostrarFiltros(false);
        setPaginaActual(1); // Reiniciar a la página 1 al filtrar
    };

    // ==========================================
    // LÓGICA DEL MODAL DE INHABILITAR
    // ==========================================
    const abrirModal = (empleado) => {
        setEmpleadoSeleccionado(empleado);
        setModalInhabilitar(true);
        setInputConfirmacion("");
        setMenuActivo(null);
    };

    const cerrarModal = () => {
        setModalInhabilitar(false);
        setEmpleadoSeleccionado(null);
        setInputConfirmacion("");
    };

    const handleInhabilitar = async () => {
        if (inputConfirmacion !== empleadoSeleccionado.id) return;

        setDesactivando(true);
        try {
            await desactivarEmpleado(empleadoSeleccionado.id);
            setEmpleados(empleados.map(emp => 
                emp.id === empleadoSeleccionado.id ? { ...emp, estado: "INACTIVO" } : emp
            ));
            cerrarModal();
        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo inhabilitar al empleado.");
        } finally {
            setDesactivando(false);
        }
    };

    return (
        <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen relative">
            
            {/* --- CABECERA --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#020817]">Gestión de Empleados</h2>
                    <p className="text-[13px] text-gray-500 mt-1 font-medium">
                        Administra el personal del Comisariato y sus saldos de nómina.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Empleados Activos</p>
                        <p className="text-lg font-extrabold text-[#020817] leading-none">
                            {empleados.filter(e => e.estado?.toUpperCase() === 'ACTIVO').length} 
                            <span className="text-[11px] font-medium text-gray-400 ml-1">
                                de {empleados.length} total
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* --- ÁREA DE TRABAJO --- */}
            <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative z-10">
                
                {/* BARRA DE HERRAMIENTAS */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                setPaginaActual(1);
                            }}
                            placeholder="Buscar por nombre o ID..." 
                            // OJO: Cambié 'pr-4' por 'pr-10' para que el texto no choque con la X
                            className="w-full bg-white border border-gray-200 text-sm font-medium pl-10 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                        />
                        
                        {busqueda && (
                            <button 
                                onClick={() => {
                                    setBusqueda('');
                                    setPaginaActual(1); 
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto relative">
                        {/* Botón de Filtros Dinámico */}
                        <button 
                            onClick={handleBotonFiltroClick}
                            className={`border text-[11px] font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors
                                ${isFiltroActivo 
                                    ? 'bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }
                            `}
                        >
                            {isFiltroActivo ? <XCircle className="w-4 h-4" /> : <Filter className="w-4 h-4" />} 
                            {isFiltroActivo ? 'QUITAR FILTROS' : 'FILTRAR'}
                        </button>

                        {/* MENÚ DROPDOWN DE FILTROS */}
                        {mostrarFiltros && (
                            <div ref={filtroRef} className="absolute top-12 right-0 md:right-32 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 p-4">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">Opciones de Filtro</h4>
                                
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-[#020817] mb-2">Departamento</label>
                                    <select 
                                        value={filtrosTemp.departamento}
                                        onChange={(e) => setFiltrosTemp({...filtrosTemp, departamento: e.target.value})}
                                        className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                    >
                                        <option value="">Todos los departamentos</option>
                                        <option value="Molienda">Molienda</option>
                                        <option value="Logística">Logística</option>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                        <option value="Administración">Administración</option>
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-[#020817] mb-2">Estado</label>
                                    <select 
                                        value={filtrosTemp.estado}
                                        onChange={(e) => setFiltrosTemp({...filtrosTemp, estado: e.target.value})}
                                        className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                    >
                                        <option value="">Todos los estados</option>
                                        <option value="ACTIVO">Activos</option>
                                        <option value="INACTIVO">Inactivos</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={aplicarFiltros}
                                    className="w-full bg-[#020817] text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-black transition-colors uppercase tracking-widest"
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        )}

                        <Link to="/empleados/nuevo" className="bg-[#020817] text-white text-[11px] font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md w-full md:w-auto">
                            NUEVO EMPLEADO
                        </Link>
                    </div>
                </div>

                {/* TABLA DE EMPLEADOS */}
                <div className="w-full overflow-visible min-h-[400px]"> 
                    {cargando ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7C3AED]" />
                            <p className="text-sm font-bold tracking-widest uppercase">Cargando base de datos...</p>
                        </div>
                    ) : empleadosPaginados.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm mb-2">
                                {empleados.length === 0 ? "No hay empleados registrados" : "No se encontraron resultados"}
                            </p>
                            <p className="text-xs text-gray-400">
                                {empleados.length === 0 ? "Haz clic en 'Nuevo Empleado' para comenzar." : "Intenta buscar con otros términos o cambia los filtros."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8F9FF] rounded-xl">
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest rounded-l-xl">Empleado</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">DNI / ID</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Departamento</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Límite Crédito</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center rounded-r-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium text-[#020817]">
                                {/* Mapeamos empleadosPaginados en lugar de empleados */}
                                {empleadosPaginados.map((emp) => {
                                    const activo = emp.estado?.toUpperCase() === 'ACTIVO';
                                    
                                    return (
                                        <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0
                                                        ${activo ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}
                                                    `}>
                                                        {obtenerIniciales(emp.nombres, emp.apellidos)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#020817]">{`${emp.nombres} ${emp.apellidos}`}</p>
                                                        <p className="text-[11px] text-gray-400 font-medium">{emp.correo || emp.correoContacto || "Sin correo"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-gray-600 font-medium text-xs">{emp.dni}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{emp.id}</p>
                                            </td>
                                            <td className="py-4 px-4 text-gray-500 text-xs">{emp.departamento || "No especificado"}</td>
                                            <td className="py-4 px-4 font-bold text-[#020817]">
                                                ${(emp.limiteCredito || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                                                    activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                                }`}>
                                                    {emp.estado || 'INACTIVO'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center relative">
                                                <button 
                                                    onClick={() => toggleMenu(emp.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors focus:outline-none"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>

                                                {menuActivo === emp.id && (
                                                    <div ref={menuRef} className="absolute right-12 top-10 w-40 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left overflow-hidden">
                                                        <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                                                            <span className="text-[11px] font-bold text-[#b2b1b6] uppercase tracking-widest">Opciones</span>
                                                        </div>
                                                        <div className="py-2 flex flex-col">
                                                            <Link to={`/empleados/editar/${emp.id}`} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors block">
                                                                Editar
                                                            </Link>
                                                            
                                                            {activo && (
                                                                <button 
                                                                    onClick={() => abrirModal(emp)}
                                                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 text-left transition-colors"
                                                                >
                                                                    Inhabilitar
                                                                </button>
                                                            )}
                                                            
                                                            <Link to={`/empleados/detalle/${emp.id}`} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors">
                                                                Ver detalles
                                                            </Link>
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

                {/* PAGINACIÓN FOOTER */}
                {!cargando && empleadosFiltrados.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-50 gap-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPorPagina, empleadosFiltrados.length)} de {empleadosFiltrados.length} Resultados
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                disabled={paginaActual === 1}
                                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <span className="text-xs font-bold text-[#020817] px-3">
                                Página {paginaActual} de {totalPaginas}
                            </span>
                            
                            <button 
                                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                                disabled={paginaActual === totalPaginas}
                                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ======================================================== */}
            {/* MODAL DE CONFIRMACIÓN PARA INHABILITAR                 */}
            {/* ======================================================== */}
            {modalInhabilitar && empleadoSeleccionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100 relative">
                            <button onClick={cerrarModal} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-extrabold text-red-600 text-center">¿Inhabilitar a {empleadoSeleccionado.nombres}?</h3>
                            <p className="text-xs font-medium text-red-500 mt-1 text-center px-4">
                                Esta acción revocará el acceso del empleado al sistema y hará un cobro total de todos los créditos activos.
                            </p>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                                Para confirmar, por favor escribe el código del empleado: <br/>
                                <span className="font-extrabold text-[#020817] select-all bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                                    {empleadoSeleccionado.id}
                                </span>
                            </p>
                            <input 
                                type="text"
                                value={inputConfirmacion}
                                onChange={(e) => setInputConfirmacion(e.target.value)}
                                placeholder="Escribe el ID aquí..."
                                className="w-full text-center bg-[#F8F9FF] border border-gray-200 text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            />
                            <div className="flex items-center gap-3 mt-6">
                                <button 
                                    onClick={cerrarModal}
                                    className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleInhabilitar}
                                    disabled={inputConfirmacion !== empleadoSeleccionado.id || desactivando}
                                    className={`flex-1 text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase
                                        ${(inputConfirmacion !== empleadoSeleccionado.id || desactivando) 
                                            ? 'bg-red-200 cursor-not-allowed opacity-70' 
                                            : 'bg-red-500 hover:bg-red-600'
                                        }
                                    `}
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