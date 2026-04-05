import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreHorizontal, ChevronRight, Loader2, ChevronLeft, Filter, AlertCircle, TrendingUp, TrendingDown, XCircle, X, Settings, Trophy } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { obtenerProductos, actualizarProducto, cambiarEstadoProducto } from '../../../services/productosService'; 
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

export default function Inventario() {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [configGlobal, setConfigGlobal] = useState({ StockMinimoAviso: 8, StockMinimoCierre: 2 });
    
    const [categoriasDb, setCategoriasDb] = useState([]);

    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const filtroRef = useRef(null);
    const [filtrosTemp, setFiltrosTemp] = useState({ categoria: '', estado: '' });
    const [filtrosAplicados, setFiltrosAplicados] = useState({ categoria: '', estado: '' });

    const [menuActivo, setMenuActivo] = useState(null);
    const menuRef = useRef(null);

    const [modalConfirmacion, setModalConfirmacion] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [inputConfirmacion, setInputConfirmacion] = useState("");
    const [procesandoEstado, setProcesandoEstado] = useState(false);

    useEffect(() => {
        cargarDatos();
        cargarConfiguracion();
        cargarCategorias();
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

    const cargarConfiguracion = async () => {
        try {
            const docRef = doc(db, 'configuraciones', 'config_global');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setConfigGlobal(docSnap.data());
            }
        } catch (error) {
            console.error("Error al cargar config global:", error);
        }
    };

    const cargarCategorias = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'categorias'));
            const categoriasData = querySnapshot.docs
                .map(doc => doc.data())
                .filter(cat => cat.estado === "Activo")
                .map(cat => cat.nombre);
                
            setCategoriasDb(categoriasData);
        } catch (error) {
            console.error("Error al cargar categorías:", error);
        }
    };

    useEffect(() => {
        const handleClickFuera = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMenuActivo(null);
            if (filtroRef.current && !filtroRef.current.contains(event.target)) setMostrarFiltros(false);
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const toggleMenu = (idProducto) => {
        setMenuActivo(menuActivo === idProducto ? null : idProducto);
    };

    const formatearLempiras = (monto) => {
        return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(monto);
    };

    const isFiltroActivo = filtrosAplicados.categoria !== '' || filtrosAplicados.estado !== '';

    const handleBotonFiltroClick = () => {
        if (isFiltroActivo) {
            setFiltrosAplicados({ categoria: '', estado: '' });
            setFiltrosTemp({ categoria: '', estado: '' });
            setPaginaActual(1);
        } else {
            setMostrarFiltros(!mostrarFiltros);
        }
    };

    const aplicarFiltros = () => {
        setFiltrosAplicados(filtrosTemp);
        setMostrarFiltros(false);
        setPaginaActual(1);
    };

    const productosFiltrados = productos.filter(prod => {
        const termino = busqueda.toLowerCase();
        const matchBusqueda = prod.nombre?.toLowerCase().includes(termino) || 
                                prod.productoId?.toLowerCase().includes(termino);
        
        const matchCategoria = filtrosAplicados.categoria === '' || prod.categoria === filtrosAplicados.categoria;
        
        let matchEstado = true;
        if (filtrosAplicados.estado !== '') {
            matchEstado = filtrosAplicados.estado === 'ACTIVO' ? prod.activo === true : prod.activo === false;
        }

        return matchBusqueda && matchCategoria && matchEstado;
    });

    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina) || 1;
    const startIndex = (paginaActual - 1) * itemsPorPagina;
    const productosPaginados = productosFiltrados.slice(startIndex, startIndex + itemsPorPagina);

    const abrirModalEstado = (prod) => {
        setProductoSeleccionado(prod);
        setModalConfirmacion(true);
        setInputConfirmacion("");
        setMenuActivo(null);
    };

    const cerrarModalEstado = () => {
        setModalConfirmacion(false);
        setProductoSeleccionado(null);
        setInputConfirmacion("");
    };

    const confirmarCambioEstado = async () => {
        if (inputConfirmacion !== productoSeleccionado.productoId) return; 

        setProcesandoEstado(true);
        const nuevoEstado = !productoSeleccionado.activo;
        
        try {
            await cambiarEstadoProducto(productoSeleccionado.id, nuevoEstado);
            
            setProductos(productos.map(p => p.id === productoSeleccionado.id ? { ...p, activo: nuevoEstado } : p));
            cerrarModalEstado();
        } catch (error) {
            alert("No se pudo actualizar el estado del producto");
        } finally {
            setProcesandoEstado(false);
        }
    };

    const topVentas = [...productos]
        .sort((a, b) => (b.cantidadVendida || 0) - (a.cantidadVendida || 0))
        .slice(0, 5);

    return (
        <div className="p-4 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen relative">
            <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-[#020817]">Gestión de Inventario</h2>
                <p className="text-[13px] text-gray-500 mt-1 font-medium">Control editorial del inventario industrial</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] items-start gap-6 w-full">
                
                {/* ÁREA PRINCIPAL: TABLA DE INVENTARIO */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative z-10 w-full overflow-hidden">
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 relative">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                value={busqueda}
                                onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                                placeholder="Buscar por nombre o ID..." 
                                className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                            />
                            {busqueda && (
                                <button onClick={() => { setBusqueda(''); setPaginaActual(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                    <XCircle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto relative">
                            
                            {/* BOTÓN FILTRO */}
                            <button 
                                onClick={handleBotonFiltroClick}
                                className={`border text-[11px] font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors w-full md:w-auto uppercase tracking-widest
                                    ${isFiltroActivo 
                                        ? 'bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100' 
                                        : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {isFiltroActivo ? <XCircle className="w-4 h-4" /> : <Filter className="w-4 h-4" />} 
                                {isFiltroActivo ? 'Quitar Filtros' : 'Filtrar'}
                            </button>

                            {/* DROPDOWN FILTROS */}
                            {mostrarFiltros && (
                                <div ref={filtroRef} className="absolute top-14 right-0 md:right-36 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 p-4">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">Opciones de Filtro</h4>
                                    
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-[#020817] mb-2">Categoría</label>
                                        <select 
                                            value={filtrosTemp.categoria}
                                            onChange={(e) => setFiltrosTemp({...filtrosTemp, categoria: e.target.value})}
                                            className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                        >
                                            <option value="">Todas las categorías</option>
                                            {categoriasDb.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
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
                                            <option value="ACTIVO">Habilitados</option>
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

                            <Link to="/inventario/nuevo" className="bg-[#020817] text-white text-[11px] font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md w-full md:w-auto uppercase tracking-widest whitespace-nowrap">
                                Nuevo Producto
                            </Link>
                        </div>
                    </div>

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
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Vendidos</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center rounded-r-xl">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-medium text-[#020817]">
                                    {productosPaginados.map((prod) => {
                                        const estaActivo = prod.activo === true;
                                        const stockActual = prod.stock || 0;
                                        const esCierre = stockActual <= (configGlobal.StockMinimoCierre || 2);
                                        const esAviso = !esCierre && stockActual <= (configGlobal.StockMinimoAviso || 8);

                                        return (
                                            <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <td className="py-5 px-4 text-gray-400 font-bold text-xs">{prod.productoId}</td>
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
                                                <td className="py-5 px-4 text-gray-600">{prod.categoria || "Sin categoría"}</td>
                                                <td className="py-5 px-4 text-right font-bold text-gray-700">{formatearLempiras(prod.precioContado || 0)}</td>
                                                <td className="py-5 px-4 text-right font-bold text-[#7C3AED]">{formatearLempiras(prod.precioCredito || 0)}</td>
                                                <td className="py-5 px-4 text-center">
                                                    <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest inline-block ${estaActivo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                                        {estaActivo ? 'Habilitado' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4 text-center font-extrabold text-sm">
                                                    <div className="flex items-center justify-center gap-1.5 mt-[10px]">
                                                        {stockActual}
                                                        {esCierre && <AlertCircle className="w-4 h-4 text-red-500" title="Stock Crítico" />}
                                                        {esAviso && <AlertCircle className="w-4 h-4 text-amber-500" title="Stock Bajo" />}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4 text-center font-bold text-gray-600">{prod.cantidadVendida || 0}</td>
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
                                                            <button 
                                                                onClick={() => abrirModalEstado(prod)}
                                                                className={`w-full px-4 py-2 text-xs font-medium text-left transition-colors ${estaActivo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                            >
                                                                {estaActivo ? 'Inhabilitar' : 'Habilitar'}
                                                            </button>
                                                            <Link to={`/inventario/detalle/${prod.id}`} className="block w-full px-4 py-2 text-xs font-medium text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                                                Ver detalles
                                                            </Link>
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

                {/* SIDEBAR COLUMNA DERECHA */}
                <div className="flex flex-col gap-6 w-full">
                    
                    {/* TARJETA 1: CONFIGURACIONES GLOBALES */}
                    <div className="w-full bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <Settings className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-extrabold text-[#020817] uppercase tracking-wider text-sm">Reglas de Stock</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-[#F8F9FF]">
                                <span className="text-xs font-bold text-gray-500">Aviso (Naranja)</span>
                                <span className="text-sm font-extrabold text-[#020817]">≤ {configGlobal.StockMinimoAviso || 8}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl border border-red-50 bg-red-50/30">
                                <span className="text-xs font-bold text-red-500">Crítico (Rojo)</span>
                                <span className="text-sm font-extrabold text-red-600">≤ {configGlobal.StockMinimoCierre || 2}</span>
                            </div>
                        </div>
                    </div>

                    {/* TARJETA 2: TOP VENTAS DINÁMICO */}
                    <div className="w-full bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-extrabold text-[#020817] uppercase tracking-wider text-sm">Top Ventas</h3>
                        </div>

                        <div className="flex flex-col gap-3">
                            {cargando ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                                </div>
                            ) : topVentas.length > 0 ? (
                                topVentas.map((prod, index) => {
                                    const stockActual = prod.stock || 0;
                                    const esCierre = stockActual <= (configGlobal.StockMinimoCierre || 2);
                                    const esAviso = !esCierre && stockActual <= (configGlobal.StockMinimoAviso || 8);

                                    return (
                                        <div key={prod.id} className={`flex items-center justify-between p-3 rounded-xl border ${esCierre ? 'border-red-50 bg-red-50/30' : esAviso ? 'border-amber-50 bg-amber-50/20' : 'border-gray-100 hover:shadow-sm transition-shadow'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-extrabold text-gray-400">#{index + 1}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-[#020817] max-w-[140px] truncate" title={prod.nombre}>
                                                        {prod.nombre}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                        {prod.cantidadVendida || 0} vendidos
                                                    </span>
                                                </div>
                                            </div>
                                            {esCierre ? (
                                                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold" title="¡Stock Crítico!">!</div>
                                            ) : esAviso ? (
                                                <TrendingDown className="w-4 h-4 text-amber-500" title="Stock Bajo" />
                                            ) : (
                                                <TrendingUp className="w-4 h-4 text-green-500" title="Stock Óptimo" />
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sin ventas registradas</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {modalConfirmacion && productoSeleccionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        
                        <div className={`${productoSeleccionado.activo ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} p-6 flex flex-col items-center border-b relative`}>
                            <button onClick={cerrarModalEstado} className={`absolute top-4 right-4 ${productoSeleccionado.activo ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'} transition-colors`}>
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <AlertCircle className={`w-8 h-8 ${productoSeleccionado.activo ? 'text-red-500' : 'text-green-500'}`} />
                            </div>
                            <h3 className={`text-lg font-extrabold text-center ${productoSeleccionado.activo ? 'text-red-600' : 'text-green-600'}`}>
                                ¿{productoSeleccionado.activo ? 'Inhabilitar' : 'Habilitar'} producto?
                            </h3>
                            <p className={`text-xs font-medium mt-1 text-center px-4 ${productoSeleccionado.activo ? 'text-red-500' : 'text-green-600'}`}>
                                {productoSeleccionado.activo 
                                    ? 'El producto ya no estará visible para la venta ni facturación.'
                                    : 'El producto volverá a estar disponible en el inventario activo.'}
                            </p>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                                Para confirmar, escribe el <span className="font-bold">ID del Producto</span>: <br/>
                                <span className="font-extrabold text-[#020817] select-all bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                                    {productoSeleccionado.productoId}
                                </span>
                            </p>
                            
                            <input 
                                type="text"
                                value={inputConfirmacion}
                                onChange={(e) => setInputConfirmacion(e.target.value)}
                                placeholder={`Ej: ${productoSeleccionado.productoId}`}
                                className={`w-full text-center bg-[#F8F9FF] border text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                    productoSeleccionado.activo 
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
                                    disabled={inputConfirmacion !== productoSeleccionado.productoId || procesandoEstado}
                                    className={`flex-1 text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase
                                        ${(inputConfirmacion !== productoSeleccionado.productoId || procesandoEstado) 
                                            ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                                            : (productoSeleccionado.activo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600')
                                        }
                                    `}
                                >
                                    {procesandoEstado ? 'Procesando...' : (productoSeleccionado.activo ? 'Sí, Inhabilitar' : 'Sí, Habilitar')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}