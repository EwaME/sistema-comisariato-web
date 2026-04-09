import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, UserMinus, Loader2, Wallet, CreditCard, AlertCircle, X, ShoppingBag } from 'lucide-react'; 
import { obtenerEmpleadoPorId, desactivarEmpleado } from '../../../services/empleadosService';
import { obtenerTotalCuotasPorEmpleadoId, obtenerCreditosActivosPorEmpleadoId } from '../../../services/creditosService';

export default function DetalleEmpleado() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [empleado, setEmpleado] = useState(null);
    const [creditoUsado, setCreditoUsado] = useState(0); 
    const [creditosActivos, setCreditosActivos] = useState([]); // <-- Nuevo estado para los detalles
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const [modalInhabilitar, setModalInhabilitar] = useState(false);
    const [inputConfirmacion, setInputConfirmacion] = useState("");
    const [desactivando, setDesactivando] = useState(false);

    useEffect(() => {
        const cargarDetalle = async () => {
            try {
                // Ejecutamos las 3 consultas al mismo tiempo para no hacer esperar al usuario
                const [resEmpleado, resUsado, resActivos] = await Promise.allSettled([
                    obtenerEmpleadoPorId(id),
                    obtenerTotalCuotasPorEmpleadoId(id),
                    obtenerCreditosActivosPorEmpleadoId(id)
                ]);
                
                if (resEmpleado.status === 'rejected') {
                    throw resEmpleado.reason;
                }
                
                setEmpleado(resEmpleado.value);
                
                if (resUsado.status === 'fulfilled') {
                    setCreditoUsado(resUsado.value);
                } else {
                    setCreditoUsado(0);
                }

                if (resActivos.status === 'fulfilled') {
                    setCreditosActivos(resActivos.value);
                }

            } catch (err) {
                console.error(err);
                setError('No se pudo encontrar la información del empleado.');
            } finally {
                setCargando(false);
            }
        };

        cargarDetalle();
    }, [id]);

    const abrirModal = () => {
        setModalInhabilitar(true);
        setInputConfirmacion("");
    };

    const cerrarModal = () => {
        setModalInhabilitar(false);
        setInputConfirmacion("");
    };

    const handleInhabilitar = async () => {
        if (inputConfirmacion !== empleado.id) return;

        setDesactivando(true);
        try {
            await desactivarEmpleado(empleado.id);
            setEmpleado({ ...empleado, estado: "INACTIVO" });
            cerrarModal();
        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo inhabilitar al empleado.");
        } finally {
            setDesactivando(false);
        }
    };

    if (cargando) {
        return (
            <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando expediente...</p>
            </div>
        );
    }

    if (error || !empleado) {
        return (
            <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-[#020817] mb-4">{error}</p>
                <button onClick={() => navigate('/empleados')} className="text-[#7C3AED] font-bold hover:underline">Volver a la lista</button>
            </div>
        );
    }

    const activo = empleado.estado?.toUpperCase() === 'ACTIVO';
    
    // --- LÓGICA DE LA BARRITA ---
    const limite = empleado.limiteCredito || 0;
    const porcentajeUso = limite > 0 ? Math.min(100, Math.round((creditoUsado / limite) * 100)) : 0;
    const colorBarra = porcentajeUso > 80 ? 'bg-red-500' : 'bg-[#7C3AED]';
    const colorTexto = porcentajeUso > 80 ? 'text-red-500' : 'text-[#7C3AED]';

    return (
        <div className="p-4 max-w-[1200px] mx-auto bg-[#F8F9FF] min-h-screen relative">
            
            <div className="mb-6">
                <button 
                    onClick={() => navigate('/empleados')} 
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Regresar
                </button>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 mb-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    
                    <div className="flex items-center gap-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner shrink-0 overflow-hidden
                            ${activo ? 'bg-purple-100 text-[#7C3AED]' : 'bg-gray-100 text-gray-400'}
                            `}>
                            {empleado.fotoUrl ? (
                                <img src={empleado.fotoUrl} alt="Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <>{empleado.nombres.charAt(0)}{empleado.apellidos.charAt(0)}</>
                            )}
                        </div>
                        
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-extrabold text-[#020817]">{empleado.nombres} {empleado.apellidos}</h2>
                                <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                    {empleado.estado || 'INACTIVO'}
                                </span>
                            </div>
                            <p className="text-[#7C3AED] font-bold text-lg">{empleado.cargo || 'Cargo no asignado'}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                                <p>Departamento: <span className="text-[#020817]">{empleado.departamento || 'No especificado'}</span></p>
                                <p>•</p>
                                <p>Ingreso: <span className="text-[#020817]">{empleado.fechaIngreso || 'No registrado'}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button 
                            onClick={() => navigate(`/empleados/editar/${empleado.id}`)}
                            className="bg-[#020817] text-white text-[11px] font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md w-full md:w-auto"
                        >
                            <Edit className="w-4 h-4" /> Editar Perfil
                        </button>
                        
                        {activo && (
                            <button 
                                onClick={abrirModal}
                                className="bg-white border border-red-100 text-red-500 text-[11px] font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors w-full md:w-auto"
                            >
                                <UserMinus className="w-4 h-4" /> Desactivar Cuenta
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-8 mt-8 border-b border-gray-100 pb-0 relative z-10">
                    <button className="text-sm font-bold text-[#7C3AED] border-b-2 border-[#7C3AED] pb-4">Información general</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-white p-8 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative">
                    <div className="flex justify-between items-start mb-8">
                        <h3 className="text-lg font-bold text-[#020817]">Datos del Empleado</h3>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                            Expediente {empleado.id}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Documento de Identidad (DNI)</p>
                            <p className="font-bold text-[#020817]">{empleado.dni}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Teléfono Móvil</p>
                            <p className="font-bold text-[#020817]">{empleado.telefono || 'No registrado'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Correo Institucional</p>
                            <p className="font-bold text-[#020817]">{empleado.correoContacto || empleado.correo || 'No registrado'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha de Ingreso</p>
                            <p className="font-bold text-[#020817]">{empleado.fechaIngreso || 'No registrado'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    
                    <div className="bg-[#020817] p-8 rounded-[1.5rem] shadow-xl relative overflow-hidden text-white">
                        <Wallet className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Salario Mensual</p>
                        <h3 className="text-3xl font-extrabold relative z-10">
                            L {empleado.salario ? empleado.salario.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                        </h3>
                    </div>

                    <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50 relative overflow-hidden">
                        <CreditCard className="absolute -bottom-4 -right-4 w-32 h-32 text-gray-50" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Límite de Crédito</p>
                        <div className="flex items-end gap-2 mb-6 relative z-10">
                            <h3 className="text-3xl font-extrabold text-[#020817]">
                                {limite.toLocaleString('en-US')} <span className="text-sm font-bold text-gray-400">Lps.</span>
                            </h3>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between text-[10px] font-bold mb-2">
                                <span className="text-gray-400">
                                    Usados: L {creditoUsado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className={colorTexto}>{porcentajeUso}% en Uso</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div 
                                    className={`${colorBarra} h-2.5 rounded-full transition-all duration-700 ease-out`} 
                                    style={{ width: `${porcentajeUso}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- MÓDULO: DETALLES DE PRODUCTOS / CRÉDITOS EN USO --- */}
            <div className="mt-6 bg-white p-8 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 rounded-lg text-[#7C3AED]">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-[#020817]">Detalle de Productos en Uso</h3>
                </div>
                
                {creditosActivos.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/2">Producto Adquirido</th>
                                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progreso de Pago</th>
                                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Saldo Pendiente</th>
                                </tr>
                            </thead>
                            <tbody>
                                {creditosActivos.map((credito) => {
                                    const pagadas = credito.cuotasPagadas || 0;
                                    const totalCuotas = credito.cantidad || 1;
                                    const cuota = parseFloat(credito.cuotaMensual) || 0;
                                    const saldoPendiente = (totalCuotas - pagadas) * cuota;

                                    return (
                                        <tr key={credito.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4">
                                                <p className="text-sm font-bold text-[#020817]">{credito.nombreProducto || 'Producto sin nombre'}</p>
                                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Ref: {credito.id}</p>
                                            </td>
                                            <td className="py-4">
                                                <span className="bg-[#F5F3FF] text-[#7C3AED] text-[11px] font-bold px-3 py-1.5 rounded-full">
                                                    {pagadas} de {totalCuotas} cuotas
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <p className="font-extrabold text-[#020817]">
                                                    L {saldoPendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                    L {cuota.toLocaleString('en-US')} / mes
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-8 text-center bg-[#F8F9FF] rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 font-medium">Este empleado no tiene productos ni créditos en curso.</p>
                    </div>
                )}
            </div>

            {/* MODAL INHABILITAR */}
            {modalInhabilitar && empleado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        
                        <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100 relative">
                            <button onClick={cerrarModal} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-extrabold text-red-600 text-center">¿Inhabilitar a {empleado.nombres}?</h3>
                            <p className="text-xs font-medium text-red-500 mt-1 text-center px-4">
                                Esta acción revocará el acceso del empleado al sistema y cancelará cualquier saldo de crédito activo.
                            </p>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                                Para confirmar, por favor escribe el código del empleado: <br/>
                                <span className="font-extrabold text-[#020817] select-all bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                                    {empleado.id}
                                </span>
                            </p>
                            
                            <input 
                                type="text"
                                value={inputConfirmacion}
                                onChange={(e) => setInputConfirmacion(e.target.value)}
                                placeholder="Escribe el ID aquí..."
                                className="w-full text-center bg-[#F8F9FF] border border-gray-200 text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            />

                            <div className="flex items-center gap-3 mt-6">
                                <button 
                                    onClick={cerrarModal}
                                    className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleInhabilitar}
                                    disabled={inputConfirmacion !== empleado.id || desactivando}
                                    className={`flex-1 text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase
                                        ${(inputConfirmacion !== empleado.id || desactivando) 
                                            ? 'bg-red-200 cursor-not-allowed opacity-70' 
                                            : 'bg-red-500 hover:bg-red-600'
                                        }
                                    `}
                                >
                                    {desactivando ? 'Inhabilitando...' : 'Sí, Inhabilitar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}