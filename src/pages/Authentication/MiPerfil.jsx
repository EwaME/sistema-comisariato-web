import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Headset, Edit2, KeyRound } from 'lucide-react';

export default function MiPerfil() {
    const [mostrarActual, setMostrarActual] = useState(false);
    const [mostrarNueva, setMostrarNueva] = useState(false);
    
    const usuario = {
        nombre: "Edward Maradiaga",
        rol: "Administrador Principal",
        correo: "edward@comisariato.com",
        ultimoAcceso: "Hoy, 10:45 AM"
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen flex flex-col items-center">
            
            {/* Tarjeta Principal */}
            <div className="bg-white w-full rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-8 md:p-12 relative overflow-hidden">
                
                {/* Header Perfil */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#3b82f6] p-1">
                            <div className="w-full h-full bg-white rounded-xl overflow-hidden border-2 border-white">
                                <img src="https://ui-avatars.com/api/?name=Edward+Maradiaga&background=f3f4f6&color=7C3AED&size=150" alt="Perfil" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <button className="absolute -bottom-2 -right-2 bg-[#020817] text-white p-2 rounded-full shadow-lg hover:bg-black transition-colors">
                            <Edit2 size={12} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black text-[#020817]">{usuario.nombre}</h2>
                    <p className="text-[#7C3AED] text-xs font-bold uppercase tracking-widest mt-1 mb-3">{usuario.rol}</p>
                    <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400">
                        <span className="flex items-center gap-1">✉ {usuario.correo}</span>
                        <span className="flex items-center gap-1">⏱ Último acceso: {usuario.ultimoAcceso}</span>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-100 mb-10"></div>

                {/* Formulario de Contraseña */}
                <div className="max-w-xl mx-auto">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-1 h-6 bg-[#7C3AED] rounded-full"></div>
                        <h3 className="text-lg font-extrabold text-[#020817]">Cambiar Contraseña</h3>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contraseña Actual</label>
                            <div className="relative">
                                <input 
                                    type={mostrarActual ? "text" : "password"} 
                                    className="w-full bg-[#F8F9FF] border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                                    placeholder="••••••••••••"
                                />
                                <button type="button" onClick={() => setMostrarActual(!mostrarActual)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {mostrarActual ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Nueva Contraseña</label>
                                <div className="relative">
                                    <input 
                                        type={mostrarNueva ? "text" : "password"} 
                                        className="w-full bg-[#F8F9FF] border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                                        placeholder="••••••••••••"
                                    />
                                    <button type="button" onClick={() => setMostrarNueva(!mostrarNueva)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {mostrarNueva ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Confirmar Nueva Contraseña</label>
                                <input 
                                    type="password" 
                                    className="w-full bg-[#F8F9FF] border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        {/* Indicador de Fortaleza */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fortaleza de seguridad</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Fuerte</span>
                        </div>
                        <div className="flex gap-2 h-1.5 w-full">
                            <div className="flex-1 bg-emerald-400 rounded-full"></div>
                            <div className="flex-1 bg-emerald-400 rounded-full"></div>
                            <div className="flex-1 bg-emerald-400 rounded-full"></div>
                            <div className="flex-1 bg-emerald-400 rounded-full"></div>
                        </div>

                        <button className="w-full bg-[#020817] text-white py-3.5 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 mt-4 shadow-md">
                            <KeyRound size={14} /> Actualizar contraseña
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed font-medium px-4">
                            La nueva contraseña debe contener al menos 12 caracteres, incluyendo una mayúscula, un número y un símbolo especial.
                        </p>
                    </form>
                </div>
            </div>

            {/* Tarjetas Inferiores */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_250px] gap-6 mt-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Autenticación de dos pasos</h4>
                        <p className="text-sm font-bold text-[#020817]">Tu cuenta está protegida con verificación móvil.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <ShieldCheck size={20} />
                    </div>
                </div>

                <div className="bg-[#7C3AED] rounded-2xl p-6 shadow-md text-white flex flex-col justify-center relative overflow-hidden group cursor-pointer">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
                    <Headset size={20} className="mb-3 opacity-90" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Soporte IT</h4>
                    <p className="text-sm font-bold">¿Necesitas ayuda?</p>
                </div>
            </div>

        </div>
    );
}