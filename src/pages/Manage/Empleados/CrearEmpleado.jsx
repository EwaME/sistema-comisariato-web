import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Camera, Upload } from 'lucide-react';
// Importamos también obtenerEmpleadoPorId y actualizarEmpleado
import { crearEmpleado, obtenerEmpleados, obtenerEmpleadoPorId, actualizarEmpleado } from '../../../services/empleadosService';

export default function CrearEmpleado() {
    const navigate = useNavigate();
    const { id } = useParams(); // Captura el ID de la URL si estamos editando
    const isEdit = Boolean(id); // Si hay ID, es true (Modo Edición)

    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(isEdit); // Spinner inicial si estamos editando

    const hoy = new Date().toISOString().split('T')[0];

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
        estado: 'ACTIVO' 
    });

    // ==========================================
    // 1. CARGAR DATOS O GENERAR ID (HÍBRIDO)
    // ==========================================
    useEffect(() => {
        const inicializarFormulario = async () => {
            if (isEdit) {
                // MODO EDICIÓN: Traer datos del empleado
                try {
                    const empleadoAEditar = await obtenerEmpleadoPorId(id);
                    setFormData(empleadoAEditar);
                } catch (error) {
                    console.error("Error al cargar empleado para editar:", error);
                    alert("No se pudo cargar la información del empleado.");
                    navigate('/empleados');
                } finally {
                    setCargandoDatos(false);
                }
            } else {
                // MODO CREACIÓN: Generar siguiente ID
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

    // ==========================================
    // 2. MÁSCARAS
    // ==========================================
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

    // ==========================================
    // 3. GUARDAR O ACTUALIZAR
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
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
            };

            if (isEdit) {
                // Actualiza el existente
                await actualizarEmpleado(id, empleadoGuardar);
            } else {
                // Crea uno nuevo
                await crearEmpleado(formData.empleadoId, empleadoGuardar);
            }
            
            navigate('/empleados');
            
        } catch (error) {
            console.error("Error al guardar el empleado:", error);
            alert("Hubo un error al procesar la solicitud.");
        } finally {
            setCargando(false);
        }
    };

    // Si está cargando datos para editar, mostramos un spinner rápido
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
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                    General <span className="mx-2 text-gray-300">&gt;</span> Empleados <span className="mx-2 text-gray-300">&gt;</span> 
                    <span className="text-[#7C3AED]">{isEdit ? 'Editar Perfil' : 'Agregar Nuevo'}</span>
                </p>
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
                    <div className="w-24 h-24 rounded-2xl bg-[#F8F9FF] border border-gray-100 flex items-center justify-center relative shadow-inner">
                        {isEdit ? (
                            <div className="w-full h-full rounded-2xl bg-purple-100 flex items-center justify-center text-[#7C3AED] text-3xl font-bold">
                                {formData.nombres?.charAt(0)}{formData.apellidos?.charAt(0)}
                            </div>
                        ) : (
                            <Camera className="w-8 h-8 text-gray-300" />
                        )}
                        <button type="button" className="absolute -bottom-2 -right-2 bg-[#7C3AED] text-white p-1.5 rounded-full hover:bg-purple-700 transition-colors shadow-md">
                            <Upload className="w-3 h-3" />
                        </button>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#020817] mb-1">Fotografía de perfil</h4>
                        <p className="text-xs text-gray-400">Sube una imagen profesional en formato JPG o PNG. Máximo 5MB.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Código de Empleado (Auto)</label>
                        <input readOnly value={isEdit ? id : formData.empleadoId} className="w-full bg-gray-100 border border-gray-200 text-sm font-bold text-gray-500 px-4 py-3 rounded-xl cursor-not-allowed"/>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Estado</label>
                        {/* Se desactiva si NO es edición (creando = disabled). En edición, puede cambiarlo. */}
                        <select 
                            disabled={!isEdit} name="estado" value={formData.estado} onChange={handleChange}
                            className={`w-full text-sm font-bold px-4 py-3 rounded-xl appearance-none ${!isEdit ? 'bg-green-50/50 border-green-100 text-green-600 cursor-not-allowed' : 'bg-[#F8F9FF] border-gray-100 text-gray-700 cursor-pointer focus:ring-2 focus:ring-[#7C3AED]/20'}`}
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
                        <select required name="departamento" value={formData.departamento} onChange={handleChange} className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]">
                            <option value="">Seleccionar departamento</option>
                            <option value="Molienda">Molienda</option>
                            <option value="Logística">Logística</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Administración">Administración</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cargo / Posición</label>
                        <input required name="cargo" value={formData.cargo} onChange={handleChange} placeholder="Ej. Supervisor de Planta" className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Correo Institucional</label>
                        <input type="email" required name="correo" value={formData.correo} onChange={handleChange} placeholder="usuario@comisariato.com" className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha de Ingreso</label>
                        <input type="date" required name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange} className="w-full bg-[#F8F9FF] border border-gray-100 text-sm text-gray-500 font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Salario Base Mensual (Lempiras)</label>
                        <input type="number" required name="salario" value={formData.salario} onChange={handleChange} placeholder="Ej. 15000" min="0" step="0.01" className="w-full md:w-1/2 bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                    </div>

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