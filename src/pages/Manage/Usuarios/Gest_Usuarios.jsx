import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreHorizontal, ChevronRight, Loader2, ChevronLeft, XCircle, AlertCircle, X, ShieldAlert } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { obtenerUsuarios, actualizarUsuario, asignarRolWebYAuth } from '../../../services/usuariosService';

export default function Gest_Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const [menuActivo, setMenuActivo] = useState(null);
    const menuRef = useRef(null);

    // --- ESTADOS PARA EL MODAL DE ESTADO (ACTIVAR/DESACTIVAR) ---
    const [modalConfirmacion, setModalConfirmacion] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [inputConfirmacion, setInputConfirmacion] = useState("");
    const [procesandoEstado, setProcesandoEstado] = useState(false);

    // --- ESTADOS PARA EL MODAL DE CAMBIO DE ROL (NUEVO DISEÑO) ---
    const [modalRol, setModalRol] = useState(false);
    const [rolDestino, setRolDestino] = useState("");
    const [procesandoRol, setProcesandoRol] = useState(false);
    
    // Roles disponibles para asignar (Excluyendo EMPLEADO que es fijo)
    const ROLES_DISPONIBLES = ['ADMINISTRADOR', 'ACREDITADOR', 'GESTOR DE INVENTARIO', 'MODERADOR'];

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const data = await obtenerUsuarios();
            setUsuarios(data);
        } catch (error) {
            console.error("Error:", error);
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

    const toggleMenu = (idUsuario) => {
        setMenuActivo(menuActivo === idUsuario ? null : idUsuario);
    };

    // ==========================================
    // LÓGICA DEL MODAL DE ESTADO (ACTIVAR/DESACTIVAR)
    // ==========================================
    const abrirModalEstado = (user) => {
        setUsuarioSeleccionado(user);
        setModalConfirmacion(true);
        setInputConfirmacion("");
        setMenuActivo(null);
    };

    const cerrarModalEstado = () => {
        setModalConfirmacion(false);
        setUsuarioSeleccionado(null);
        setInputConfirmacion("");
    };

    const confirmarCambioEstado = async () => {
        if (inputConfirmacion !== usuarioSeleccionado.id) return; 

        setProcesandoEstado(true);
        const nuevoEstado = usuarioSeleccionado.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        
        try {
            await actualizarUsuario(usuarioSeleccionado.id, { estado: nuevoEstado });
            setUsuarios(usuarios.map(u => u.id === usuarioSeleccionado.id ? { ...u, estado: nuevoEstado } : u));
            cerrarModalEstado();
        } catch (error) {
            alert("No se pudo actualizar el estado");
        } finally {
            setProcesandoEstado(false);
        }
    };

    // ==========================================
    // LÓGICA DEL MODAL DE CAMBIO DE ROL (MEJORADO)
    // ==========================================
    const abrirModalSelectorRol = (user) => {
        setUsuarioSeleccionado(user);
        
        // Detectar el rol extra actual (si lo tiene) para pre-seleccionarlo
        const rolesArray = Array.isArray(user.rol) ? user.rol : (user.rol ? String(user.rol).split(', ') : []);
        const rolExtra = rolesArray.find(r => r !== 'EMPLEADO');
        setRolDestino(rolExtra || "");

        setModalRol(true);
        setInputConfirmacion("");
        setMenuActivo(null);
    };

    const cerrarModalRol = () => {
        setModalRol(false);
        setUsuarioSeleccionado(null);
        setRolDestino("");
        setInputConfirmacion("");
    };

    const confirmarCambioRol = async () => {
        if (inputConfirmacion !== usuarioSeleccionado.id || !rolDestino) return;

        setProcesandoRol(true);
        try {
            // Reutilizamos la función del servicio que mantiene 'EMPLEADO' y asegura el Auth
            await asignarRolWebYAuth(usuarioSeleccionado, rolDestino);
            
            // Actualizamos la vista local
            const rolesFinales = ['EMPLEADO', rolDestino];
            setUsuarios(usuarios.map(u => u.id === usuarioSeleccionado.id ? { ...u, rol: rolesFinales } : u));
            cerrarModalRol();
        } catch (error) {
            alert("Error al cambiar el rol");
        } finally {
            setProcesandoRol(false);
        }
    };

    const usuariosFiltrados = usuarios.filter(user => {
        const termino = busqueda.toLowerCase();
        return user.nombre?.toLowerCase().includes(termino) || 
               user.correo?.toLowerCase().includes(termino) ||
               user.empleadoId?.toLowerCase().includes(termino);
    });

    const totalPaginas = Math.ceil(usuariosFiltrados.length / itemsPorPagina);
    const startIndex = (paginaActual - 1) * itemsPorPagina;
    const usuariosPaginados = usuariosFiltrados.slice(startIndex, startIndex + itemsPorPagina);

    return (
        <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen relative">
            <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-[#020817]">Gestión de Usuarios</h2>
                <p className="text-[13px] text-gray-500 mt-1 font-medium">Control de acceso y permisos.</p>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative z-10">
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={busqueda}
                            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                            placeholder="Buscar por nombre o email..." 
                            className="w-full bg-[#F8F9FF] border border-gray-200 text-sm font-medium pl-10 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                        />
                        {busqueda && (
                            <button onClick={() => { setBusqueda(''); setPaginaActual(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Link to="/usuarios/nuevo" className="bg-[#020817] text-white text-[11px] font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md w-full md:w-auto uppercase tracking-widest">
                        Nuevo Usuario
                    </Link>
                </div>

                <div className="w-full overflow-visible min-h-[400px]"> 
                    {cargando ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400"><Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7C3AED]" /></div>
                    ) : usuariosPaginados.length === 0 ? (
                        <div className="text-center py-20"><p className="text-gray-400 font-bold uppercase text-sm mb-2">No se encontraron usuarios</p></div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8F9FF] rounded-xl">
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest rounded-l-xl">Empleado ID</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Usuario / Correo</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Roles Asignados</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Estado</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center rounded-r-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium text-[#020817]">
                                {usuariosPaginados.map((user) => {
                                    const activo = user.estado?.toUpperCase() === 'ACTIVO';
                                    const rolesArray = Array.isArray(user.rol) ? user.rol : (user.rol ? String(user.rol).split(', ') : ['SIN ROL']);
                                    
                                    return (
                                        <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            
                                            <td className="py-5 px-4">
                                                <p className="font-bold text-gray-500 text-xs">{user.empleadoId}</p>
                                            </td>
                                            
                                            <td className="py-5 px-4">
                                                <p className="font-bold text-[#020817] text-sm">{user.nombre}</p>
                                                <p className="font-medium text-gray-400 text-xs">{user.id}</p> 
                                            </td>
                                            
                                            <td className="py-5 px-4 text-center">
                                                <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[200px] mx-auto">
                                                    {rolesArray.map((r, i) => (
                                                        <span key={i} className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm ${r === 'EMPLEADO' ? 'bg-gray-200 text-gray-600' : 'bg-[#020817] text-white'}`}>
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="py-5 px-4 text-center">
                                                <span className={`text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-block ${
                                                    activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                                }`}>
                                                    {user.estado}
                                                </span>
                                            </td>

                                            <td className="py-5 px-4 text-center relative">
                                                <button onClick={() => toggleMenu(user.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors focus:outline-none">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>

                                                {menuActivo === user.id && (
                                                    <div ref={menuRef} className="absolute right-12 top-10 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left py-2">
                                                        <div className="px-4 py-1 mb-1">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Opciones</span>
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={() => abrirModalEstado(user)}
                                                            className={`w-full px-4 py-2 text-xs font-medium text-left transition-colors ${activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                        >
                                                            {activo ? 'Desactivar Acceso' : 'Activar Acceso'}
                                                        </button>
                                                        
                                                        {activo && (
                                                            // NUEVO BOTÓN SIMPLE (Sin submenú traicionero)
                                                            <button 
                                                                onClick={() => abrirModalSelectorRol(user)}
                                                                className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors"
                                                            >
                                                                Modificar Rol Extra
                                                            </button>
                                                        )}
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
                {!cargando && usuariosFiltrados.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-50 gap-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPorPagina, usuariosFiltrados.length)} de {usuariosFiltrados.length} Resultados
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-xs font-bold px-3">Página {paginaActual} de {totalPaginas}</span>
                            <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* ======================================================== */}
            {/* MODAL DE CONFIRMACIÓN PARA ACTIVAR/INHABILITAR           */}
            {/* ======================================================== */}
            {modalConfirmacion && usuarioSeleccionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        
                        <div className={`${usuarioSeleccionado.estado === 'ACTIVO' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} p-6 flex flex-col items-center border-b relative`}>
                            <button onClick={cerrarModalEstado} className={`absolute top-4 right-4 ${usuarioSeleccionado.estado === 'ACTIVO' ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'} transition-colors`}>
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <AlertCircle className={`w-8 h-8 ${usuarioSeleccionado.estado === 'ACTIVO' ? 'text-red-500' : 'text-green-500'}`} />
                            </div>
                            <h3 className={`text-lg font-extrabold text-center ${usuarioSeleccionado.estado === 'ACTIVO' ? 'text-red-600' : 'text-green-600'}`}>
                                ¿{usuarioSeleccionado.estado === 'ACTIVO' ? 'Suspender' : 'Activar'} acceso a {usuarioSeleccionado.nombre}?
                            </h3>
                            <p className={`text-xs font-medium mt-1 text-center px-4 ${usuarioSeleccionado.estado === 'ACTIVO' ? 'text-red-500' : 'text-green-600'}`}>
                                {usuarioSeleccionado.estado === 'ACTIVO' 
                                    ? 'El usuario no podrá entrar al sistema ni usar la app móvil.'
                                    : 'El usuario recuperará su acceso al sistema de inmediato.'}
                            </p>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                                Para confirmar, escribe el <span className="font-bold">correo</span> del usuario: <br/>
                                <span className="font-extrabold text-[#020817] select-all bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                                    {usuarioSeleccionado.id}
                                </span>
                            </p>
                            
                            <input 
                                type="text"
                                value={inputConfirmacion}
                                onChange={(e) => setInputConfirmacion(e.target.value)}
                                placeholder="usuario@correo.com"
                                className={`w-full text-center bg-[#F8F9FF] border text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                    usuarioSeleccionado.estado === 'ACTIVO' 
                                        ? 'border-gray-200 focus:ring-red-500/20 focus:border-red-500' 
                                        : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'
                                }`}
                            />

                            <div className="flex items-center gap-3 mt-6">
                                <button 
                                    onClick={cerrarModalEstado}
                                    className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmarCambioEstado}
                                    disabled={inputConfirmacion !== usuarioSeleccionado.id || procesandoEstado}
                                    className={`flex-1 text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase
                                        ${(inputConfirmacion !== usuarioSeleccionado.id || procesandoEstado) 
                                            ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                                            : (usuarioSeleccionado.estado === 'ACTIVO' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600')
                                        }
                                    `}
                                >
                                    {procesandoEstado ? 'Procesando...' : (usuarioSeleccionado.estado === 'ACTIVO' ? 'Sí, Suspender' : 'Sí, Activar')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL REDISEÑADO PARA CAMBIO DE ROL (SELECCIÓN INTERACTIVA) */}
            {/* ======================================================== */}
            {modalRol && usuarioSeleccionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        
                        <div className="bg-purple-50 p-6 flex flex-col items-center border-b border-purple-100 relative">
                            <button onClick={cerrarModalRol} className="absolute top-4 right-4 text-purple-400 hover:text-purple-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <ShieldAlert className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-extrabold text-purple-700 text-center leading-tight">
                                Asignar Rol Administrativo a<br/>{usuarioSeleccionado.nombre}
                            </h3>
                            <p className="text-[10px] font-bold mt-2 text-center px-4 bg-purple-100 text-purple-600 py-1 rounded-full uppercase tracking-widest">
                                Rol Base: EMPLEADO (Intacto)
                            </p>
                        </div>

                        <div className="p-6">
                            {/* Selector de Rol interactivo */}
                            <div className="mb-6">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                    Selecciona el nuevo rol:
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {ROLES_DISPONIBLES.map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setRolDestino(r)}
                                            className={`w-full px-4 py-3 text-xs font-bold rounded-xl transition-all border text-left flex items-center justify-between ${
                                                rolDestino === r 
                                                    ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm' 
                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {r}
                                            {rolDestino === r && <span className="w-2 h-2 rounded-full bg-purple-600"></span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 text-center font-medium border-t border-gray-100 pt-6">
                                Para confirmar, escribe el <span className="font-bold">correo</span>: <br/>
                                <span className="font-extrabold text-[#020817] select-all bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                                    {usuarioSeleccionado.id}
                                </span>
                            </p>
                            
                            <input 
                                type="text"
                                value={inputConfirmacion}
                                onChange={(e) => setInputConfirmacion(e.target.value)}
                                placeholder="usuario@correo.com"
                                className="w-full text-center bg-[#F8F9FF] border border-gray-200 text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            />

                            <div className="flex items-center gap-3 mt-6">
                                <button 
                                    onClick={cerrarModalRol}
                                    className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmarCambioRol}
                                    disabled={inputConfirmacion !== usuarioSeleccionado.id || !rolDestino || procesandoRol}
                                    className={`flex-1 text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase
                                        ${(inputConfirmacion !== usuarioSeleccionado.id || !rolDestino || procesandoRol) 
                                            ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                                            : 'bg-purple-600 hover:bg-purple-700'
                                        }
                                    `}
                                >
                                    {procesandoRol ? 'Procesando...' : 'Asignar Rol'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}