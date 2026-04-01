import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase.js";

// ¡Importación de la imagen para que Vercel no llore! (Ajusta la ruta si es necesario)
import shrekImg from '../../assets/img/shrekEnllavado.png'; 

export default function RecuperarPassword() {
    const [email, setEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRecuperar = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');
        
        // 1. VALIDACIÓN DE FORMATO DE CORREO (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Por favor, ingresa un formato de correo válido (ejemplo@empresa.com).');
            return; 
        }

        setLoading(true);

        try {
            const emailMinuscula = email.toLowerCase().trim();

            // 2. VALIDAR SI EL CORREO EXISTE EN LA COLECCIÓN "USUARIOS"
            const usuarioRef = doc(db, "usuarios", emailMinuscula);
            const usuarioSnap = await getDoc(usuarioRef);

            // Si el documento NO existe, tiramos error y detenemos todo
            if (!usuarioSnap.exists()) {
                setError('No encontramos ningún usuario registrado con este correo en nuestro sistema.');
                setLoading(false);
                return;
            }

            // 3. SI EXISTE, MANDAMOS EL CORREO CON FIREBASE AUTH
            await sendPasswordResetEmail(auth, emailMinuscula);
            setMensaje('¡Listo! Revisa tu bandeja de entrada o la carpeta de spam para restablecer tu contraseña.');
            setEmail('');

        } catch (err) {
            console.error("Error al recuperar:", err); 
            
            if (err.code === 'auth/invalid-email') {
                setError('El formato del correo no es válido.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Has hecho demasiados intentos. Por favor, intenta más tarde.');
            } else {
                setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
            }
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

            {/* Shrek encerrado sin clave */}
            <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center -mb-8 relative z-10 shadow-sm border-4 border-white">
                <img src={shrekImg} alt="Recuperar" className="w-40 h-auto -mb-8 relative z-10" />
            </div>

            {/* --- TARJETA BLANCA --- */}
            <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 w-full max-w-md p-8 md:p-10 relative z-0 text-center">
                
                <h2 className="text-[22px] font-bold text-[#020817] mb-2 mt-4">
                    Recuperar Contraseña
                </h2>
                <p className="text-[11px] text-gray-500 font-medium mb-8">
                    Ingresa tu correo para recibir el enlace de recuperación
                </p>

                {/* Alertas */}
                {mensaje && (
                    <div className="mb-6 p-3 bg-green-50 text-green-600 text-[11px] font-bold rounded-xl border border-green-100">
                        {mensaje}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-500 text-[11px] font-bold rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRecuperar} className="text-left space-y-6">
                    <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nombre@empresa.com"
                                className="w-full bg-[#F8FAFC] border border-gray-100 text-sm font-medium px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                            />
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C3AED]" />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full text-white text-[10px] font-bold px-4 py-4 rounded-xl uppercase tracking-widest transition-all
                            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#020817] hover:bg-black shadow-md'}
                        `}
                    >
                        {loading ? 'Validando...' : 'ENVIAR ENLACE'}
                    </button>
                </form>

            </div>

            {/* --- ENLACE PARA VOLVER --- */}
            <Link 
                to="/login" 
                className="mt-8 text-[#7C3AED] text-[9px] font-bold uppercase tracking-widest hover:underline transition-all"
            >
                Volver al inicio de sesión
            </Link>

        </div>
    );
}