import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../../firebase/firebase"; 
// Importamos los íconos del ojito
import { Eye, EyeOff } from 'lucide-react'; 

export default function NuevaPassword() {
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Nuevo estado para controlar si se ve o no la contraseña
    const [showPassword, setShowPassword] = useState(false);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get('oobCode'); 

    const handleCambiarPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');

        if (!oobCode) {
            setError('El enlace es inválido o ya expiró. Vuelve a solicitar el cambio de contraseña.');
            return;
        }

        if (nuevaPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            await confirmPasswordReset(auth, oobCode, nuevaPassword);
            setMensaje('¡Contraseña actualizada con éxito!');
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (err) {
            console.error(err);
            setError('Hubo un error al cambiar la contraseña. El enlace pudo haber expirado.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative">
            
            {/* ESTILO PARA MATAR EL AUTOFILL AMARILLO DE CHROME */}
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #F5F3FF inset !important;
                    -webkit-text-fill-color: #020817 !important;
                    border-radius: 0.75rem !important;
                }
            `}</style>

            <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center -mb-8 relative z-10 shadow-sm border-4 border-white">
                <img src="src/assets/img/spiderkey.png" alt="Cambiar Contraseña" className="w-40 h-auto -mb-8 relative z-10" />
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 w-full max-w-md p-8 md:p-10 relative z-0 text-center">
                
                <h2 className="text-[22px] font-bold text-[#020817] mb-2 mt-4">
                    Crear Nueva Contraseña
                </h2>
                <p className="text-[11px] text-gray-500 font-medium mb-8">
                    Ingresa tu nueva contraseña para acceder al portal.
                </p>

                {mensaje && (
                    <div className="mb-6 p-3 bg-green-50 text-green-600 text-[11px] font-bold rounded-xl border border-green-100">
                        {mensaje} Redirigiendo al login...
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-500 text-[11px] font-bold rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCambiarPassword} className="text-left space-y-6">
                    <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <input 
                                // Aquí cambiamos dinámicamente el tipo de input
                                type={showPassword ? "text" : "password"} 
                                required
                                value={nuevaPassword}
                                onChange={(e) => setNuevaPassword(e.target.value)}
                                placeholder="••••••••"
                                // Le damos un padding-right (pr-12) para que el texto no se monte sobre el ojito
                                className="w-full bg-[#F8FAFC] border border-gray-100 text-sm font-medium pl-4 pr-12 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                            />
                            
                            {/* Botón del ojito */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7C3AED] transition-colors focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !oobCode}
                        className={`w-full text-white text-[10px] font-bold px-4 py-4 rounded-xl uppercase tracking-widest transition-all
                            ${loading || !oobCode ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#020817] hover:bg-black shadow-md'}
                        `}
                    >
                        {loading ? 'Guardando...' : 'GUARDAR CONTRASEÑA'}
                    </button>
                </form>
            </div>
        </div>
    );
}