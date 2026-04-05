import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { crearCargo, obtenerCargoPorId, actualizarCargo } from '../../../../services/cargosService'; 

export default function CrearCargo() {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const isEdit = Boolean(id); 

    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(isEdit); 

    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        estado: 'ACTIVO'
    });

    useEffect(() => {
        const cargarAEditar = async () => {
            if (isEdit) {
                try {
                    const docAEditar = await obtenerCargoPorId(id);
                    setFormData({
                        codigo: docAEditar.id, 
                        nombre: docAEditar.nombre || '',
                        descripcion: docAEditar.descripcion || '',
                        estado: docAEditar.estado || 'ACTIVO'
                    });
                } catch (error) {
                    console.error("Error al cargar cargo:", error);
                    alert("No se pudo cargar la información del cargo.");
                    navigate('/cargos');
                } finally {
                    setCargandoDatos(false);
                }
            }
        };

        cargarAEditar();
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const valorFinal = name === 'codigo' ? value.toUpperCase() : value;
        setFormData({ ...formData, [name]: valorFinal });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.codigo.trim() || !formData.nombre.trim()) {
            alert("El código y el nombre del cargo son obligatorios.");
            return;
        }

        setCargando(true);

        try {
            const datosGuardar = {
                codigo: formData.codigo, 
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                estado: formData.estado
            };

            if (isEdit) {
                await actualizarCargo(id, datosGuardar);
            } else {
                await crearCargo(formData.codigo, datosGuardar);
            }
            
            navigate('/cargos');
            
        } catch (error) {
            console.error("Error al guardar el cargo:", error);
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
                <button onClick={() => navigate('/cargos')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Regresar
                </button>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-[#020817]">
                    {isEdit ? 'Editar Cargo' : 'Registrar Cargo'}
                </h2>
                <p className="text-[13px] text-gray-500 mt-1 font-medium">
                    {isEdit ? 'Modifica los detalles de este puesto de trabajo.' : 'Crea un nuevo puesto para asignar a los empleados.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Código (ID Único)</label>
                        <input 
                            required 
                            name="codigo" 
                            value={formData.codigo} 
                            onChange={handleChange} 
                            readOnly={isEdit}
                            placeholder="Ej. CAR-001" 
                            className={`w-full text-sm font-bold px-4 py-3 rounded-xl focus:outline-none transition-all ${
                                isEdit 
                                ? 'bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#F8F9FF] border border-gray-100 text-[#020817] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]'
                            }`} 
                        />
                        {isEdit && <p className="text-[10px] text-gray-400 mt-1 font-medium leading-tight">El código no es modificable.</p>}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre del Cargo</label>
                        <input 
                            required 
                            name="nombre" 
                            value={formData.nombre} 
                            onChange={handleChange} 
                            placeholder="Ej. Gerente de Logística" 
                            className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Estado Operativo</label>
                        <select 
                            name="estado" 
                            value={formData.estado} 
                            onChange={handleChange}
                            className={`w-full text-sm font-bold px-4 py-3 rounded-xl appearance-none outline-none cursor-pointer border ${
                                formData.estado === 'ACTIVO' 
                                    ? 'bg-green-50 text-green-700 border-green-200 focus:ring-2 focus:ring-green-500/20' 
                                    : 'bg-red-50 text-red-700 border-red-200 focus:ring-2 focus:ring-red-500/20'
                            }`}
                        >
                            <option value="ACTIVO">ACTIVO</option>
                            <option value="INACTIVO">INACTIVO</option>
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción / Responsabilidades</label>
                        <textarea 
                            required 
                            name="descripcion" 
                            value={formData.descripcion} 
                            onChange={handleChange} 
                            rows="3"
                            placeholder="Ej. Encargado de supervisar toda la flota de transporte..." 
                            className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] resize-none" 
                        />
                    </div>

                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-50">
                    <button type="button" onClick={() => navigate('/cargos')} className="bg-white border border-gray-200 text-gray-600 text-[11px] font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase">
                        Cancelar
                    </button>
                    <button type="submit" disabled={cargando} className={`text-white text-[11px] font-bold px-8 py-3 rounded-xl shadow-md transition-colors tracking-widest uppercase ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#020817] hover:bg-black'}`}>
                        {cargando ? 'Guardando...' : (isEdit ? 'Actualizar Cambios' : 'Guardar Cargo')}
                    </button>
                </div>

            </form>
        </div>
    );
}