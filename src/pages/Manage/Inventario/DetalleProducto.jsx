import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Package, Calendar, Loader2, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { obtenerProductoPorId } from '../../../services/productosService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

export default function DetalleProducto() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [producto, setProducto] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [configGlobal, setConfigGlobal] = useState({ StockMinimoAviso: 8, StockMinimoCierre: 2 });
    const [tabActiva, setTabActiva] = useState('descripcion');
    const [imagenPrincipal, setImagenPrincipal] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, [id]);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const prodData = await obtenerProductoPorId(id);
            setProducto(prodData);
            setImagenPrincipal(prodData.imagenFrontalUrl);

            const configRef = doc(db, 'configuraciones', 'config_global');
            const configSnap = await getDoc(configRef);
            if (configSnap.exists()) {
                setConfigGlobal(configSnap.data());
            }
        } catch (error) {
            console.error("Error al cargar detalle:", error);
            alert("No se pudo cargar la información del producto.");
            navigate('/inventario');
        } finally {
            setCargando(false);
        }
    };

    const formatearLempiras = (monto) => {
        if (monto === undefined || monto === null) return "0.00 L.";
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL'
        }).format(monto);
    };

    const formatearFecha = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-HN') + ' | ' + date.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
    };

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF]">
                <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
                <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Cargando producto...</p>
            </div>
        );
    }

    if (!producto) return null;

    const textoGarantia = producto.garantiaDias 
        ? `${producto.garantiaDias} ${producto.garantiaDias === 1 ? 'Día' : 'Días'} de cobertura`
        : producto.garantiaMeses 
            ? `${producto.garantiaMeses} ${producto.garantiaMeses === 1 ? 'Mes' : 'Meses'} de cobertura`
            : 'Sin garantía registrada';

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <button onClick={() => navigate('/inventario')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Regresar
                </button>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(`/inventario/editar/${producto.id}`)}
                        className="bg-[#020817] text-white text-[11px] font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md uppercase tracking-widest"
                    >
                        <Edit className="w-4 h-4" /> Editar Producto
                    </button>

                    <button 
                        onClick={() => navigate(`/inventario/comentarios/${producto.id}`)}
                        className="bg-white border border-gray-200 text-[#020817] text-[11px] font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-widest"
                    >
                        <MessageSquare className="w-4 h-4" /> Ver Comentarios
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_550px] gap-8 items-start">
                
                <div className="flex flex-col gap-6">
                    
                    <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[#7C3AED] font-extrabold text-[10px] uppercase tracking-widest mb-2 block">
                                    {producto.categoria || "Sin Categoría"}
                                </span>
                                <h1 className="text-3xl font-extrabold text-[#020817] leading-tight max-w-[80%]">
                                    {producto.nombre}
                                </h1>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 ${producto.activo ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className={`w-2 h-2 rounded-full ${producto.activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${producto.activo ? 'text-green-600' : 'text-red-600'}`}>
                                    {producto.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100 mt-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Precio Contado</p>
                                <p className="text-2xl font-extrabold text-[#020817]">{formatearLempiras(producto.precioContado)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Precio Crédito</p>
                                <p className="text-2xl font-extrabold text-[#7C3AED]">{formatearLempiras(producto.precioCredito)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                        <div className="flex items-center gap-3 mb-6">
                            <Package className="w-5 h-5 text-[#020817]" />
                            <h3 className="text-sm font-extrabold text-[#020817] uppercase tracking-wider">Información de Stock</h3>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stock Actual</span>
                                <span className="text-3xl font-extrabold text-[#020817]">{producto.stock || 0}</span>
                            </div>
                            <div className="flex flex-col border-gray-100 pl-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cant. Vendida</span>
                                <span className="text-3xl font-extrabold text-[#7C3AED]">{producto.cantidadVendida || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 flex flex-col h-full min-h-[300px]">
                        <div className="flex items-center gap-8 border-b border-gray-100 mb-6">
                            <button 
                                onClick={() => setTabActiva('descripcion')}
                                className={`pb-4 text-[11px] font-extrabold uppercase tracking-widest transition-colors relative ${tabActiva === 'descripcion' ? 'text-[#020817]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Descripción
                                {tabActiva === 'descripcion' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#020817] rounded-t-full"></div>}
                            </button>
                            <button 
                                onClick={() => setTabActiva('garantia')}
                                className={`pb-4 text-[11px] font-extrabold uppercase tracking-widest transition-colors relative ${tabActiva === 'garantia' ? 'text-[#020817]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Garantía
                                {tabActiva === 'garantia' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#020817] rounded-t-full"></div>}
                            </button>
                        </div>

                        <div className="flex-1">
                            {tabActiva === 'descripcion' && (
                                <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-line">
                                    {producto.descripcion || "Este producto no tiene una descripción registrada."}
                                </p>
                            )}
                            {tabActiva === 'garantia' && (
                                <div className="flex flex-col items-start gap-2 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Plazo Establecido</span>
                                    <p className="text-xl font-extrabold text-blue-700">{textoGarantia}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-50">
                            <div className="flex gap-3 items-start">
                                <Calendar className="w-4 h-4 text-gray-300 shrink-0" />
                                <div>
                                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Fecha de Registro</span>
                                    <span className="text-xs font-bold text-[#020817]">{formatearFecha(producto.fechaRegistro)}</span>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start border-l border-gray-50 pl-4">
                                <Calendar className="w-4 h-4 text-gray-300 shrink-0" />
                                <div>
                                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Última Modificación</span>
                                    <span className="text-xs font-bold text-[#020817]">{formatearFecha(producto.fechaModificacion)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="w-full aspect-square bg-white rounded-[2rem] border border-gray-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex items-center justify-center overflow-hidden relative">
                        {imagenPrincipal ? (
                            <img src={imagenPrincipal} alt={producto.nombre} className="w-full h-full object-contain p-8" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-300 gap-3">
                                <ImageIcon className="w-16 h-16" />
                                <span className="text-xs font-bold uppercase tracking-widest">Sin Imagen</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-4">
                        {[
                            { url: producto.imagenFrontalUrl, label: 'Frontal' },
                            { url: producto.imagenLateralUrl, label: 'Lateral' },
                            { url: producto.imagenTraseraUrl, label: 'Trasera' }
                        ].map((foto, index) => (
                            <div 
                                key={index} 
                                className={`flex-1 aspect-square rounded-2xl flex items-center justify-center overflow-hidden shadow-sm transition-all border-2 ${
                                    foto.url ? 'bg-white border-transparent hover:border-[#7C3AED]' : 'bg-gray-100 border-dashed border-gray-200'
                                }`}
                            >
                                {foto.url ? (
                                    <img 
                                        src={foto.url} 
                                        alt={`Vista ${foto.label}`} 
                                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                        onClick={() => setImagenPrincipal(foto.url)}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <ImageIcon className="w-5 h-5 mb-1" />
                                        <span className="text-[8px] font-bold uppercase tracking-tighter">Sin {foto.label}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}