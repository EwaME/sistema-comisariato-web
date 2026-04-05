import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Camera, Loader2 } from 'lucide-react';
import { crearCategoria, obtenerCategoriaPorId, actualizarCategoria, subirImagenCategoria, obtenerCategorias } from "../../../services/categoriasService";
import { db } from '../../../firebase/firebase';

export default function CrearCategoria() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const isEdit = Boolean(id) && id !== 'nuevo'; 
    const fileInputRef = useRef(null);

    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(isEdit);
    
    const [formData, setFormData] = useState({
        categoriaId: 'Calculando...',
        nombre: '',
        descripcion: '',
        estado: 'ACTIVO', 
        imagenUrl: ''
    });

    const [archivoImagen, setArchivoImagen] = useState(null);
    const [previewImagen, setPreviewImagen] = useState(null);

    useEffect(() => {
        const inicializar = async () => {
            if (isEdit) {
                try {
                    const cat = await obtenerCategoriaPorId(id);
                    setFormData({...cat, estado: cat.estado?.toUpperCase() || 'ACTIVO'});
                    setPreviewImagen(cat.imagenUrl);
                } catch (error) {
                    navigate('/categorias');
                } finally { setCargandoDatos(false); }
            } else {
                try {
                    const todas = await obtenerCategorias();
                    const proxId = `CAT-${String(todas.length + 1).padStart(2, '0')}`;
                    setFormData(prev => ({ ...prev, categoriaId: proxId }));
                } catch (error) {
                    console.error("Error al obtener ID:", error);
                } finally {
                    setCargandoDatos(false);
                }
            }
        };
        inicializar();
    }, [id, isEdit]);

    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim()) return alert("El nombre es obligatorio");
        
        setCargando(true);
        try {
            let urlFinal = formData.imagenUrl;
            if (archivoImagen) {
                urlFinal = await subirImagenCategoria(archivoImagen, formData.categoriaId);
            }

            const payload = { ...formData, imagenUrl: urlFinal };

            if (isEdit) {
                await actualizarCategoria(id, payload);
            } else {
                await crearCategoria(payload);
            }
            navigate('/categorias');
        } catch (error) {
            console.error(error);
            alert("Error al guardar");
        } finally { setCargando(false); }
    };

    if (cargandoDatos) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-[#7C3AED]" /></div>;

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
            <button onClick={() => navigate('/categorias')} className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-6 hover:text-black transition-colors">
                <ChevronLeft className="w-4 h-4" /> Regresar
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-50">
                    <h2 className="text-2xl font-black text-[#020817] mb-2">{isEdit ? 'Editar Categoría' : 'Registrar Nueva Categoría'}</h2>
                    <p className="text-gray-400 text-sm mb-10">Administra las categorías disponibles en tu comisariato</p>

                    <form onSubmit={handleGuardar} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Nombre de la Categoría</label>
                                    <input 
                                        required placeholder="higiene..."
                                        className="w-full bg-[#F8F9FF] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Descripción</label>
                                    <textarea 
                                        placeholder="Describe las características..."
                                        className="w-full bg-[#F8F9FF] border-none rounded-2xl px-5 py-4 text-sm font-medium h-32 resize-none"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block w-full text-center">Imagen de Portada</label>
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-48 h-48 bg-[#F8F9FF] rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#7C3AED] transition-all overflow-hidden group"
                                >
                                    {previewImagen ? (
                                        <img src={previewImagen} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Camera className="w-8 h-8" />
                                            <span className="text-[10px] font-bold">Subir Imagen</span>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setArchivoImagen(file);
                                            setPreviewImagen(URL.createObjectURL(file));
                                        }
                                    }}/>
                                </div>
                                <p className="text-[9px] text-gray-400 mt-4 text-center leading-relaxed">Recuerda que la imagen debe seguir los lineamientos estéticos</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pt-6 border-t border-gray-50">
                            <div className="flex items-center gap-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</label>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, estado: formData.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'})}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.estado === 'ACTIVO' ? 'bg-[#7C3AED]' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.estado === 'ACTIVO' ? 'left-7' : 'left-1'}`} />
                                </button>
                                <span className="text-xs font-bold text-[#020817]">{formData.estado}</span>
                            </div>
                            
                            <div className="flex-1 flex justify-end gap-4">
                                <button type="button" onClick={() => navigate('/categorias')} className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Cancelar</button>
                                <button disabled={cargando} className="bg-[#020817] text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-black transition-all">
                                    {cargando ? 'Guardando...' : 'Guardar Categoría'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="hidden lg:flex flex-col items-center">
                    <div className="w-[300px] h-[600px] border-[12px] border-[#020817] rounded-[3rem] bg-white relative shadow-2xl overflow-hidden flex flex-col">
                        <div className="h-6 w-32 bg-[#020817] mx-auto rounded-b-2xl mb-6" />
                        <div className="px-6 space-y-8">
                            <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-gray-400 uppercase tracking-widest">Categorías Sugeridas</span>
                                <span className="text-[#7C3AED]">Ver todas</span>
                            </div>
                            <div className="flex gap-4 overflow-hidden">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-full bg-[#020817] flex items-center justify-center overflow-hidden border-2 border-[#7C3AED]">
                                        {previewImagen && <img src={previewImagen} className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase">{formData.nombre || 'Nombre'}</span>
                                </div>
                                {[1,2,3].map(i => (
                                    <div key={i} className="flex flex-col items-center gap-2 opacity-30">
                                        <div className="w-16 h-16 rounded-full bg-gray-200" />
                                        <div className="h-2 w-10 bg-gray-200 rounded" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 pt-4">
                                <div className="h-3 w-32 bg-gray-100 rounded" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 bg-gray-50 rounded-2xl" />
                                    <div className="h-32 bg-gray-50 rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">Vista Previa App Móvil</p>
                </div>
            </div>
        </div>
    );
}