import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Headset, KeyRound, Loader2, Building2, Briefcase, CreditCard, Calendar, DollarSign, IdCard, Phone, Mail, CheckCircle2, History, ShieldCheck, Wallet } from 'lucide-react';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { obtenerUsuarioPorId } from '../../services/usuariosService';
import { obtenerEmpleadoPorId } from '../../services/empleadosService';
import { registrarAuditoria } from '../../services/auditoriasService';
import { obtenerCreditosRecientesPorEmpleado } from '../../services/creditosService';

export default function MiPerfil() {
    const auth = getAuth();
    
    const [cargando, setCargando] = useState(true);
    const [usuarioData, setUsuarioData] = useState(null);
    const [empleadoData, setEmpleadoData] = useState(null);
    const [historialCreditos, setHistorialCreditos] = useState([]); 

    const [mostrarActual, setMostrarActual] = useState(false);
    const [mostrarNueva, setMostrarNueva] = useState(false);
    
    const [pwdActual, setPwdActual] = useState("");
    const [pwdNueva, setPwdNueva] = useState("");
    const [pwdConfirmar, setPwdConfirmar] = useState("");
    
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        const cargarPerfil = async () => {
            if (!auth.currentUser) return;
            try {
                const email = auth.currentUser.email;
                const dataUsuario = await obtenerUsuarioPorId(email);
                
                if (dataUsuario) {
                    setUsuarioData(dataUsuario);
                    if (dataUsuario.empleadoId) {
                        const dataEmp = await obtenerEmpleadoPorId(dataUsuario.empleadoId);
                        if (dataEmp) {
                            setEmpleadoData(dataEmp);
                            
                            const creditosDb = await obtenerCreditosRecientesPorEmpleado(dataEmp.empleadoId);

                            const creditosFormateados = creditosDb.map(c => {
                                let fechaStr = "Fecha desconocida";
                                if (c.fechaRegistro) {
                                    const date = c.fechaRegistro.toDate ? c.fechaRegistro.toDate() : new Date(c.fechaRegistro);
                                    fechaStr = date.toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' });
                                }
                                
                                return {
                                    id: c.id,
                                    producto: c.nombreProducto || "Producto",
                                    fecha: fechaStr,
                                    monto: c.totalCredito || 0,
                                    estado: c.estado?.toUpperCase() || "DESCONOCIDO"
                                };
                            });

                            setHistorialCreditos(creditosFormateados);
                        }
                    }
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarPerfil();
    }, [auth.currentUser]);

    const calcularFortaleza = (pwd) => {
        let score = 0;
        if (pwd.length >= 12) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
        return score;
    };

    const getFortalezaUI = (score) => {
        if (pwdNueva.length === 0) return { texto: "Sin ingresar", bg: "bg-slate-200", color: "text-slate-400" };
        if (score <= 1) return { texto: "Débil", bg: "bg-red-500", color: "text-red-500" };
        if (score === 2) return { texto: "Regular", bg: "bg-amber-500", color: "text-amber-500" };
        if (score === 3) return { texto: "Buena", bg: "bg-emerald-400", color: "text-emerald-500" };
        return { texto: "Fuerte", bg: "bg-emerald-600", color: "text-emerald-600" };
    };

    const scorePwd = calcularFortaleza(pwdNueva);
    const uiFortaleza = getFortalezaUI(scorePwd);

    const handleActualizarPwd = async (e) => {
        e.preventDefault();
        setMensaje({ texto: "", tipo: "" });

        if (scorePwd < 4) {
            setMensaje({ texto: "La nueva contraseña no cumple los requisitos.", tipo: "error" });
            return;
        }
        if (pwdNueva !== pwdConfirmar) {
            setMensaje({ texto: "Las contraseñas no coinciden.", tipo: "error" });
            return;
        }

        setProcesando(true);
        try {
            const credencial = EmailAuthProvider.credential(auth.currentUser.email, pwdActual);
            await reauthenticateWithCredential(auth.currentUser, credencial);

            await updatePassword(auth.currentUser, pwdNueva);
            await registrarAuditoria("EDICIÓN", "Seguridad", "Cambio de contraseña exitoso", auth.currentUser.email);
            
            setMensaje({ texto: "Contraseña actualizada exitosamente", tipo: "exito" });
            setPwdActual("");
            setPwdNueva("");
            setPwdConfirmar("");

            setTimeout(() => setMensaje({ texto: "", tipo: "" }), 5000);

        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setMensaje({ texto: "La contraseña actual es incorrecta.", tipo: "error" });
            } else {
                setMensaje({ texto: "Error al actualizar. Intenta más tarde.", tipo: "error" });
            }
        } finally {
            setProcesando(false);
        }
    };

    if (cargando) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-500 animate-pulse">Cargando perfil...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="h-32 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"></div>
                    
                    <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12 relative">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-md">
                                <img 
                                    src={empleadoData?.fotoUrl || `https://ui-avatars.com/api/?name=${empleadoData?.nombres?.charAt(0)}+${empleadoData?.apellidos?.charAt(0)}&background=f8fafc&color=7C3AED&size=150`} 
                                    alt="Perfil" 
                                    className="w-full h-full object-cover rounded-full bg-slate-100" 
                                />
                            </div>
                            <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Activo">
                                <CheckCircle2 size={16} strokeWidth={3} />
                            </div>
                        </div>

                        <div className="flex-1 mb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                    {empleadoData?.nombres} {empleadoData?.apellidos}
                                </h1>
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-100">
                                    <ShieldCheck size={14} /> {empleadoData?.empleadoId}
                                </span>
                            </div>
                            <p className="text-slate-500 font-medium flex items-center gap-2">
                                <Briefcase size={16} className="text-purple-500" /> 
                                {empleadoData?.cargo}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Phone size={14} /> Contacto
                        </h3>
                        <ul className="space-y-4 text-sm text-slate-700 font-medium">
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-purple-600"><Mail size={16} /></div>
                                <span className="truncate">{empleadoData?.correo}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-purple-600"><Phone size={16} /></div>
                                <span>{empleadoData?.telefono}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-purple-600"><IdCard size={16} /></div>
                                <span>{empleadoData?.dni}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Building2 size={14} /> Corporativo
                        </h3>
                        <ul className="space-y-4 text-sm text-slate-700 font-medium">
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-purple-600"><Building2 size={16} /></div>
                                <span>{empleadoData?.departamento}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-purple-600"><Calendar size={16} /></div>
                                <span>Ingreso: {empleadoData?.fechaIngreso}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle2 size={16} /></div>
                                <span>Acceso: {usuarioData?.plataforma}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-800 text-white relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Wallet size={14} /> Finanzas
                            </h3>
                            <div className="mb-4">
                                <p className="text-xs text-slate-400 mb-1">Salario Base</p>
                                <p className="text-2xl font-bold tracking-tight">L. {empleadoData?.salario?.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </div>
                        </div>
                        
                        <div className="relative z-10 pt-4 border-t border-slate-700/50 flex items-end justify-between">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Límite Aprobado (30%)</p>
                                <p className="text-lg font-semibold text-emerald-400">L. {empleadoData?.limiteCredito?.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </div>
                            <CreditCard size={24} className="text-slate-600" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <History size={18} className="text-purple-600" />
                            <h2 className="text-base font-bold text-slate-900">Historial de Créditos</h2>
                        </div>

                        {historialCreditos.length > 0 ? (
                            <div className="space-y-3">
                                {historialCreditos.map((credito, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-lg flex items-center justify-center
                                                ${credito.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600' : 
                                                    credito.estado === 'RECHAZADO' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                <DollarSign size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 line-clamp-1">{credito.producto}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-medium text-slate-500">{credito.id}</span>
                                                    <span className="text-[10px] text-slate-300">•</span>
                                                    <span className="text-[10px] text-slate-500">{credito.fecha}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">L. {credito.monto.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                            <span className={`text-[10px] font-semibold uppercase ${
                                                credito.estado === 'APROBADO' ? 'text-emerald-600' : 
                                                credito.estado === 'RECHAZADO' ? 'text-red-600' : 'text-amber-600'}`}>
                                                {credito.estado}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <History size={20} className="text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">No hay créditos registrados aún.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <KeyRound size={18} className="text-purple-600" />
                            <h2 className="text-base font-bold text-slate-900">Seguridad de la Cuenta</h2>
                        </div>

                        <form onSubmit={handleActualizarPwd} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contraseña Actual</label>
                                <div className="relative">
                                    <input 
                                        type={mostrarActual ? "text" : "password"} 
                                        value={pwdActual}
                                        onChange={(e) => setPwdActual(e.target.value)}
                                        required
                                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                        placeholder="••••••••••••"
                                    />
                                    <button type="button" onClick={() => setMostrarActual(!mostrarActual)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {mostrarActual ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nueva Contraseña</label>
                                    <div className="relative">
                                        <input 
                                            type={mostrarNueva ? "text" : "password"} 
                                            value={pwdNueva}
                                            onChange={(e) => setPwdNueva(e.target.value)}
                                            required
                                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                            placeholder="••••••••••••"
                                        />
                                        <button type="button" onClick={() => setMostrarNueva(!mostrarNueva)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {mostrarNueva ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmar Contraseña</label>
                                    <input 
                                        type="password" 
                                        value={pwdConfirmar}
                                        onChange={(e) => setPwdConfirmar(e.target.value)}
                                        required
                                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fortaleza</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${uiFortaleza.color}`}>{uiFortaleza.texto}</span>
                                </div>
                                <div className="flex gap-1.5 h-1.5 w-full">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div key={level} className={`flex-1 rounded-full transition-colors duration-300 ${scorePwd >= level ? uiFortaleza.bg : 'bg-slate-200'}`}></div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-3 leading-tight">
                                    Debe contener al menos 12 caracteres, 1 mayúscula, 1 número y 1 símbolo especial.
                                </p>
                            </div>

                            {mensaje.texto && (
                                <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                    {mensaje.tipo === 'exito' && <CheckCircle2 size={16} />}
                                    {mensaje.texto}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={procesando || !pwdActual || !pwdNueva || !pwdConfirmar}
                                className="w-full h-11 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                            >
                                {procesando ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                                Actualizar Contraseña
                            </button>
                        </form>
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <Headset size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">¿Necesitas ayuda con la plataforma?</h4>
                            <p className="text-sm text-slate-600">Contacta al centro de soporte de IT interno.</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-semibold text-sm shadow-sm flex items-center gap-2 shrink-0">
                        <Phone size={16} /> +504 3250-5304
                    </div>
                </div>

            </div>
        </div>
    );
}