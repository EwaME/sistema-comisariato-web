import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, MoreHorizontal, Smartphone, Monitor, ChevronRight, Loader2 } from 'lucide-react'; 
import { Link } from 'react-router-dom';

export default function Gest_Usuarios() {
    // Datos de prueba basados en tu diseño (luego los traeremos de Firebase)
    const mockUsuarios = [
        { id: '234hg2784g', email: 'kala@gmail.com', nombre: 'Karina Torres', rol: 'USUARIO', estado: 'INACTIVO', plataforma: 'MÓVIL' },
        { id: '234hg2784h', email: 'Juris@gmail.com', nombre: 'Juan Risoto', rol: 'ADMINISTRADOR', estado: 'ACTIVO', plataforma: 'WEB' }
    ];

    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    // Control de menús dropdown
    const [menuActivo, setMenuActivo] = useState(null);
    const [submenuActivo, setSubmenuActivo] = useState(null);
    const menuRef = useRef(null);

    // Simulamos la carga de Firebase
    useEffect(() => {
        setTimeout(() => {
            setUsuarios(mockUsuarios);
            setCargando(false);
        }, 800);
    }, []);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickFuera = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuActivo(null);
                setSubmenuActivo(null);
            }
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const toggleMenu = (idUsuario) => {
        if (menuActivo === idUsuario) {
            setMenuActivo(null);
            setSubmenuActivo(null);
        } else {
            setMenuActivo(idUsuario);
            setSubmenuActivo(null);
        }
    };

    return (
        <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen relative">
            
            {/* --- CABECERA --- */}
            <div className="mb-6">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    General <span className="mx-2 text-gray-300">&gt;</span> <span className="text-[#7C3AED]">Usuarios</span>
                </p>
                <h2 className="text-2xl font-extrabold text-[#020817]">Gestión de Usuarios</h2>
                <p className="text-[13px] text-gray-500 mt-1 font-medium">
                    Control de acceso y permisos para el personal administrativo y operativo del portal.
                </p>
            </div>

            {/* --- ÁREA DE TRABAJO --- */}
            <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                
                {/* BARRA DE HERRAMIENTAS */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre..." 
                            className="w-full bg-white border border-gray-200 text-sm font-medium pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="bg-white border border-gray-200 text-gray-600 text-[11px] font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4" /> FILTRAR
                        </button>
                        <button className="bg-[#020817] text-white text-[11px] font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md w-full md:w-auto uppercase tracking-widest">
                            Nuevo Usuario
                        </button>
                    </div>
                </div>

                {/* TABLA DE USUARIOS */}
                <div className="w-full overflow-visible"> 
                    {cargando ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7C3AED]" />
                            <p className="text-sm font-bold tracking-widest uppercase">Cargando usuarios...</p>
                        </div>
                    ) : usuarios.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm mb-2">No hay usuarios registrados</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8F9FF] rounded-xl">
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest rounded-l-xl">ID</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Rol</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Estado</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Plataforma</th>
                                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center rounded-r-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium text-[#020817]">
                                {usuarios.map((user) => {
                                    const activo = user.estado?.toUpperCase() === 'ACTIVO';
                                    const esMovil = user.plataforma?.toUpperCase() === 'MÓVIL';
                                    
                                    return (
                                        <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            
                                            {/* ID */}
                                            <td className="py-5 px-4">
                                                <p className="text-gray-500 font-medium text-xs">{user.id}</p>
                                            </td>
                                            
                                            {/* EMAIL */}
                                            <td className="py-5 px-4">
                                                <p className="font-medium text-[#020817] text-sm">{user.email}</p>
                                            </td>
                                            
                                            {/* NOMBRE */}
                                            <td className="py-5 px-4">
                                                <p className="font-bold text-[#020817] text-sm">{user.nombre}</p>
                                            </td>

                                            {/* ROL (Píldora Negra) */}
                                            <td className="py-5 px-4 text-center">
                                                <span className="bg-[#020817] text-white text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-block shadow-sm">
                                                    {user.rol}
                                                </span>
                                            </td>

                                            {/* ESTADO (Verde / Gris) */}
                                            <td className="py-5 px-4 text-center">
                                                <span className={`text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-block ${
                                                    activo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {user.estado}
                                                </span>
                                            </td>

                                            {/* PLATAFORMA (Morada) */}
                                            <td className="py-5 px-4 text-center">
                                                <div className="flex justify-center">
                                                    <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                                        {esMovil ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                                                        {user.plataforma}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* ACCIONES (Dropdown Anidado) */}
                                            <td className="py-5 px-4 text-center relative">
                                                <button 
                                                    onClick={() => toggleMenu(user.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors focus:outline-none"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>

                                                {menuActivo === user.id && (
                                                    <div ref={menuRef} className="absolute right-12 top-10 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left py-2">
                                                        <div className="px-4 py-1 mb-1">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Opciones</span>
                                                        </div>
                                                        
                                                        <button className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors">
                                                            Desactivar
                                                        </button>
                                                        
                                                        {/* Opción con Submenú */}
                                                        <div 
                                                            className="relative"
                                                            onMouseEnter={() => setSubmenuActivo(user.id)}
                                                            onMouseLeave={() => setSubmenuActivo(null)}
                                                        >
                                                            <button className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                                                Cambiar Rol
                                                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                                            </button>

                                                            {/* SUBMENÚ */}
                                                            {submenuActivo === user.id && (
                                                                <div className="absolute right-full top-0 mr-1 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left py-2">
                                                                    <button className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors">Administrador</button>
                                                                    <button className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors">Acreditador</button>
                                                                    <button className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors">Gestor de Inventario</button>
                                                                    <button className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors">Moderador</button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors">
                                                            Entregar Credenciales
                                                        </button>
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
                {!cargando && usuarios.length > 0 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Mostrando {usuarios.length} de 156 PRODUCTOS
                        </p>
                        {/* Paginación estática para igualar el diseño */}
                        <div className="flex items-center gap-1">
                            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded-lg text-sm">&lt;</button>
                            <button className="w-8 h-8 flex items-center justify-center bg-[#020817] text-white font-bold rounded-lg text-xs">1</button>
                            <button className="w-8 h-8 flex items-center justify-center text-gray-600 font-medium hover:bg-gray-50 rounded-lg text-xs">2</button>
                            <button className="w-8 h-8 flex items-center justify-center text-gray-600 font-medium hover:bg-gray-50 rounded-lg text-xs">3</button>
                            <span className="px-2 text-gray-400 text-xs">...</span>
                            <button className="w-8 h-8 flex items-center justify-center text-gray-600 font-medium hover:bg-gray-50 rounded-lg text-xs">15</button>
                            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded-lg text-sm">&gt;</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}