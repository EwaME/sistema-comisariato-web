import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { obtenerProductoPorId, obtenerComentariosProducto, actualizarVisibilidadComentario } from '../../../services/productosService';

export default function Gest_Comentarios_Producto() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [producto, setProducto] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, [id]);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const prod = await obtenerProductoPorId(id);
            setProducto(prod);

            const coms = await obtenerComentariosProducto(id);
            coms.sort((a, b) => {
                const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                return fechaB - fechaA;
            });
            setComentarios(coms);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            alert("No se pudo cargar la información.");
            navigate('/inventario');
        } finally {
            setCargando(false);
        }
    };

    const toggleVisibilidad = async (comentario) => {
        setProcesando(comentario.id);
        try {
            const nuevaVisibilidad = !comentario.visible;
            await actualizarVisibilidadComentario(id, comentario.id, nuevaVisibilidad);
            setComentarios(comentarios.map(c =>
                c.id === comentario.id ? { ...c, visible: nuevaVisibilidad } : c
            ));
        } catch (error) {
            alert("No se pudo actualizar la visibilidad.");
        } finally {
            setProcesando(null);
        }
    };

    const formatearFecha = (timestamp) => {
        if (!timestamp) return 'Sin fecha';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-HN') + ' · ' + date.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderEstrellas = (calificacion) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`text-sm ${i < calificacion ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
        ));
    };

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF]">
                <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
                <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando comentarios...</p>
            </div>
        );
    }

    const visibles = comentarios.filter(c => c.visible !== false).length;
    const ocultos = comentarios.filter(c => c.visible === false).length;

    return (
        <div className="p-4 md:p-8 max-w-[1200px] mx-auto bg-[#F8F9FF] min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <button
                    onClick={() => navigate(`/inventario/detalle/${id}`)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Regresar al Detalle
                </button>
            </div>

            {/* Info del producto */}
            {producto && (
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-50 shadow-sm mb-6 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center shrink-0 border border-gray-100">
                        {producto.imagenFrontalUrl ? (
                            <img src={producto.imagenFrontalUrl} alt={producto.nombre} className="w-full h-full object-cover" />
                        ) : (
                            <MessageSquare className="w-6 h-6 text-gray-300" />
                        )}
                    </div>
                    <div className="flex-1">
                        <span className="text-[#7C3AED] font-bold text-[10px] uppercase tracking-widest">{producto.categoria}</span>
                        <h2 className="text-xl font-extrabold text-[#020817]">{producto.nombre}</h2>
                        <p className="text-[11px] text-gray-400 font-medium">{producto.productoId}</p>
                    </div>
                    <div className="flex gap-4 text-center">
                        <div className="bg-[#F8F9FF] px-4 py-2 rounded-xl">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                            <p className="text-lg font-extrabold text-[#020817]">{comentarios.length}</p>
                        </div>
                        <div className="bg-green-50 px-4 py-2 rounded-xl">
                            <p className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Visibles</p>
                            <p className="text-lg font-extrabold text-green-600">{visibles}</p>
                        </div>
                        <div className="bg-red-50 px-4 py-2 rounded-xl">
                            <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Ocultos</p>
                            <p className="text-lg font-extrabold text-red-500">{ocultos}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de comentarios */}
            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-50 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#020817] uppercase tracking-widest mb-6">
                    Comentarios del Producto
                </h3>

                {comentarios.length === 0 ? (
                    <div className="text-center py-20">
                        <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase text-sm">Sin comentarios aún</p>
                        <p className="text-xs text-gray-400 mt-1">Los comentarios de los empleados aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {comentarios.map((com) => {
                            const esVisible = com.visible !== false;
                            return (
                                <div
                                    key={com.id}
                                    className={`p-5 rounded-2xl border transition-all ${
                                        esVisible
                                            ? 'bg-white border-gray-100'
                                            : 'bg-gray-50 border-dashed border-gray-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">

                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xs font-bold text-[#7C3AED] shrink-0 overflow-hidden">
                                                {com.fotoUrl ? (
                                                    <img src={com.fotoUrl} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    (com.email || 'U').charAt(0).toUpperCase()
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                    <p className="font-bold text-[#020817] text-sm">
                                                        {com.email || 'Usuario desconocido'}
                                                    </p>
                                                    {com.calificacion && (
                                                        <div className="flex items-center gap-0.5">
                                                            {renderEstrellas(com.calificacion)}
                                                        </div>
                                                    )}
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                        esVisible
                                                            ? 'bg-green-50 text-green-600'
                                                            : 'bg-red-50 text-red-500'
                                                    }`}>
                                                        {esVisible ? 'Visible' : 'Oculto'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                                    {com.comentario || com.texto || com.contenido || 'Sin contenido'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium mt-2">
                                                    {formatearFecha(com.fecha)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Botón toggle visibilidad */}
                                        <button
                                            onClick={() => toggleVisibilidad(com)}
                                            disabled={procesando === com.id}
                                            title={esVisible ? 'Ocultar comentario' : 'Hacer visible'}
                                            className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                                                esVisible
                                                    ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100'
                                                    : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {procesando === com.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : esVisible ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}