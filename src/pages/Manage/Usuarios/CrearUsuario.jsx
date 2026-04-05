import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, User, X } from 'lucide-react';
import { obtenerUsuarios, asignarRolWebYAuth } from '../../../services/usuariosService';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../../firebase/firebase';

export default function CrearUsuario() {
    const navigate = useNavigate();
    const [usuariosBase, setUsuariosBase] = useState([]);
    const [guardando, setGuardando] = useState(false);

    const [busquedaEmp, setBusquedaEmp] = useState('');
    const [mostrarDropdown, setMostrarDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const [usuarioData, setUsuarioData] = useState(null); 
    const [rolAdicional, setRolAdicional] = useState(''); 
    
    const [rolesDisponibles, setRolesDisponibles] = useState([]);

    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
                const data = await obtenerUsuarios();
                const activos = data.filter(u => u.estado === 'ACTIVO');
                setUsuariosBase(activos);

                const qRoles = query(collection(db, 'roles'), where('estado', '==', 'ACTIVO'));
                const rolesSnap = await getDocs(qRoles);
                
                const rolesFiltrados = rolesSnap.docs
                    .map(doc => doc.id.toUpperCase())
                    .filter(rolId => rolId !== 'USUARIO/EMPLEADO' && rolId !== 'EMPLEADO');
                
                setRolesDisponibles(rolesFiltrados);

            } catch (error) {
                console.error("Error al cargar datos:", error);
                alert("No se pudieron cargar los datos iniciales.");
            }
        };
        cargarDatosIniciales();
    }, []);

    useEffect(() => {
        const handleClickFuera = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMostrarDropdown(false);
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const usuariosFiltrados = usuariosBase
        .filter(u => 
            u.nombre?.toLowerCase().includes(busquedaEmp.toLowerCase()) || 
            u.correo?.toLowerCase().includes(busquedaEmp.toLowerCase())
        )
        .slice(0, 10);

    const seleccionarUsuario = (user) => {
        setUsuarioData(user);
        setBusquedaEmp(`${user.nombre} (${user.correo})`);
        setMostrarDropdown(false);
        
        const rolesArray = Array.isArray(user.rol) ? user.rol : (user.rol ? String(user.rol).split(', ') : []);
        const rolExtraExistente = rolesArray.find(r => r.toUpperCase() !== 'EMPLEADO');
        
        setRolAdicional(rolExtraExistente || ''); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usuarioData || !rolAdicional) return;
        
        setGuardando(true);
        try {
            await asignarRolWebYAuth(usuarioData, rolAdicional);
            navigate('/usuarios');
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="p-4 max-w-[1400px] mx-auto bg-[#F8F9FF] min-h-screen">
            <div className="mb-6">
                <button onClick={() => navigate('/usuarios')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] mb-4">
                    <ChevronLeft className="w-4 h-4" /> Regresar
                </button>
                <h2 className="text-2xl font-extrabold text-[#020817]">Otorgar Acceso Web a Empleado</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-50" ref={dropdownRef}>
                        <p className="text-[10px] font-extrabold text-[#020817] uppercase tracking-widest mb-4">PASO 1: BUSCAR EMPLEADO</p>
                        
                        <div className="relative mb-3">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C3AED]" />
                            <input 
                                type="text"
                                placeholder="Escribe nombre o correo..."
                                value={busquedaEmp}
                                onChange={(e) => {
                                    setBusquedaEmp(e.target.value);
                                    setMostrarDropdown(true);
                                    if(usuarioData) {
                                        setUsuarioData(null);
                                        setRolAdicional(''); 
                                    }
                                }}
                                onFocus={() => setMostrarDropdown(true)}
                                className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-bold pl-10 pr-10 py-3.5 rounded-xl focus:ring-2 focus:ring-[#7C3AED]/20"
                            />
                            {busquedaEmp && (
                                <button type="button" onClick={() => {setBusquedaEmp(''); setUsuarioData(null); setRolAdicional('');}} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            )}

                            {mostrarDropdown && busquedaEmp && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden">
                                    {usuariosFiltrados.length > 0 ? (
                                        usuariosFiltrados.map(u => (
                                            <div key={u.id} onClick={() => seleccionarUsuario(u)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b flex items-center gap-3 transition-colors">
                                                
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {u.fotoUrl ? (
                                                        <img src={u.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-[#7C3AED]" />
                                                    )}
                                                </div>

                                                <div>
                                                    <span className="text-sm font-bold block text-[#020817]">{u.nombre}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{u.correo} | Usuario: {u.usuario}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : <div className="p-4 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">Sin resultados</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    {usuarioData && (
                        <div className="bg-white p-6 rounded-[1.5rem] border border-[#7C3AED]/20 flex items-center gap-4 animate-in fade-in shadow-sm">
                            
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm">
                                {usuarioData.fotoUrl ? (
                                    <img src={usuarioData.fotoUrl} alt="Perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-[#7C3AED]" />
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span className="bg-blue-50 text-blue-600 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Seleccionado</span>
                                </div>
                                <h3 className="text-lg font-extrabold text-[#020817] leading-none mb-1">{usuarioData.nombre}</h3>
                                <p className="text-xs text-gray-500 font-bold mt-0.5">Autogenerado: <span className="text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded ml-1">{usuarioData.usuario}</span></p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-7 bg-white p-8 rounded-[1.5rem] relative shadow-sm border border-gray-50">
                    {!usuarioData && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[1.5rem]">
                            <div className="bg-white px-6 py-3 rounded-full shadow-lg border border-gray-100 flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7C3AED] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7C3AED]"></span>
                                </span>
                                <p className="text-sm font-bold text-gray-500">
                                    Busca un empleado primero
                                </p>
                            </div>
                        </div>
                    )}

                    <h3 className="text-2xl font-extrabold text-[#020817] mb-8">Asignar Rol Web</h3>

                    <div className="mb-8">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Rol Base (Inamovible)</label>
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-inner">EMPLEADO (App Móvil)</span>
                    </div>

                    <div className="mb-8">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Elige 1 Rol Administrativo Adicional</label>
                        <div className="grid grid-cols-2 gap-3">
                            {rolesDisponibles.length === 0 ? (
                                <p className="text-xs text-gray-400 italic col-span-2">Cargando roles o no hay roles activos...</p>
                            ) : (
                                rolesDisponibles.map(r => (
                                    <button
                                        key={r} type="button" onClick={() => setRolAdicional(r)}
                                        className={`px-4 py-3 text-xs font-bold rounded-xl transition-all border text-left flex items-center justify-between ${
                                            rolAdicional === r 
                                                ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {r}
                                        {rolAdicional === r && <span className="w-2 h-2 rounded-full bg-purple-600"></span>}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-50">
                        <button type="submit" disabled={!usuarioData || !rolAdicional || guardando} className={`text-white text-[11px] font-bold px-8 py-3.5 rounded-xl uppercase tracking-widest transition-all ${
                            (!usuarioData || !rolAdicional || guardando) 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'bg-[#020817] hover:bg-black shadow-md'
                        }`}>
                            {guardando ? 'Generando Credenciales...' : 'Confirmar Rol'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}