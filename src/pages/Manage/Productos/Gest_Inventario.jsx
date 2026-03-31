import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreHorizontal, ChevronRight, Loader2, ChevronLeft, Filter, AlertCircle } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { obtenerProductos } from '../../../services/productosService'; 

export default function Inventario() {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const [menuActivo, setMenuActivo] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const data = await obtenerProductos();
            setProductos(data);
        } catch (error) {
            console.error("Error al cargar productos:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        const handleClickFuera = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuActivo(null);
            }
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const toggleMenu = (idProducto) => {
        setMenuActivo(menuActivo === idProducto ? null : idProducto);
    };

    const formatearLempiras = (monto) => {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL'
        }).format(monto);
    };

    const productosFiltrados = productos.filter(prod => {
        const termino = busqueda.toLowerCase();
        return prod.nombre?.toLowerCase().includes(termino) || 
               prod.productoId?.toLowerCase().includes(termino) ||
               prod.categoria?.toLowerCase().includes(termino);
    });

    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina) || 1;
    const startIndex = (paginaActual - 1) * itemsPorPagina;
    const productosPaginados = productosFiltrados.slice(startIndex, startIndex + itemsPorPagina);

    return (
        <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
            <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-[#020817]">Gestión de Inventario</h2>
                <p className="text-[13px] text-gray-500 mt-1 font-medium">Control editorial del inventario industrial</p>
            </div>

            {/* ========================================================= */}
            {/* SOLUCIÓN: USAR CSS GRID EN LUGAR DE FLEXBOX               */}
            {/* grid-cols-[1fr_320px] obliga a que el contenido respete   */}
            {/* el ancho exacto sin empujar hacia afuera.                 */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] items-start gap-6 w-full">
                
                {/* ÁREA PRINCIPAL: TABLA DE INVENTARIO */}
                {/* overflow-hidden aquí corta cualquier desbordamiento de la tarjeta */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative z-10 w-full overflow-hidden">
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                value={busqueda}
                                onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                                placeholder="Buscar por nombre o ID..." 
                                className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button className="bg-gray-100 text-gray-600 text-[11px] font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors uppercase tracking-widest w-full md:w-auto">
                                <Filter className="w-4 h-4" /> Filtrar
                            </button>
                            <Link to="/inventario/nuevo" className="bg-[#020817] text-white text-[11px] font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md w-full md:w-auto uppercase tracking-widest whitespace-nowrap">
                                Nuevo Producto
                            </Link>
                        </div>
                    </div>

                    {/* Contenedor del scroll horizontal exclusivo para la tabla */}
                    <div className="w-full overflow-x-auto min-h-[400px]"> 
                        {cargando ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7C3AED]" />
                                <p className="text-sm font-bold uppercase tracking-widest">Cargando catálogo...</p>
                            </div>
                        ) : productosPaginados.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-400 font-bold uppercase text-sm mb-2">No se encontraron productos</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-[#F8F9FF] rounded-xl">
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest rounded-l-xl">ID #</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Producto</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoría</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Precio Contado</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Precio Crédito</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Estado</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Stock</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center rounded-r-xl">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-medium text-[#020817]">
                                    {productosPaginados.map((prod) => {
                                        const estaActivo = prod.activo === true;
                                        const stockBajo = prod.stock <= 5;

                                        return (
                                            <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <td className="py-5 px-4 text-gray-400 font-bold text-xs">
                                                    {prod.productoId}
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                            {prod.imagenFrontalUrl ? (
                                                                <img src={prod.imagenFrontalUrl} alt={prod.nombre} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs text-gray-400 font-bold">Img</span>
                                                            )}
                                                        </div>
                                                        <p className="font-bold text-[#020817] text-sm max-w-[200px] truncate" title={prod.nombre}>{prod.nombre}</p>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4 text-gray-600">
                                                    {prod.categoria || "Sin categoría"}
                                                </td>
                                                <td className="py-5 px-4 text-right font-bold text-gray-700">
                                                    {formatearLempiras(prod.precioContado || 0)}
                                                </td>
                                                <td className="py-5 px-4 text-right font-bold text-[#7C3AED]">
                                                    {formatearLempiras(prod.precioCredito || 0)}
                                                </td>
                                                <td className="py-5 px-4 text-center">
                                                    <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest inline-block ${
                                                        estaActivo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {estaActivo ? 'Habilitado' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4 text-center font-extrabold text-sm flex items-center justify-center gap-1.5 mt-[10px]">
                                                    {prod.stock || 0}
                                                    {stockBajo && <AlertCircle className="w-4 h-4 text-amber-500" title="Stock bajo" />}
                                                </td>
                                                <td className="py-5 px-4 text-center relative">
                                                    <button onClick={() => toggleMenu(prod.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors focus:outline-none">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                    {menuActivo === prod.id && (
                                                        <div ref={menuRef} className="absolute right-12 top-10 w-40 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left py-2">
                                                            <div className="px-4 py-1 mb-1">
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Opciones</span>
                                                            </div>
                                                            <Link to={`/inventario/editar/${prod.id}`} className="block w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                                                Editar
                                                            </Link>
                                                            <button className="w-full px-4 py-2 text-xs font-medium text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                                                {estaActivo ? 'Inhabilitar' : 'Habilitar'}
                                                            </button>
                                                            <button className="w-full px-4 py-2 text-xs font-medium text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                                                Ver detalles
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
                    {!cargando && productosFiltrados.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-50 gap-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPorPagina, productosFiltrados.length)} de {productosFiltrados.length} Productos
                            </p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                                <span className="text-xs font-bold px-3">Página {paginaActual} de {totalPaginas}</span>
                                <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR: TOP VENTAS */}
                <div className="w-full bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 h-fit">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                            <span className="text-green-600 text-lg">🏆</span>
                        </div>
                        <h3 className="font-extrabold text-[#020817] uppercase tracking-wider text-sm">Top Ventas</h3>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-extrabold text-gray-400">#1</span>
                                <span className="text-xs font-bold text-[#020817]">iPhone 15 Pro</span>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-extrabold text-gray-400">#2</span>
                                <span className="text-xs font-bold text-[#020817]">Essential Loter</span>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-extrabold text-gray-400">#3</span>
                                <span className="text-xs font-bold text-[#020817]">Logitech MX Keys</span>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-red-50 bg-red-50/30">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-extrabold text-gray-400">#4</span>
                                <span className="text-xs font-bold text-[#020817]">iPad Pro 12.9"</span>
                            </div>
                            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-red-50 bg-red-50/30">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-extrabold text-gray-400">#5</span>
                                <span className="text-xs font-bold text-[#020817]">Galaxy S24 Ultra</span>
                            </div>
                            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}