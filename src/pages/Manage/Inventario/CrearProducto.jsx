import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Camera, Heart, Hash, Info, Loader2 } from 'lucide-react';
import { crearProducto, obtenerProductoPorId, actualizarProducto, subirImagenProducto } from '../../../services/productosService'; 
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

export default function GestionarProducto() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(isEdit);
    
    const [categoriasDb, setCategoriasDb] = useState([]);
    const [garantiasDb, setGarantiasDb] = useState([]);
    const [porcentajeInteres, setPorcentajeInteres] = useState(0);

    const [formData, setFormData] = useState({
        productoId: 'Calculando...',
        nombre: '',
        descripcion: '',
        precioContado: '',
        precioCredito: '',
        categoria: '',
        categoriaId: '',
        stock: '',
        garantia: '', 
        activo: true,
        imagenFrontalUrl: '',
        imagenLateralUrl: '',
        imagenTraseraUrl: ''
    });

    const [imagenesArchivo, setImagenesArchivo] = useState({
        frontal: null,
        lateral: null,
        trasera: null
    });

    const [vistasPrevias, setVistasPrevias] = useState({
        frontal: null,
        lateral: null,
        trasera: null
    });

    useEffect(() => {
        cargarDatosIniciales();
    }, [id, isEdit]);

    const cargarDatosIniciales = async () => {
        try {
            const configRef = doc(db, 'configuraciones', 'config_global');
            const configSnap = await getDoc(configRef);
            let interesActual = 0;
            if (configSnap.exists()) {
                interesActual = configSnap.data().porcentajeInteres || 0;
                setPorcentajeInteres(interesActual);
            }

            const catSnap = await getDocs(collection(db, 'categorias'));
            const categoriasData = catSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(cat => cat.estado === "ACTIVO");
            setCategoriasDb(categoriasData);

            const garantiasSnap = await getDocs(collection(db, 'configuraciones', 'config_global', 'garantias'));
            const garantiasData = garantiasSnap.docs.map(d => d.data());
            garantiasData.sort((a, b) => {
                if (a.diasCobertura && b.diasCobertura) return a.diasCobertura - b.diasCobertura;
                if (a.mesesCobertura && b.mesesCobertura) return a.mesesCobertura - b.mesesCobertura;
                if (a.diasCobertura && b.mesesCobertura) return -1;
                return 1;
            });
            setGarantiasDb(garantiasData);

            if (isEdit) {
                const prod = await obtenerProductoPorId(id);
                
                let garantiaSeleccionada = "";
                if (prod.garantiaDias) garantiaSeleccionada = `dias-${prod.garantiaDias}`;
                else if (prod.garantiaMeses) garantiaSeleccionada = `meses-${prod.garantiaMeses}`;

                setFormData({
                    productoId: prod.productoId,
                    nombre: prod.nombre || '',
                    descripcion: prod.descripcion || '',
                    precioContado: prod.precioContado || '',
                    precioCredito: prod.precioCredito || '',
                    categoria: prod.categoria || '',
                    categoriaId: prod.categoriaId || '',
                    stock: prod.stock || '',
                    garantia: garantiaSeleccionada,
                    activo: prod.activo ?? true,
                    imagenFrontalUrl: prod.imagenFrontalUrl || '',
                    imagenLateralUrl: prod.imagenLateralUrl || '',
                    imagenTraseraUrl: prod.imagenTraseraUrl || ''
                });

                setVistasPrevias({
                    frontal: prod.imagenFrontalUrl || null,
                    lateral: prod.imagenLateralUrl || null,
                    trasera: prod.imagenTraseraUrl || null
                });

            } else {
                const q = query(collection(db, 'productos'), orderBy('productoId', 'desc'), limit(1));
                const prodSnap = await getDocs(q);
                let proxId = 'PROD-001';
                
                if (!prodSnap.empty) {
                    const ultimoId = prodSnap.docs[0].data().productoId; 
                    if (ultimoId && ultimoId.includes('-')) {
                        const numero = parseInt(ultimoId.split('-')[1], 10);
                        if (!isNaN(numero)) proxId = `PROD-${String(numero + 1).padStart(3, '0')}`;
                    }
                }
                setFormData(prev => ({ ...prev, productoId: proxId }));
            }
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            if (isEdit) {
                alert("Error al cargar el producto.");
                navigate('/inventario');
            } else {
                setFormData(prev => ({ ...prev, productoId: 'PROD-ERROR' }));
            }
        } finally {
            setCargandoDatos(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };
            
            if (name === 'precioContado') {
                const contado = parseFloat(newValue) || 0;
                if (contado >= 0) {
                    updated.precioCredito = (contado * (1 + porcentajeInteres)).toFixed(2);
                } else {
                    updated.precioCredito = '';
                }
            }

            if (name === 'categoria') {
                const categoriaSeleccionada = categoriasDb.find(c => c.nombre === newValue);
                updated.categoriaId = categoriaSeleccionada ? categoriaSeleccionada.id : '';
            }

            return updated;
        });
    };

    const handleImageChange = (e, tipo) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("La imagen es demasiado pesada. Máximo 5MB.");
                return;
            }
            setImagenesArchivo(prev => ({ ...prev, [tipo]: file }));
            setVistasPrevias(prev => ({ ...prev, [tipo]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const precioContado = parseFloat(formData.precioContado);
        const stock = parseInt(formData.stock);

        if (!formData.nombre.trim()) return alert("El nombre del producto es obligatorio.");
        if (!formData.categoria) return alert("Debes seleccionar una categoría válida.");
        if (isNaN(precioContado) || precioContado <= 0) return alert("El precio de contado debe ser mayor a 0.");
        if (isNaN(stock) || stock < 0) return alert("El stock no puede ser un número negativo.");
        if (!formData.garantia) return alert("Debes seleccionar un plazo de garantía válido.");
        if (formData.productoId === 'Calculando...' || formData.productoId === 'PROD-ERROR') return alert("ID inválido.");

        setCargando(true);
        try {
            const elId = formData.productoId;

            let urlFrontal = formData.imagenFrontalUrl;
            let urlLateral = formData.imagenLateralUrl;
            let urlTrasera = formData.imagenTraseraUrl;

            if (imagenesArchivo.frontal) urlFrontal = await subirImagenProducto(imagenesArchivo.frontal, elId, 'frontal');
            if (imagenesArchivo.lateral) urlLateral = await subirImagenProducto(imagenesArchivo.lateral, elId, 'lateral');
            if (imagenesArchivo.trasera) urlTrasera = await subirImagenProducto(imagenesArchivo.trasera, elId, 'trasera');

            const [tipoGarantia, valorGarantia] = formData.garantia.split('-');
            const valorNumerico = parseInt(valorGarantia, 10);

            const datosGuardar = {
                productoId: elId,
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                precioContado: precioContado,
                precioCredito: parseFloat(formData.precioCredito) || 0,
                categoria: formData.categoria,
                categoriaId: formData.categoriaId,
                stock: stock,
                activo: formData.activo,
                imagenFrontalUrl: urlFrontal,
                imagenLateralUrl: urlLateral,
                imagenTraseraUrl: urlTrasera,
                nombreNormalizado: formData.nombre.trim().toLowerCase(),
                rate: 0
            };

            if (tipoGarantia === 'dias') {
                datosGuardar.garantiaDias = valorNumerico;
                datosGuardar.garantiaMeses = null; 
            } else if (tipoGarantia === 'meses') {
                datosGuardar.garantiaMeses = valorNumerico;
                datosGuardar.garantiaDias = null;
            }

            if (isEdit) {
                await actualizarProducto(id, datosGuardar);
            } else {
                datosGuardar.cantidadVendida = 0;
                await crearProducto(datosGuardar);
            }

            navigate('/inventario');
            
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Hubo un error al guardar el producto.");
        } finally {
            setCargando(false);
        }
    };

    const formatearLempiras = (monto) => {
        if (!monto) return "0.00 L.";
        return new Intl.NumberFormat('es-HN', {
            style: 'decimal',
            minimumFractionDigits: 2
        }).format(monto) + " L.";
    };

    if (cargandoDatos) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF]">
                <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
                <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#F8F9FF] min-h-screen">
            
            <div className="mb-6">
                <button onClick={() => navigate('/inventario')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Regresar
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#020817]">
                        {isEdit ? 'Editar Producto' : 'Registrar Nuevo Producto'}
                    </h2>
                    <p className="text-[13px] text-gray-500 mt-1 font-medium">
                        {isEdit ? 'Actualiza la información del producto.' : 'Administra los productos disponibles en comisariato.'}
                    </p>
                </div>
                <div className="bg-white border border-gray-100 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm w-fit">
                    <div className="bg-blue-50 p-1.5 rounded-lg">
                        <Hash className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Asignado</p>
                        <p className="text-sm font-extrabold text-[#020817]">{formData.productoId}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre del Producto</label>
                        <input required name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Smartphone Ultra X1" className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)]" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción</label>
                        <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" placeholder="Describe las especificaciones principales del producto..." className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)] resize-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Precio Contado (L)</label>
                            <input type="number" step="0.01" min="0.01" required name="precioContado" value={formData.precioContado} onChange={handleChange} placeholder="0.00" className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)]" />
                        </div>
                        <div className="relative">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Precio Crédito (L)
                                <span className="group relative cursor-help">
                                    <Info className="w-3 h-3 text-blue-400" />
                                </span>
                            </label>
                            <input type="number" readOnly name="precioCredito" value={formData.precioCredito} placeholder="0.00" className="w-full bg-gray-50 border border-gray-100 text-sm font-bold text-gray-500 px-4 py-3 rounded-xl outline-none cursor-not-allowed shadow-[0_2px_10px_rgb(0,0,0,0.01)]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría</label>
                            <select required name="categoria" value={formData.categoria} onChange={handleChange} className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)] appearance-none">
                                <option value="">Seleccionar categoría</option>
                                {categoriasDb.map(cat => (
                                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Stock Inicial/Actual</label>
                            <input type="number" min="0" required name="stock" value={formData.stock} onChange={handleChange} placeholder="0" className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Plazo de Garantía</label>
                            <select required name="garantia" value={formData.garantia} onChange={handleChange} className="w-full bg-white border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] shadow-[0_2px_10px_rgb(0,0,0,0.02)] appearance-none">
                                <option value="">Seleccionar plazo</option>
                                {garantiasDb.map(garantia => {
                                    if (garantia.diasCobertura) {
                                        return (
                                            <option key={garantia.garantiaId} value={`dias-${garantia.diasCobertura}`}>
                                                {garantia.diasCobertura} {garantia.diasCobertura === 1 ? 'Día' : 'Días'}
                                            </option>
                                        );
                                    } else if (garantia.mesesCobertura) {
                                        return (
                                            <option key={garantia.garantiaId} value={`meses-${garantia.mesesCobertura}`}>
                                                {garantia.mesesCobertura} {garantia.mesesCobertura === 1 ? 'Mes' : 'Meses'}
                                            </option>
                                        );
                                    }
                                    return null;
                                })}
                            </select>
                        </div>

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
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-2">
                        {['frontal', 'lateral', 'trasera'].map((vista) => (
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
                                    <input type="file" accept="image/png, image/jpeg" onChange={(e) => handleImageChange(e, vista)} className="hidden" />
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center md:justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
                        <button type="button" onClick={() => navigate('/inventario')} className="bg-white border border-gray-200 text-[#020817] text-[11px] font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase shadow-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={cargando} className={`text-white text-[11px] font-bold px-8 py-3.5 rounded-xl shadow-md transition-colors tracking-widest uppercase ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#020817] hover:bg-black'}`}>
                            {cargando ? 'Guardando...' : (isEdit ? 'Actualizar Producto' : 'Guardar Producto')}
                        </button>
                    </div>
                </form>

                <div className="hidden lg:flex flex-col items-center">
                    <div className="w-[320px] h-[640px] border-[14px] border-[#020817] rounded-[3rem] bg-white relative overflow-hidden shadow-2xl flex flex-col">
                        
                        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                            <div className="w-32 h-6 bg-[#020817] rounded-b-2xl"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 pt-10 px-5 flex flex-col">
                            
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-[#020817]">
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="text-xs font-bold">Detalle del producto</span>
                                </div>
                            </div>

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

                            <div className="flex gap-2 mb-6">
                                {[vistasPrevias.frontal, vistasPrevias.lateral, vistasPrevias.trasera].map((img, i) => (
                                    <div key={i} className={`flex-1 aspect-square rounded-xl overflow-hidden bg-[#F4F4F5] flex items-center justify-center border-2 ${i === 0 ? 'border-[#020817]' : 'border-transparent'}`}>
                                        {img ? <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" /> : <Camera className="w-4 h-4 text-gray-300" />}
                                    </div>
                                ))}
                            </div>

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