import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Camera, Upload, Mail } from 'lucide-react';
import { 
    crearEmpleado, 
    obtenerEmpleados, 
    obtenerEmpleadoPorId, 
    actualizarEmpleado, 
    subirImagenEmpleado,
    enviarCorreoBienvenida 
} from '../../../services/empleadosService';

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../../firebase/firebase'; 

export default function CrearEmpleado() {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const isEdit = Boolean(id); 

    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(isEdit); 

    const [departamentos, setDepartamentos] = useState([]);
    const [cargos, setCargos] = useState([]);
    
    const [enviarNotificacion, setEnviarNotificacion] = useState(false);

    const hoy = new Date().toISOString().split('T')[0];

    const fileInputRef = useRef(null);
    const [imagenArchivo, setImagenArchivo] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);

    const [formData, setFormData] = useState({
        empleadoId: 'Cargando...', 
        nombres: '',
        apellidos: '',
        dni: '',
        departamento: '',
        cargo: '', 
        correo: '', 
        telefono: '+504 ', 
        fechaIngreso: hoy, 
        salario: '',
        estado: 'ACTIVO',
        fotoUrl: '' 
    });

    useEffect(() => {
        const cargarListasDinamicas = async () => {
            try {
                const [deptSnap, cargosSnap] = await Promise.all([
                    getDocs(query(collection(db, 'departamentos'), where('estado', '==', 'ACTIVO'))),
                    getDocs(query(collection(db, 'cargos'), where('estado', '==', 'ACTIVO'))),
                ]);

                setDepartamentos(deptSnap.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
                setCargos(cargosSnap.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));
            } catch (error) {
                console.error("Error al cargar listas desplegables:", error);
            }
        };

        const inicializarFormulario = async () => {
            await cargarListasDinamicas(); 

            if (isEdit) {
                try {
                    const empleadoAEditar = await obtenerEmpleadoPorId(id);
                    setFormData(empleadoAEditar);
                    if (empleadoAEditar.fotoUrl) {
                        setImagenPreview(empleadoAEditar.fotoUrl);
                    }
                } catch (error) {
                    console.error("Error al cargar empleado para editar:", error);
                    alert("No se pudo cargar la información del empleado.");
                    navigate('/empleados');
                } finally {
                    setCargandoDatos(false);
                }
            } else {
                try {
                    const empleadosDb = await obtenerEmpleados();
                    if (empleadosDb.length === 0) {
                        setFormData(prev => ({ ...prev, empleadoId: 'EMP-001' }));
                        return;
                    }

                    const numerosIds = empleadosDb.map(emp => {
                        if (emp.id && emp.id.includes('-')) {
                            const num = parseInt(emp.id.split('-')[1]);
                            return isNaN(num) ? 0 : num;
                        }
                        return 0;
                    });

                    const maxId = Math.max(...numerosIds);
                    const nuevoIdStr = `EMP-${String(maxId + 1).padStart(3, '0')}`;
                    setFormData(prev => ({ ...prev, empleadoId: nuevoIdStr }));
                } catch (error) {
                    console.error("Error al generar ID:", error);
                    setFormData(prev => ({ ...prev, empleadoId: 'EMP-ERROR' }));
                }
            }
        };

        inicializarFormulario();
    }, [id, isEdit, navigate]);

    const handleClickImagen = () => fileInputRef.current.click();

    const handleImagenChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("La imagen es demasiado pesada. Máximo 5MB.");
            return;
        }

        setImagenArchivo(file);
        setImagenPreview(URL.createObjectURL(file)); 
    };

    const formatearDNI = (valor) => {
        const soloNumeros = valor.replace(/\D/g, '');
        let formateado = soloNumeros;
        if (soloNumeros.length > 4) formateado = `${soloNumeros.slice(0, 4)}-${soloNumeros.slice(4)}`;
        if (soloNumeros.length > 8) formateado = `${soloNumeros.slice(0, 4)}-${soloNumeros.slice(4, 8)}-${soloNumeros.slice(8, 13)}`;
        return formateado;
    };

    const formatearTelefono = (valor) => {
        let soloNumeros = valor.replace(/\D/g, '');
        if (soloNumeros.startsWith('504')) soloNumeros = soloNumeros.substring(3);
        
        let formateado = '+504 ';
        if (soloNumeros.length > 0) {
            if (soloNumeros.length > 4) formateado += `${soloNumeros.slice(0, 4)}-${soloNumeros.slice(4, 8)}`;
            else formateado += soloNumeros;
        }
        return formateado;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let valorFinal = value;
        if (name === 'dni') valorFinal = formatearDNI(value);
        if (name === 'telefono') valorFinal = formatearTelefono(value);
        setFormData({ ...formData, [name]: valorFinal });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            let urlFotoFinal = formData.fotoUrl;
            const elId = isEdit ? id : formData.empleadoId;

            if (imagenArchivo) {
                urlFotoFinal = await subirImagenEmpleado(imagenArchivo, elId);
            }

            const empleadoGuardar = {
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                dni: formData.dni,
                departamento: formData.departamento,
                cargo: formData.cargo,
                correo: formData.correo,
                telefono: formData.telefono,
                fechaIngreso: formData.fechaIngreso,
                estado: formData.estado,
                salario: Number(formData.salario) || 0,
                limiteCredito: (Number(formData.salario) || 0) * 0.30,
                fotoUrl: urlFotoFinal 
            };

            if (isEdit) {
                await actualizarEmpleado(id, empleadoGuardar);
            } else {
                await crearEmpleado(elId, empleadoGuardar);
                
                if (enviarNotificacion && formData.correo) {
                    await enviarCorreoBienvenida(formData.correo, `${formData.nombres} ${formData.apellidos}`);
                }
            }
            
            navigate('/empleados');
            
        } catch (error) {
            console.error("Error al guardar el empleado:", error);
            alert("Hubo un error al procesar la solicitud.");
        } finally {
            setCargando(false);
        }
    };

    if (cargandoDatos) {
        return (
            <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-[1200px] mx-auto bg-[#F8F9FF] min-h-screen">
            <div className="mb-6">
                <button onClick={() => navigate('/empleados')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Regresar
                </button>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-[#020817]">
                    {isEdit ? 'Editar Empleado' : 'Registrar Empleado'}
                </h2>
                <p className="text-[13px] text-gray-500 mt-1 font-medium">
                    {isEdit ? 'Actualiza la información del expediente del empleado.' : 'Administra el personal del Comisariato y sus saldos de nómina.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                
                <div className="flex items-center gap-6 mb-10">
                    <div 
                        onClick={handleClickImagen}
                        className="w-24 h-24 rounded-2xl bg-[#F8F9FF] border border-gray-100 flex items-center justify-center relative shadow-inner cursor-pointer hover:border-[#7C3AED] transition-all overflow-hidden"
                    >
                        {imagenPreview ? (
                            <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : isEdit ? (
                            <div className="w-full h-full rounded-2xl bg-purple-100 flex items-center justify-center text-[#7C3AED] text-3xl font-bold uppercase">
                                {formData.nombres?.charAt(0)}{formData.apellidos?.charAt(0)}
                            </div>
                        ) : (
                            <Camera className="w-8 h-8 text-gray-300" />
                        )}

                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Upload className="w-6 h-6 text-white" />
                        </div>
                        
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImagenChange} 
                        />
                    </div>
                    <div>
                        <h4 className="font-bold text-[#020817] mb-1">Fotografía de perfil</h4>
                        <p className="text-xs text-gray-400">Clickea la imagen para subir (JPG/PNG. Máx 5MB).</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Código de Empleado (Auto)</label>
                        <input readOnly value={isEdit ? id : formData.empleadoId} className="w-full bg-gray-100 border border-gray-200 text-sm font-bold text-gray-500 px-4 py-3 rounded-xl cursor-not-allowed"/>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Estado del Empleado</label>
                        <select 
                            disabled={!isEdit} 
                            name="estado" 
                            value={formData.estado} 
                            onChange={handleChange}
                            className={`w-full text-sm font-bold px-4 py-3 rounded-xl appearance-none transition-colors outline-none cursor-pointer ${
                                !isEdit 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : formData.estado === 'ACTIVO' 
                                        ? 'bg-green-50 text-green-700 border border-green-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500' 
                                        : 'bg-red-50 text-red-700 border border-red-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                            }`}
                        >
                            <option value="ACTIVO">ACTIVO</option>
                            <option value="INACTIVO">INACTIVO</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombres</label>
                        <input required name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Ej. Edward Antonio" className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Apellidos</label>
                        <input required name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Ej. Maradiaga Espinal" className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Número de Identidad</label>
                        <input required name="dni" value={formData.dni} onChange={handleChange} placeholder="0000-0000-00000" maxLength="15" className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Teléfono</label>
                        <input required name="telefono" value={formData.telefono} onChange={handleChange} placeholder="+504 0000-0000" maxLength="14" className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Departamento</label>
                        <select required name="departamento" value={formData.departamento} onChange={handleChange} className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] appearance-none">
                            <option value="">Seleccionar departamento</option>
                            {departamentos.map(dep => (
                                <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cargo / Posición</label>
                        <select required name="cargo" value={formData.cargo} onChange={handleChange} className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] appearance-none">
                            <option value="">Seleccionar cargo</option>
                            {cargos.map(car => (
                                <option key={car.id} value={car.nombre}>{car.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Correo Institucional</label>
                        <input type="email" required name="correo" value={formData.correo} onChange={handleChange} placeholder="usuario@comisariato.com" className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha de Ingreso</label>
                        <input type="date" required name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange} className="w-full bg-[#F8F9FF] border border-gray-100 text-sm text-gray-500 font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Salario Base Mensual (L)</label>
                        <input type="number" required name="salario" value={formData.salario} onChange={handleChange} placeholder="Ej. 15000" min="0" step="0.01" className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    {!isEdit && (
                        <div className="col-span-1 md:col-span-2 mt-2 bg-[#F8F9FF] border border-purple-100 p-4 rounded-xl flex items-start gap-4 transition-all hover:border-purple-200">
                            <div className="mt-0.5">
                                <input 
                                    id="checkCorreo"
                                    type="checkbox" 
                                    checked={enviarNotificacion}
                                    onChange={(e) => setEnviarNotificacion(e.target.checked)}
                                    className="w-5 h-5 text-[#7C3AED] border-gray-300 rounded focus:ring-[#7C3AED] cursor-pointer"
                                />
                            </div>
                            <label htmlFor="checkCorreo" className="flex-1 cursor-pointer"> 
                                <div className="flex items-center gap-2 mb-1">
                                    <Mail className="w-4 h-4 text-[#7C3AED]" />
                                    <span className="text-sm font-black text-[#020817]">
                                        Enviar invitación a la App Móvil
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                    Si habilitas esta opción, el sistema enviará un correo automático...
                                </p>
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-50">
                    <button type="button" onClick={() => navigate('/empleados')} className="bg-white border border-gray-200 text-gray-600 text-[11px] font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase">
                        Cancelar
                    </button>
                    <button type="submit" disabled={cargando || (!isEdit && formData.empleadoId.includes('Cargando'))} className={`text-white text-[11px] font-bold px-8 py-3 rounded-xl shadow-md transition-colors tracking-widest uppercase ${(cargando || (!isEdit && formData.empleadoId.includes('Cargando'))) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#020817] hover:bg-black'}`}>
                        {cargando ? 'Guardando...' : (isEdit ? 'Actualizar Cambios' : 'Guardar Empleado')}
                    </button>
                </div>

            </form>
        </div>
    );
}