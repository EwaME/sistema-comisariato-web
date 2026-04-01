import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { Search, Plus, Edit2, ImageIcon, Loader2, MoreVertical, Power, X, AlertCircle } from 'lucide-react';
import { obtenerCategorias, actualizarCategoria } from '../../../services/categoriasService';

export default function Gest_Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    // Estados para el menú de opciones (3 puntos)
    const [menuActivo, setMenuActivo] = useState(null);
    const menuRef = useRef(null);

    // Estados para el modal de desactivación
    const [modalDesactivar, setModalDesactivar] = useState(false);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [inputConfirmacion, setInputConfirmacion] = useState("");
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        cargarCategorias();
    }, []);

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

    const cargarCategorias = async () => {
        try {
            const data = await obtenerCategorias();
            setCategorias(data);
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    };

    const toggleMenu = (e, id) => {
        e.stopPropagation();
        setMenuActivo(menuActivo === id ? null : id);
    };

    const abrirModalDesactivar = (cat) => {
        setCategoriaSeleccionada(cat);
        setModalDesactivar(true);
        setMenuActivo(null);
        setInputConfirmacion("");
    };

    const handleDesactivar = async () => {
        if (inputConfirmacion !== categoriaSeleccionada.categoriaId) return;

        setProcesando(true);
        try {
            const nuevoEstado = categoriaSeleccionada.estado === 'Activo' ? 'Inactivo' : 'Activo';
            await actualizarCategoria(categoriaSeleccionada.id, { estado: nuevoEstado });
            
            setCategorias(categorias.map(cat => 
                cat.id === categoriaSeleccionada.id ? { ...cat, estado: nuevoEstado } : cat
            ));
            setModalDesactivar(false);
        } catch (error) {
            alert("No se pudo cambiar el estado de la categoría");
        } finally {
            setProcesando(false);
        }
    };

    const filtradas = categorias.filter(c => 
        c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (cargando) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="animate-spin text-[#7C3AED]" />
        </div>
    );

    return (
        <div className="p-8 bg-[#F8F9FF] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#020817]">Gestión de Categorías</h2>
                    <p className="text-gray-500 text-sm font-medium">Control de categorías de los productos. Campo clave para la navegación en el portal móvil</p>
                </div>
                
                <Link 
                    to="/categorias/nuevo" 
                    className="bg-[#020817] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-md uppercase text-[11px] tracking-widest"
                >
                    <Plus className="w-4 h-4" /> Nueva Categoría
                </Link>
            </div>

            <div className="relative mb-8 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm font-medium text-sm"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filtradas.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-[2rem] p-6 border border-gray-50 shadow-sm hover:shadow-md transition-all group relative flex flex-col items-center">
                        
                        {/* Botón de 3 Puntos */}
                        <div className="absolute top-4 right-4">
                            <button 
                                onClick={(e) => toggleMenu(e, cat.id)}
                                className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {menuActivo === cat.id && (
                                <div ref={menuRef} className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left overflow-hidden">
                                    
                                    {/* Header igual al de Empleados */}
                                    <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                                        <span className="text-[11px] font-bold text-[#b2b1b6] uppercase tracking-widest">
                                            Opciones
                                        </span>
                                    </div>

                                    <div className="py-2 flex flex-col">
                                        <button
                                            onClick={() => navigate(`/categorias/editar/${cat.id}`)}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            onClick={() => abrirModalDesactivar(cat)}
                                            className={`px-4 py-2 text-sm font-medium text-left transition-colors
                                                ${cat.estado === 'Activo' 
                                                    ? 'text-red-600 hover:bg-red-50' 
                                                    : 'text-green-600 hover:bg-green-50'
                                                }`}
                                        >
                                            {cat.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="w-32 h-32 mb-4 bg-gray-50 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-inner">
                            {cat.imagenUrl ? (
                                <img src={cat.imagenUrl} alt={cat.nombre} className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-10 h-10 text-gray-200" />
                            )}
                        </div>

                        <div className="text-center">
                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${cat.estado === 'Activo' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {cat.estado}
                            </span>
                            <h3 className="font-extrabold text-[#020817] mt-3 uppercase tracking-wider text-sm">{cat.nombre}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE VALIDACIÓN PARA DESACTIVAR/ACTIVAR */}
            {modalDesactivar && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                        <div className={`p-6 flex flex-col items-center border-b relative ${categoriaSeleccionada.estado === 'Activo' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                            <button onClick={() => setModalDesactivar(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <AlertCircle className={`w-8 h-8 ${categoriaSeleccionada.estado === 'Activo' ? 'text-red-500' : 'text-green-500'}`} />
                            </div>
                            <h3 className={`text-lg font-extrabold text-center ${categoriaSeleccionada.estado === 'Activo' ? 'text-red-600' : 'text-green-600'}`}>
                                ¿{categoriaSeleccionada.estado === 'Activo' ? 'Desactivar' : 'Activar'} categoría {categoriaSeleccionada.nombre}?
                            </h3>
                            <p className="text-xs font-medium text-gray-500 mt-2 text-center px-4 leading-relaxed">
                                {categoriaSeleccionada.estado === 'Activo' 
                                    ? "Al desactivarla, los productos de esta categoría dejarán de ser visibles en la App móvil para los clientes." 
                                    : "Al activarla, la categoría y sus productos volverán a ser visibles en la App móvil."}
                            </p>
                        </div>
                        <div className="p-8">
                            <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                                Escribe el ID de la categoría para confirmar: <br/>
                                <span className="font-extrabold text-[#020817] select-all bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                                    {categoriaSeleccionada.categoriaId}
                                </span>
                            </p>
                            <input 
                                type="text"
                                value={inputConfirmacion}
                                onChange={(e) => setInputConfirmacion(e.target.value)}
                                placeholder="Escribe el ID aquí..."
                                className="w-full text-center bg-[#F8F9FF] border border-gray-200 text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                            />
                            <div className="flex items-center gap-3 mt-8">
                                <button 
                                    onClick={() => setModalDesactivar(false)}
                                    className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleDesactivar}
                                    disabled={inputConfirmacion !== categoriaSeleccionada.categoriaId || procesando}
                                    className={`flex-1 text-white text-[11px] font-bold py-3.5 rounded-xl shadow-md transition-all tracking-widest uppercase
                                        ${inputConfirmacion !== categoriaSeleccionada.categoriaId || procesando
                                            ? 'bg-gray-200 cursor-not-allowed' 
                                            : categoriaSeleccionada.estado === 'Activo' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                >
                                    {procesando ? 'Procesando...' : `Sí, ${categoriaSeleccionada.estado === 'Activo' ? 'Desactivar' : 'Activar'}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}