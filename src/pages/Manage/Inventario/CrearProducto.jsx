import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Heart } from 'lucide-react';
import { crearProducto } from '../../../services/productosService'; 

export default function CrearProducto() {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precioContado: '',
        precioCredito: '',
        categoria: '',
        stock: '',
        activo: true
    });

    // Estado para las imágenes (Vista previa local)
    const [imagenes, setImagenes] = useState({
        frontal: null,
        lateral: null,
        posterior: null
    });

    const [vistasPrevias, setVistasPrevias] = useState({
        frontal: null,
        lateral: null,
        posterior: null
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e, tipo) => {
        const file = e.target.files[0];
        if (file) {
            setImagenes(prev => ({ ...prev, [tipo]: file }));
            setVistasPrevias(prev => ({ ...prev, [tipo]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre || !formData.categoria) {
            alert("El nombre y la categoría son obligatorios.");
            return;
        }

        setCargando(true);
        try {
            // Nota: Aquí deberías subir 'imagenes.frontal' a Firebase Storage primero
            // y obtener la URL. Para este ejemplo, mandaremos null o un string vacío
            // hasta que agregues la lógica de Storage.
            const urlImagenFalsa = vistasPrevias.frontal || ""; 

            const datosGuardar = {
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                precioContado: parseFloat(formData.precioContado) || 0,
                precioCredito: parseFloat(formData.precioCredito) || 0,
                categoria: formData.categoria,
                stock: parseInt(formData.stock) || 0,
                activo: formData.activo,
                imagenFrontalUrl: urlImagenFalsa 
            };

            await crearProducto(datosGuardar);
            navigate('/inventario');
            
        } catch (error) {
            console.error("Error:", error);
            alert("Hubo un error al guardar el producto.");
        } finally {
            setCargando(false);
        }
    };

    // Formateador para la vista previa del celular
    const formatearLempiras = (monto) => {
        if (!monto) return "0.00 L.";
        return new Intl.NumberFormat('es-HN', {
            style: 'decimal',
            minimumFractionDigits: 2
        }).format(monto) + " L.";
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
            
            <div className="mb-6">
                <button onClick={() => navigate('/inventario')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Regresar
                </button>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-[#020817]">Registrar Nuevo Producto</h2>
                <p className="text-[13px] text-gray-500 mt-1 font-medium">Administra los productos disponibles en comisariato</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
                
                {/* --- FORMULARIO (Izquierda) --- */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    
                    {/* Nombre */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre del Producto</label>
                        <input required name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Smartphone Ultra X1" className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)]" />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción</label>
                        <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" placeholder="Describe las especificaciones principales del producto..." className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)] resize-none" />
                    </div>

                    {/* Precios */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Precio Contado (L)</label>
                            <input type="number" step="0.01" required name="precioContado" value={formData.precioContado} onChange={handleChange} placeholder="L 0.00" className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)]" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Precio Crédito (L)</label>
                            <input type="number" step="0.01" required name="precioCredito" value={formData.precioCredito} onChange={handleChange} placeholder="L 0.00" className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)]" />
                        </div>
                    </div>

                    {/* Categoría y Stock */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría</label>
                            <select required name="categoria" value={formData.categoria} onChange={handleChange} className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)] appearance-none">
                                <option value="">Seleccionar categoría</option>
                                <option value="Tecnologia">Tecnología</option>
                                <option value="Hogar">Hogar</option>
                                <option value="Accesorios">Accesorios</option>
                                <option value="Linea Blanca">Línea Blanca</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Stock Actual</label>
                            <input type="number" required name="stock" value={formData.stock} onChange={handleChange} placeholder="0" className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)]" />
                        </div>
                    </div>

                    {/* Estado Toggle */}
                    <div className="flex flex-col gap-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado del Producto</label>
                        <label className="flex items-center cursor-pointer w-fit">
                            <div className="relative">
                                <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} className="sr-only" />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.activo ? 'bg-[#7C3AED]' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.activo ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-sm font-bold text-[#020817]">
                                {formData.activo ? 'Activo' : 'Inactivo'}
                            </div>
                        </label>
                    </div>

                    {/* Subida de Imágenes */}
                    <div className="grid grid-cols-3 gap-4 mt-2">
                        {['frontal', 'lateral', 'posterior'].map((vista) => (
                            <div key={vista} className="flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Vista {vista}</span>
                                <label className="relative flex flex-col items-center justify-center w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all overflow-hidden">
                                    {vistasPrevias[vista] ? (
                                        <img src={vistasPrevias[vista]} alt={`Vista ${vista}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Camera className="w-6 h-6" />
                                            <span className="text-[10px] font-bold">Subir imagen</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, vista)} className="hidden" />
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-center md:justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
                        <button type="button" onClick={() => navigate('/inventario')} className="bg-white border border-gray-200 text-[#020817] text-[11px] font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase shadow-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={cargando} className={`text-white text-[11px] font-bold px-8 py-3.5 rounded-xl shadow-md transition-colors tracking-widest uppercase ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#020817] hover:bg-black'}`}>
                            {cargando ? 'Guardando...' : 'Guardar Producto'}
                        </button>
                    </div>
                </form>

                {/* --- VISTA PREVIA (Derecha) --- */}
                <div className="hidden lg:flex flex-col items-center">
                    {/* Mockup del Celular */}
                    <div className="w-[320px] h-[640px] border-[14px] border-[#020817] rounded-[3rem] bg-white relative overflow-hidden shadow-2xl flex flex-col">
                        
                        {/* Notch del celular */}
                        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                            <div className="w-32 h-6 bg-[#020817] rounded-b-2xl"></div>
                        </div>

                        {/* Contenido del celular */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 pt-10 px-5 flex flex-col">
                            
                            {/* Header App */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-[#020817]">
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="text-xs font-bold">Detalle del producto</span>
                                </div>
                            </div>

                            {/* Imagen Principal App */}
                            <div className="w-full aspect-square bg-[#F4F4F5] rounded-2xl relative mb-4 overflow-hidden flex items-center justify-center">
                                {vistasPrevias.frontal ? (
                                    <img src={vistasPrevias.frontal} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-10 h-10 text-gray-300" />
                                )}
                                <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Heart className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Miniaturas App (Opcionales, mostradas si hay imágenes) */}
                            <div className="flex gap-2 mb-6">
                                {[vistasPrevias.frontal, vistasPrevias.lateral, vistasPrevias.posterior].map((img, i) => (
                                    <div key={i} className={`flex-1 aspect-square rounded-xl overflow-hidden bg-[#F4F4F5] flex items-center justify-center border-2 ${i === 0 ? 'border-[#020817]' : 'border-transparent'}`}>
                                        {img ? <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" /> : <Camera className="w-4 h-4 text-gray-300" />}
                                    </div>
                                ))}
                            </div>

                            {/* Detalles App */}
                            <div className="flex flex-col flex-1">
                                <span className="text-[#7C3AED] font-extrabold text-[9px] uppercase tracking-widest mb-1">
                                    {formData.categoria || "CATEGORÍA"}
                                </span>
                                <h3 className="text-xl font-extrabold text-[#020817] leading-tight mb-2">
                                    {formData.nombre || "Nombre del Producto"}
                                </h3>
                                <p className="text-xl font-medium text-[#020817] mb-6">
                                    {formatearLempiras(formData.precioContado)}
                                </p>

                                {/* Botón App (Siempre al fondo) */}
                                <div className="mt-auto">
                                    <button className="w-full bg-[#020817] text-white font-bold text-xs py-4 rounded-xl shadow-md uppercase tracking-widest">
                                        Solicitar Producto
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="mt-6 text-center max-w-[280px]">
                        <h4 className="text-[11px] font-extrabold text-[#020817] uppercase tracking-widest mb-1">Vista Previa App Móvil</h4>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                            Los cambios realizados en el formulario se reflejarán automáticamente en la aplicación del cliente.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}